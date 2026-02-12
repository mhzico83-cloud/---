
import React, { useState, useEffect } from 'react';
import { IDP, UserRole, FamilyMember, ExternalDependent } from '../types';
import Counter from './Counter';

interface IDPManagementProps {
  idps: IDP[];
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleRole: (id: string) => void;
  onToggleSuspend?: (id: string) => void; 
  onUpdate: (id: string, data: Partial<IDP>) => void;
  onApproveEdit?: (id: string) => void;
  activeRole: UserRole;
  currentUserId?: string;
  forceOpenId?: string | null;
  onCloseForceOpen?: () => void;
}

const IDPManagement: React.FC<IDPManagementProps> = ({ 
  idps, onApprove, onDelete, onToggleRole, onToggleSuspend, onUpdate, activeRole, forceOpenId, onCloseForceOpen 
}) => {
  const [selectedIDP, setSelectedIDP] = useState<IDP | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'family' | 'health' | 'housing' | 'docs'>('info');

  useEffect(() => {
    if (forceOpenId) {
      const target = idps.find(i => i.id === forceOpenId);
      if (target) {
        setSelectedIDP(target);
        if (onCloseForceOpen) onCloseForceOpen();
      }
    }
  }, [forceOpenId, idps]);

  const activeIDPs = idps.filter(idp => idp.status !== 'Pending');
  const pendingIDPs = idps.filter(idp => idp.status === 'Pending');
  const filteredActive = activeIDPs.filter(idp => idp.name.includes(searchTerm) || idp.idNumber.includes(searchTerm));

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const DataField = ({ label, value, icon, color = "text-indigo-500" }: { label: string, value: string | number | undefined, icon: string, color?: string }) => (
    <div className="bg-slate-50 border border-slate-100 p-3 md:p-4 rounded-2xl flex items-center gap-3 hover:shadow-md transition-all">
      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${color} shrink-0`}>
        <i className={`fas ${icon} text-sm md:text-base`}></i>
      </div>
      <div className="text-right min-w-0 flex-1">
        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-xs md:text-sm font-bold text-slate-800 break-words">{value || 'غير متوفر'}</p>
      </div>
    </div>
  );

  const navTabs = [
    { id: 'info', label: 'الشخصية', icon: 'fa-id-card' },
    { id: 'housing', label: 'السكن', icon: 'fa-house-chimney' },
    { id: 'family', label: 'العائلة', icon: 'fa-users' },
    { id: 'health', label: 'الصحة', icon: 'fa-notes-medical' },
    { id: 'docs', label: 'الوثائق', icon: 'fa-file-shield' },
  ] as const;

  return (
    <div className="space-y-6 pb-24 md:pb-32">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-in fade-in duration-700">
        {[
          { label: 'المعتمدين', val: activeIDPs.length, icon: 'fa-users-check', color: 'indigo' },
          { label: 'بالانتظار', val: pendingIDPs.length, icon: 'fa-hourglass-half', color: 'orange' },
          { label: 'طوارئ', val: idps.filter(i => i.status === 'Critical').length, icon: 'fa-heart-pulse', color: 'rose' },
          { label: 'معلق', val: idps.filter(i => i.status === 'Suspended').length, icon: 'fa-user-slash', color: 'slate' }
        ].map((stat, idx) => (
          <div key={idx} className="glass p-4 rounded-[1.5rem] border-white/10 shadow-lg">
            <div className="flex justify-between items-center mb-1">
              <i className={`fas ${stat.icon} text-${stat.color}-500 text-lg`}></i>
            </div>
            <h3 className="text-xl font-black text-main"><Counter value={stat.val} /></h3>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-lg md:text-2xl font-black text-main flex items-center gap-2">
              <i className="fas fa-users-line text-accent"></i>
              سجلات المستفيدين
            </h2>
            <p className="text-[9px] text-second mt-0.5 font-black uppercase tracking-widest">عرض وإدارة سكان المخيم</p>
          </div>
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو الهوية..." 
              className="w-full bg-black/5 border border-white/5 rounded-2xl py-3 pr-10 pl-4 text-xs text-main outline-none focus:border-accent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-muted-custom"></i>
          </div>
        </div>

        {activeRole === 'idari' && pendingIDPs.length > 0 && (
          <div className="mb-8 space-y-3">
            <h3 className="text-[10px] font-black text-orange-500 flex items-center gap-2 uppercase tracking-widest px-2">
              <i className="fas fa-circle-exclamation"></i>
              طلبات تسجيل بانتظار الاعتماد ({pendingIDPs.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingIDPs.map(idp => (
                <div key={idp.id} className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl flex items-center justify-between group hover:bg-white transition-all">
                  <div className="flex items-center gap-3 cursor-pointer overflow-hidden" onClick={() => setSelectedIDP(idp)}>
                    <img src={idp.docs.profilePic || "https://picsum.photos/100"} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                    <div className="text-right truncate">
                      <p className="text-[11px] font-black text-slate-800 truncate">{idp.name}</p>
                      <p className="text-[8px] font-bold text-slate-400">هوية: {idp.idNumber}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => onApprove(idp.id)} className="w-8 h-8 bg-emerald-500 text-white rounded-lg shadow-md hover:scale-105 transition-all flex items-center justify-center">
                      <i className="fas fa-check text-xs"></i>
                    </button>
                    <button onClick={() => onDelete(idp.id)} className="w-8 h-8 bg-white border border-red-100 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                      <i className="fas fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredActive.map(idp => (
            <div 
              key={idp.id} 
              onClick={() => setSelectedIDP(idp)}
              className="glass p-5 rounded-[1.8rem] md:rounded-[2.5rem] border-white/5 hover:border-accent/40 hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="relative shrink-0">
                  <img src={idp.docs.profilePic || "https://picsum.photos/200"} className="w-16 h-16 rounded-2xl object-cover border border-white/10 group-hover:scale-105 transition-transform" alt="" />
                  <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center text-[8px] text-white shadow-lg border border-white ${idp.status === 'Approved' ? 'bg-emerald-500' : idp.status === 'Critical' ? 'bg-rose-500' : 'bg-slate-400'}`}>
                    <i className={`fas ${idp.status === 'Approved' ? 'fa-check' : idp.status === 'Critical' ? 'fa-heart-pulse' : 'fa-clock'}`}></i>
                  </span>
                </div>
                <div className="text-right flex-1 min-w-0">
                  <h4 className="text-xs md:text-sm font-black text-main truncate group-hover:text-accent transition-colors">{idp.name}</h4>
                  <p className="text-[9px] font-black text-muted-custom mt-0.5 uppercase tracking-widest truncate">هوية: {idp.idNumber}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[7px] font-black bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/10">{idp.shelterType} {idp.shelterNumber}</span>
                    <span className="text-[7px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">{idp.familySize} أفراد</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedIDP && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 lg:p-10 animate-in fade-in duration-300 overflow-hidden" dir="rtl">
          <div className="bg-white w-full max-w-5xl md:rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl relative animate-in slide-in-from-bottom-20 md:zoom-in-95 duration-500 flex flex-col md:flex-row h-[95vh] md:h-[85vh] lg:h-[90vh]">
            
            <div className="w-full md:w-72 lg:w-80 bg-slate-50 p-6 md:p-8 border-l border-black/5 flex flex-col items-center shrink-0 overflow-y-auto no-scrollbar">
              <button onClick={() => setSelectedIDP(null)} className="absolute top-4 left-4 md:top-6 md:left-6 w-10 h-10 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-black/5 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all z-20"><i className="fas fa-times"></i></button>

              <div className="relative mb-4 md:mb-6 mt-4 md:mt-0">
                <img src={selectedIDP.docs.profilePic || "https://picsum.photos/400"} className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-[2rem] md:rounded-[3rem] object-cover shadow-2xl border-4 border-white" alt="" />
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl shadow-xl font-black text-[9px] text-white whitespace-nowrap ${selectedIDP.status === 'Approved' ? 'bg-emerald-500' : 'bg-orange-500'}`}>{selectedIDP.status === 'Approved' ? 'حساب معتمد' : 'بانتظار المراجعة'}</div>
              </div>

              <div className="text-center space-y-2 mb-6 w-full">
                <h2 className="text-lg md:text-xl font-black text-slate-800 leading-tight">{selectedIDP.name}</h2>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{selectedIDP.role === 'idari' ? (selectedIDP.adminTitle || 'إداري النظام') : 'نازح مقيم'}</p>
                  <p className="text-[9px] font-mono font-bold text-slate-400">ID: {selectedIDP.idNumber}</p>
                </div>
              </div>

              <div className="w-full flex md:flex-col gap-2 overflow-x-auto no-scrollbar pb-4 md:pb-0 pt-4 border-t border-black/5">
                {navTabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 md:flex-none py-3 px-4 md:px-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs flex items-center justify-center md:justify-start gap-2.5 transition-all whitespace-nowrap border ${activeTab === tab.id ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-white text-slate-400 border-black/5 hover:bg-slate-100'}`}><i className={`fas ${tab.icon} shrink-0`}></i><span>{tab.label}</span></button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto no-scrollbar bg-white">
              <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-10">
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <h3 className="text-base md:text-xl font-black text-slate-800 border-r-4 border-accent pr-3">المعلومات الشخصية</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DataField label="الاسم الكامل" value={selectedIDP.name} icon="fa-user" />
                      <DataField label="رقم الهوية" value={selectedIDP.idNumber} icon="fa-fingerprint" />
                      <DataField label="تاريخ الميلاد" value={selectedIDP.birthDate} icon="fa-calendar-day" />
                      <DataField label="العمر" value={calculateAge(selectedIDP.birthDate) + " سنة"} icon="fa-hourglass-half" />
                      <DataField label="رقم الجوال" value={selectedIDP.phone} icon="fa-phone" />
                      <DataField label="الجنس" value={selectedIDP.gender} icon="fa-venus-mars" />
                      <DataField label="الحالة الاجتماعية" value={selectedIDP.maritalStatus} icon="fa-ring" />
                      <DataField label="المحفظة الإلكترونية" value={selectedIDP.walletNumber} icon="fa-wallet" color="text-emerald-500" />
                    </div>
                  </div>
                )}

                {activeTab === 'housing' && (
                  <div className="space-y-6">
                    <h3 className="text-base md:text-xl font-black text-slate-800 border-r-4 border-accent pr-3">بيانات السكن</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DataField label="العنوان السابق" value={selectedIDP.addressBefore} icon="fa-location-dot" />
                      <DataField label="حالة السكن السابق" value={selectedIDP.housingStatus} icon="fa-house-damage" color="text-rose-500" />
                      <DataField label="نوع المأوى" value={selectedIDP.shelterType} icon="fa-tent" />
                      <DataField label="رقم (غرفة/خيمة)" value={selectedIDP.shelterNumber} icon="fa-hashtag" />
                    </div>
                  </div>
                )}

                {activeTab === 'family' && (
                  <div className="space-y-6">
                    <h3 className="text-base md:text-xl font-black text-slate-800 border-r-4 border-accent pr-3">أفراد العائلة ({selectedIDP.familyMembers.length})</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedIDP.familyMembers.map((member, idx) => (
                        <div key={member.id} className="bg-white border border-black/5 p-4 rounded-[1.5rem] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 text-xs font-black shadow-inner">{idx + 1}</div>
                            <div className="text-right">
                              <p className="text-xs font-black text-slate-800">{member.name}</p>
                              <div className="flex gap-2 mt-0.5">
                                <span className="text-[9px] font-bold text-accent">{member.relation}</span>
                                <span className="text-[9px] font-bold text-slate-400">عمر: {calculateAge(member.birthDate)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto justify-end">
                             {member.isPregnant && <span className="bg-rose-50 text-rose-500 px-2 py-0.5 rounded-lg text-[8px] font-black">حامل</span>}
                             {member.isNursing && <span className="bg-blue-50 text-blue-500 px-2 py-0.5 rounded-lg text-[8px] font-black">مرضعة</span>}
                             {member.pregnancyCert && <a href={member.pregnancyCert} target="_blank" className="bg-rose-500 text-white px-2 py-0.5 rounded-lg text-[8px] font-black">شهادة حمل</a>}
                             {member.birthCert && <a href={member.birthCert} target="_blank" className="bg-blue-500 text-white px-2 py-0.5 rounded-lg text-[8px] font-black">شهادة ميلاد</a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'health' && (
                  <div className="space-y-6">
                    <h3 className="text-base md:text-xl font-black text-slate-800 border-r-4 border-accent pr-3">الاحتياجات الطبية</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className={`p-5 rounded-[2rem] border flex flex-col items-center text-center gap-2 ${selectedIDP.healthStatus === 'مُعافى' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${selectedIDP.healthStatus === 'مُعافى' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}><i className={`fas ${selectedIDP.healthStatus === 'مُعافى' ? 'fa-heart' : 'fa-hand-holding-medical'}`}></i></div>
                          <p className="text-sm font-black">{selectedIDP.healthStatus}</p>
                       </div>
                       {selectedIDP.healthDetails && (
                         <div className="col-span-full bg-slate-50 p-6 rounded-[2rem] border border-black/5"><p className="text-xs font-bold text-slate-700 leading-relaxed">{selectedIDP.healthDetails}</p></div>
                       )}
                    </div>
                  </div>
                )}

                {activeTab === 'docs' && (
                  <div className="space-y-8">
                    <h3 className="text-base md:text-xl font-black text-slate-800 border-r-4 border-accent pr-3">الأرشيف والمستندات</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">صورة الهوية</p><div className="aspect-[4/3] bg-slate-100 rounded-[1.8rem] border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative shadow-sm">{selectedIDP.docs.idImage ? <img src={selectedIDP.docs.idImage} className="w-full h-full object-cover" /> : <i className="fas fa-id-card text-3xl opacity-20"></i>}</div></div>
                      <div className="space-y-2"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">كرت الوكالة</p><div className="aspect-[4/3] bg-slate-100 rounded-[1.8rem] border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative shadow-sm">{selectedIDP.docs.agencyCard ? <img src={selectedIDP.docs.agencyCard} className="w-full h-full object-cover" /> : <i className="fas fa-address-card text-3xl opacity-20"></i>}</div></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDPManagement;
