import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { chatAPI, ChatGroup, ChatMessage } from "../services/chatService";
import { WS_BASE_URL } from "../config/api";

type SearchPerson = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
};

const isImageAttachment = (attachmentUrl?: string, attachmentName?: string) => {
  const source = String(attachmentName || attachmentUrl || "").toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic|heif)(\?|#|$)/i.test(source);
};

const EMOJI_OPTIONS = [
  "😀",
  "😂",
  "😍",
  "😎",
  "🤝",
  "🙏",
  "👍",
  "🎉",
  "🔥",
  "✅",
  "🚀",
  "💡",
  "📌",
  "📎",
  "👀",
  "💬",
];

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"direct" | "groups">("groups");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupMemberQuery, setGroupMemberQuery] = useState("");
  const [groupMemberResults, setGroupMemberResults] = useState<SearchPerson[]>([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<SearchPerson[]>([]);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [networkError, setNetworkError] = useState("");
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    attachment_url: string;
    attachment_name: string;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [userSearchResults, setUserSearchResults] = useState<SearchPerson[]>([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const [unreadByGroup, setUnreadByGroup] = useState<Record<string, number>>({});

  const selectedGroupRef = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const subscribedGroupIdsRef = useRef<Set<string>>(new Set());

  const directChats = useMemo(
    () => chatGroups.filter((group) => group.is_direct),
    [chatGroups],
  );
  const groupChats = useMemo(
    () => chatGroups.filter((group) => !group.is_direct),
    [chatGroups],
  );

  const displayedChats = useMemo(
    () => (activeTab === "direct" ? directChats : groupChats),
    [activeTab, directChats, groupChats],
  );

  const selectedChat = useMemo(
    () => chatGroups.find((group) => group.id === selectedGroup) || null,
    [chatGroups, selectedGroup],
  );

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

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await chatAPI.searchUsers(
          searchQuery.trim(),
          20,
          controller.signal,
        );
        if (response.success) {
          setUserSearchResults(response.data);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setUserSearchResults([]);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
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

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await chatAPI.searchUsers(
          groupMemberQuery.trim(),
          20,
          controller.signal,
        );
        if (response.success) {
          setGroupMemberResults(
            response.data.filter(
              (person) => !selectedGroupMembers.some((member) => member.id === person.id),
            ),
          );
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setGroupMemberResults([]);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [showCreateGroup, groupMemberQuery, selectedGroupMembers]);

  useEffect(() => {
    const socket = new WebSocket(`${WS_BASE_URL}/ws/chat`, ["chat.v1"]);

    socket.onopen = () => {
      setSocketConnected(true);
      subscribedGroupIdsRef.current.clear();
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
          const incomingMessage = payload.message as ChatMessage;
          const isSelectedGroup = payload.groupId === selectedGroupRef.current;

          setChatGroups((prev) => {
            const found = prev.find((group) => group.id === payload.groupId);
            if (!found) return prev;
            return [
              { ...found, updated_at: incomingMessage.created_at || new Date().toISOString() },
              ...prev.filter((group) => group.id !== payload.groupId),
            ];
          });

          if (isSelectedGroup) {
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === incomingMessage.id)) return prev;
              return [...prev, incomingMessage];
            });
            setUnreadByGroup((prev) => {
              if (!prev[payload.groupId!]) return prev;
              const next = { ...prev };
              delete next[payload.groupId!];
              return next;
            });
          } else {
            setUnreadByGroup((prev) => ({
              ...prev,
              [payload.groupId!]: (prev[payload.groupId!] || 0) + 1,
            }));
          }
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
    const hasSelectionInTab = displayedChats.some((chat) => chat.id === selectedGroup);
    if (hasSelectionInTab) return;

    if (displayedChats.length > 0) {
      setSelectedGroup(displayedChats[0].id);
    } else {
      setSelectedGroup("");
      setMessages([]);
      setHasMoreMessages(false);
    }
  }, [activeTab, displayedChats, selectedGroup]);

  useEffect(() => {
    const requestedGroup = searchParams.get("group");
    if (!requestedGroup) return;

    const requestedTab = searchParams.get("tab");
    if (requestedTab === "direct" || requestedTab === "groups") {
      setActiveTab(requestedTab);
    }

    const targetExists = chatGroups.some((group) => group.id === requestedGroup);
    if (targetExists) {
      setSelectedGroup(requestedGroup);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("group");
        next.delete("tab");
        return next;
      });
    }
  }, [chatGroups, searchParams, setSearchParams]);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;

    if (!selectedGroup) return;

    fetchMessages(selectedGroup, false);
    setPendingAttachment(null);
    setUnreadByGroup((prev) => {
      if (!prev[selectedGroup]) return prev;
      const next = { ...prev };
      delete next[selectedGroup];
      return next;
    });

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "subscribe", groupId: selectedGroup }));
    }
  }, [selectedGroup, ws]);

  useEffect(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const nextGroupIds = new Set(chatGroups.map((group) => group.id));
    const currentSubscriptions = subscribedGroupIdsRef.current;

    nextGroupIds.forEach((groupId) => {
      if (currentSubscriptions.has(groupId)) return;
      ws.send(JSON.stringify({ type: "subscribe", groupId }));
      currentSubscriptions.add(groupId);
    });

    currentSubscriptions.forEach((groupId) => {
      if (nextGroupIds.has(groupId)) return;
      ws.send(JSON.stringify({ type: "unsubscribe", groupId }));
      currentSubscriptions.delete(groupId);
    });
  }, [chatGroups, ws]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncLayout = (matches: boolean) => {
      setShowMobileSidebar(matches ? true : !selectedGroupRef.current);
    };

    syncLayout(mediaQuery.matches);

    const handleMediaChange = (event: MediaQueryListEvent) => {
      syncLayout(event.matches);
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (emojiPickerRef.current?.contains(target)) return;
      if (target.closest("[data-emoji-toggle]")) return;
      setShowEmojiPicker(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowEmojiPicker(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showEmojiPicker]);

  const fetchChatGroups = async () => {
    try {
      setLoading(true);
      setNetworkError("");
      const response = await chatAPI.getGroups();
      if (response.success) {
        setChatGroups(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch chat groups:", error);
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
      console.error("Failed to fetch messages:", error);
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
        name: newGroupName.trim(),
        member_ids: selectedGroupMembers.map((member) => member.id),
      });

      if (response.success) {
        setChatGroups((prev) => [response.data, ...prev]);
        setActiveTab("groups");
        setSelectedGroup(response.data.id);
        setNewGroupName("");
        setGroupMemberQuery("");
        setGroupMemberResults([]);
        setSelectedGroupMembers([]);
        setShowCreateGroup(false);
      }
    } catch (error) {
      console.error("Failed to create group:", error);
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
          if (prev.some((msg) => msg.id === response.data.id)) return prev;
          return [...prev, response.data];
        });
        setMessage("");
        setPendingAttachment(null);
        setShowEmojiPicker(false);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handlePickAttachment = () => {
    if (!selectedGroup || uploadingAttachment) return;
    fileInputRef.current?.click();
  };

  const handleAttachmentSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      event.target.value = "";
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

      setActiveTab("direct");
      setSelectedGroup(group.id);
      setShowMobileSidebar(false);
    } catch (error) {
      console.error("Failed to open direct chat:", error);
    }
  };

  const filteredChats = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return displayedChats;

    return displayedChats.filter((group) => {
      const inName = group.name.toLowerCase().includes(normalized);
      const inMembers =
        group.members?.some(
          (member) =>
            member.full_name.toLowerCase().includes(normalized) ||
            member.email.toLowerCase().includes(normalized),
        ) || false;
      return inName || inMembers;
    });
  }, [displayedChats, searchQuery]);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const onSelectConversation = (groupId: string) => {
    setSelectedGroup(groupId);
    setShowEmojiPicker(false);
    if (window.innerWidth < 768) {
      setShowMobileSidebar(false);
    }
  };

  const openSidebarMobile = () => setShowMobileSidebar(true);

  const insertEmoji = (emoji: string) => {
    const input = messageInputRef.current;
    if (!input) {
      setMessage((prev) => `${prev}${emoji}`);
      setShowEmojiPicker(false);
      return;
    }

    const selectionStart = input.selectionStart ?? message.length;
    const selectionEnd = input.selectionEnd ?? message.length;
    const nextMessage =
      message.slice(0, selectionStart) + emoji + message.slice(selectionEnd);

    setMessage(nextMessage);
    setShowEmojiPicker(false);

    requestAnimationFrame(() => {
      const nextCursor = selectionStart + emoji.length;
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const directSearchResults = useMemo(() => {
    if (activeTab !== "direct") return [];
    const existingIds = new Set(directChats.map((group) => group.members?.find((m) => m.id !== user?.id)?.id));
    return userSearchResults.filter((person) => !existingIds.has(person.id));
  }, [activeTab, userSearchResults, directChats, user?.id]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-slate-100 md:flex-row">
      <aside
        className={`
          ${showMobileSidebar ? "flex" : "hidden"}
          absolute inset-0 z-20 w-full flex-col border-r border-slate-200 bg-white/95 backdrop-blur-sm
          md:relative md:z-0 md:flex md:w-[320px] md:bg-white md:backdrop-blur-none
          lg:w-[360px]
        `}
      >
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Chat</h2>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${
                  socketConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {socketConnected ? "wifi" : "wifi_off"}
                </span>
                {socketConnected ? "Live" : "Offline"}
              </span>
              <button
                type="button"
                onClick={() => fetchChatGroups()}
                className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-100"
                title="Refresh"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
              </button>
            </div>
          </div>

          {networkError && (
            <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {networkError}
            </div>
          )}

          <div className="mb-3 flex h-10 w-full">
            <div className="flex items-center justify-center rounded-l-lg bg-slate-100 pl-3 text-slate-500">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              className="h-full w-full rounded-r-lg border-none bg-slate-100 px-3 pl-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
              placeholder={activeTab === "direct" ? "Search chats or people..." : "Search groups..."}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                activeTab === "direct"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => {
                setActiveTab("direct");
                setShowCreateGroup(false);
              }}
            >
              Direct
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                activeTab === "groups"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("groups")}
            >
              Groups
            </button>
            {activeTab === "groups" && !showCreateGroup && (
              <button
                type="button"
                onClick={() => setShowCreateGroup(true)}
                className="rounded-md bg-blue-600 px-2.5 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
                title="Create Group"
              >
                +
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <span className="material-symbols-outlined text-xl">
                  {activeTab === "direct" ? "chat" : "group"}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {activeTab === "direct" ? "No direct chats" : "No groups found"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {activeTab === "direct"
                  ? "Search a user by name or email to start a conversation."
                  : "Create a group to start collaboration."}
              </p>
            </div>
          ) : (
            filteredChats.map((group) => {
              const isSelected = selectedGroup === group.id;
              const isDirect = !!group.is_direct;
              const directPeer = group.members?.find((member) => member.id !== user?.id);

              return (
                <button
                  key={group.id}
                  type="button"
                  className={`flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-50"
                      : "border-transparent hover:bg-slate-50"
                  }`}
                  onClick={() => onSelectConversation(group.id)}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {isDirect ? "person" : group.is_project_group ? "folder" : "groups"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{group.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {isDirect
                        ? directPeer?.email || "Direct message"
                        : `${group.memberCount} members${group.is_project_group ? " • Project" : ""}`}
                    </p>
                  </div>
                  {!!unreadByGroup[group.id] && (
                    <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {unreadByGroup[group.id] > 99 ? "99+" : unreadByGroup[group.id]}
                    </span>
                  )}
                </button>
              );
            })
          )}

          {activeTab === "direct" && directSearchResults.length > 0 && (
            <div className="border-t border-slate-200 pb-2 pt-2">
              <p className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Start New Direct Chat
              </p>
              {directSearchResults.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-slate-50"
                  onClick={() => handleStartDirect(person.id)}
                >
                  <p className="text-sm font-semibold text-slate-800">{person.full_name}</p>
                  <p className="text-xs text-slate-500">{person.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTab === "groups" && (
          <div className="border-t border-slate-200 p-4">
            {showCreateGroup ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  placeholder="Group name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleCreateGroup();
                    }
                  }}
                  autoFocus
                />

                <input
                  type="text"
                  value={groupMemberQuery}
                  onChange={(event) => setGroupMemberQuery(event.target.value)}
                  placeholder="Add members by name or email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />

                {groupMemberResults.length > 0 && (
                  <div className="max-h-28 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                    {groupMemberResults.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() => {
                          setSelectedGroupMembers((prev) => [...prev, person]);
                          setGroupMemberQuery("");
                          setGroupMemberResults([]);
                        }}
                      >
                        <p className="text-sm font-medium text-slate-800">{person.full_name}</p>
                        <p className="text-xs text-slate-500">{person.email}</p>
                      </button>
                    ))}
                  </div>
                )}

                {selectedGroupMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGroupMembers.map((person) => (
                      <div
                        key={person.id}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700"
                      >
                        <span>{person.full_name}</span>
                        <button
                          type="button"
                          className="material-symbols-outlined text-[12px]"
                          onClick={() =>
                            setSelectedGroupMembers((prev) =>
                              prev.filter((member) => member.id !== person.id),
                            )
                          }
                        >
                          close
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim()}
                    className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateGroup(false);
                      setNewGroupName("");
                      setGroupMemberQuery("");
                      setGroupMemberResults([]);
                      setSelectedGroupMembers([]);
                    }}
                    className="flex-1 rounded-lg bg-slate-200 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreateGroup(true)}
                className="flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
              >
                <span className="material-symbols-outlined mr-2 text-lg">add</span>
                New Group
              </button>
            )}
          </div>
        )}
      </aside>

      <main
        className={`
          ${showMobileSidebar ? "hidden" : "flex"}
          min-w-0 flex-1 flex-col overflow-hidden bg-white lg:flex
          md:flex
        `}
      >
        {selectedChat ? (
          <>
            <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 md:flex-nowrap md:px-5 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="rounded-md p-1 text-slate-600 hover:bg-slate-100 md:hidden"
                  onClick={openSidebarMobile}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>

                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-slate-900 lg:text-lg">
                    {selectedChat.name}
                  </h3>
                  <p className="truncate text-xs text-slate-500">
                    {selectedChat.is_direct
                      ? "Direct conversation"
                      : `${selectedChat.memberCount} members${selectedChat.is_project_group ? " • Project group" : ""}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                {activeTab === "groups" && (
                  <button
                    type="button"
                    className="rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-blue-600"
                    onClick={() => {
                      setActiveTab("groups");
                      setShowCreateGroup(true);
                      setShowMobileSidebar(true);
                    }}
                    title="Create group"
                  >
                    <span className="material-symbols-outlined">group_add</span>
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-blue-600"
                  onClick={() => fetchMessages(selectedChat.id, false)}
                  title="Refresh messages"
                >
                  <span className="material-symbols-outlined">refresh</span>
                </button>
                <button
                  type="button"
                  className="rounded-md p-1.5 transition-colors hover:bg-slate-100"
                >
                  <span className="material-symbols-outlined">info</span>
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4 md:px-5 lg:px-6 lg:py-6">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
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
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-sm text-slate-500">
                    No messages yet. Start the conversation.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCurrentUser = msg.user_id === user?.id;
                    const hasImageAttachment = isImageAttachment(
                      msg.attachment_url,
                      msg.attachment_name,
                    );
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 sm:gap-3 lg:gap-4 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white lg:h-10 lg:w-10">
                          {msg.user?.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>

                        <div
                          className={`flex max-w-[calc(100vw-5.5rem)] min-w-0 flex-col sm:max-w-[85%] ${
                            isCurrentUser ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 ${
                              isCurrentUser ? "flex-row-reverse" : ""
                            }`}
                          >
                            <span className="text-sm font-bold text-slate-900">
                              {isCurrentUser ? "You" : msg.user?.full_name || "Unknown User"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div
                            className={`w-fit rounded-2xl px-3 py-2 text-sm leading-relaxed lg:px-4 lg:py-2.5 ${
                              isCurrentUser
                                ? "rounded-tr-md bg-blue-600 text-white"
                                : "rounded-tl-md bg-slate-100 text-slate-900"
                            }`}
                          >
                            {msg.content && <p>{msg.content}</p>}
                            {msg.attachment_url && hasImageAttachment && (
                              <div className={msg.content ? "mt-3" : ""}>
                                <img
                                  src={msg.attachment_url}
                                  alt={msg.attachment_name || "Shared image"}
                                  className="max-h-[320px] w-full max-w-[220px] rounded-xl object-cover sm:max-w-[340px] lg:max-w-[420px]"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            {msg.attachment_url && !hasImageAttachment && (
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
                                <span className="max-w-[220px] truncate">
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
            </div>

            <footer className="border-t border-slate-200 bg-white px-3 py-3 sm:px-4 md:px-5 lg:px-6 lg:py-4">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleAttachmentSelected}
              />

              <div className="relative mx-auto w-full max-w-4xl rounded-xl border border-slate-200 bg-slate-50 p-2">
                {(pendingAttachment || uploadingAttachment) && (
                  <div className="px-2 pb-1 pt-1">
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
                  ref={messageInputRef}
                  className="min-h-[56px] w-full resize-none border-none bg-transparent px-3 pt-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
                  placeholder={`Message ${selectedChat.name}...`}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleKeyPress}
                />

                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-[calc(100%+0.5rem)] left-2 right-2 z-10 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:left-auto sm:right-2 sm:w-72"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Insert emoji
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xl transition hover:border-blue-200 hover:bg-blue-50"
                          onClick={() => insertEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1">
                  <div className="flex items-center gap-1 text-slate-500">
                    <button
                      type="button"
                      className="rounded p-1.5 transition-colors hover:bg-slate-200"
                      title="Formatting coming soon"
                    >
                      <span className="material-symbols-outlined text-xl">format_bold</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePickAttachment}
                      disabled={!selectedGroup || uploadingAttachment}
                      className="rounded p-1.5 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-xl">attach_file</span>
                    </button>
                    <button
                      type="button"
                      data-emoji-toggle
                      className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
                        showEmojiPicker ? "bg-slate-200 text-blue-600" : ""
                      }`}
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      title="Insert emoji"
                    >
                      <span className="material-symbols-outlined text-xl">mood</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={(!message.trim() && !pendingAttachment) || uploadingAttachment || !selectedGroup}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <span>Send</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </div>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <span className="material-symbols-outlined text-2xl">chat</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Select a conversation</h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose a {activeTab === "direct" ? "direct chat" : "group"} from the sidebar.
            </p>
            <button
              type="button"
              className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:hidden"
              onClick={openSidebarMobile}
            >
              Open chat list
            </button>
            {activeTab === "groups" && (
              <button
                type="button"
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                onClick={() => {
                  setShowCreateGroup(true);
                  setShowMobileSidebar(true);
                }}
              >
                Create group
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Chat;
