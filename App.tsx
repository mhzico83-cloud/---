
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import IDPManagement from './components/IDPManagement';
import AidServices from './components/AidServices';
import Reports from './components/Reports';
import Messaging from './components/Messaging';
import Logo from './components/Logo';
import BottomNav from './components/BottomNav';
import { View, IDP, Notification, UserRole, FamilyMember, ExternalDependent, Gender, HealthStatus, HousingStatus, ShelterType } from './types';
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
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [requestedProfileId, setRequestedProfileId] = useState<string | null>(null);

  // Registration states
  const [regData, setRegData] = useState<Partial<IDP>>({
    role: 'nazih',
    name: '',
    idNumber: '',
    birthDate: '',
    phone: '',
    walletNumber: '',
    addressBefore: '',
    housingStatus: 'هدم كُلي',
    shelterType: 'خيمة',
    shelterNumber: '',
    password: '',
    gender: 'ذكر',
    maritalStatus: 'أعزب',
    healthStatus: 'مُعافى',
    healthDetails: '',
    familyMembers: [],
    externalDependents: [],
    docs: {},
    needs: []
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // States for adding members
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({ relation: 'ابن' });
  const [showAddDependent, setShowAddDependent] = useState(false);
  const [newDep, setNewDep] = useState<Partial<ExternalDependent>>({});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleReadNotif = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const openMyProfile = () => {
    if (currentUser) {
      setRequestedProfileId(currentUser.id);
      setCurrentView('idp-list');
    }
  };

  const handleUpdateIDP = (id: string, data: Partial<IDP>) => {
    setIdps(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  };

  const handleBulkNotify = (recipients: IDP[], aidLabel: string, location: string) => {
    const today = new Date().toISOString().split('T')[0];
    setIdps(prev => prev.map(idp => {
      if (recipients.some(r => r.id === idp.id)) {
        return { 
          ...idp, 
          lastAidDate: today, 
          status: 'Served' as const 
        };
      }
      return idp;
    }));
    
    addNotification(
      'توزيع مساعدات',
      `تم توزيع (${aidLabel}) في (${location}) لـ ${recipients.length} مستفيد.`,
      'system'
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string, isFamily = false, memberId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isFamily && memberId) {
          setRegData(prev => ({
            ...prev,
            familyMembers: prev.familyMembers?.map(m => 
              m.id === memberId ? { ...m, [field]: base64 } : m
            )
          }));
        } else if (isFamily && !memberId) {
          setNewMember(prev => ({ ...prev, [field]: base64 }));
        } else {
          setRegData(prev => ({
            ...prev,
            docs: { ...prev.docs, [field]: base64 }
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addFamilyMember = () => {
    if (!newMember.name || !newMember.idNumber) return;
    const member: FamilyMember = {
      ...(newMember as FamilyMember),
      id: Math.random().toString(36).substr(2, 9),
    };
    
    setRegData(prev => {
      const updated = [...(prev.familyMembers || []), member];
      updated.sort((a, b) => {
        if (a.relation === 'زوجة' && b.relation !== 'زوجة') return -1;
        if (b.relation === 'زوجة' && a.relation !== 'زوجة') return 1;
        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
      });
      return { ...prev, familyMembers: updated };
    });
    setNewMember({ relation: 'ابن' });
    setShowAddMember(false);
  };

  const addExternalDep = () => {
    if (!newDep.fullName) return;
    const dep: ExternalDependent = {
      ...(newDep as ExternalDependent),
      id: Math.random().toString(36).substr(2, 9),
    };
    setRegData(prev => ({
      ...prev,
      externalDependents: [...(prev.externalDependents || []), dep]
    }));
    setNewDep({});
    setShowAddDependent(false);
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
      location: regData.shelterType === 'صف' ? `غرفة ${regData.shelterNumber}` : `خيمة ${regData.shelterNumber}`,
      familySize: (regData.familyMembers?.length || 0) + 1,
      status: 'Pending',
      lastAidDate: '-',
      needs: []
    };
    setIdps(prev => [newIDP, ...prev]);
    setIsRegistering(false);
    
    addNotification(
      'طلب تسجيل جديد',
      `قام ${newIDP.name} بتقديم طلب انضمام كـ (${newIDP.role === 'idari' ? 'إداري' : 'نازح'})`,
      'registration'
    );
    
    alert("تم تقديم طلبك بنجاح. يرجى انتظار مراجعة الإدارة.");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === '123') {
      setIsAuthenticated(true);
      setActiveRole('idari');
      setCurrentUser(idps.find(i => i.id === 'admin-1') || idps[0]);
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
      setLoginError('عزيزي أنت لست من أسرة مخيم الكلية, لو إنضممت مؤخراً لمخيم الكلية يتوجب عليك التسجيل.');
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setActiveRole('nazih');
      setCurrentView('dashboard');
      setLoginForm({ username: '', password: '' });
      setLoginError('');
      setIsRegistering(false);
      setIsLoggingOut(false);
    }, 1200);
  };

  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-500">
        <Logo size="lg" className="animate-pulse mb-8" />
        <h2 className="text-2xl font-black text-white">يتم تسجيل الخروج بأمان...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-vibrant flex items-center justify-center p-4 md:p-10 overflow-y-auto relative text-right" dir="rtl">
        <div className={`reg-card relative w-full ${isRegistering ? 'max-w-6xl my-10' : 'max-w-md'} p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] z-10 animate-in zoom-in-95 transition-all duration-700`}>
          
          <div className="flex flex-col items-center mb-10">
            <Logo size={isRegistering ? 'md' : 'lg'} className="mb-4 float-anim" />
            <h1 className="text-2xl md:text-3xl font-black text-slate-800">نظام مخيمي</h1>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-slate-400">الإدارة الإلكترونية لمخيم الكلية</p>
          </div>

          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black mr-4 text-slate-400 uppercase">رقم الهوية</label>
                <input required type="text" placeholder="أدخل رقم الهوية" className="w-full input-reg rounded-2xl py-4 px-6 outline-none" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black mr-4 text-slate-400 uppercase">كلمة المرور</label>
                <input required type="password" placeholder="••••••••" className="w-full input-reg rounded-2xl py-4 px-6 outline-none" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
              </div>
              <button type="submit" className="w-full btn-reg text-white font-black py-5 rounded-2xl text-lg">دخول للنظام</button>
              {loginError && <p className="text-red-500 text-xs text-center font-bold leading-relaxed bg-red-50 p-4 rounded-xl border border-red-100 animate-in shake">{loginError}</p>}
              <button type="button" onClick={() => setIsRegistering(true)} className="w-full text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors">ليس لديك حساب؟ سجل الآن</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-12 animate-in fade-in slide-in-from-bottom-10 pb-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* Section 1: Basic Info */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4 section-header p-4 rounded-2xl">
                    <div className="badge-num w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black">١</div>
                    <h3 className="text-lg font-black text-slate-800">البيانات الأساسية</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                    <div className="col-span-full">
                      <label className="text-[10px] font-black text-slate-400 mb-2 block mr-2 uppercase tracking-widest">نوع التسجيل</label>
                      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-black/5">
                        {['nazih', 'idari'].map(r => (
                          <button key={r} type="button" onClick={() => setRegData({...regData, role: r as any})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${regData.role === r ? 'btn-reg text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                            {r === 'nazih' ? 'نازح' : 'إداري'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {regData.role === 'idari' && (
                      <div className="col-span-full">
                         <input required type="text" placeholder="المُسمى الإداري" className="w-full input-reg rounded-2xl p-4 outline-none" value={regData.adminTitle || ''} onChange={e => setRegData({...regData, adminTitle: e.target.value})} />
                      </div>
                    )}
                    <input required type="text" placeholder="الإسم رباعي" className="w-full input-reg rounded-2xl p-4 outline-none" value={regData.name || ''} onChange={e => setRegData({...regData, name: e.target.value})} />
                    <input required type="text" placeholder="رقم الهوية" className="w-full input-reg rounded-2xl p-4 outline-none font-mono" value={regData.idNumber || ''} onChange={e => setRegData({...regData, idNumber: e.target.value})} />
                    <input required type="date" className="w-full input-reg rounded-2xl p-4 outline-none" value={regData.birthDate || ''} onChange={e => setRegData({...regData, birthDate: e.target.value})} title="تاريخ الميلاد" />
                    <input required type="tel" placeholder="رقم الهاتف المحمول" className="w-full input-reg rounded-2xl p-4 outline-none" value={regData.phone || ''} onChange={e => setRegData({...regData, phone: e.target.value})} />
                    <input required type="text" placeholder="رقم المحفظة" className="w-full input-reg rounded-2xl p-4 outline-none" value={regData.walletNumber || ''} onChange={e => setRegData({...regData, walletNumber: e.target.value})} />
                    <input required type="text" placeholder="العنوان قبل النزوح" className="w-full input-reg rounded-2xl p-4 outline-none" value={regData.addressBefore || ''} onChange={e => setRegData({...regData, addressBefore: e.target.value})} />
                  </div>
                </div>

                {/* Section 2: Housing & Health */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4 section-header p-4 rounded-2xl">
                    <div className="badge-num w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black">٢</div>
                    <h3 className="text-lg font-black text-slate-800">السكن والحالة الصحية</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                    <select required className="w-full input-reg rounded-2xl p-4 outline-none" value={regData.housingStatus} onChange={e => setRegData({...regData, housingStatus: e.target.value as HousingStatus})}>
                      <option value="هدم كُلي">هدم كُلي</option>
                      <option value="هدم جُزئي">هدم جُزئي</option>
                      <option value="منطقة قتال">منطقة قتال</option>
                    </select>
                    <div className="flex gap-2">
                       <select required className="flex-1 input-reg rounded-2xl p-4 outline-none" value={regData.shelterType} onChange={e => setRegData({...regData, shelterType: e.target.value as ShelterType})}>
                          <option value="خيمة">خيمة</option>
                          <option value="صف">صف</option>
                       </select>
                       <input required type="text" placeholder="رقم" className="w-20 input-reg rounded-2xl p-4 outline-none" value={regData.shelterNumber || ''} onChange={e => setRegData({...regData, shelterNumber: e.target.value})} />
                    </div>
                    <div className="col-span-full grid grid-cols-2 gap-4">
                      <select required className="w-full input-reg rounded-2xl p-4 outline-none" value={regData.gender} onChange={e => {
                        const gender = e.target.value as Gender;
                        setRegData({...regData, gender, maritalStatus: gender === 'ذكر' ? 'أعزب' : 'عزباء'});
                      }}>
                        <option value="ذكر">ذكر</option>
                        <option value="أُنثى">أُنثى</option>
                      </select>
                      <select required className="w-full input-reg rounded-2xl p-4 outline-none" value={regData.maritalStatus} onChange={e => setRegData({...regData, maritalStatus: e.target.value})}>
                        {regData.gender === 'ذكر' ? (
                          <>
                            <option value="أعزب">أعزب</option>
                            <option value="متزوج">متزوج</option>
                            <option value="أرمل">أرمل</option>
                            <option value="مطلق">مطلق</option>
                          </>
                        ) : (
                          <>
                            <option value="عزباء">عزباء</option>
                            <option value="متزوجة">متزوجة</option>
                            <option value="زوجة شهيد">زوجة شهيد</option>
                            <option value="زوجة أسير">زوجة أسير</option>
                            <option value="مطلقة">مطلقة</option>
                            <option value="مهجورة">مهجورة</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="col-span-full">
                       <select required className="w-full input-reg rounded-2xl p-4 outline-none" value={regData.healthStatus} onChange={e => setRegData({...regData, healthStatus: e.target.value as HealthStatus})}>
                          <option value="مُعافى">مُعافى</option>
                          <option value="مريض مُزمن">مريض مُزمن</option>
                          <option value="مصاب حرب">مصاب حرب</option>
                          <option value="إعاقة">إعاقة</option>
                       </select>
                       {regData.healthStatus !== 'مُعافى' && (
                         <textarea placeholder="تفاصيل صحية" className="w-full input-reg rounded-2xl p-4 outline-none mt-4 h-24 resize-none" value={regData.healthDetails || ''} onChange={e => setRegData({...regData, healthDetails: e.target.value})} />
                       )}
                    </div>
                    <div className="col-span-full grid grid-cols-2 gap-4 pt-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black mr-2 text-slate-400">كلمة المرور</label>
                         <input required type="password" placeholder="••••••••" className="w-full input-reg rounded-2xl p-4 outline-none" value={regData.password || ''} onChange={e => setRegData({...regData, password: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black mr-2 text-slate-400">تأكيد كلمة المرور</label>
                         <input required type="password" placeholder="••••••••" className="w-full input-reg rounded-2xl p-4 outline-none" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Family Members */}
                <div className="col-span-full space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-50/30 p-8 rounded-[3rem] border border-indigo-100 gap-6">
                    <div className="flex items-center gap-5">
                      <div className="badge-num w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black">٣</div>
                      <div>
                        <h3 className="text-slate-800 font-black">أفراد الأسرة والمرافقين</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase mt-1">يتم الترتيب: الزوجة ثم الأبناء حسب السن</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowAddMember(true)} className="btn-reg text-white px-10 py-4 rounded-2xl font-black text-xs">إضافة فرد للأسرة</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-4">
                    {regData.familyMembers?.map(m => (
                      <div key={m.id} className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm flex flex-col gap-3 relative hover:border-indigo-300 transition-all">
                         <button type="button" onClick={() => setRegData(prev => ({...prev, familyMembers: prev.familyMembers?.filter(x => x.id !== m.id)}))} className="absolute top-5 left-5 text-slate-300 hover:text-red-500"><i className="fas fa-times-circle text-lg"></i></button>
                         <p className="text-sm font-black text-slate-800">{m.name}</p>
                         <div className="flex gap-2">
                            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg">{m.relation}</span>
                            <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-3 py-1 rounded-lg">{m.idNumber}</span>
                         </div>
                         {(m.isPregnant || m.isNursing) && (
                           <div className="flex gap-2">
                             {m.isPregnant && <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">حامل</span>}
                             {m.isNursing && <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">مرضعة</span>}
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 4: External Dependents - NEW REQUESTED SECTION */}
                <div className="col-span-full space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-center bg-slate-100/50 p-8 rounded-[3rem] border border-slate-200 gap-6">
                    <div className="flex items-center gap-5">
                      <div className="badge-num w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black bg-slate-800">٤</div>
                      <div>
                        <h3 className="text-slate-800 font-black">هل تعيل أفراد من خارج أسرتك؟</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase mt-1">إضافة أفراد من خارج العائلة تتكفل بهم</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowAddDependent(true)} className="bg-slate-800 text-white px-10 py-4 rounded-2xl font-black text-xs shadow-xl hover:brightness-110 transition-all">زر إضافة أفراد من خارج العائلة</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-4">
                    {regData.externalDependents?.map(d => (
                      <div key={d.id} className="bg-slate-50 border border-dashed border-slate-300 p-6 rounded-[2.5rem] flex justify-between items-center hover:bg-white transition-all">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-700">{d.fullName}</p>
                          <p className="text-[9px] font-bold text-slate-400">{d.relation}</p>
                        </div>
                        <button type="button" onClick={() => setRegData(prev => ({...prev, externalDependents: prev.externalDependents?.filter(x => x.id !== d.id)}))} className="text-red-400 hover:text-red-600"><i className="fas fa-trash-alt"></i></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 5: Documents - UPDATED REQUESTED SECTION */}
                <div className="col-span-full space-y-8">
                   <div className="flex items-center gap-4 section-header p-4 rounded-2xl">
                    <div className="badge-num w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black">٥</div>
                    <h3 className="text-lg font-black text-slate-800">الوثائق والمرفقات الرسمية</h3>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                      <div className="space-y-4">
                        <p className="text-xs font-black text-slate-600 text-center">زر إضافة صورة الهوية</p>
                        <div className="group relative h-56 bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-all cursor-pointer">
                          {regData.docs?.idImage ? <img src={regData.docs.idImage} className="w-full h-full object-cover" /> : <div className="text-center opacity-30"><i className="fas fa-camera text-4xl mb-2"></i><p className="text-[9px] font-black">إدراج صورة الهوية</p></div>}
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, 'idImage')} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-xs font-black text-slate-600 text-center">زر إضافة صورة كرت تسجيل العائلة - الوكالة</p>
                        <div className="group relative h-56 bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-all cursor-pointer">
                          {regData.docs?.agencyCard ? <img src={regData.docs.agencyCard} className="w-full h-full object-cover" /> : <div className="text-center opacity-30"><i className="fas fa-address-card text-4xl mb-2"></i><p className="text-[9px] font-black">إدراج صورة كرت الوكالة</p></div>}
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, 'agencyCard')} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-xs font-black text-slate-600 text-center">زر صورة شخصية</p>
                        <div className="group relative h-56 bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-all cursor-pointer">
                          {regData.docs?.profilePic ? <img src={regData.docs.profilePic} className="w-full h-full object-cover" /> : <div className="text-center opacity-30"><i className="fas fa-user-circle text-4xl mb-2"></i><p className="text-[9px] font-black">إدراج صورة شخصية</p></div>}
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, 'profilePic')} />
                        </div>
                      </div>
                   </div>
                </div>

                {/* Final Agreement - UPDATED TEXT */}
                <div className="col-span-full pt-10 border-t border-slate-200">
                  <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-accent"></div>
                    <label className="flex items-center gap-8 cursor-pointer relative z-10">
                      <div className="relative">
                        <input required type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="peer w-8 h-8 opacity-0 absolute inset-0 cursor-pointer" />
                        <div className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${agreedToTerms ? 'bg-accent border-accent' : 'border-white/20'}`}>
                          {agreedToTerms && <i className="fas fa-check text-sm text-white"></i>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black leading-snug">زر (صح) أوافق على أن كل البيانات المُدرجة صحيحة</p>
                        <p className="text-[11px] font-black text-slate-400 mt-2 uppercase tracking-widest opacity-80 leading-relaxed">أي خطأ مقصود يعرض صاحب الطلب لإلغاء طلبه وإجراءات إدارية قانونية.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 pt-10">
                <button type="submit" className="flex-[3] btn-reg text-white font-black py-7 rounded-[2.5rem] text-xl">إرسال طلب التسجيل النهائي</button>
                <button type="button" onClick={() => setIsRegistering(false)} className="flex-1 py-7 rounded-[2.5rem] border bg-slate-50 text-slate-500 hover:text-slate-800 transition-all font-black text-sm">عودة للدخول</button>
              </div>
            </form>
          )}
        </div>

        {/* Modal: Add Family Member */}
        {showAddMember && (
          <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-10 shadow-2xl relative animate-in zoom-in-95">
              <h3 className="text-xl font-black text-slate-800 mb-8 border-r-4 border-indigo-600 pr-4">إضافة فرد للأسرة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input type="text" placeholder="الاسم" className="w-full input-reg p-4 rounded-2xl outline-none" value={newMember.name || ''} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                 <select className="w-full input-reg p-4 rounded-2xl outline-none" value={newMember.relation} onChange={e => setNewMember({...newMember, relation: e.target.value as any})}>
                    <option value="زوج">زوج</option>
                    <option value="زوجة">زوجة</option>
                    <option value="ابن">ابن</option>
                    <option value="ابنة">ابنة</option>
                 </select>
                 <input type="text" placeholder="رقم الهوية" className="w-full input-reg p-4 rounded-2xl outline-none" value={newMember.idNumber || ''} onChange={e => setNewMember({...newMember, idNumber: e.target.value})} />
                 <input type="date" className="w-full input-reg p-4 rounded-2xl outline-none" value={newMember.birthDate || ''} onChange={e => setNewMember({...newMember, birthDate: e.target.value})} />
                 
                 {newMember.relation === 'زوجة' && (
                   <div className="col-span-full space-y-4 pt-4 border-t border-black/5">
                      <div className="flex gap-6 justify-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 accent-accent" checked={newMember.isPregnant || false} onChange={e => setNewMember({...newMember, isPregnant: e.target.checked, isNursing: false})} />
                          <span className="text-xs font-black text-slate-600">حامل</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 accent-accent" checked={newMember.isNursing || false} onChange={e => setNewMember({...newMember, isNursing: e.target.checked, isPregnant: false})} />
                          <span className="text-xs font-black text-slate-600">مرضعة</span>
                        </label>
                      </div>
                      
                      {(newMember.isPregnant || newMember.isNursing) && (
                        <div className="space-y-4 text-center">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{newMember.isPregnant ? 'إدراج صورة شهادة حمل' : 'إدراج صورة شهادة ميلاد'}</p>
                          <div className="relative h-40 w-full max-w-xs mx-auto bg-indigo-50/50 rounded-[2.5rem] border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden">
                             {(newMember.isPregnant ? newMember.pregnancyCert : newMember.birthCert) ? <img src={newMember.isPregnant ? newMember.pregnancyCert : newMember.birthCert} className="w-full h-full object-cover" /> : <i className="fas fa-image text-indigo-200 text-3xl"></i>}
                             <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, newMember.isPregnant ? 'pregnancyCert' : 'birthCert', true)} />
                          </div>
                        </div>
                      )}
                   </div>
                 )}
              </div>
              <div className="flex gap-4 mt-10">
                <button type="button" onClick={addFamilyMember} className="flex-1 btn-reg text-white font-black py-4 rounded-2xl shadow-xl">تأكيد الإضافة</button>
                <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 bg-slate-100 text-slate-400 font-black py-4 rounded-2xl">إلغاء</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add External Dependent - UPDATED REQUESTED FIELDS */}
        {showAddDependent && (
          <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-10 shadow-2xl relative animate-in zoom-in-95">
              <h3 className="text-xl font-black text-slate-800 mb-8 border-r-4 border-slate-800 pr-4">إضافة شخص من خارج العائلة (إعالة)</h3>
              <div className="space-y-4">
                 <input type="text" placeholder="الإسم رباعي" className="w-full input-reg p-4 rounded-2xl outline-none" value={newDep.fullName || ''} onChange={e => setNewDep({...newDep, fullName: e.target.value})} />
                 <input type="text" placeholder="صلة القرابة مربع نصي" className="w-full input-reg p-4 rounded-2xl outline-none" value={newDep.relation || ''} onChange={e => setNewDep({...newDep, relation: e.target.value})} />
                 <input type="text" placeholder="رقم الهوية" className="w-full input-reg p-4 rounded-2xl outline-none" value={newDep.idNumber || ''} onChange={e => setNewDep({...newDep, idNumber: e.target.value})} />
                 <input type="date" className="w-full input-reg p-4 rounded-2xl outline-none" value={newDep.birthDate || ''} onChange={e => setNewDep({...newDep, birthDate: e.target.value})} title="تاريخ الميلاد" />
              </div>
              <div className="flex gap-4 mt-10">
                <button type="button" onClick={addExternalDep} className="flex-1 bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl hover:brightness-110">تأكيد الإضافة</button>
                <button type="button" onClick={() => setShowAddDependent(false)} className="flex-1 bg-slate-100 text-slate-400 font-black py-4 rounded-2xl">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Rest of the component remains the same for authenticated state
  return (
    <div className="flex min-h-screen bg-vibrant text-right" dir="rtl">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} />
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-w-7xl mx-auto w-full relative">
        <header className="flex justify-between items-center mb-10 sticky top-0 z-40 bg-transparent backdrop-blur-sm py-2 px-1">
          <div className="flex items-center gap-4">
             <button onClick={handleLogout} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all cursor-pointer shadow-lg hover:shadow-red-500/20 group" title="تسجيل الخروج"><i className="fas fa-power-off group-hover:rotate-12 transition-transform"></i></button>
             <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className={`w-12 h-12 glass rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg ${showNotifications ? 'border-accent text-accent' : 'text-[#8B909A]'}`}><i className="fas fa-bell"></i>{unreadCount > 0 && <span className="absolute -top-1 -left-1 w-5 h-5 bg-orange-500 text-white text-[9px] font-black flex items-center justify-center rounded-full animate-bounce ring-4 ring-white/20">{unreadCount}</span>}</button>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-[-1] md:hidden" onClick={() => setShowNotifications(false)}></div>
                    <div className="fixed md:absolute top-20 left-4 right-4 md:right-auto md:left-0 md:w-96 glass rounded-[2.5rem] shadow-2xl border border-white/10 p-6 animate-in slide-in-from-top-4 duration-300 z-50 overflow-hidden max-h-[80vh] flex flex-col">
                      <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-accent/20 text-accent rounded-xl flex items-center justify-center"><i className="fas fa-bolt text-xs"></i></div><h4 className="text-sm font-black text-main">مركز التنبيهات</h4></div><button onClick={() => setNotifications(notifications.map(n => ({...n, isRead: true})))} className="text-[10px] font-black text-accent hover:underline">تحديد الكل كقروء</button></div>
                      <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 pr-1">{notifications.length > 0 ? notifications.map(notif => (<div key={notif.id} onClick={() => toggleReadNotif(notif.id)} className={`p-5 rounded-[2rem] border transition-all cursor-pointer relative group ${notif.isRead ? 'bg-black/5 border-transparent opacity-60' : 'bg-white border-accent/10 shadow-sm hover:border-accent/30'}`}>{!notif.isRead && <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-accent rounded-full shadow-[0_0_10px_var(--accent-glow)]"></div>}<div className="flex items-start gap-4"><div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${notif.type === 'registration' ? 'bg-indigo-50 text-indigo-500' : notif.type === 'edit_request' ? 'bg-orange-50 text-orange-500' : notif.type === 'approval' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-500'}`}><i className={`fas ${notif.type === 'registration' ? 'fa-user-plus' : notif.type === 'edit_request' ? 'fa-user-pen' : notif.type === 'approval' ? 'fa-check-double' : 'fa-circle-info'} text-sm`}></i></div><div className="text-right flex-1"><div className="flex justify-between items-center mb-0.5"><p className="text-[11px] font-black text-main line-clamp-1">{notif.title}</p><p className="text-[8px] text-muted-custom font-bold">{notif.time}</p></div><p className="text-[10px] text-second leading-relaxed line-clamp-2">{notif.message}</p></div></div></div>)) : (<div className="py-16 text-center"><div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-bell-slash text-slate-300 text-3xl"></i></div><p className="text-xs font-black text-slate-400">هدوء تام.. لا توجد تنبيهات</p></div>)}</div>
                    </div>
                  </>
                )}
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div onClick={openMyProfile} className="flex items-center gap-3 glass px-5 py-2.5 rounded-[1.8rem] border border-black/5 group cursor-pointer hover:border-accent/30 transition-all"><div className="text-right"><p className="text-[9px] font-black text-[#8B909A] uppercase tracking-widest">{activeRole === 'idari' ? (currentUser?.adminTitle || 'إداري النظام') : activeRole === 'khariji' ? 'نازح خارجي' : 'نازح مسجل'}</p><p className="text-xs font-bold text-slate-800 group-hover:text-accent transition-colors">{currentUser?.name}</p></div><img src={currentUser?.docs.profilePic || "https://picsum.photos/100"} className="w-11 h-11 rounded-2xl shadow-lg border-2 border-white/10 group-hover:border-accent transition-all object-cover" /></div>
          </div>
        </header>

        {currentView === 'dashboard' && <Dashboard idps={idps} />}
        {currentView === 'idp-list' && (<IDPManagement idps={idps} activeRole={activeRole} currentUserId={currentUser?.id} forceOpenId={requestedProfileId} onCloseForceOpen={() => setRequestedProfileId(null)} onApprove={(id) => { setIdps(prev => prev.map(i => i.id === id ? {...i, status: 'Approved'} : i)); addNotification('اعتماد طلب انضمام', 'تمت الموافقة على طلب تسجيل جديد وأصبح المستفيد نشطاً في النظام.', 'approval'); }} onDelete={(id) => { if(confirm('هل أنت متأكد من الحذف؟')) setIdps(prev => prev.filter(i => i.id !== id)) }} onToggleSuspend={(id) => { setIdps(prev => prev.map(i => i.id === id ? {...i, status: i.status === 'Suspended' ? 'Approved' : 'Suspended'} : i)); }} onToggleRole={(id) => setIdps(prev => prev.map(i => i.id === id ? {...i, role: i.role === 'idari' ? 'nazih' : 'idari'} : i))} onUpdate={handleUpdateIDP} />)}
        {currentView === 'aid-services' && activeRole === 'idari' && <AidServices idps={idps.filter(i => i.status !== 'Pending' && i.status !== 'Suspended')} onDistribute={handleBulkNotify} />}
        {currentView === 'reports' && activeRole === 'idari' && <Reports idps={idps.filter(i => i.status !== 'Pending')} />}
        {currentView === 'messages' && <Messaging currentUser={currentUser} allIDPs={idps} />}
      </main>
      <BottomNav currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

export default App;
