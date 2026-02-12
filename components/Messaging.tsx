import React, { useState, useMemo } from 'react';
import { Conversation, Message, IDP } from '../types';

interface MessagingProps {
  currentUser: IDP | null;
  allIDPs: IDP[];
}

// بيانات تجريبية للمحاكاة
const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participantName: 'أحمد المحمد',
    participantAvatar: 'https://picsum.photos/seed/1/200',
    lastMessage: 'أحتاج لتحديث بيانات أسرتي لو سمحت.',
    time: '09:15 ص',
    date: '2023-11-22',
    unreadCount: 1,
    online: true,
    messages: [
      { id: 'm1', senderId: '1', senderName: 'أحمد المحمد', text: 'السلام عليكم، أحتاج لتحديث بيانات أسرتي لو سمحت.', time: '09:15 ص', date: '2023-11-22', isMe: false },
    ]
  },
  {
    id: 'c2',
    participantName: 'سارة العبدالله',
    participantAvatar: 'https://picsum.photos/seed/2/200',
    lastMessage: 'تم استلام الطرد، شكراً لكم.',
    time: '08:30 ص',
    date: '2023-11-22',
    unreadCount: 0,
    online: false,
    messages: [
      { id: 'm2-1', senderId: '2', senderName: 'سارة العبدالله', text: 'متى موعد استلام الطرود؟', time: '08:00 ص', date: '2023-11-21', isMe: false },
      { id: 'm2-2', senderId: 'admin-1', senderName: 'مدير النظام الموقر', text: 'أهلاً سارة، الموعد اليوم الساعة 10 صباحاً.', time: '08:15 ص', date: '2023-11-22', isMe: true },
      { id: 'm2-3', senderId: '2', senderName: 'سارة العبدالله', text: 'تم استلام الطرد، شكراً لكم.', time: '08:30 ص', date: '2023-11-22', isMe: false },
    ]
  },
  {
    id: 'alert-1',
    participantName: 'تنبيه: صيانة عامة للمخيم',
    participantAvatar: '',
    lastMessage: 'يرجى العلم بوجود أعمال صيانة لشبكة المياه غداً.',
    time: '11:00 ص',
    date: '2023-11-21',
    unreadCount: 0,
    online: false,
    isAlert: true,
    senderAdmin: 'المهندس سامي (الإدارة)',
    messages: [
      { id: 'am1', senderId: 'admin-ref', senderName: 'المهندس سامي (الإدارة)', text: 'يرجى العلم بوجود أعمال صيانة لشبكة المياه غداً في تمام الساعة 9 صباحاً.', time: '11:00 ص', date: '2023-11-21', isMe: false }
    ]
  },
  {
    id: 'alert-2',
    participantName: 'تنبيه: توزيع الخبز اليومي',
    participantAvatar: '',
    lastMessage: 'بدأ توزيع الخبز في الساحة الشرقية.',
    time: '07:00 ص',
    date: '2023-11-22',
    unreadCount: 0,
    online: false,
    isAlert: true,
    senderAdmin: 'أبو عمر (مسؤول الإغاثة)',
    messages: [
      { id: 'am2', senderId: 'admin-ref2', senderName: 'أبو عمر (مسؤول الإغاثة)', text: 'بدأ توزيع الخبز في الساحة الشرقية، يرجى الالتزام بالدور.', time: '07:00 ص', date: '2023-11-22', isMe: false }
    ]
  }
];

