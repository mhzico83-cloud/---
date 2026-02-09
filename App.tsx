
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import IDPManagement from './components/IDPManagement';
import AidServices from './components/AidServices';
import Reports from './components/Reports';
import Messaging from './components/Messaging';
import Logo from './components/Logo';
import BottomNav from './components/BottomNav';
import { View, IDP, Notification, UserRole, FamilyMember, ExternalDependent, Gender, HealthStatus } from './types';
import { INITIAL_IDPS } from './constants';

type AppTheme = 'classic' | 'ocean' | 'forest';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<IDP | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('idari');
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('classic');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [idps, setIdps] = useState<IDP[]>(INITIAL_IDPS as any);
  const [currentView, setCurrentView] = useState<View>('reports');
  
  // State to force profile view in IDP management
  const [requestedProfileId, setRequestedProfileId] = useState<string | null>(null);

  // Registration State
  const [regData, setRegData] = useState<Partial<IDP>>({
    role: 'nazih',
    gender: 'ذكر',
    maritalStatus: 'أعزب',
    healthStatus: 'مُعافى',
    familyMembers: [],
    externalDependents: [],
    housingStatus: 'هدم كُلي',
    shelterType: 'خيمة',
    shelterNumber: '',
    docs: {},
    needs: []
  });

  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({ relation: 'ابن' });
  const [newDependent, setNewDependent] = useState<Partial<ExternalDependent>>({});
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // File Input Refs
  const profilePicRef = useRef<HTMLInputElement>(null);
  const idImageRef = useRef<HTMLInputElement>(null);
  const agencyCardRef = useRef<HTMLInputElement>(null);
  const medicalDocRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profilePic' | 'idImage' | 'agencyCard' | 'medical') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'medical') {
          setNewMember({ ...newMember, medicalDoc: reader.result as string });
        } else {
          setRegData({ ...regData, docs: { ...regData.docs, [type]: reader.result as string } });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addFamilyMember = () => {
    if (!newMember.name || !newMember.idNumber || !newMember.birthDate) {
      alert("يرجى إكمال بيانات فرد الأسرة (الاسم، الهوية، تاريخ الميلاد)");
      return;
    }
    const member = { ...newMember, id: Math.random().toString(36).substr(2, 9) } as FamilyMember;
    
    // منطق الترتيب: الزوجة أولاً ثم الأبناء حسب تاريخ الميلاد (الأكبر سناً أولاً)
    const updated = [...(regData.familyMembers || []), member].sort((a, b) => {
      if (a.relation === 'زوجة' && b.relation !== 'زوجة') return -1;
      if (b.relation === 'زوجة' && a.relation !== 'زوجة') return 1;
      return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
    });

    setRegData({ ...regData, familyMembers: updated });
    setNewMember({ relation: 'ابن' });
  };

  const addExternalDependent = () => {
    if (!newDependent.fullName || !newDependent.idNumber || !newDependent.relation || !newDependent.birthDate) {
      alert("يرجى إدخال بيانات المعيل الخارجي كاملة");
      return;
    }
    const dependent = { ...newDependent, id: Math.random().toString(36).substr(2, 9) } as ExternalDependent;
    setRegData({ ...regData, externalDependents: [...(regData.externalDependents || []), dependent] });
    setNewDependent({});
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regData.password !== confirmPassword) {
      alert("كلمات المرور غير متطابقة");
      return;
    }
    if (!agreedToTerms) {
      alert("يجب الموافقة على صحة البيانات للمتابعة");
      return;
    }

    const newIDP: IDP = {
      ...(regData as IDP),
      id: Math.random().toString(36).substr(2, 9),
      location: regData.role === 'khariji' ? (regData.detailedAddress || 'خارج المخيم') : 'مخيم الكلية',
      familySize: (regData.familyMembers?.length || 0) + 1,
      status: 'Pending',
      lastAidDate: '-',
      needs: []
    };

    setIdps(prev => [newIDP, ...prev]);
    addNotification('تسجيل جديد', `قام ${newIDP.name} بتقديم طلب تسجيل بصفة ${newIDP.role === 'khariji' ? 'خارجي' : newIDP.role === 'idari' ? 'إداري' : 'نازح'}.`, 'registration');
    setIsRegistering(false);
    alert("تم تقديم طلبك بنجاح. يرجى انتظار مراجعة الإدارة.");
  };

  const addNotification = (title: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleBulkNotify = (recipients: IDP[], aidLabel: string, location: string) => {
    recipients.forEach(recipient => {
      addNotification(
        'استحقاق مساعدة إنسانية',
        `أنت مدرج لاستلام (${aidLabel}) في (${location}). يرجى المراجعة مع إحضار الهوية.`,
        'approval'
      );
    });

    setIdps(prev => prev.map(idp => {
      if (recipients.some(r => r.id === idp.id)) {
        return { 
          ...idp, 
          status: 'Served' as const, 
          lastAidDate: new Date().toISOString().split('T')[0] 
        };
      }
      return idp;
    }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === '123') {
      setIsAuthenticated(true);
      setActiveRole('idari');
      const adminUser: IDP = {
        id: 'admin-1',
        name: 'مدير النظام الموقر',
        role: 'idari',
        adminTitle: 'مدير الإدارة العامة',
        idNumber: 'admin',
        birthDate: '1980-01-01',
        phone: '059000000',
        walletNumber: 'W-999',
        addressBefore: 'غزة - حي الرمال',
        housingStatus: 'هدم كُلي',
        shelterType: 'صف',
        shelterNumber: 'HQ-01',
        gender: 'ذكر',
        maritalStatus: 'متزوج',
        healthStatus: 'مُعافى',
        familyMembers: [],
        externalDependents: [],
        docs: {},
        location: 'مجمع الإدارة المركزية',
        familySize: 1,
        status: 'Approved',
        lastAidDate: '-',
        needs: []
      };
      setCurrentUser(adminUser);
      setIdps(prev => prev.some(i => i.id === adminUser.id) ? prev : [adminUser, ...prev]);
      return;
    }
    const foundUser = idps.find(i => i.idNumber === loginForm.username && (i.password === loginForm.password || loginForm.password === '123'));
    
    if (foundUser) {
      if (foundUser.status === 'Suspended') {
        setLoginError('عذراً، تم تعليق حسابك من قبل الإدارة. يرجى مراجعة المسؤول.');
        return;
      }
      setIsAuthenticated(true);
      setCurrentUser(foundUser);
      setActiveRole(foundUser.role);
    } else {
      setLoginError('رقم الهوية أو كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    if (window.confirm('هل أنت متأكد من تسجيل الخروج من النظام؟')) {
      // تصفير كامل البيانات والحالة
      setIsAuthenticated(false);
      setCurrentUser(null);
      setActiveRole('nazih');
      setCurrentView('reports');
      setLoginForm({ username: '', password: '' });
      setLoginError('');
      // ضمان العودة لشاشة البداية
      setIsRegistering(false);
    }
  };

  const openMyProfile = () => {
    if (currentUser) {
      setRequestedProfileId(currentUser.id);
      setCurrentView('idp-list');
    }
  };

  const maritalOptions = regData.gender === 'ذكر' 
    ? ['أعزب', 'متزوج', 'أرمل', 'مطلق']
    : ['عزباء', 'متزوجة', 'زوجة شهيد', 'زوجة أسير', 'مطلقة', 'مهجورة'];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-vibrant flex items-center justify-center p-6 overflow-y-auto relative text-right" dir="rtl">
        <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-accent/5 blur-[150px] rounded-full"></div>
        
        <div className={`glass login-card w-full ${isRegistering ? 'max-w-5xl my-10' : 'max-w-md'} p-10 rounded-[3rem] shadow-2xl z-10 animate-in zoom-in-95`}>
          <div className="flex flex-col items-center mb-10">
            <Logo size={isRegistering ? 'md' : 'lg'} className="mb-4" />
            <h1 className="text-3xl font-bold text-white tracking-tight">نظام مخيمي</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-2">بوابة التسجيل والتحقق الموحدة</p>
          </div>
          
          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 mr-4">رقم الهوية</label>
                <input required type="text" placeholder="أدخل رقم الهوية" className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pr-6 pl-4 text-white outline-none focus:border-accent transition-all" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 mr-4">كلمة المرور</label>
                <input required type="password" placeholder="••••••••" className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pr-6 pl-4 text-white outline-none focus:border-accent transition-all" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
              </div>
              {loginError && <p className="text-red-400 text-sm text-center font-bold">{loginError}</p>}
              <button type="submit" className="w-full bg-accent text-white font-black py-5 rounded-2xl shadow-xl hover:brightness-110 transition-all text-lg btn-glow">دخول للنظام</button>
              <button type="button" onClick={() => setIsRegistering(true)} className="w-full text-gray-400 text-sm py-2 hover:text-white transition-colors">ليس لديك حساب؟ سجل الآن</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-10 animate-in fade-in slide-in-from-bottom-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* العمود الأول: البيانات الشخصية */}
                <div className="space-y-6">
                  <h3 className="text-accent font-black border-r-4 border-accent pr-4 mb-4">1. البيانات الشخصية</h3>
                  <div className="space-y-4">
                    <div className="flex gap-2 p-1 bg-black/20 rounded-2xl">
                      {['nazih', 'idari', 'khariji'].map(r => (
                        <button key={r} type="button" onClick={() => setRegData({...regData, role: r as any})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${regData.role === r ? 'bg-accent text-white shadow-lg' : 'text-gray-500'}`}>
                          {r === 'nazih' ? 'نازح' : r === 'idari' ? 'إداري' : 'خارجي'}
                        </button>
                      ))}
                    </div>
                    {regData.role === 'idari' && (
                      <input required type="text" placeholder="المُسمى الإداري" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent animate-in zoom-in-95" value={regData.adminTitle || ''} onChange={e => setRegData({...regData, adminTitle: e.target.value})} />
                    )}
                    <input required type="text" placeholder="الإسم رباعي" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent" value={regData.name || ''} onChange={e => setRegData({...regData, name: e.target.value})} />
                    <input required type="text" placeholder="رقم الهوية" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent font-mono" value={regData.idNumber || ''} onChange={e => setRegData({...regData, idNumber: e.target.value})} />
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 mr-4 font-bold">تاريخ الميلاد</label>
                      <input required type="date" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent text-right" value={regData.birthDate || ''} onChange={e => setRegData({...regData, birthDate: e.target.value})} />
                    </div>
                    <input required type="tel" placeholder="رقم الهاتف المحمول" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent" value={regData.phone || ''} onChange={e => setRegData({...regData, phone: e.target.value})} />
                    <input type="text" placeholder="رقم المحفظة (اختياري)" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent" value={regData.walletNumber || ''} onChange={e => setRegData({...regData, walletNumber: e.target.value})} />
                  </div>
                </div>

                {/* العمود الثاني: الحالة الاجتماعية والسكن */}
                <div className="space-y-6">
                  <h3 className="text-accent font-black border-r-4 border-accent pr-4 mb-4">2. الوضع الاجتماعي والسكن</h3>
                  <div className="space-y-4">
                    <input required type="text" placeholder="العنوان قبل النزوح" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent" value={regData.addressBefore || ''} onChange={e => setRegData({...regData, addressBefore: e.target.value})} />
                    
                    {regData.role === 'khariji' ? (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <label className="text-[10px] text-gray-500 mr-4 font-bold">العنوان التفصيلي الحالي</label>
                        <textarea required placeholder="مثلاً: خانيونس - بجوار صيدلية كذا..." className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent min-h-[100px]" value={regData.detailedAddress || ''} onChange={e => setRegData({...regData, detailedAddress: e.target.value})} />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-500 mr-4 font-bold">حالة المسكن الأصلي</label>
                          <select required className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent appearance-none" value={regData.housingStatus} onChange={e => setRegData({...regData, housingStatus: e.target.value as any})}>
                            <option value="هدم كُلي" className="bg-slate-900">هدم كُلي</option>
                            <option value="هدم جُزئي" className="bg-slate-900">هدم جُزئي</option>
                            <option value="منطقة قتال" className="bg-slate-900">منطقة قتال</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-2xl">
                          {['خيمة', 'صف'].map(s => (
                            <button key={s} type="button" onClick={() => setRegData({...regData, shelterType: s as any})} className={`py-3 rounded-xl text-xs font-black transition-all ${regData.shelterType === s ? 'bg-accent text-white' : 'text-gray-500'}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                        <input required type="text" placeholder={regData.shelterType === 'خيمة' ? "رقم الخيمة" : "رقم الصف"} className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent" value={regData.shelterNumber || ''} onChange={e => setRegData({...regData, shelterNumber: e.target.value})} />
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-2xl">
                      {['ذكر', 'أُنثى'].map(g => (
                        <button key={g} type="button" onClick={() => setRegData({...regData, gender: g as any})} className={`py-3 rounded-xl text-xs font-black transition-all ${regData.gender === g ? 'bg-accent text-white' : 'text-gray-500'}`}>
                          {g}
                        </button>
                      ))}
                    </div>

                    <select required className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent appearance-none" value={regData.maritalStatus} onChange={e => setRegData({...regData, maritalStatus: e.target.value})}>
                      {maritalOptions.map(opt => (
                        <option key={opt} value={opt} className="bg-slate-900">{opt}</option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-4">
                      <input required type="password" placeholder="كلمة المرور" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent" value={regData.password || ''} onChange={e => setRegData({...regData, password: e.target.value})} />
                      <input required type="password" placeholder="تأكيد كلمة المرور" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* العمود الثالث: الصحة وأفراد الأسرة */}
                <div className="space-y-6">
                  <h3 className="text-accent font-black border-r-4 border-accent pr-4 mb-4">3. الوضع الصحي والأسرة</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {['مُعافى', 'مريض مُزمن', 'مصاب حرب', 'إعاقة'].map(h => (
                        <button key={h} type="button" onClick={() => setRegData({...regData, healthStatus: h as any})} className={`py-3 rounded-xl text-[10px] font-black transition-all border ${regData.healthStatus === h ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                          {h}
                        </button>
                      ))}
                    </div>
                    {regData.healthStatus !== 'مُعافى' && (
                      <textarea placeholder="تفاصيل صحية هامة..." className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-accent min-h-[100px] text-xs animate-in slide-in-from-top-2" value={regData.healthDetails || ''} onChange={e => setRegData({...regData, healthDetails: e.target.value})} />
                    )}

                    {/* قسم أفراد الأسرة */}
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-4">
                      <h4 className="text-xs font-black text-gray-400">إضافة أفراد الأسرة</h4>
                      <input type="text" placeholder="إسم الفرد" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-white" value={newMember.name || ''} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                      <div className="grid grid-cols-2 gap-2">
                        <select className="bg-black/20 border border-white/10 rounded-xl p-3 text-[10px] text-white" value={newMember.relation} onChange={e => setNewMember({...newMember, relation: e.target.value as any})}>
                          <option value="زوج" className="bg-slate-900">زوج</option>
                          <option value="زوجة" className="bg-slate-900">زوجة</option>
                          <option value="ابن" className="bg-slate-900">ابن</option>
                          <option value="ابنة" className="bg-slate-900">ابنة</option>
                        </select>
                        <input type="text" placeholder="رقم الهوية" className="bg-black/20 border border-white/10 rounded-xl p-3 text-[10px] text-white font-mono" value={newMember.idNumber || ''} onChange={e => setNewMember({...newMember, idNumber: e.target.value})} />
                      </div>
                      <input type="date" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-[10px] text-white" value={newMember.birthDate || ''} onChange={e => setNewMember({...newMember, birthDate: e.target.value})} />
                      
                      {newMember.relation === 'زوجة' && (
                        <div className="flex gap-4 p-2 bg-white/5 rounded-xl animate-in zoom-in-95">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="hidden" checked={newMember.isPregnant} onChange={e => setNewMember({...newMember, isPregnant: e.target.checked, isNursing: false})} />
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${newMember.isPregnant ? 'bg-pink-500 border-pink-500' : 'border-white/20'}`}>
                              {newMember.isPregnant && <i className="fas fa-check text-[8px] text-white"></i>}
                            </div>
                            <span className="text-[10px] text-gray-400">حامل</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="hidden" checked={newMember.isNursing} onChange={e => setNewMember({...newMember, isNursing: e.target.checked, isPregnant: false})} />
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${newMember.isNursing ? 'bg-sky-500 border-sky-500' : 'border-white/20'}`}>
                              {newMember.isNursing && <i className="fas fa-check text-[8px] text-white"></i>}
                            </div>
                            <span className="text-[10px] text-gray-400">مرضعة</span>
                          </label>
                        </div>
                      )}

                      {(newMember.isPregnant || newMember.isNursing) && (
                        <div className="animate-in slide-in-from-top-2">
                           <button type="button" onClick={() => medicalDocRef.current?.click()} className="w-full py-2 border border-dashed border-white/20 rounded-xl text-[9px] text-gray-500 hover:text-white transition-colors">
                             <i className="fas fa-upload ml-2"></i>
                             إدراج صورة {newMember.isPregnant ? 'شهادة الحمل' : 'شهادة الميلاد'}
                           </button>
                           <input type="file" hidden ref={medicalDocRef} accept="image/*" onChange={e => handleFileUpload(e, 'medical')} />
                           {newMember.medicalDoc && <p className="text-[8px] text-green-500 mt-1 text-center">✓ تم إدراج الوثيقة</p>}
                        </div>
                      )}

                      <button type="button" onClick={addFamilyMember} className="w-full bg-white/10 py-3 rounded-xl text-xs font-black hover:bg-white/20 transition-all">إضافة للفرد للأسرة</button>
                      
                      {regData.familyMembers && regData.familyMembers.length > 0 && (
                        <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                          {regData.familyMembers.map((m, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] bg-black/20 p-2 rounded-lg">
                              <span className="font-bold">{m.name} ({m.relation})</span>
                              <button type="button" onClick={() => setRegData({...regData, familyMembers: regData.familyMembers?.filter((_, i) => i !== idx)})} className="text-red-400 hover:text-red-500"><i className="fas fa-times"></i></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* قسم المعالين الخارجيين */}
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-4">
                       <h4 className="text-xs font-black text-gray-400">إعالة من خارج الأسرة</h4>
                       <input type="text" placeholder="الإسم رباعي (خارجي)" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-white" value={newDependent.fullName || ''} onChange={e => setNewDependent({...newDependent, fullName: e.target.value})} />
                       <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="صلة القرابة" className="bg-black/20 border border-white/10 rounded-xl p-3 text-[10px] text-white" value={newDependent.relation || ''} onChange={e => setNewDependent({...newDependent, relation: e.target.value})} />
                        <input type="text" placeholder="رقم الهوية" className="bg-black/20 border border-white/10 rounded-xl p-3 text-[10px] text-white font-mono" value={newDependent.idNumber || ''} onChange={e => setNewDependent({...newDependent, idNumber: e.target.value})} />
                       </div>
                       <input type="date" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-[10px] text-white" value={newDependent.birthDate || ''} onChange={e => setNewDependent({...newDependent, birthDate: e.target.value})} />
                       <button type="button" onClick={addExternalDependent} className="w-full bg-white/10 py-3 rounded-xl text-xs font-black hover:bg-white/20 transition-all">إضافة معال خارجي</button>
                       {regData.externalDependents && regData.externalDependents.length > 0 && (
                         <div className="mt-2 space-y-1">
                            {regData.externalDependents.map((d, i) => (
                              <p key={i} className="text-[9px] text-gray-500">{d.fullName} - {d.relation}</p>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>

              {/* قسم المرفقات الثبوتية */}
              <div className="pt-10 border-t border-white/10">
                <h3 className="text-accent font-black mb-6">4. الوثائق والمستندات الثبوتية</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3 flex flex-col items-center">
                    <button type="button" onClick={() => idImageRef.current?.click()} className={`w-full h-40 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all ${regData.docs?.idImage ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:border-accent hover:bg-white/5'}`}>
                      {regData.docs?.idImage ? <img src={regData.docs.idImage} className="w-full h-full object-cover rounded-[2.5rem]" /> : <><i className="fas fa-id-card text-2xl mb-2 text-gray-500"></i><span className="text-xs font-bold text-gray-400">إدراج صورة الهوية</span></>}
                    </button>
                    <input type="file" hidden ref={idImageRef} accept="image/*" onChange={e => handleFileUpload(e, 'idImage')} />
                  </div>
                  <div className="space-y-3 flex flex-col items-center">
                    <button type="button" onClick={() => agencyCardRef.current?.click()} className={`w-full h-40 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all ${regData.docs?.agencyCard ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:border-accent hover:bg-white/5'}`}>
                      {regData.docs?.agencyCard ? <img src={regData.docs.agencyCard} className="w-full h-full object-cover rounded-[2.5rem]" /> : <><i className="fas fa-address-card text-2xl mb-2 text-gray-500"></i><span className="text-xs font-bold text-gray-400">صورة كرت الوكالة / العائلة</span></>}
                    </button>
                    <input type="file" hidden ref={agencyCardRef} accept="image/*" onChange={e => handleFileUpload(e, 'agencyCard')} />
                  </div>
                  <div className="space-y-3 flex flex-col items-center">
                    <button type="button" onClick={() => profilePicRef.current?.click()} className={`w-full h-40 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all ${regData.docs?.profilePic ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:border-accent hover:bg-white/5'}`}>
                      {regData.docs?.profilePic ? <img src={regData.docs.profilePic} className="w-full h-full object-cover rounded-[2.5rem]" /> : <><i className="fas fa-user-circle text-2xl mb-2 text-gray-500"></i><span className="text-xs font-bold text-gray-400">صورة شخصية حديثة</span></>}
                    </button>
                    <input type="file" hidden ref={profilePicRef} accept="image/*" onChange={e => handleFileUpload(e, 'profilePic')} />
                  </div>
                </div>
              </div>

              {/* قسم الشروط والإرسال */}
              <div className="space-y-6 pt-10">
                <label className="flex items-start gap-4 p-6 bg-red-500/5 rounded-[2.5rem] border border-red-500/20 cursor-pointer group">
                  <input type="checkbox" className="hidden" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} />
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mt-1 transition-all ${agreedToTerms ? 'bg-red-500 border-red-500' : 'border-red-500/40 group-hover:border-red-500'}`}>
                    {agreedToTerms && <i className="fas fa-check text-xs text-white"></i>}
                  </div>
                  <p className="text-xs font-bold text-gray-300 leading-relaxed">
                    أوافق على أن كل البيانات المُدرجة صحيحة، وأتحمل المسؤولية الكاملة عن أي خطأ مقصود قد يعرض صاحب الطلب لإلغاء طلبه نهائياً من كشوفات المخيم.
                  </p>
                </label>

                <div className="flex gap-4">
                  <button type="submit" className="flex-[2] bg-accent text-white font-black py-6 rounded-[2rem] shadow-2xl hover:brightness-110 transition-all text-xl btn-glow">إتمام طلب التسجيل</button>
                  <button type="button" onClick={() => setIsRegistering(false)} className="flex-1 bg-white/5 text-gray-500 py-6 rounded-[2rem] border border-white/10 hover:text-white transition-all">إلغاء والعودة</button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- Main Application Layout (Authenticated) ---
  return (
    <div className="flex min-h-screen bg-vibrant text-right" dir="rtl">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-w-7xl mx-auto w-full relative">
        {/* Header Bar */}
        <header className="flex justify-between items-center mb-10 sticky top-0 z-40 bg-transparent backdrop-blur-sm py-2 px-1">
          <div className="flex items-center gap-4">
             {/* Notifications */}
             <div className="relative group">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-gray-400 hover:text-accent transition-all relative group"
                  title="الإشعارات"
                >
                  <i className="fas fa-bell"></i>
                  {notifications.some(n => !n.isRead) && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0c] animate-ping"></span>}
                </button>
                {showNotifications && (
                  <div className="absolute top-16 right-0 w-80 glass rounded-[2.5rem] shadow-2xl p-6 border border-white/10 animate-in fade-in slide-in-from-top-2 z-50">
                    <h4 className="font-bold mb-4 text-sm text-white">الإشعارات الأخيرة</h4>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                           <p className="text-[10px] font-black text-accent mb-1">{n.title}</p>
                           <p className="text-[11px] text-gray-400 line-clamp-2">{n.message}</p>
                        </div>
                      )) : <p className="text-xs text-gray-500 italic text-center py-4">لا توجد إشعارات حالياً</p>}
                    </div>
                  </div>
                )}
             </div>

             {/* Logout Button in Header */}
             <button 
                onClick={handleLogout}
                className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all cursor-pointer shadow-lg hover:shadow-red-500/20"
                title="تسجيل الخروج من النظام"
             >
                <i className="fas fa-power-off"></i>
             </button>
          </div>

          <div className="flex items-center gap-4">
             <div 
                onClick={openMyProfile}
                className="flex items-center gap-3 glass px-5 py-2.5 rounded-[1.8rem] border border-white/5 group cursor-pointer hover:border-accent/30 transition-all"
                title="بياناتي الشخصية"
             >
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{activeRole === 'idari' ? (currentUser?.adminTitle || 'إداري النظام') : activeRole === 'khariji' ? 'نازح خارجي' : 'نازح مسجل'}</p>
                  <p className="text-xs font-bold text-white group-hover:text-accent transition-colors">{currentUser?.name}</p>
                </div>
                <div className="relative">
                  <img src={currentUser?.docs.profilePic || "https://picsum.photos/100"} className="w-11 h-11 rounded-2xl shadow-lg border-2 border-white/10 group-hover:border-accent transition-all object-cover" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent rounded-lg flex items-center justify-center text-white text-[8px] shadow-lg border-2 border-[#0a0a0c]">
                    <i className="fas fa-user-cog"></i>
                  </div>
                </div>
             </div>
          </div>
        </header>

        {currentView === 'dashboard' && <Dashboard idps={idps} />}
        {currentView === 'idp-list' && (
          <IDPManagement 
            idps={idps} 
            activeRole={activeRole}
            currentUserId={currentUser?.id}
            forceOpenId={requestedProfileId}
            onCloseForceOpen={() => setRequestedProfileId(null)}
            onApprove={(id) => setIdps(prev => prev.map(i => i.id === id ? {...i, status: 'Approved'} : i))}
            onDelete={(id) => { if(confirm('هل أنت متأكد من الحذف النهائي؟')) setIdps(prev => prev.filter(i => i.id !== id)) }}
            onToggleSuspend={(id) => {
              setIdps(prev => prev.map(i => {
                if (i.id === id) {
                  const newStatus = i.status === 'Suspended' ? 'Approved' : 'Suspended';
                  addNotification('تحديث الحالة', `تم ${newStatus === 'Suspended' ? 'تعليق' : 'تنشيط'} عضوية ${i.name}.`, 'system');
                  return {...i, status: newStatus};
                }
                return i;
              }));
            }}
            onToggleRole={(id) => setIdps(prev => prev.map(i => i.id === id ? {...i, role: i.role === 'idari' ? 'nazih' : 'idari'} : i))}
            onUpdate={(id, data) => {
              if (activeRole === 'idari') {
                setIdps(prev => prev.map(i => i.id === id ? {...i, ...data} : i));
                if (id === currentUser?.id) setCurrentUser(prev => prev ? {...prev, ...data} : null);
              } else {
                setIdps(prev => prev.map(i => i.id === id ? {...i, pendingData: data} : i));
                alert('تم إرسال طلب التعديل للإدارة للموافقة');
              }
            }}
            onApproveEdit={(id) => {
              setIdps(prev => prev.map(i => i.id === id ? {...i, ...i.pendingData, pendingData: undefined} : i));
              addNotification('تعديل مقبول', `تمت الموافقة على تعديلات ملفك الشخصي.`, 'approval');
              if (id === currentUser?.id) {
                 const updatedUser = idps.find(i => i.id === id);
                 if (updatedUser && updatedUser.pendingData) setCurrentUser({...updatedUser, ...updatedUser.pendingData});
              }
            }}
          />
        )}
        {currentView === 'aid-services' && (
          <AidServices 
            idps={idps.filter(i => i.status !== 'Pending' && i.status !== 'Suspended')} 
            onDistribute={handleBulkNotify} 
          />
        )}
        {currentView === 'reports' && <Reports idps={idps.filter(i => i.status !== 'Pending')} />}
        {currentView === 'messages' && <Messaging />}
      </main>

      <BottomNav currentView={currentView} setView={setCurrentView} />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
