import crypto from "crypto";
import { IncomingMessage } from "http";
import net from "net";
import jwt from "jsonwebtoken";
import { URL } from "url";
import ChatGroupMember from "../models/chatGroupMember";

type WebSocketClient = {
  socket: net.Socket;
  userId: string;
  subscribedGroups: Set<string>;
};

const clients = new Set<WebSocketClient>();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

const parseFrame = (buffer: Buffer): { payload: string; bytesUsed: number } | null => {
  if (buffer.length < 2) return null;

  const firstByte = buffer[0];
  const secondByte = buffer[1];
  const opcode = firstByte & 0x0f;
  const masked = (secondByte & 0x80) !== 0;

  if (opcode === 0x8) {
    return { payload: "", bytesUsed: 2 };
  }

  let payloadLength = secondByte & 0x7f;
  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < offset + 2) return null;
    payloadLength = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (payloadLength === 127) {
    if (buffer.length < offset + 8) return null;
    const big = buffer.readBigUInt64BE(offset);
    payloadLength = Number(big);
    offset += 8;
  }

  const maskBytes = masked ? 4 : 0;
  if (buffer.length < offset + maskBytes + payloadLength) return null;

  const mask = masked ? buffer.subarray(offset, offset + 4) : null;
  offset += maskBytes;

  const payloadBuffer = Buffer.from(buffer.subarray(offset, offset + payloadLength));
  if (masked && mask) {
    for (let i = 0; i < payloadBuffer.length; i += 1) {
      payloadBuffer[i] ^= mask[i % 4];
    }
  }

  return {
    payload: payloadBuffer.toString("utf8"),
    bytesUsed: offset + payloadLength,
  };
};

const encodeTextFrame = (text: string): Buffer => {
  const payload = Buffer.from(text, "utf8");
  const payloadLength = payload.length;

  if (payloadLength < 126) {
    return Buffer.concat([Buffer.from([0x81, payloadLength]), payload]);
  }

  if (payloadLength < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payloadLength, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(payloadLength), 2);
  return Buffer.concat([header, payload]);
};

const sendJson = (client: WebSocketClient, payload: Record<string, unknown>) => {
  try {
    client.socket.write(encodeTextFrame(JSON.stringify(payload)));
  } catch (error) {
    client.socket.destroy();
  }
};

const sendSystem = (client: WebSocketClient, message: string) => {
  sendJson(client, { type: "system", message });
};

const removeClient = (client: WebSocketClient) => {
  clients.delete(client);
  try {
    client.socket.destroy();
  } catch (error) {
    // ignore
  }
};

const handleMessage = async (client: WebSocketClient, rawMessage: string) => {
  try {
    const parsed = JSON.parse(rawMessage) as { type?: string; groupId?: string };
    if (parsed.type === "subscribe" && parsed.groupId) {
      const membershipCount = await ChatGroupMember.count({
        where: { group_id: parsed.groupId, user_id: client.userId },
      });
      if (membershipCount === 0) {
        sendSystem(client, "Access denied for this chat group");
        return;
      }
      client.subscribedGroups.add(parsed.groupId);
      sendJson(client, { type: "subscribed", groupId: parsed.groupId });
      return;
    }

    if (parsed.type === "unsubscribe" && parsed.groupId) {
      client.subscribedGroups.delete(parsed.groupId);
      sendJson(client, { type: "unsubscribed", groupId: parsed.groupId });
      return;
    }
  } catch (error) {
    sendSystem(client, "Invalid websocket payload");
  }
};

export const broadcastChatMessage = (
  groupId: string,
  message: Record<string, unknown>,
) => {
  const payload = JSON.stringify({
    type: "chat.message",
    groupId,
    message,
  });
  const frame = encodeTextFrame(payload);

  clients.forEach((client) => {
    if (client.subscribedGroups.has(groupId)) {
      try {
        client.socket.write(frame);
      } catch (error) {
        removeClient(client);
      }
    }
  });
};

const authenticateRequest = (request: IncomingMessage): string | null => {
  if (!request.url) return null;
  const host = request.headers.host || "localhost";
  const parsed = new URL(request.url, `http://${host}`);
  const token = parsed.searchParams.get("token");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string };
    return decoded.id || null;
  } catch (error) {
    return null;
  }
};

export const handleChatUpgrade = (request: IncomingMessage, socket: net.Socket) => {
  if (!request.url?.startsWith("/ws/chat")) {
    socket.destroy();
    return;
  }

  const userId = authenticateRequest(request);
  const wsKey = request.headers["sec-websocket-key"];
  if (!userId || !wsKey || Array.isArray(wsKey)) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  const acceptKey = crypto
    .createHash("sha1")
    .update(`${wsKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, "binary")
    .digest("base64");

  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
      "\r\n",
    ].join("\r\n"),
  );

  const client: WebSocketClient = {
    socket,
    userId,
    subscribedGroups: new Set<string>(),
  };

  clients.add(client);
  sendSystem(client, "Connected to chat websocket");

  let pendingBuffer = Buffer.alloc(0);
  socket.on("data", async (chunk: Buffer) => {
    pendingBuffer = Buffer.concat([pendingBuffer, chunk]);

    while (pendingBuffer.length > 0) {
      const parsed = parseFrame(pendingBuffer);
      if (!parsed) break;
      pendingBuffer = pendingBuffer.subarray(parsed.bytesUsed);

      if (!parsed.payload) continue;
      await handleMessage(client, parsed.payload);
    }
  });

  socket.on("close", () => removeClient(client));
  socket.on("error", () => removeClient(client));
};