const Messaging: React.FC<MessagingProps> = ({ currentUser, allIDPs }) => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'alerts'>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  
  const [isNewMsgModalOpen, setIsNewMsgModalOpen] = useState(false);
  const [newMsgSearch, setNewMsgSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<IDP | null>(null);
  const [broadcastTargets, setBroadcastTargets] = useState({ nazih: false, idari: false });
  const [newMsgContent, setNewMsgContent] = useState('');

  const isAdmin = currentUser?.role === 'idari';

  const filteredRecipients = useMemo(() => {
    if (!newMsgSearch) return [];
    return allIDPs.filter(idp => 
      idp.name.toLowerCase().includes(newMsgSearch.toLowerCase()) || 
      idp.idNumber.includes(newMsgSearch)
    );
  }, [newMsgSearch, allIDPs]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeChat || activeChat.isAlert) return;

    const now = new Date();
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.name || 'الإدارة',
      text: inputMessage,
      time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('ar-EG'),
      isMe: true
    };

    const updatedChat = { 
      ...activeChat, 
      messages: [...activeChat.messages, newMessage], 
      lastMessage: inputMessage, 
      time: newMessage.time,
      date: newMessage.date
    };
    
    setActiveChat(updatedChat);
    setConversations(prev => [updatedChat, ...prev.filter(c => c.id !== activeChat.id)]);
    setInputMessage('');
  };

  const startNewChatOrAlert = () => {
    const isBroadcast = broadcastTargets.nazih || broadcastTargets.idari;
    if (!isBroadcast && !selectedRecipient) return;
    if (!newMsgContent.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('ar-EG');

    if (isBroadcast) {
      let targetTitle = broadcastTargets.nazih && broadcastTargets.idari ? "تنبيه عام لكافة السكان" : broadcastTargets.nazih ? "تنبيه للنازحين" : "تنبيه للإداريين";

      const newAlert: Conversation = {
        id: `alert-${Date.now()}`,
        participantName: targetTitle,
        participantAvatar: '',
        lastMessage: newMsgContent,
        time: timeStr,
        date: dateStr,
        unreadCount: 0,
        online: false,
        isAlert: true,
        senderAdmin: currentUser?.name || 'مدير النظام',
        messages: [{
          id: `m-${Date.now()}`,
          senderId: currentUser?.id || 'admin',
          senderName: currentUser?.name || 'الإدارة',
          text: newMsgContent,
          time: timeStr,
          date: dateStr,
          isMe: true
        }]
      };

      setConversations(prev => [newAlert, ...prev]);
      setActiveTab('alerts');
      setActiveChat(newAlert);
      setIsNewMsgModalOpen(false);
      resetNewMsg();
      return;
    }

    if (selectedRecipient) {
      const existing = conversations.find(c => c.participantName === selectedRecipient.name && !c.isAlert);
      const newMessage: Message = {
        id: `m-${Date.now()}`,
        senderId: currentUser?.id || 'me',
        senderName: currentUser?.name || 'الإدارة',
        text: newMsgContent,
        time: timeStr,
        date: dateStr,
        isMe: true
      };

      if (existing) {
        const updated = { 
          ...existing, 
          messages: [...existing.messages, newMessage], 
          lastMessage: newMsgContent, 
          time: timeStr, 
          date: dateStr 
        };
        setConversations(prev => [updated, ...prev.filter(c => c.id !== existing.id)]);
        setActiveChat(updated);
      } else {
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          participantName: selectedRecipient.name,
          participantAvatar: selectedRecipient.docs.profilePic || `https://picsum.photos/seed/${selectedRecipient.id}/200`,
          lastMessage: newMsgContent,
          time: timeStr,
          date: dateStr,
          unreadCount: 0,
          online: false,
          messages: [newMessage]
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveChat(newConv);
      }
      setActiveTab('conversations');
    }

    setIsNewMsgModalOpen(false);
    resetNewMsg();
  };

  const toggleBroadcast = (type: 'nazih' | 'idari') => {
    setBroadcastTargets(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    setSelectedRecipient(null);
    setNewMsgSearch('');
  };

  const resetNewMsg = () => {
    setNewMsgSearch('');
    setSelectedRecipient(null);
    setBroadcastTargets({ nazih: false, idari: false });
    setNewMsgContent('');
  };

  const displayConversations = conversations.filter(c => {
    const isTargetTab = activeTab === 'alerts' ? c.isAlert : !c.isAlert;
    if (!isAdmin) {
      return isTargetTab && (c.participantName === currentUser?.name || c.isAlert);
    }
    return isTargetTab;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] animate-in fade-in duration-500 overflow-hidden rounded-[3rem] shadow-2xl glass relative">
      
      {!activeChat ? (
        <div className="flex flex-col h-full bg-slate-50/30">
          {/* Tabs System */}
          <div className="p-6 pb-2 shrink-0">
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 py-5 rounded-[2rem] font-black text-sm transition-all shadow-md flex items-center justify-center gap-3 border ${activeTab === 'conversations' ? 'bg-gradient-to-br from-pink-600 to-pink-800 text-white border-pink-900 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_10px_20px_rgba(157,23,77,0.3)] ring-2 ring-pink-500/10' : 'bg-white text-slate-400 border-black/5 hover:bg-slate-50'}`}
              >
                <i className="fas fa-comments text-lg"></i>
                المحادثات
              </button>
              <button 
                onClick={() => setActiveTab('alerts')}
                className={`flex-1 py-5 rounded-[2rem] font-black text-sm transition-all shadow-sm flex items-center justify-center gap-3 border ${activeTab === 'alerts' ? 'bg-orange-500 text-white border-orange-500 shadow-orange-500/20' : 'bg-white text-slate-400 border-black/5 hover:bg-slate-50'}`}
              >
                <i className="fas fa-bullhorn"></i>
                التنبيهات
              </button>
            </div>

            {activeTab === 'conversations' && (
              <div className="bg-[#EEF2FF]/60 backdrop-blur-md rounded-[2.5rem] p-6 shadow-sm border border-white/40 flex items-center justify-start gap-6 overflow-x-auto no-scrollbar">
                <div onClick={() => setIsNewMsgModalOpen(true)} className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-white/40 group-hover:bg-white transition-all shadow-sm group-hover:border-accent">
                    <i className="fas fa-plus"></i>
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">رسالة</span>
                </div>
                {conversations.filter(c => !c.isAlert).slice(0, 10).map(conv => (
                  <div key={conv.id} className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer" onClick={() => setActiveChat(conv)}>
                    <div className="relative">
                      <img src={conv.participantAvatar} className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-transparent group-hover:border-accent transition-all group-hover:scale-105" alt="" />
                      {conv.online && <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#EEF2FF] rounded-full"></span>}
                    </div>
                    <span className="text-[9px] font-bold text-slate-700 truncate w-14 text-center">{conv.participantName.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Combined List with detailed info */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 no-scrollbar">
            <h3 className="text-[9px] font-black text-slate-400 px-4 mb-2 uppercase tracking-[0.2em] flex items-center justify-between">
              <span>{activeTab === 'conversations' ? 'إدارة المراسلات المباشرة' : 'أرشيف التنبيهات الإدارية الموثق'}</span>
              {isAdmin && <span className="text-accent">وضع الإدارة: رؤية شاملة</span>}
            </h3>

            {displayConversations.length > 0 ? displayConversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => setActiveChat(conv)} 
                className={`group p-6 rounded-[2.5rem] flex items-center gap-5 transition-all cursor-pointer border shadow-sm ${
                  conv.isAlert 
                    ? 'bg-orange-50/50 border-orange-100 hover:bg-orange-100/50' 
                    : 'bg-white border-black/5 hover:shadow-xl hover:border-accent/20 active:bg-slate-50'
                }`}
              >
                <div className="shrink-0 relative">
                  <div className={`w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 ${conv.isAlert ? 'bg-orange-500 text-white' : 'bg-slate-100'}`}>
                    {conv.isAlert ? (
                      <i className="fas fa-bullhorn text-2xl"></i>
                    ) : (
                      <img src={conv.participantAvatar} className="w-full h-full object-cover" alt="" />
                    )}
                  </div>
                  {conv.unreadCount > 0 && <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[9px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-pulse">{conv.unreadCount}</span>}
                </div>
                
                <div className="flex-1 text-right min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`font-black text-sm truncate ${conv.isAlert ? 'text-orange-700' : 'text-slate-800'}`}>
                      {conv.participantName}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">{conv.time}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-[11px] font-medium truncate ${conv.isAlert ? 'text-orange-600/70' : 'text-slate-500'}`}>
                      {conv.lastMessage}
                    </p>
                    <span className="text-[9px] text-slate-300 font-bold ml-2">{conv.date}</span>
                  </div>

                  {conv.isAlert && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-orange-200/50">
                       <span className="text-[9px] font-black text-orange-600">المرسل: {conv.senderAdmin}</span>
                       <span className="text-[8px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-lg">إشعار رسمي</span>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-24 opacity-30">
                 <i className={`fas ${activeTab === 'alerts' ? 'fa-bullhorn' : 'fa-comments'} text-5xl mb-4`}></i>
                 <p className="font-black text-sm">لا توجد سجلات {activeTab === 'alerts' ? 'تنبيهات' : 'محادثات'} حالياً</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Chat Details View */
        <div className="flex flex-col h-full bg-[#F8FAFF]">
          <div className="bg-white/90 backdrop-blur-xl border-b border-black/5 p-6 flex justify-between items-center sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveChat(null)} className="w-10 h-10 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-400">
                <i className="fas fa-chevron-right text-lg"></i>
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl shadow-md flex items-center justify-center ${activeChat.isAlert ? 'bg-orange-500 text-white' : 'bg-white'}`}>
                  {activeChat.isAlert ? <i className="fas fa-bullhorn"></i> : <img src={activeChat.participantAvatar} className="w-full h-full object-cover rounded-2xl" alt="" />}
                </div>
                <div>
                  <h4 className="text-slate-900 font-black text-sm">{activeChat.participantName}</h4>
                  <p className={`text-[9px] font-black ${activeChat.isAlert ? 'text-orange-600' : 'text-green-600'}`}>
                    {activeChat.isAlert ? `بواسطة: ${activeChat.senderAdmin}` : 'محادثة تفاعلية فورية'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">{activeChat.date}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/20">
            {activeChat.messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-start' : 'items-end'}`}>
                <span className={`text-[10px] font-black mb-2 px-3 tracking-wide ${msg.isMe ? 'text-accent' : 'text-slate-700'}`}>
                  {msg.senderName}
                </span>
                
                <div className={`max-w-[85%] p-5 md:p-6 rounded-[2.2rem] text-[13px] md:text-sm font-black shadow-md leading-relaxed transition-all cursor-default select-text focus:ring-4 focus:ring-pink-500/10 active:scale-[0.99] ${
                  msg.isMe 
                    ? 'bg-accent text-white rounded-bl-none shadow-accent/15 ring-1 ring-white/10' 
                    : 'bg-white text-slate-900 rounded-br-none border border-slate-200 shadow-sm ring-1 ring-black/5'
                }`}>
                  {msg.text}
                </div>
                
                <div className={`flex items-center gap-2 mt-2 px-3 text-[9px] font-black uppercase tracking-widest ${msg.isMe ? 'text-accent/80' : 'text-slate-400'}`}>
                  <span>{msg.time}</span>
                  <span className="opacity-20">•</span>
                  <span>{msg.date}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 md:p-8 bg-white border-t border-slate-100">
            {activeChat.isAlert ? (
              <div className="bg-orange-50/50 border border-orange-100 p-6 rounded-[2.5rem] flex items-center gap-5 text-orange-700 shadow-inner">
                <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                  <i className="fas fa-bullhorn text-xl"></i>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black">هذا التنبيه مؤرشف للتوثيق الإداري</p>
                  <p className="text-[10px] font-bold opacity-80 leading-relaxed mt-1">الرسائل في قسم التنبيهات هي إعلانات رسمية لا تدعم الرد المباشر، يرجى مراجعة الإدارة في حال وجود استفسار.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-slate-50 rounded-[2.5rem] p-2 pl-4 border border-slate-200 shadow-inner focus-within:border-accent transition-colors">
                <button className="w-12 h-12 rounded-full text-slate-400 hover:text-accent transition-colors"><i className="fas fa-paperclip"></i></button>
                <input 
                  type="text" 
                  placeholder="اكتب ردك هنا..." 
                  className="flex-1 bg-transparent border-none text-slate-900 text-sm outline-none px-3 font-bold placeholder:text-slate-300" 
                  value={inputMessage} 
                  onChange={(e) => setInputMessage(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
                />
                <button 
                  onClick={handleSendMessage} 
                  disabled={!inputMessage.trim()}
                  className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30 hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
                >
                  <i className="fas fa-paper-plane text-xs"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal - New Message / Alert */}
      {isNewMsgModalOpen && (
        <div className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-lg flex items-end md:items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-t-[3.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500 max-h-[95vh] flex flex-col border border-white/20">
            <div className="p-8 flex justify-between items-center border-b border-black/5 bg-slate-50/80">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                   <i className="fas fa-envelope-open-text"></i>
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-slate-800">إنشاء مراسلة</h3>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">تنبيهات جماعية أو محادثات فردية</p>
                 </div>
              </div>
              <button onClick={() => { setIsNewMsgModalOpen(false); resetNewMsg(); }} className="w-12 h-12 bg-white rounded-2xl border border-black/5 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-10">
              {/* Broadcast Options */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2">نظام التنبيهات الرسمية (بث)</p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => toggleBroadcast('nazih')} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-3 relative group overflow-hidden ${broadcastTargets.nazih ? 'bg-orange-500 border-orange-600 shadow-xl shadow-orange-500/30' : 'bg-slate-50 border-black/5 hover:border-orange-200'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-all ${broadcastTargets.nazih ? 'bg-white text-orange-500' : 'bg-orange-500 text-white'}`}><i className="fas fa-users text-lg"></i></div>
                    <div className="text-center">
                      <p className={`font-black text-xs ${broadcastTargets.nazih ? 'text-white' : 'text-slate-800'}`}>كافة النازحين</p>
                    </div>
                    {broadcastTargets.nazih && <i className="fas fa-check-circle text-white text-xs absolute top-4 left-4 animate-in zoom-in"></i>}
                  </button>
                  <button onClick={() => toggleBroadcast('idari')} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-3 relative group overflow-hidden ${broadcastTargets.idari ? 'bg-orange-500 border-orange-600 shadow-xl shadow-orange-500/30' : 'bg-slate-50 border-black/5 hover:border-orange-200'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-all ${broadcastTargets.idari ? 'bg-white text-orange-500' : 'bg-orange-500 text-white'}`}><i className="fas fa-user-shield text-lg"></i></div>
                    <div className="text-center">
                      <p className={`font-black text-xs ${broadcastTargets.idari ? 'text-white' : 'text-slate-800'}`}>كافة الإداريين</p>
                    </div>
                    {broadcastTargets.idari && <i className="fas fa-check-circle text-white text-xs absolute top-4 left-4 animate-in zoom-in"></i>}
                  </button>
                </div>
              </div>

              {/* Search Recipient */}
              <div className={`space-y-4 transition-all duration-500 ${broadcastTargets.nazih || broadcastTargets.idari ? 'opacity-30 pointer-events-none grayscale blur-[3px]' : ''}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2">محادثة فردية مع مستفيد</p>
                <div className="relative">
                  <input type="text" placeholder="ابحث بالاسم أو رقم الهوية..." className="w-full bg-slate-50 border border-black/5 rounded-[2rem] py-5 pr-14 pl-6 text-sm outline-none transition-all text-slate-800 focus:bg-white focus:border-accent shadow-inner" value={newMsgSearch} onChange={(e) => { setNewMsgSearch(e.target.value); setSelectedRecipient(null); setBroadcastTargets({ nazih: false, idari: false }); }} />
                  <i className={`fas fa-search absolute right-6 top-1/2 -translate-y-1/2 transition-colors ${newMsgSearch ? 'text-accent' : 'text-slate-300'}`}></i>
                  {newMsgSearch && !selectedRecipient && (
                    <div className="mt-2 bg-white border border-black/5 rounded-[2rem] shadow-2xl z-20 max-h-60 overflow-y-auto no-scrollbar py-3 border-accent/10">
                      {filteredRecipients.length > 0 ? filteredRecipients.map(idp => (
                        <div key={idp.id} onClick={() => { setSelectedRecipient(idp); setNewMsgSearch(idp.name); }} className="flex items-center gap-4 p-5 hover:bg-accent/5 cursor-pointer border-b border-black/5 last:border-0">
                          <img src={idp.docs.profilePic || "https://picsum.photos/100"} className="w-12 h-12 rounded-2xl shadow-sm object-cover" />
                          <div className="text-right flex-1">
                            <p className="text-xs font-black text-slate-800">{idp.name}</p>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${idp.role === 'idari' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{idp.role === 'idari' ? 'إداري' : 'نازح'}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-slate-300 text-xs font-bold italic">لا توجد نتائج مطابقة لبحثك</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2">محتوى المراسلة</p>
                <textarea 
                  placeholder="اكتب تفاصيل الرسالة أو الإعلان هنا..." 
                  className="w-full bg-slate-50 border border-black/5 rounded-[2.5rem] p-8 text-sm outline-none focus:bg-white focus:border-accent transition-all text-slate-800 h-44 resize-none font-medium leading-relaxed shadow-inner" 
                  value={newMsgContent} 
                  onChange={(e) => setNewMsgContent(e.target.value)} 
                />
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-black/5 shrink-0">
              <button 
                onClick={startNewChatOrAlert} 
                disabled={(!broadcastTargets.nazih && !broadcastTargets.idari && !selectedRecipient) || !newMsgContent.trim()} 
                className={`w-full font-black py-5 rounded-[2.2rem] shadow-2xl disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-4 active:scale-95 bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-orange-500/40 hover:shadow-orange-500/60 ring-1 ring-white/20`}
              >
                <span>{(broadcastTargets.nazih || broadcastTargets.idari) ? 'إرسال التنبيه الرسمي' : 'بدء المراسلة المباشرة'}</span>
                <i className={`fas ${(broadcastTargets.nazih || broadcastTargets.idari) ? 'fa-bullhorn' : 'fa-paper-plane'} text-xs`} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Messaging;