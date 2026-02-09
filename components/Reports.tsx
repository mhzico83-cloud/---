
import React, { useState, useMemo } from 'react';
import { IDP } from '../types';
import { generateSmartReport } from '../services/geminiService';
import Counter from './Counter';

interface ReportsProps {
  idps: IDP[];
}

interface StatCardProps {
  icon: string;
  title: string;
  count: number;
  total: number;
  color: string;
  onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, count, total, color, onClick }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div 
      onClick={onClick}
      className="glass p-4 rounded-[2rem] border-white/5 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-40 shadow-lg"
    >
      <div className={`absolute -right-4 -top-4 w-16 h-16 ${color} opacity-5 rounded-full blur-2xl group-hover:opacity-15 transition-opacity`}></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform`}>
          <i className={`fas ${icon} text-sm`}></i>
        </div>
        <div className="text-left">
          <p className={`text-lg font-black ${color.replace('bg-', 'text-')}`}>
            %<Counter value={Number(percentage.toFixed(1))} duration={2000} />
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <h4 className="text-gray-300 text-[10px] font-black mb-1 line-clamp-1">{title}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-white"><Counter value={count} /></span>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">شخص</span>
        </div>
      </div>

      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const Reports: React.FC<ReportsProps> = ({ idps }) => {
  const [selectedStat, setSelectedStat] = useState<{ label: string; list: IDP[] } | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const totalPop = idps.length;

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const report = await generateSmartReport(idps);
    setAiReport(report);
    setIsAnalyzing(false);
  };

  const categories = useMemo(() => {
    const filterByAge = (max: number, min: number = 0) => idps.filter(i => {
      const age = calculateAge(i.birthDate);
      return age >= min && age <= max;
    });

    return [
      {
        title: 'المؤشرات السكانية والمساعدات',
        stats: [
          { label: 'إجمالي المسجلين', icon: 'fa-users', count: idps.length, color: 'bg-indigo-500', filter: (i: IDP) => true },
          { label: 'الأسر المسجلة (رؤوس العوائل)', icon: 'fa-house-chimney', count: idps.filter(i => i.familySize > 0).length, color: 'bg-blue-600', filter: (i: IDP) => i.familySize > 0 },
          { label: 'نسبة الذكور', icon: 'fa-mars', count: idps.filter(i => i.gender === 'ذكر').length, color: 'bg-blue-400', filter: (i: IDP) => i.gender === 'ذكر' },
          { label: 'نسبة الإناث', icon: 'fa-venus', count: idps.filter(i => i.gender === 'أُنثى').length, color: 'bg-pink-500', filter: (i: IDP) => i.gender === 'أُنثى' },
          { label: 'المستهدفين من الطرود', icon: 'fa-box-open', count: idps.filter(i => i.status === 'Served').length, color: 'bg-emerald-500', filter: (i: IDP) => i.status === 'Served' },
        ]
      },
      {
        title: 'الأطفال والشباب (توزيع عمري)',
        stats: [
          { label: 'أطفال (≤ سنة)', icon: 'fa-baby', count: filterByAge(1).length, color: 'bg-cyan-300', filter: (i: IDP) => calculateAge(i.birthDate) <= 1 },
          { label: 'أطفال (≤ سنتين)', icon: 'fa-baby-carriage', count: filterByAge(2).length, color: 'bg-cyan-400', filter: (i: IDP) => calculateAge(i.birthDate) <= 2 },
          { label: 'أطفال (≤ ٣ سنوات)', icon: 'fa-child-reaching', count: filterByAge(3).length, color: 'bg-cyan-500', filter: (i: IDP) => calculateAge(i.birthDate) <= 3 },
          { label: 'أطفال (≤ ٥ سنوات)', icon: 'fa-child', count: filterByAge(5).length, color: 'bg-teal-500', filter: (i: IDP) => calculateAge(i.birthDate) <= 5 },
          { label: 'ذكور (٥-١٢ سنة)', icon: 'fa-child-combatant', count: idps.filter(i => i.gender === 'ذكر' && calculateAge(i.birthDate) > 5 && calculateAge(i.birthDate) <= 12).length, color: 'bg-blue-300', filter: (i: IDP) => i.gender === 'ذكر' && calculateAge(i.birthDate) > 5 && calculateAge(i.birthDate) <= 12 },
          { label: 'إناث (٥-١٢ سنة)', icon: 'fa-child-dress', count: idps.filter(i => i.gender === 'أُنثى' && calculateAge(i.birthDate) > 5 && calculateAge(i.birthDate) <= 12).length, color: 'bg-pink-300', filter: (i: IDP) => i.gender === 'أُنثى' && calculateAge(i.birthDate) > 5 && calculateAge(i.birthDate) <= 12 },
          { label: 'شباب (١٢-١٨ سنة)', icon: 'fa-user-graduate', count: idps.filter(i => i.gender === 'ذكر' && calculateAge(i.birthDate) > 12 && calculateAge(i.birthDate) <= 18).length, color: 'bg-indigo-400', filter: (i: IDP) => i.gender === 'ذكر' && calculateAge(i.birthDate) > 12 && calculateAge(i.birthDate) <= 18 },
          { label: 'صبايا (١٢-١٨ سنة)', icon: 'fa-user-tie', count: idps.filter(i => i.gender === 'أُنثى' && calculateAge(i.birthDate) > 12 && calculateAge(i.birthDate) <= 18).length, color: 'bg-purple-400', filter: (i: IDP) => i.gender === 'أُنثى' && calculateAge(i.birthDate) > 12 && calculateAge(i.birthDate) <= 18 },
        ]
      },
      {
        title: 'الحالات الاجتماعية والزوجات',
        stats: [
          { label: 'الزوجات', icon: 'fa-ring', count: idps.filter(i => i.gender === 'أُنثى' && (i.maritalStatus === 'متزوجة' || i.maritalStatus === 'زوجة')).length, color: 'bg-rose-400', filter: (i: IDP) => i.gender === 'أُنثى' && (i.maritalStatus === 'متزوجة' || i.maritalStatus === 'زوجة') },
          { label: 'مطلقة', icon: 'fa-user-slash', count: idps.filter(i => i.maritalStatus === 'مطلقة').length, color: 'bg-orange-400', filter: (i: IDP) => i.maritalStatus === 'مطلقة' },
          { label: 'حامل', icon: 'fa-person-pregnant', count: idps.filter(i => i.maritalStatus === 'حامل').length, color: 'bg-pink-600', filter: (i: IDP) => i.maritalStatus === 'حامل' },
          { label: 'مرضعة', icon: 'fa-baby', count: idps.filter(i => i.maritalStatus === 'مرضعة').length, color: 'bg-sky-400', filter: (i: IDP) => i.maritalStatus === 'مرضعة' },
          { label: 'أرملة', icon: 'fa-user-large-slash', count: idps.filter(i => i.maritalStatus === 'أرملة').length, color: 'bg-slate-500', filter: (i: IDP) => i.maritalStatus === 'أرملة' },
          { label: 'زوجة شهيد', icon: 'fa-dove', count: idps.filter(i => i.maritalStatus === 'زوجة شهيد').length, color: 'bg-emerald-600', filter: (i: IDP) => i.maritalStatus === 'زوجة شهيد' },
          { label: 'زوجة أسير', icon: 'fa-handcuffs', count: idps.filter(i => i.maritalStatus === 'زوجة أسير').length, color: 'bg-slate-700', filter: (i: IDP) => i.maritalStatus === 'زوجة أسير' },
          { label: 'مهجورة', icon: 'fa-person-walking-dashed-line-arrow-right', count: idps.filter(i => i.maritalStatus === 'مهجورة').length, color: 'bg-amber-600', filter: (i: IDP) => i.maritalStatus === 'مهجورة' },
        ]
      },
      {
        title: 'السكن، الصحة وكبار السن',
        stats: [
          { label: 'كبار سن (٥٠-٦٠)', icon: 'fa-person-cane', count: filterByAge(60, 50).length, color: 'bg-stone-500', filter: (i: IDP) => calculateAge(i.birthDate) >= 50 && calculateAge(i.birthDate) <= 60 },
          { label: 'كبار سن (٦٠+)', icon: 'fa-person-old', count: filterByAge(120, 61).length, color: 'bg-stone-700', filter: (i: IDP) => calculateAge(i.birthDate) > 60 },
          { label: 'هدم كُلي', icon: 'fa-house-crack', count: idps.filter(i => i.housingStatus === 'هدم كُلي').length, color: 'bg-red-600', filter: (i: IDP) => i.housingStatus === 'هدم كُلي' },
          { label: 'هدم جزئي', icon: 'fa-house-chimney-crack', count: idps.filter(i => i.housingStatus === 'هدم جُزئي').length, color: 'bg-orange-600', filter: (i: IDP) => i.housingStatus === 'هدم جُزئي' },
          { label: 'منطقة قتال', icon: 'fa-person-burst', count: idps.filter(i => i.housingStatus === 'منطقة قتال').length, color: 'bg-yellow-700', filter: (i: IDP) => i.housingStatus === 'منطقة قتال' },
          { label: 'مرض مزمن', icon: 'fa-pills', count: idps.filter(i => i.healthStatus === 'مريض مُزمن').length, color: 'bg-blue-800', filter: (i: IDP) => i.healthStatus === 'مريض مُزمن' },
          { label: 'إعاقة', icon: 'fa-wheelchair', count: idps.filter(i => i.healthStatus === 'إعاقة').length, color: 'bg-rose-700', filter: (i: IDP) => i.healthStatus === 'إعاقة' },
          { label: 'مصاب حرب', icon: 'fa-user-injured', count: idps.filter(i => i.healthStatus === 'مصاب حرب').length, color: 'bg-red-900', filter: (i: IDP) => i.healthStatus === 'مصاب حرب' },
        ]
      }
    ];
  }, [idps]);

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-1000 text-right" dir="rtl">
      
      {/* Strategic AI Analysis */}
      <div className="glass p-6 md:p-8 rounded-[3rem] bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-blue-900/40 border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
           <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-2xl border border-white/10">
             <i className="fas fa-microchip"></i>
           </div>
           <div className="flex-1 text-center md:text-right">
             <h3 className="text-xl font-black text-white">تحليل بيانات مخيم الكلية</h3>
             <p className="text-[10px] text-gray-400 mt-1">توليد تقرير استراتيجي</p>
           </div>
           <button 
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              className="bg-white text-indigo-950 px-8 py-3 rounded-2xl font-black text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl disabled:opacity-50"
           >
             {isAnalyzing ? "جاري المعالجة..." : "توليد التقرير الذكي"}
             <i className="fas fa-wand-magic-sparkles"></i>
           </button>
        </div>

        {aiReport && (
          <div className="mt-6 bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 text-gray-200 text-xs leading-[2] animate-in zoom-in-95 duration-500 whitespace-pre-wrap">
             {aiReport}
          </div>
        )}
      </div>

      {/* Categorized Infographic Stats */}
      <div className="space-y-12">
        {categories.map((cat, idx) => (
          <div key={idx} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-accent rounded-full shadow-[0_0_10px_var(--accent-glow)]"></div>
              <h3 className="text-lg font-black text-white">{cat.title}</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cat.stats.map((stat, sIdx) => (
                <StatCard 
                  key={sIdx}
                  icon={stat.icon}
                  title={stat.label}
                  count={stat.count}
                  total={totalPop}
                  color={stat.color}
                  onClick={() => setSelectedStat({ label: stat.label, list: idps.filter(stat.filter) })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Modal List */}
      {selectedStat && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setSelectedStat(null)}></div>
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[3rem] overflow-hidden relative shadow-2xl flex flex-col animate-in zoom-in-95">
            <header className="p-6 md:p-8 border-b-4 border-slate-900 flex justify-between items-center bg-slate-50">
              <div className="text-right">
                <h3 className="text-xl font-black text-slate-900">{selectedStat.label}</h3>
                <p className="text-slate-500 text-[10px] font-bold">إجمالي النتائج: {selectedStat.list.length} فرد</p>
              </div>
              <button onClick={() => setSelectedStat(null)} className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-red-500 hover:text-white transition-all">
                <i className="fas fa-times"></i>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="py-3 px-4 rounded-rt-xl">#</th>
                    <th className="py-3 px-4">الاسم الكامل</th>
                    <th className="py-3 px-4">الهوية</th>
                    <th className="py-3 px-4">العمر</th>
                    <th className="py-3 px-4 rounded-lt-xl">موقع السكن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedStat.list.length > 0 ? selectedStat.list.map((idp, idx) => (
                    <tr key={idp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-300">{idx + 1}</td>
                      <td className="py-3 px-4 font-black text-slate-800">{idp.name}</td>
                      <td className="py-3 px-4 font-mono text-[10px]">{idp.idNumber}</td>
                      <td className="py-3 px-4 font-bold">{calculateAge(idp.birthDate)}</td>
                      <td className="py-3 px-4 text-slate-500">{idp.shelterType} {idp.shelterNumber}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-300 italic">لا توجد سجلات مطابقة لهذه الإحصائية حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-600 transition-all">
                 <i className="fas fa-print ml-2"></i>
                 طباعة الكشف
               </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
