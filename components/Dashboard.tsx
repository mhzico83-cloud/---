
import React, { useState, useMemo } from 'react';
import { IDP } from '../types';
import Counter from './Counter';

interface DashboardProps {
  idps: IDP[];
}

const Dashboard: React.FC<DashboardProps> = ({ idps }) => {
  const [selectedOccupant, setSelectedOccupant] = useState<IDP | null>(null);
  const [mapSearch, setMapSearch] = useState('');

  const stats = [
    { label: 'إجمالي النازحين', value: idps.length, icon: 'fa-users', color: 'from-blue-500 to-cyan-500' },
    { label: 'حالات حرجة', value: idps.filter(i => i.status === 'Critical').length, icon: 'fa-triangle-exclamation', color: 'from-orange-500 to-red-500' },
    { label: 'إجمالي الأسر', value: idps.reduce((acc, curr) => acc + curr.familySize, 0), icon: 'fa-house-user', color: 'from-purple-500 to-indigo-500' },
    { label: 'مساعدات اليوم', value: 12, icon: 'fa-box-open', color: 'from-green-500 to-emerald-500' },
  ];

  const extractNumber = (str: string) => {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  };

  const mapBlocks = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => {
      const blockNum = i + 1;
      const isRoom = blockNum <= 30;
      const type = isRoom ? 'صف' : 'خيمة';
      
      const occupant = idps.find(idp => {
        const num = extractNumber(idp.shelterNumber);
        return idp.shelterType === type && num === blockNum;
      });

      const isFoundInSearch = mapSearch.trim() !== '' && 
                             occupant?.name.includes(mapSearch.trim());

      return {
        id: blockNum,
        type,
        label: isRoom ? `غرفة ${blockNum}` : `خيمة ${blockNum}`,
        isOccupied: !!occupant,
        isAdmin: occupant?.role === 'idari',
        isHighlighted: isFoundInSearch,
        occupant: occupant || null
      };
    });
  }, [idps, mapSearch]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Summary Cards */}
      <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl relative overflow-hidden group min-w-[200px] md:min-w-0 flex-shrink-0 border border-white/10">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform`}></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-second text-[10px] mb-1 font-black uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-black text-main">
                  <Counter value={stat.value} />
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform`}>
                <i className={`fas ${stat.icon} text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* خريطة النزوح الميدانية */}
      <div className="glass p-6 md:p-8 rounded-[3rem] border border-black/5 shadow-2xl relative">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
          <div className="text-right">
            <h3 className="text-2xl font-black text-main flex items-center gap-3">
              <i className="fas fa-map-location-dot text-accent"></i>
              خريطة التوزيع الميداني
            </h3>
            <p className="text-[10px] text-second mt-1 font-black uppercase tracking-widest">تحديد مواقع النازحين والبحث الميداني المباشر</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
            <div className="relative flex-1 md:w-64">
               <input 
                 type="text" 
                 placeholder="ابحث عن اسم للتعيين..." 
                 className="w-full bg-black/5 border border-white/10 rounded-2xl py-3 pr-10 pl-4 text-xs text-main outline-none focus:border-accent transition-all placeholder:text-muted-custom"
                 value={mapSearch}
                 onChange={(e) => setMapSearch(e.target.value)}
               />
               <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-muted-custom"></i>
            </div>
            
            <div className="flex flex-wrap gap-4 bg-black/5 p-3 rounded-2xl border border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-[10px] text-second font-black">إداري</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                <span className="text-[10px] text-second font-black">نازح</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-300 rounded-full border border-black/10"></div>
                <span className="text-[10px] text-second font-black">شاغر</span>
              </div>
            </div>
          </div>
        </div>

        {/* شبكة الخريطة */}
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 md:gap-3">
          {mapBlocks.map(block => (
            <div 
              key={block.id}
              onClick={() => block.occupant && setSelectedOccupant(block.occupant)}
              className={`
                aspect-square rounded-xl md:rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-300 relative group cursor-pointer
                ${!block.isOccupied 
                  ? 'bg-black/5 border-white/5 grayscale opacity-20 hover:opacity-100' 
                  : block.isAdmin 
                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-600' 
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-600'
                }
                ${block.isOccupied ? 'hover:scale-110 z-10 hover:shadow-2xl' : ''}
                ${block.isHighlighted ? 'animate-flash scale-110 ring-4 ring-accent border-white z-20' : ''}
              `}
            >
              <i className={`fas ${block.type === 'صف' ? 'fa-building' : 'fa-tent'} text-sm md:text-lg`}></i>
              <span className="text-[8px] md:text-[9px] font-black opacity-60">{block.id}</span>
              
              {block.isAdmin && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[7px] text-white shadow-lg border border-white">
                  <i className="fas fa-cog"></i>
                </div>
              )}

              {block.isOccupied && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 border border-white/10 shadow-xl">
                  {block.occupant?.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedOccupant && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
            <div className="h-64 relative">
              <img 
                src={selectedOccupant.docs.profilePic || "https://picsum.photos/400"} 
                className="w-full h-full object-cover" 
                alt={selectedOccupant.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
              <button 
                onClick={() => setSelectedOccupant(null)}
                className="absolute top-6 left-6 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
              <div className="absolute bottom-4 right-8">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedOccupant.role === 'idari' ? 'bg-yellow-500 text-white' : 'bg-indigo-600 text-white'}`}>
                  {selectedOccupant.role === 'idari' ? 'إداري النظام' : 'نازح مقيم'}
                </span>
              </div>
            </div>
            
            <div className="p-8 pt-2 text-right">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الاسم الرباعي للمستفيد</h4>
              <h2 className="text-2xl font-black text-slate-800 mb-6">{selectedOccupant.name}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-black/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase">رقم الهوية</p>
                  <p className="font-bold text-slate-700 font-mono">{selectedOccupant.idNumber}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-black/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase">موقع السكن</p>
                  <p className="font-bold text-slate-700">{selectedOccupant.shelterType} {selectedOccupant.shelterNumber}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedOccupant(null)}
                className="w-full mt-8 bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes flash {
          0%, 100% { filter: brightness(1); box-shadow: 0 0 20px rgba(var(--accent-color), 0.2); }
          50% { filter: brightness(1.2); box-shadow: 0 0 40px var(--accent-glow); }
        }
        .animate-flash {
          animation: flash 1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
