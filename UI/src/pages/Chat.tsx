import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { chatAPI, ChatGroup, ChatMessage } from "../services/chatService";
import { API_BASE_URL } from "../config/api";

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"direct" | "groups">("groups");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupMemberQuery, setGroupMemberQuery] = useState("");
  const [groupMemberResults, setGroupMemberResults] = useState<
    Array<{ id: string; full_name: string; email: string; avatar_url?: string }>
  >([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<
    Array<{ id: string; full_name: string; email: string; avatar_url?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const selectedGroupRef = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [networkError, setNetworkError] = useState("");
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    attachment_url: string;
    attachment_name: string;
  } | null>(null);
  const [userSearchResults, setUserSearchResults] = useState<
    Array<{ id: string; full_name: string; email: string; avatar_url?: string }>
  >([]);

  useEffect(() => {
    fetchChatGroups();
  }, []);

  useEffect(() => {
    if (activeTab !== "direct") {
      setUserSearchResults([]);
      return;
    }

    if (searchQuery.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await chatAPI.searchUsers(searchQuery.trim(), 20);
        if (response.success) {
          setUserSearchResults(response.data);
        }
      } catch (error) {
        setUserSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (!showCreateGroup) {
      setGroupMemberResults([]);
      return;
    }
    if (groupMemberQuery.trim().length < 2) {
      setGroupMemberResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await chatAPI.searchUsers(groupMemberQuery.trim(), 20);
        if (response.success) {
          setGroupMemberResults(
            response.data.filter(
              (person) => !selectedGroupMembers.some((member) => member.id === person.id),
            ),
          );
        }
      } catch (error) {
        setGroupMemberResults([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [showCreateGroup, groupMemberQuery, selectedGroupMembers]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const wsBase =
      import.meta.env.VITE_WS_BASE_URL ||
      API_BASE_URL.replace(/^http/i, "ws");
    const socket = new WebSocket(`${wsBase}/ws/chat?token=${encodeURIComponent(token)}`);

    socket.onopen = () => {
      setSocketConnected(true);
      if (selectedGroupRef.current) {
        socket.send(JSON.stringify({ type: "subscribe", groupId: selectedGroupRef.current }));
      }
    };

    socket.onclose = () => {
      setSocketConnected(false);
      setWs(null);
    };

    socket.onerror = () => {
      setSocketConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          groupId?: string;
          message?: ChatMessage;
        };

        if (payload.type === "chat.message" && payload.groupId && payload.message) {
          if (payload.groupId !== selectedGroupRef.current) return;
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === payload.message?.id)) {
              return prev;
            }
            return [...prev, payload.message as ChatMessage];
          });
        }
      } catch (error) {
        // ignore parse failures
      }
    };

    setWs(socket);
    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
    if (selectedGroup) {
      fetchMessages(selectedGroup, false);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "subscribe", groupId: selectedGroup }));
      }
    }
  }, [selectedGroup, ws]);

  const fetchChatGroups = async () => {
    try {
      setLoading(true);
      setNetworkError("");
      const response = await chatAPI.getGroups();
      if (response.success) {
        setChatGroups(response.data);
        if (response.data.length > 0) {
          setSelectedGroup(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat groups:', error);
      setNetworkError("Cannot reach chat server. Ensure backend API is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (groupId: string, append: boolean, before?: string) => {
    try {
      if (append) {
        setLoadingOlder(true);
      } else {
        setMessagesLoading(true);
      }
      const response = await chatAPI.getMessages(groupId, 30, before);
      if (response.success) {
        setHasMoreMessages(response.data.length === 30);
        setMessages((prev) => (append ? [...response.data, ...prev] : response.data));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setMessagesLoading(false);
      setLoadingOlder(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!selectedGroup || !messages.length) return;
    const oldest = messages[0]?.created_at;
    if (!oldest) return;
    await fetchMessages(selectedGroup, true, oldest);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      const response = await chatAPI.createGroup({
        name: newGroupName,
        member_ids: selectedGroupMembers.map((member) => member.id),
      });
      
      if (response.success) {
        setChatGroups(prev => [...prev, response.data]);
        setNewGroupName("");
        setGroupMemberQuery("");
        setGroupMemberResults([]);
        setSelectedGroupMembers([]);
        setShowCreateGroup(false);
        setSelectedGroup(response.data.id);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !pendingAttachment) || !selectedGroup || uploadingAttachment) return;
    
    try {
      const response = await chatAPI.sendMessage(selectedGroup, {
        content: message.trim(),
        attachment_url: pendingAttachment?.attachment_url,
        attachment_name: pendingAttachment?.attachment_name,
      });
      
      if (response.success) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === response.data.id)) {
            return prev;
          }
          return [...prev, response.data];
        });
        setMessage("");
        setPendingAttachment(null);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handlePickAttachment = () => {
    if (!selectedGroup || uploadingAttachment) return;
    fileInputRef.current?.click();
  };

  const handleAttachmentSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedGroup) return;

    try {
      setUploadingAttachment(true);
      const response = await chatAPI.uploadAttachment(selectedGroup, file);
      if (response.success) {
        setPendingAttachment(response.data);
      }
    } catch (error) {
      console.error("Failed to upload attachment:", error);
    } finally {
      setUploadingAttachment(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleStartDirect = async (targetUserId: string) => {
    try {
      const response = await chatAPI.openDirectChat(targetUserId);
      if (!response.success) return;
      const group = response.data;

      setChatGroups((prev) => {
        const existing = prev.find((item) => item.id === group.id);
        if (existing) return prev;
        return [group, ...prev];
      });
      setSelectedGroup(group.id);
    } catch (error) {
      console.error("Failed to open direct chat:", error);
    }
  };

  const filteredGroups = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const source =
      activeTab === "direct"
        ? chatGroups.filter((group) => group.is_direct)
        : chatGroups.filter((group) => !group.is_direct);

    if (!normalized) return source;

    return source.filter((group) => {
      const inName = group.name.toLowerCase().includes(normalized);
      const inMembers =
        group.members?.some(
          (member) =>
            member.full_name.toLowerCase().includes(normalized) ||
            member.email.toLowerCase().includes(normalized),
        ) || false;
      return inName || inMembers;
    });
  }, [activeTab, chatGroups, searchQuery]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Messages Panel */}
      <section className="w-80 flex flex-col border-r border-slate-200 bg-slate-50">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          {networkError && (
            <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {networkError}
            </div>
          )}

          {/* Search Bar */}
          <div className="flex w-full h-10 mb-4">
            <div className="text-slate-500 flex border-none bg-slate-200 items-center justify-center pl-3 rounded-l-lg">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-slate-900 focus:outline-0 focus:ring-0 border-none bg-slate-200 h-full placeholder:text-slate-500 px-3 pl-2 text-sm font-normal leading-normal"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-4 mb-2">
            <button
              className={`flex flex-col items-center justify-center border-b-[2px] pb-2 pt-1 px-2 ${
                activeTab === "direct"
                  ? "border-blue-600 text-slate-900"
                  : "border-transparent text-slate-500"
              }`}
              onClick={() => setActiveTab("direct")}
            >
              <p className="text-xs font-bold uppercase tracking-wider">
                Direct
              </p>
            </button>
            <button
              className={`flex flex-col items-center justify-center border-b-[2px] pb-2 pt-1 px-2 ${
                activeTab === "groups"
                  ? "border-blue-600 text-slate-900"
                  : "border-transparent text-slate-500"
              }`}
              onClick={() => setActiveTab("groups")}
            >
              <p className="text-xs font-bold uppercase tracking-wider">
                Groups
              </p>
            </button>
          </div>
        </div>

        {/* Group List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className={`flex items-center gap-3 px-4 min-h-[64px] py-2 cursor-pointer transition-colors ${
                    selectedGroup === group.id
                      ? "bg-white border-l-4 border-blue-600"
                      : "hover:bg-slate-100"
                  }`}
                  onClick={() => setSelectedGroup(group.id)}
                >
                  <div
                    className={`flex items-center justify-center rounded-lg shrink-0 size-10 ${
                      selectedGroup === group.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {group.is_project_group ? "folder" : "tag"}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center flex-1">
                    <p
                      className={`text-sm line-clamp-1 ${
                        selectedGroup === group.id
                          ? "font-semibold text-slate-900"
                          : "font-medium text-slate-900"
                      }`}
                    >
                      {group.name}
                    </p>
                    <p className="text-slate-500 text-xs line-clamp-1">
                      {group.memberCount} members
                      {group.is_project_group && " • Project Group"}
                    </p>
                  </div>
                  {Math.random() > 0.7 && (
                    <div className="shrink-0">
                      <div className="size-2 rounded-full bg-green-500"></div>
                    </div>
                  )}
                </div>
              ))
          )}
          {activeTab === "direct" && userSearchResults.length > 0 && (
            <div className="border-t border-slate-200 mt-2 pt-2">
              <p className="px-4 py-1 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                People
              </p>
              {userSearchResults.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-slate-100"
                  onClick={() => handleStartDirect(person.id)}
                >
                  <p className="text-sm font-semibold text-slate-800">{person.full_name}</p>
                  <p className="text-xs text-slate-500">{person.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4">
          {showCreateGroup ? (
            <div className="space-y-3">
                <input
                  type="text"
                  value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                  autoFocus
                />
                <input
                  type="text"
                  value={groupMemberQuery}
                  onChange={(e) => setGroupMemberQuery(e.target.value)}
                  placeholder="Add members by name/email..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
                {groupMemberResults.length > 0 && (
                  <div className="max-h-28 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                    {groupMemberResults.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-slate-50"
                        onClick={() => {
                          setSelectedGroupMembers((prev) => [...prev, person]);
                          setGroupMemberQuery("");
                          setGroupMemberResults([]);
                        }}
                      >
                        <p className="text-sm font-medium text-slate-800">
                          {person.full_name}
                        </p>
                        <p className="text-xs text-slate-500">{person.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedGroupMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGroupMembers.map((person) => {
                      return (
                        <div
                          key={person.id}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 text-xs px-2 py-1"
                        >
                          <span>{person.full_name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedGroupMembers((prev) =>
                                prev.filter((member) => member.id !== person.id),
                              )
                            }
                            className="material-symbols-outlined text-[12px]"
                          >
                            close
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="flex-1 bg-blue-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateGroup(false);
                    setNewGroupName("");
                    setGroupMemberQuery("");
                    setGroupMemberResults([]);
                    setSelectedGroupMembers([]);
                  }}
                  className="flex-1 bg-slate-200 text-slate-700 text-sm font-bold py-2 rounded-lg hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowCreateGroup(true)}
              className="w-full flex cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-blue-600 text-white text-sm font-bold transition-all hover:bg-blue-700"
            >
              <span className="material-symbols-outlined text-lg mr-2">add</span>
              <span className="truncate">New Group</span>
            </button>
          )}
        </div>
      </section>

      {/* Main Chat Window */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold">
              {chatGroups.find(g => g.id === selectedGroup)?.name || '#general'}
            </h3>
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
            <div className="flex items-center text-slate-500 text-sm gap-1 cursor-pointer hover:text-blue-600">
              <span className="material-symbols-outlined text-base">
                person
              </span>
              <span>{chatGroups.find(g => g.id === selectedGroup)?.memberCount || 0}</span>
            </div>
            <div className="flex items-center text-xs gap-1 ml-2">
              <span
                className={`material-symbols-outlined text-sm ${
                  socketConnected ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {socketConnected ? "wifi" : "wifi_off"}
              </span>
              <span className={socketConnected ? "text-emerald-700" : "text-slate-500"}>
                {socketConnected ? "Live" : "Offline"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <button className="hover:text-blue-600 transition-colors">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button className="hover:text-blue-600 transition-colors">
              <span className="material-symbols-outlined">info</span>
            </button>
            <button className="hover:text-blue-600 transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {hasMoreMessages && messages.length > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={loadOlderMessages}
                disabled={loadingOlder}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {loadingOlder ? "Loading..." : "Load older messages"}
              </button>
            </div>
          )}
          {messagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.user_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                >
                  <div className="size-10 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {msg.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div
                    className={`flex flex-col ${isCurrentUser ? "items-end" : ""}`}
                  >
                    <div
                      className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                    >
                      <span className="font-bold text-sm">
                        {isCurrentUser ? "You" : (msg.user?.full_name || 'Unknown User')}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div
                      className={`p-3 text-sm leading-relaxed max-w-2xl ${
                        isCurrentUser
                          ? "bg-blue-600 text-white rounded-tl-xl rounded-bl-xl rounded-br-xl shadow-sm"
                          : "bg-slate-50 rounded-tr-xl rounded-br-xl rounded-bl-xl"
                      }`}
                    >
                      {msg.content}
                      {msg.attachment_url && (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className={`mt-2 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                            isCurrentUser
                              ? "border-blue-300 bg-blue-500 text-white"
                              : "border-slate-200 bg-white text-blue-700"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">attach_file</span>
                          <span className="truncate max-w-[220px]">
                            {msg.attachment_name || "Attachment"}
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rich-Text Input Area */}
        <footer className="p-6 pt-0">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleAttachmentSelected}
          />
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
            {(pendingAttachment || uploadingAttachment) && (
              <div className="px-3 pt-2 pb-1">
                <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                  <span className="material-symbols-outlined text-sm">
                    {uploadingAttachment ? "progress_activity" : "attach_file"}
                  </span>
                  <span className="max-w-[220px] truncate">
                    {uploadingAttachment
                      ? "Uploading attachment..."
                      : pendingAttachment?.attachment_name}
                  </span>
                  {pendingAttachment && !uploadingAttachment && (
                    <button
                      type="button"
                      className="material-symbols-outlined text-[14px] text-slate-500 hover:text-slate-800"
                      onClick={() => setPendingAttachment(null)}
                    >
                      close
                    </button>
                  )}
                </div>
              </div>
            )}
            <textarea
              className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none min-h-[60px] px-3 pt-2 placeholder:text-slate-500"
              placeholder={`Message ${chatGroups.find(g => g.id === selectedGroup)?.name || '#general'}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-1 text-slate-500">
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <span className="material-symbols-outlined text-xl">
                    format_bold
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handlePickAttachment}
                  disabled={!selectedGroup || uploadingAttachment}
                  className="p-1.5 hover:bg-slate-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-xl">
                    attach_file
                  </span>
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <span className="material-symbols-outlined text-xl">
                    mood
                  </span>
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <span className="material-symbols-outlined text-xl">
                    alternate_email
                  </span>
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={(!message.trim() && !pendingAttachment) || uploadingAttachment || !selectedGroup}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Chat;
