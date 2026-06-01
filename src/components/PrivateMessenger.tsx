import React, { useState, useEffect } from "react";
import { PrivateChat, Message, User } from "../types";
import { Mail, Send, ShieldCheck, Ban, ShieldAlert, CheckCheck, Loader2 } from "lucide-react";

interface PrivateMessengerProps {
  currentUser: User | null;
  usersList: User[];
  onSendMessage: (recipientId: string, content: string) => void;
  onBlockUserToggle: (targetBlockUserId: string, block: boolean) => void;
  activeChatId?: string;
  onChatSelected?: (chatId: string) => void;
  preselectedRecipientId?: string;
  onRecipientSelected?: (userId: string | undefined) => void;
}

export default function PrivateMessenger({
  currentUser,
  usersList,
  onSendMessage,
  onBlockUserToggle,
  activeChatId,
  onChatSelected,
  preselectedRecipientId,
  onRecipientSelected
}: PrivateMessengerProps) {
  const [conversations, setConversations] = useState<PrivateChat[]>([]);
  const [activeChat, setActiveChat] = useState<PrivateChat | null>(null);
  const [typedMessage, setTypedMessage] = useState("");
  const [newUserSearchQuery, setNewUserSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Load private conversations for current user session
  useEffect(() => {
    if (!currentUser) return;

    const fetchChats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/chats/private?userId=${currentUser.id}`);
        if (response.ok) {
          const payload = await response.json();
          setConversations(payload);
          
          if (preselectedRecipientId) {
            const match = payload.find((c: PrivateChat) => 
               c.userA.id === preselectedRecipientId || c.userB.id === preselectedRecipientId
            );
            if (match) {
              setActiveChat(match);
            } else {
              const userObj = usersList.find(u => u.id === preselectedRecipientId);
              if (userObj) {
                const tempChat: PrivateChat = {
                  id: `temp-${Date.now()}`,
                  userA: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, verified: currentUser.verified },
                  userB: { id: userObj.id, name: userObj.name, avatar: userObj.avatar, verified: userObj.verified },
                  messages: [],
                  lastMessageAt: new Date().toISOString()
                };
                setActiveChat(tempChat);
              }
            }
          } else if (activeChatId) {
            const match = payload.find((c: PrivateChat) => c.id === activeChatId);
            if (match) setActiveChat(match);
          } else if (payload.length > 0 && !activeChat) {
            const firstChat = payload[0];
            setActiveChat(firstChat);
            const partner = firstChat.userA.id === currentUser.id ? firstChat.userB : firstChat.userA;
            if (onRecipientSelected) onRecipientSelected(partner.id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
    // Poll chats every 5 seconds for simulation realtime effect
    const interval = setInterval(fetchChats, 4000);
    return () => clearInterval(interval);
  }, [currentUser, activeChatId, preselectedRecipientId, usersList, onRecipientSelected]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeChat || !typedMessage.trim()) return;

    const partner = activeChat.userA.id === currentUser.id ? activeChat.userB : activeChat.userA;
    
    // Check if partner is blocked
    const isBlocked = currentUser.blockList.includes(partner.id);
    if (isBlocked) {
      alert("You cannot send messages to blocked companions. Please unblock them first.");
      return;
    }

    onSendMessage(partner.id, typedMessage);
    setTypedMessage("");

    // optimistic local push
    const mockMsg: Message = {
      id: `opt-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: typedMessage,
      timestamp: new Date().toISOString(),
      type: "text"
    };
    
    setActiveChat(prev => prev ? {
      ...prev,
      messages: [...prev.messages, mockMsg]
    } : null);
  };

  const handleStartChatWith = (user: User) => {
    // Check if chat already exists
    let existing = conversations.find(c => c.userA.id === user.id || c.userB.id === user.id);
    if (!existing) {
      // Setup temporary visual chat structure
      const tempChat: PrivateChat = {
        id: `temp-${Date.now()}`,
        userA: { id: currentUser!.id, name: currentUser!.name, avatar: currentUser!.avatar, verified: currentUser!.verified },
        userB: { id: user.id, name: user.name, avatar: user.avatar, verified: user.verified },
        messages: [],
        lastMessageAt: new Date().toISOString()
      };
      setActiveChat(tempChat);
    } else {
      setActiveChat(existing);
    }
    setNewUserSearchQuery("");
    if (onRecipientSelected) onRecipientSelected(user.id);
  };

  if (!currentUser) {
    return (
      <div className="bg-white border border-gray-150 rounded-3xl p-8 text-center text-gray-500 max-w-md mx-auto" id="anonymous-chat-alert">
        <Mail className="h-10 w-10 text-teal-600 mx-auto mb-3 animate-bounce" />
        <p className="font-bold">Access Secured Private Discussions</p>
        <p className="text-xs text-gray-400 mt-1 leading-normal font-sans">
          To chat securely with approved companions, please select your Active Profile Persona inside the upper navigation bar!
        </p>
      </div>
    );
  }

  // Filter possible users to talk to (not self)
  const filteredTravelers = usersList.filter(u => 
    u.id !== currentUser.id && 
    u.name.toLowerCase().includes(newUserSearchQuery.toLowerCase())
  );

  const getPartner = (chat: PrivateChat) => {
    return chat.userA.id === currentUser.id ? chat.userB : chat.userA;
  };

  const activePartner = activeChat ? getPartner(activeChat) : null;
  const isBlockedByMe = activePartner ? currentUser.blockList.includes(activePartner.id) : false;

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex h-[600px]" id="private-messenger-layout">
      {/* SIDEBAR CONVERSATIONS LIST */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50" id="conversations-sidebar">
        {/* START NEW CHAT INPUT */}
        <div className="p-3 border-b border-gray-150 bg-white" id="search-travelers-discussion">
          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Start Discussion</label>
          <input
            type="text"
            placeholder="Search travelers name..."
            value={newUserSearchQuery}
            onChange={(e) => setNewUserSearchQuery(e.target.value)}
            className="w-full bg-gray-50 text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-700 font-medium placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            id="traveler-search-bar"
          />

          {newUserSearchQuery.trim() && (
            <div className="absolute bg-white border border-gray-200 rounded-2xl p-2 mt-1 shadow-2xl z-20 max-h-48 overflow-y-auto max-w-sm space-y-1" id="dropdown-search-results">
              {filteredTravelers.length === 0 ? (
                <p className="text-[10px] text-gray-400 font-medium p-2 text-center">No companions found.</p>
              ) : (
                filteredTravelers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartChatWith(u)}
                    className="w-full text-left p-1.5 hover:bg-teal-50 rounded-lg flex items-center space-x-2 text-xs font-semibold cursor-pointer text-gray-700"
                  >
                    <img src={u.avatar} alt={u.name} className="h-6 w-6 rounded-full object-cover" />
                    <span>{u.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* ONGOING DISCUSSIONS LIST */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1" id="conversations-scroller-active">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-[11px] leading-relaxed font-sans mt-12" id="no-conversations">
              <Mail className="h-6 w-6 mx-auto mb-1 text-gray-300 animate-pulse" />
              <span>No direct communications started yet.</span>
            </div>
          ) : (
            conversations.map((chat) => {
              const partner = getPartner(chat);
              const isSelected = activeChat?.id === chat.id;
              const hasNoMessage = chat.messages.length === 0;
              const lastMsg = hasNoMessage ? "Conversation started" : chat.messages[chat.messages.length - 1].content;
              const isPartnerBlocked = currentUser.blockList.includes(partner.id);

              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChat(chat);
                    if (onRecipientSelected) onRecipientSelected(partner.id);
                    if (onChatSelected) onChatSelected(chat.id);
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-center space-x-3 transition cursor-pointer leading-tight ${
                    isSelected ? "bg-teal-50 border border-teal-100/50 shadow-sm" : "hover:bg-gray-100/70 border border-transparent"
                  }`}
                  id={`dialog-btn-${chat.id}`}
                >
                  <img src={partner.avatar} alt={partner.name} className="h-9 w-9 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 flex items-center space-x-0.5">
                      <span>{partner.name}</span>
                      {partner.verified && <ShieldCheck className="h-3 w-3 text-teal-600 inline" />}
                    </p>
                    <p className={`text-[10px] truncate ${isPartnerBlocked ? "text-red-500 font-bold" : "text-gray-500"}`}>
                      {isPartnerBlocked ? "Blocked Companion" : lastMsg}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ACTIVE DISCUSSION BOX */}
      <div className="flex-1 flex flex-col bg-white" id="chat-messages-container">
        {activeChat && activePartner ? (
          <>
            {/* DISCUSSION HEADER */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between" id="active-chat-header">
              <div className="flex items-center space-x-3">
                <img src={activePartner.avatar} alt={activePartner.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-xs font-bold text-gray-800 flex items-center space-x-0.5">
                    <span>{activePartner.name}</span>
                    {activePartner.verified && <ShieldCheck className="h-3.5 w-3.5 text-teal-700 inline" />}
                  </p>
                  <p className="text-[10px] text-teal-600 font-bold">Secure Companion Pipeline</p>
                </div>
              </div>

              {/* SAFE COMMUNITY BLOCK ACTION */}
              <div>
                <button
                  onClick={() => onBlockUserToggle(activePartner.id, !isBlockedByMe)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                    isBlockedByMe 
                      ? "bg-red-50 text-red-600 hover:bg-red-100" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  }`}
                  id="block-user-btn"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>{isBlockedByMe ? "Blocked" : "Block User"}</span>
                </button>
              </div>
            </div>

            {/* MESSAGE LIST BALLOONS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50" id="balloons-stream">
              {isBlockedByMe && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-2xl flex items-start space-x-2 text-[11px] text-red-800 font-semibold mb-2">
                  <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span>You blocked {activePartner.name}. Unblock them to restore messaging capabilities and RLS secure synchronization.</span>
                  </div>
                </div>
              )}

              {activeChat.messages.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 font-serif italic">
                  No messaging logs found. Initiate communication below to connect!
                </div>
              ) : (
                activeChat.messages.map((msg, idx) => {
                  const isSentByMe = msg.senderId === currentUser.id;
                  return (
                    <div 
                      key={msg.id || idx} 
                      className={`flex ${isSentByMe ? "justify-end" : "justify-start"}`}
                      id={`msg-bubble-${msg.id}`}
                    >
                      <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs ${
                        isSentByMe 
                          ? "bg-teal-700 text-white rounded-br-none shadow-sm" 
                          : "bg-white border border-gray-150 text-gray-800 rounded-bl-none shadow-xs"
                      }`}>
                        <div className="flex items-center justify-between space-x-2 mb-1 opacity-70 text-[9px] font-bold font-mono">
                          <span>{isSentByMe ? "You" : msg.senderName}</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="font-medium font-sans leading-relaxed break-words">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* SEND ATTACHMENT / TEXT FOOTER INPUT */}
            <div className="p-3 border-t border-gray-100 bg-white" id="editor-chat-input">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={isBlockedByMe ? "Unblock user to reply..." : "Write a secure private message to companion..."}
                  disabled={isBlockedByMe}
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 text-xs px-3.5 py-3 rounded-xl placeholder-gray-400 text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                  id="typed-content-input"
                />
                <button
                  type="submit"
                  disabled={isBlockedByMe || !typedMessage.trim()}
                  className="bg-teal-700 hover:bg-teal-800 text-white p-3 rounded-xl transition disabled:opacity-40 cursor-pointer"
                  id="chat-send-icon"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 text-xs" id="chat-no-selection">
            <Mail className="h-10 w-10 text-teal-600/30 mb-2 animate-bounce-slow" />
            <p className="font-bold text-gray-600">Secure Direct Message Pipelines</p>
            <p className="text-gray-400 max-w-sm mt-1 leading-normal font-sans text-[11px]">
              Select an ongoing conversation from the sidebar left, or search a registered traveler name inside "Start Discussion".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
