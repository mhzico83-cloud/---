
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
      className="glass p-5 rounded-[2.2rem] border-white/10 hover:border-accent/30 hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-44 shadow-lg"
    >
      <div className={`absolute -right-4 -top-4 w-20 h-20 ${color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform`}>
          <i className={`fas ${icon} text-lg`}></i>
        </div>
        <div className="text-left">
          <p className={`text-xl font-black ${color.replace('bg-', 'text-')} filter brightness-125`}>
            %<Counter value={Number(percentage.toFixed(1))} duration={2000} />
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-2">
        <h4 className="text-second text-[10px] font-black mb-1 line-clamp-1 uppercase tracking-wider">{title}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-main"><Counter value={count} /></span>
          <span className="text-[9px] text-muted-custom font-black uppercase tracking-tighter">مستفيد</span>
        </div>
      </div>

      <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden mt-3">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.2)]`}
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
  const [isExporting, setIsExporting] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [copyStatus, setCopyStatus] = useState(false);
  
  const [visibleCols, setVisibleCols] = useState({
    name: true,
    idNumber: true,
    birthDate: false,
    age: true,
    housingStatus: true,
    tents: true,
    classrooms: true,
    familySize: true,
    health: true
  });

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showWhatsappInput, setShowWhatsappInput] = useState(false);

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
    setAiReport(null);
    const report = await generateSmartReport(idps);
    setAiReport(report);
    setIsAnalyzing(false);
  };

  const handleCopy = () => {
    if (aiReport) {
      navigator.clipboard.writeText(aiReport);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  // وظيفة تصدير PDF وإرسال واتساب الموحدة
  const handleExportAndSend = async () => {
    if (!whatsappNumber) {
      alert('يرجى إدخال رقم الواتساب الموجه إليه الكشف');
      return;
    }

    setIsExporting(true);
    
    const element = document.getElementById('printable-report-content');
    const timestamp = new Date().getTime();
    const filename = `كشف_${selectedStat?.label}_مخيم_الكلية_${timestamp}.pdf`;
    
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();

      const message = `*مخيم الكلية للنازحين - كشف رسمي*\n\n*الموضوع:* كشف ${selectedStat?.label}\n*موجه إلى:* السادة / ${donorName || 'الجهة المانحة'}\n*عدد السجلات:* ${selectedStat?.list.length}\n*تاريخ الإصدار:* ${new Date().toLocaleDateString('ar-EG')}\n*رقم الكشف:* CM-${timestamp}\n\n_تم تصدير الكشف بصيغة PDF بنجاح وتحميله على الجهاز. يرجى إرفاق الملف للإرسال._`;
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      setTimeout(() => {
        window.open(url, '_blank');
      }, 500);
      
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("حدث خطأ أثناء محاولة تصدير الملف.");
    } finally {
      setIsExporting(false);
    }
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
          { label: 'أطفال (≤ سنة)', icon: 'fa-baby', count: filterByAge(1).length, color: 'bg-cyan-400', filter: (i: IDP) => calculateAge(i.birthDate) <= 1 },
          { label: 'أطفال (≤ سنتين)', icon: 'fa-baby-carriage', count: filterByAge(2).length, color: 'bg-cyan-500', filter: (i: IDP) => calculateAge(i.birthDate) <= 2 },
          { label: 'أطفال (≤ ٣ سنوات)', icon: 'fa-child-reaching', count: filterByAge(3).length, color: 'bg-teal-400', filter: (i: IDP) => calculateAge(i.birthDate) <= 3 },
          { label: 'أطفال (≤ ٥ سنوات)', icon: 'fa-child', count: filterByAge(5).length, color: 'bg-teal-500', filter: (i: IDP) => calculateAge(i.birthDate) <= 5 },
        ]
      }
    ];
  }, [idps]);

  const toggleCol = (col: keyof typeof visibleCols) => {
    setVisibleCols(prev => ({ ...prev, [col]: !prev[col] }));
  };

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-1000 text-right" dir="rtl">
      
      {/* Strategic AI Analysis */}
      <div className="glass p-6 md:p-10 rounded-[3.5rem] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-white/10 shadow-2xl relative overflow-hidden group no-print">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,var(--accent-glow),transparent)] opacity-30"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
           <div className={`w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-2xl border border-white/20 transition-all ${isAnalyzing ? 'animate-pulse rotate-12' : 'group-hover:rotate-12'}`}>
             <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-microchip'}`}></i>
           </div>
           <div className="flex-1 text-center md:text-right">
             <h3 className="text-2xl font-black text-main">التحليل الاستراتيجي (Gemini AI)</h3>
             <p className="text-[10px] text-second mt-1 font-black uppercase tracking-[0.3em]">توليد تقارير ذكية بناءً على البيانات اللحظية للمخيم</p>
           </div>
           <button 
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              className="bg-accent text-white px-10 py-4 rounded-[1.8rem] font-black text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-accent/40 disabled:opacity-50"
           >
             {isAnalyzing ? "جاري التحليل..." : "توليد التقرير الذكي"}
             <i className="fas fa-wand-magic-sparkles"></i>
           </button>
        </div>

        {isAnalyzing && (
          <div className="mt-8 flex flex-col items-center justify-center py-12 animate-in zoom-in-95">
             <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-xs font-black text-accent uppercase tracking-[0.2em]">يقوم الذكاء الاصطناعي بمعالجة البيانات الآن</p>
          </div>
        )}

        {aiReport && !isAnalyzing && (
          <div className="mt-8 bg-white/60 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/20 text-main shadow-inner animate-in slide-in-from-top-4 relative">
             <div className="absolute top-6 left-6 flex gap-2">
                <button 
                  onClick={handleCopy}
                  className="w-10 h-10 bg-white rounded-xl shadow-md border border-black/5 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-all"
                  title="نسخ التقرير"
                >
                  <i className={`fas ${copyStatus ? 'fa-check' : 'fa-copy'}`}></i>
                </button>
             </div>
             <div className="text-sm font-bold leading-[1.8] text-slate-900 whitespace-pre-wrap">
                {aiReport}
             </div>
          </div>
        )}
      </div>

      {/* Categorized Infographic Stats */}
      <div className="space-y-12 no-print">
        {categories.map((cat, idx) => (
          <div key={idx} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-accent rounded-full shadow-[0_0_15px_var(--accent-glow)]"></div>
              <h3 className="text-xl font-black text-main">{cat.title}</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md no-print" onClick={() => setSelectedStat(null)}></div>
          <div className="bg-white w-full max-w-6xl h-full md:h-[95vh] md:rounded-[3.5rem] overflow-hidden relative shadow-2xl flex flex-col animate-in zoom-in-95 print:h-auto print:static print:shadow-none print:rounded-none">
            
            {/* Modal Header (HIDDEN ON PRINT) */}
            <header className="p-6 md:p-8 border-b-4 border-slate-900 bg-slate-50 no-print overflow-y-auto no-scrollbar">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">{selectedStat.label}</h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">تجهيز الكشف الرسمي وتصديره كملف PDF</p>
                    </div>
                  </div>
                  
                  {/* Donor Input Box */}
                  <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-inner">
                    <label className="text-[10px] font-black text-indigo-500 mb-2 block mr-2 uppercase">مخاطبة الجهة المانحة</label>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-800 text-sm shrink-0">السادة /</span>
                      <input 
                        type="text" 
                        placeholder="اكتب اسم المؤسسة أو الجهة المانحة هنا..." 
                        className="flex-1 bg-slate-50 p-3 rounded-xl border border-black/5 outline-none focus:border-accent font-bold text-sm"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Column Toggles */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { id: 'name', label: 'الإسم رباعي' },
                      { id: 'idNumber', label: 'رقم الهوية' },
                      { id: 'birthDate', label: 'تاريخ الميلاد' },
                      { id: 'age', label: 'العُمر' },
                      { id: 'housingStatus', label: 'تفاصيل حالة السكن' },
                      { id: 'tents', label: 'خيم' },
                      { id: 'classrooms', label: 'صفوف' },
                      { id: 'familySize', label: 'عدد افراد الأسرة' },
                      { id: 'health', label: 'الحالة الصحية و التفاصيل' }
                    ].map((col) => (
                      <button 
                        key={col.id}
                        onClick={() => toggleCol(col.id as any)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all border ${
                          visibleCols[col.id as keyof typeof visibleCols] 
                          ? 'bg-indigo-700 text-white border-indigo-900 shadow-lg' 
                          : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </header>

            {/* THE ACTUAL REPORT CONTENT FOR PDF EXPORT */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-white print:p-0 no-scrollbar relative" id="printable-report-wrapper">
              
              <button 
                onClick={() => setSelectedStat(null)} 
                className="absolute top-6 left-6 w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-xl z-[160] no-print"
              >
                <i className="fas fa-times text-xl"></i>
              </button>

              <div className="max-w-5xl mx-auto space-y-12 bg-white" id="printable-report-content" dir="rtl">
                
                {/* MODERN PROFESSIONAL HEADER */}
                <div className="flex justify-between items-center border-b-[5px] border-slate-900 pb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                      <i className="fas fa-tent text-4xl"></i>
                    </div>
                    <div className="text-right">
                      <h1 className="text-3xl font-black text-slate-950 tracking-tight leading-none">مخيم الكلية للنازحين</h1>
                      <p className="text-[11px] font-black text-indigo-600 mt-2 uppercase tracking-[0.2em]">الإدارة الإلكترونية للمستفيدين</p>
                    </div>
                  </div>

                  <div className="text-left space-y-1">
                    <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 flex flex-col items-end gap-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">رقم الكشف المرجعي</p>
                       <p className="text-sm font-black text-slate-950 font-mono">CM-REP-{Date.now().toString().slice(-6)}</p>
                    </div>
                    <div className="flex gap-3 text-[10px] font-black text-slate-500 justify-end pt-1">
                       <span className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">تاريخ: {new Date().toLocaleDateString('ar-EG')}</span>
                       <span className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">وقت: {new Date().toLocaleTimeString('ar-EG')}</span>
                    </div>
                  </div>
                </div>

                {/* Salutation Block */}
                <div className="text-right py-6 space-y-3">
                   <h2 className="text-2xl font-black text-slate-950">السادة / {donorName || '...................................................'} الموقرين</h2>
                   <p className="text-lg font-bold text-slate-700 bg-slate-50 inline-block px-5 py-3 rounded-2xl border-r-[6px] border-indigo-600 shadow-sm">
                     الموضوع: كشف {selectedStat.label} - نسخة رسمية معتمدة
                   </p>
                </div>

                {/* Data Table with Professional Styling */}
                <div className="overflow-hidden border-2 border-slate-900 rounded-2xl shadow-sm">
                  <table className="w-full text-right text-[12px] border-collapse">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="py-4 px-4 font-black border-l border-slate-800">#</th>
                        {visibleCols.name && <th className="py-4 px-4 font-black border-l border-slate-800">الاسم الرباعي للمستفيد</th>}
                        {visibleCols.idNumber && <th className="py-4 px-4 font-black border-l border-slate-800 text-center">رقم الهوية</th>}
                        {visibleCols.age && <th className="py-4 px-4 font-black border-l border-slate-800 text-center">العمر</th>}
                        {visibleCols.housingStatus && <th className="py-4 px-4 font-black border-l border-slate-800">حالة السكن السابق</th>}
                        {(visibleCols.tents || visibleCols.classrooms) && <th className="py-4 px-4 font-black border-l border-slate-800 text-center">موقع السكن الحالي</th>}
                        {visibleCols.familySize && <th className="py-4 px-4 font-black border-l border-slate-800 text-center">أفراد الأسرة</th>}
                        {visibleCols.health && <th className="py-4 px-4 font-black">الحالة الصحية</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {selectedStat.list.map((idp, idx) => (
                        <tr key={idp.id} className="border-b border-slate-200 even:bg-slate-50/50">
                          <td className="py-4 px-4 font-bold text-slate-500 border-l border-slate-100">{idx + 1}</td>
                          {visibleCols.name && <td className="py-4 px-4 font-black text-slate-950">{idp.name}</td>}
                          {visibleCols.idNumber && <td className="py-4 px-4 font-bold text-center text-slate-900">{idp.idNumber}</td>}
                          {visibleCols.age && <td className="py-4 px-4 font-black text-center text-slate-950">{calculateAge(idp.birthDate)}</td>}
                          {visibleCols.housingStatus && <td className="py-4 px-4 text-slate-800 text-[11px] leading-tight">{idp.housingStatus} {idp.addressBefore}</td>}
                          {(visibleCols.tents || visibleCols.classrooms) && (
                            <td className="py-4 px-4 text-center font-black text-indigo-700">
                              {idp.shelterType === 'خيمة' && visibleCols.tents ? `خيمة ${idp.shelterNumber}` : ''}
                              {idp.shelterType === 'صف' && visibleCols.classrooms ? `صف ${idp.shelterNumber}` : ''}
                            </td>
                          )}
                          {visibleCols.familySize && <td className="py-4 px-4 font-black text-center text-slate-900">{idp.familySize}</td>}
                          {visibleCols.health && (
                            <td className="py-4 px-4">
                              <span className={`font-black block ${idp.healthStatus === 'مُعافى' ? 'text-slate-950' : 'text-rose-700'}`}>{idp.healthStatus}</span>
                              <span className="text-[10px] text-slate-500 font-bold">{idp.healthDetails || '-'}</span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-end mt-20 pt-10 border-t-2 border-slate-100">
                   <div className="text-right max-w-lg">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-3">Official Certification / إقرار إداري</p>
                      <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                        يُقر مخيم الكلية للنازحين بصحة هذه البيانات المستخرجة من سجلات النظام الرقمي المعتمد.
                        هذا الكشف صالح فقط للأغراض الموضحة في موضوعه، وأي كشط أو تعديل يدوي يُبطل العمل به.
                      </p>
                   </div>
                   
                   <div className="flex flex-col items-center gap-4 pl-10">
                      <p className="font-black text-slate-950 text-sm">ختم إدارة المخيم</p>
                      <div className="w-36 h-36 border-4 border-slate-100 rounded-full flex items-center justify-center opacity-10 rotate-12 relative shadow-inner">
                        <span className="font-black text-3xl text-slate-300 uppercase tracking-tighter">OFFICIAL SEAL</span>
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.02)_0%,transparent_70%)]"></div>
                      </div>
                   </div>
                </div>

                <div className="text-left text-[10px] text-slate-300 font-mono mt-12 pt-4 border-t border-slate-50 uppercase tracking-widest">
                  DOCUMENT AUTH: {selectedStat.label.toUpperCase()}-PDF-SECURED-CM
                </div>
              </div>
            </div>

            <footer className="p-6 md:p-8 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
               <div className="flex flex-col gap-1 text-right">
                  <p className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">تحميل الكشف بصيغة PDF</p>
                  <p className="text-[9px] text-slate-400 font-bold">سيتم إنشاء ملف PDF عالي الجودة وتحميله، ثم توجيهك للمشاركة عبر الواتساب</p>
               </div>
               
               <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                 {showWhatsappInput ? (
                   <div className="flex flex-1 md:flex-none items-center gap-2 animate-in slide-in-from-left-2">
                     <input 
                       type="tel" 
                       placeholder="رقم الواتساب (مثال: 970...)" 
                       className="bg-white/10 border border-white/10 rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-green-500 flex-1 md:w-56 font-bold"
                       value={whatsappNumber}
                       onChange={(e) => setWhatsappNumber(e.target.value)}
                     />
                     <button 
                       disabled={isExporting}
                       onClick={handleExportAndSend} 
                       className="bg-green-500 text-white px-8 py-4 rounded-xl text-xs font-black shadow-xl hover:bg-green-600 transition-all flex items-center gap-3 active:scale-95"
                     >
                       {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-arrow-down"></i>}
                       {isExporting ? "جاري التجهيز..." : "تصدير وتحميل PDF"}
                     </button>
                     <button onClick={() => setShowWhatsappInput(false)} className="text-white/40 hover:text-white px-2"><i className="fas fa-times"></i></button>
                   </div>
                 ) : (
                   <button onClick={() => setShowWhatsappInput(true)} className="flex-1 md:flex-none bg-green-600 text-white px-12 py-5 rounded-[2rem] text-sm font-black hover:bg-green-700 transition-all flex items-center justify-center gap-4 shadow-2xl group active:scale-95">
                     <i className="fas fa-file-pdf text-xl group-hover:translate-y-1 transition-transform"></i>
                     تحميل PDF وإرسال عبر WhatsApp
                   </button>
                 )}
               </div>
            </footer>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white !important; margin: 0 !important; }
          .no-print { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          #printable-report-wrapper { overflow: visible !important; height: auto !important; padding: 0 !important; }
          #printable-report-content { padding: 40px !important; margin: 0 auto !important; width: 100% !important; background: white !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid #000 !important; color: #000 !important; }
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Reports;
