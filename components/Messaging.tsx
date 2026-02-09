
import React, { useState } from 'react';
import { Conversation, Message } from '../types';

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participantName: 'أ. سامي الجبالي',
    participantAvatar: 'https://picsum.photos/seed/admin1/200',
    lastMessage: 'تم اعتماد كشف الطرود الجديد، يرجى المراجعة.',
    time: '10:30 ص',
    unreadCount: 2,
    online: true,
    messages: [
      { id: 'm1', senderId: 'other', text: 'السلام عليكم أخي، بخصوص الطرود..', time: '10:15 ص', isMe: false },
      { id: 'm2', senderId: 'other', text: 'تم اعتماد كشف الطرود الجديد، يرجى المراجعة.', time: '10:30 ص', isMe: false },
    ]
  },
  {
    id: 'c2',
    participantName: 'د. مروة السيد',
    participantAvatar: 'https://picsum.photos/seed/admin2/200',
    lastMessage: 'هل توجد حالات صحية طارئة اليوم؟',
    time: 'أمس',
    unreadCount: 0,
    online: true,
    messages: [
      { id: 'm1', senderId: 'me', text: 'مرحبا دكتورة مروة.', time: 'أمس', isMe: true },
      { id: 'm2', senderId: 'other', text: 'هل توجد حالات صحية طارئة اليوم؟', time: 'أمس', isMe: false },
    ]
  },
  {
    id: 'c3',
    participantName: 'إدارة المخازن',
    participantAvatar: 'https://picsum.photos/seed/store/200',
    lastMessage: 'نحتاج لتحديث بيانات العوائل المستلمة.',
    time: '9:00 ص',
    unreadCount: 5,
    online: false,
    messages: [
      { id: 'm1', senderId: 'other', text: 'نحتاج لتحديث بيانات العوائل المستلمة.', time: '9:00 ص', isMe: false },
    ]
  }
];

const Messaging: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeChat) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: 'me',
      text: inputMessage,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    const updatedMessages = [...activeChat.messages, newMessage];
    const updatedChat = { ...activeChat, messages: updatedMessages, lastMessage: inputMessage, time: 'الآن' };
    
    setActiveChat(updatedChat);
    setConversations(prev => prev.map(c => c.id === activeChat.id ? updatedChat : c));
    setInputMessage('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] animate-in fade-in duration-500 overflow-hidden rounded-[3rem] shadow-2xl glass">
      
      {!activeChat ? (
        /* Inbox View */
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-b from-purple-800 to-purple-900 p-8 pb-12 rounded-b-[4rem] shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full"></div>
            <div className="relative z-10">
              {/* تم حذف كلمة "رسائلي" من هنا بناءً على طلب المستخدم */}
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-white/50 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                    <i className="fas fa-plus"></i>
                  </div>
                  <span className="text-[10px] text-white/60 font-bold">جديد</span>
                </div>
                {conversations.map(conv => (
                  <div key={conv.id} className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer" onClick={() => setActiveChat(conv)}>
                    <div className="relative">
                      <img src={conv.participantAvatar} className="w-16 h-16 rounded-full border-2 border-transparent group-hover:border-purple-400 transition-all shadow-lg" alt="" />
                      {conv.online && <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-4 border-purple-900 rounded-full"></span>}
                    </div>
                    <span className="text-[10px] text-white/80 font-bold truncate w-16 text-center">{conv.participantName.split(' ')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar -mt-6">
            {conversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => setActiveChat(conv)}
                className="bg-white/5 border border-white/10 p-5 rounded-[2.5rem] flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <img src={conv.participantAvatar} className="w-14 h-14 rounded-2xl shadow-lg group-hover:scale-105 transition-transform" alt="" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0f172a]">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-black text-white text-base">{conv.participantName}</h4>
                    <span className="text-[10px] text-gray-500 font-bold">{conv.time}</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1 font-medium">{conv.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Chat View */
        <div className="flex flex-col h-full bg-slate-900/50">
          {/* Chat Header */}
          <div className="bg-white/5 border-b border-white/5 p-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveChat(null)} className="text-gray-400 hover:text-white transition-colors">
                <i className="fas fa-chevron-right text-xl"></i>
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={activeChat.participantAvatar} className="w-12 h-12 rounded-xl shadow-md" alt="" />
                  {activeChat.online && <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></span>}
                </div>
                <div>
                  <h4 className="text-white font-black text-sm">{activeChat.participantName}</h4>
                  <p className="text-[10px] text-green-500 font-bold">{activeChat.online ? 'متصل الآن' : 'غير متصل'}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 hover:text-purple-400 transition-all">
                <i className="fas fa-phone"></i>
              </button>
              <button className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 hover:text-purple-400 transition-all">
                <i className="fas fa-video"></i>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {activeChat.messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-start' : 'items-end'}`}>
                <div className={`max-w-[80%] p-4 rounded-[1.8rem] text-sm font-medium shadow-sm ${
                  msg.isMe 
                    ? 'bg-purple-600/20 text-purple-100 rounded-bl-none border border-purple-500/20' 
                    : 'bg-white text-slate-900 rounded-br-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-gray-500 font-bold mt-1 px-2">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white/5 border-t border-white/5">
            <div className="flex items-center gap-4 bg-white/5 rounded-[2.5rem] p-2 pl-2 border border-white/10">
              <button className="w-10 h-10 rounded-full text-gray-400 hover:text-white transition-colors">
                <i className="fas fa-paperclip"></i>
              </button>
              <input 
                type="text" 
                placeholder="اكتب رسالتك هنا..." 
                className="flex-1 bg-transparent border-none text-white text-sm outline-none px-2 font-bold placeholder:text-gray-600"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-900/40 hover:bg-purple-700 transition-all"
              >
                <i className="fas fa-paper-plane-top"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default Messaging;
