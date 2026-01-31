import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ChatGroup {
  id: string;
  name: string;
  memberCount: number;
  isActive?: boolean;
  hasUnread?: boolean;
}

interface Message {
  id: string;
  user: {
    name: string;
    avatar: string;
    isCurrentUser?: boolean;
  };
  content: string;
  timestamp: string;
  attachment?: {
    name: string;
    url: string;
    preview?: string;
  };
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'direct' | 'groups'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<string>('design-team');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const chatGroups: ChatGroup[] = [
    { id: 'design-team', name: '#design-team', memberCount: 12, isActive: true, hasUnread: true },
    { id: 'q4-marketing', name: '#q4-marketing', memberCount: 8 },
    { id: 'dev-sprint', name: '#dev-sprint', memberCount: 24 },
    { id: 'general-announcements', name: '#general-announcements', memberCount: 150 }
  ];

  const messages: Message[] = [
    {
      id: '1',
      user: {
        name: 'Sarah Jenkins',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
      },
      content: "Has everyone reviewed the new Figma prototypes? I've updated the mobile navigation flow based on yesterday's feedback.",
      timestamp: '10:24 AM'
    },
    {
      id: '2',
      user: {
        name: 'Marcus Chen',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
      },
      content: "Looking great! I'll add my comments by EOD. The new typography feels much cleaner.",
      timestamp: '10:28 AM',
      attachment: {
        name: 'Dashboard_v2_final.png',
        url: '#',
        preview: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400'
      }
    },
    {
      id: '3',
      user: {
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        isCurrentUser: true
      },
      content: "Thanks Marcus! @Sarah Jenkins let's sync for 5 mins after the standup to finalize the icon set.",
      timestamp: '10:45 AM'
    }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle message sending logic here
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
                activeTab === 'direct' 
                  ? 'border-blue-600 text-slate-900' 
                  : 'border-transparent text-slate-500'
              }`}
              onClick={() => setActiveTab('direct')}
            >
              <p className="text-xs font-bold uppercase tracking-wider">Direct</p>
            </button>
            <button 
              className={`flex flex-col items-center justify-center border-b-[2px] pb-2 pt-1 px-2 ${
                activeTab === 'groups' 
                  ? 'border-blue-600 text-slate-900' 
                  : 'border-transparent text-slate-500'
              }`}
              onClick={() => setActiveTab('groups')}
            >
              <p className="text-xs font-bold uppercase tracking-wider">Groups</p>
            </button>
          </div>
        </div>

        {/* Group List */}
        <div className="flex-1 overflow-y-auto">
          {chatGroups.map((group) => (
            <div 
              key={group.id}
              className={`flex items-center gap-3 px-4 min-h-[64px] py-2 cursor-pointer transition-colors ${
                group.isActive 
                  ? 'bg-white border-l-4 border-blue-600' 
                  : 'hover:bg-slate-100'
              }`}
              onClick={() => setSelectedGroup(group.id)}
            >
              <div className={`flex items-center justify-center rounded-lg shrink-0 size-10 ${
                group.isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                <span className="material-symbols-outlined text-lg">tag</span>
              </div>
              <div className="flex flex-col justify-center flex-1">
                <p className={`text-sm line-clamp-1 ${
                  group.isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-900'
                }`}>
                  {group.name}
                </p>
                <p className="text-slate-500 text-xs line-clamp-1">{group.memberCount} members</p>
              </div>
              {group.hasUnread && (
                <div className="shrink-0">
                  <div className="size-2 rounded-full bg-green-500"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4">
          <button className="w-full flex cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-blue-600 text-white text-sm font-bold transition-all hover:bg-blue-700">
            <span className="material-symbols-outlined text-lg mr-2">add</span>
            <span className="truncate">New Group</span>
          </button>
        </div>
      </section>

      {/* Main Chat Window */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold">#design-team</h3>
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
            <div className="flex items-center text-slate-500 text-sm gap-1 cursor-pointer hover:text-blue-600">
              <span className="material-symbols-outlined text-base">person</span>
              <span>12</span>
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
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.user.isCurrentUser ? 'flex-row-reverse' : ''}`}>
              <div 
                className="size-10 rounded-lg bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${msg.user.avatar})` }}
              />
              <div className={`flex flex-col ${msg.user.isCurrentUser ? 'items-end' : ''}`}>
                <div className={`flex items-baseline gap-2 mb-1 ${msg.user.isCurrentUser ? 'flex-row-reverse' : ''}`}>
                  <span className="font-bold text-sm">{msg.user.name}</span>
                  <span className="text-xs text-slate-500">{msg.timestamp}</span>
                </div>
                <div className={`p-3 text-sm leading-relaxed max-w-2xl ${
                  msg.user.isCurrentUser 
                    ? 'bg-blue-600 text-white rounded-tl-xl rounded-bl-xl rounded-br-xl shadow-sm' 
                    : 'bg-slate-50 rounded-tr-xl rounded-br-xl rounded-bl-xl'
                }`}>
                  {msg.content.includes('@') ? (
                    <>
                      {msg.content.split('@').map((part, index) => {
                        if (index === 0) return part;
                        const [mention, ...rest] = part.split(' ');
                        return (
                          <span key={index}>
                            <span className={`px-1 rounded ${
                              msg.user.isCurrentUser ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
                            }`}>
                              @{mention}
                            </span>
                            {rest.length > 0 && ' ' + rest.join(' ')}
                          </span>
                        );
                      })}
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.attachment && (
                  <div className="rounded-lg border border-slate-200 overflow-hidden w-64 mt-2">
                    <div 
                      className="h-32 bg-slate-200 bg-cover bg-center"
                      style={{ backgroundImage: `url(${msg.attachment.preview})` }}
                    />
                    <div className="p-2 flex items-center justify-between bg-white">
                      <span className="text-xs font-medium truncate">{msg.attachment.name}</span>
                      <span className="material-symbols-outlined text-blue-600 text-sm cursor-pointer">
                        download
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Rich-Text Input Area */}
        <footer className="p-6 pt-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
            <textarea 
              className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none min-h-[60px] px-3 pt-2 placeholder:text-slate-500"
              placeholder="Message #design-team..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-1 text-slate-500">
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <span className="material-symbols-outlined text-xl">format_bold</span>
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <span className="material-symbols-outlined text-xl">attach_file</span>
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <span className="material-symbols-outlined text-xl">mood</span>
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                  <span className="material-symbols-outlined text-xl">alternate_email</span>
                </button>
              </div>
              <button 
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
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