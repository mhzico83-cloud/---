
import React, { useState, useEffect } from 'react';
import { IDP, UserRole } from '../types';
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
  idps, onApprove, onDelete, onToggleRole, onToggleSuspend, onUpdate, onApproveEdit, activeRole, currentUserId, forceOpenId, onCloseForceOpen 
}) => {
  const [selectedIDP, setSelectedIDP] = useState<IDP | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="space-y-10 pb-20">
      {/* Header Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        {[
          { label: 'إجمالي المسجلين', value: activeIDPs.length, color: 'bg-indigo-600', icon: 'fa-user-check' },
          { label: 'طلبات جديدة', value: pendingIDPs.length, color: 'bg-orange-500', icon: 'fa-clock' },
          { label: 'حالات حرجة', value: idps.filter(i => i.status === 'Critical').length, color: 'bg-rose-500', icon: 'fa-heart-pulse' },
          { label: 'معلقين', value: idps.filter(i => i.status === 'Suspended').length, color: 'bg-slate-700', icon: 'fa-user-slash' }
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-3xl border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-all">
            <div className={`w-10 h-10 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
              <i className={`fas ${stat.icon} text-sm`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <h4 className="text-xl font-black text-white"><Counter value={stat.value} /></h4>
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-xl font-bold">إدارة شؤون المسجلين</h3>
          <div className="relative w-full md:w-96">
            <input 
              type="text" placeholder="بحث بالاسم أو الهوية..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-4 text-sm outline-none focus:border-purple-500"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"></i>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] overflow-hidden border-white/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-white/5 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="p-6">البيانات الأساسية</th>
                  <th className="p-6">الحالة</th>
                  <th className="p-6 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredActive.map(idp => (
                  <tr key={idp.id} className={`hover:bg-white/5 transition-colors group ${idp.status === 'Suspended' ? 'opacity-60' : ''}`}>
                    <td className="p-4 md:p-6">
                      <div className="flex items-center gap-4">
                        <img src={idp.docs.profilePic || "https://picsum.photos/100"} className="w-10 h-10 rounded-xl" />
                        <div>
                          <p className="font-black text-white text-xs md:text-sm">{idp.name}</p>
                          <p className="text-[10px] text-gray-500">{idp.idNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 md:p-6">
                      <span className={`text-[8px] md:text-[9px] font-black px-2 py-1 rounded-full border ${idp.role === 'khariji' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {idp.role === 'khariji' ? 'خارجي' : 'نازح'}
                      </span>
                    </td>
                    <td className="px-4 py-4 md:p-6">
                      <div className="flex gap-1.5 md:gap-2 justify-center md:justify-center translate-x-1 md:translate-x-0">
                        <button onClick={() => setSelectedIDP(idp)} className="w-8 h-8 md:w-9 md:h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-all"><i className="fas fa-eye text-[10px]"></i></button>
                        {activeRole === 'idari' && (
                          <>
                            <button onClick={() => onToggleSuspend?.(idp.id)} className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center transition-all ${idp.status === 'Suspended' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                              <i className={`fas ${idp.status === 'Suspended' ? 'fa-user-check' : 'fa-user-slash'} text-[10px]`}></i>
                            </button>
                            <button onClick={() => onDelete(idp.id)} className="w-8 h-8 md:w-9 md:h-9 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"><i className="fas fa-trash-alt text-[10px]"></i></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal View */}
      {selectedIDP && (
         <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-[3.5rem] overflow-hidden relative text-slate-900 shadow-2xl flex flex-col animate-in zoom-in-95">
            <header className="p-8 border-b-[6px] border-slate-900 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-6 text-right">
                <img src={selectedIDP.docs.profilePic || "https://picsum.photos/100"} className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg" />
                <div>
                   <h3 className="text-2xl font-black">{selectedIDP.name}</h3>
                   <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase">{selectedIDP.idNumber}</span>
                </div>
              </div>
              <button onClick={() => setSelectedIDP(null)} className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-red-500 hover:text-white transition-all">
                <i className="fas fa-times"></i>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-10 bg-white text-right">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-xs font-black text-gray-400 uppercase">البيانات الشخصية</p>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                       <p className="text-[10px] text-gray-400">تاريخ الميلاد</p>
                       <p className="font-bold">{selectedIDP.birthDate}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                       <p className="text-[10px] text-gray-400">رقم الهاتف</p>
                       <p className="font-bold">{selectedIDP.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-black text-gray-400 uppercase">بيانات السكن</p>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                       <p className="text-[10px] text-gray-400">موقع السكن الحالي</p>
                       <p className="font-bold">{selectedIDP.shelterType} - {selectedIDP.shelterNumber}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                       <p className="text-[10px] text-gray-400">العنوان قبل النزوح</p>
                       <p className="font-bold">{selectedIDP.addressBefore}</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDPManagement;
