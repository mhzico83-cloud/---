
import React, { useState } from 'react';
import { AID_TYPES } from '../constants';
import { IDP } from '../types';

interface AidServicesProps {
  idps: IDP[];
  onDistribute: (recipients: IDP[], aidLabel: string, location: string) => void;
}

const AidServices: React.FC<AidServicesProps> = ({ idps, onDistribute }) => {
  const [selectedAid, setSelectedAid] = useState(AID_TYPES[0].id);
  const [selectedIDP, setSelectedIDP] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewList, setPreviewList] = useState<IDP[]>([]);
  
  const [visibleColumns, setVisibleColumns] = useState({
    idNumber: true,
    phone: true,
    age: true,
    birthDate: true,
    wallet: true,
    familySize: true
  });

  const [formData, setFormData] = useState({
    details: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    donor: '',
    ageRanges: {
      male: { from: '0', to: '120' },
      female: { from: '0', to: '120' },
      elderly: { from: '60', to: '120' }
    }
  });

  const beneficiaryGroups = [
    { id: 'classrooms', label: 'نازحين صفوف' },
    { id: 'tents', label: 'نازحين خيم' },
    { id: 'khariji', label: 'نازحين خارجيين' },
    { id: 'admins', label: 'الإداريين' },
    { id: 'pregnant', label: 'حامل' },
    { id: 'nursing', label: 'مرضعة' },
    { id: 'wives', label: 'زوجات' },
    { id: 'divorced', label: 'مطلقة' },
    { id: 'widow', label: 'أرملة' },
    { id: 'martyr_wife', label: 'زوجة شهيد' },
    { id: 'prisoner_wife', label: 'زوجة أسير' },
    { id: 'abandoned', label: 'مهجورة' },
    { id: 'single_over_30', label: 'عزباء فوق ٣٠ سنة' },
    { id: 'child_1', label: 'أطفال سنة فأقل' },
    { id: 'child_2', label: 'أطفال سنتين فأقل' },
    { id: 'child_3', label: 'أطفال ٣ سنوات فأقل' },
    { id: 'child_5', label: 'أطفال ٥ سنوات فأقل' },
    { id: 'males_age', label: 'ذكور (عُمر محدد)' },
    { id: 'females_age', label: 'إناث (عُمر محدد)' },
    { id: 'elderly_age', label: 'كبار السن (عُمر محدد)' },
  ];

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const toggleBeneficiary = (id: string) => {
    setSelectedBeneficiaries(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const generatePreview = () => {
    let filtered = idps.filter(idp => {
      if (selectedIDP && idp.id === selectedIDP) return true;
      if (selectedBeneficiaries.length === 0) return false;

      return selectedBeneficiaries.some(groupId => {
        const age = calculateAge(idp.birthDate);
        switch (groupId) {
          case 'classrooms': return idp.shelterType === 'صف';
          case 'tents': return idp.shelterType === 'خيمة';
          case 'khariji': return idp.role === 'khariji';
          case 'admins': return idp.role === 'idari';
          case 'pregnant': return idp.maritalStatus === 'حامل' || idp.familyMembers.some(m => m.relation === 'زوجة' && m.isPregnant);
          case 'nursing': return idp.maritalStatus === 'مرضعة' || idp.familyMembers.some(m => m.relation === 'زوجة' && m.isNursing);
          case 'wives': return idp.gender === 'أُنثى' && (idp.maritalStatus === 'متزوجة' || idp.maritalStatus === 'متزوج');
          case 'divorced': return idp.maritalStatus === 'مطلقة';
          case 'widow': return idp.maritalStatus === 'أرملة';
          case 'martyr_wife': return idp.maritalStatus === 'زوجة شهيد';
          case 'prisoner_wife': return idp.maritalStatus === 'زوجة أسير';
          case 'abandoned': return idp.maritalStatus === 'مهجورة';
          case 'single_over_30': return idp.maritalStatus === 'عزباء' && age > 30;
          case 'child_1': return age <= 1 || idp.familyMembers.some(m => calculateAge(m.birthDate) <= 1);
          case 'child_2': return age <= 2 || idp.familyMembers.some(m => calculateAge(m.birthDate) <= 2);
          case 'child_3': return age <= 3 || idp.familyMembers.some(m => calculateAge(m.birthDate) <= 3);
          case 'child_5': return age <= 5 || idp.familyMembers.some(m => calculateAge(m.birthDate) <= 5);
          case 'males_age': 
            return idp.gender === 'ذكر' && age >= Number(formData.ageRanges.male.from) && age <= Number(formData.ageRanges.male.to);
          case 'females_age': 
            return idp.gender === 'أُنثى' && age >= Number(formData.ageRanges.female.from) && age <= Number(formData.ageRanges.female.to);
          case 'elderly_age': 
            return age >= Number(formData.ageRanges.elderly.from) && age <= Number(formData.ageRanges.elderly.to);
          default: return false;
        }
      });
    });

    setPreviewList(filtered);
    setShowPreview(true);
  };

  const removeFromPreview = (id: string) => {
    setPreviewList(prev => prev.filter(p => p.id !== id));
  };

  const handleFinalDistribute = () => {
    const aidLabel = AID_TYPES.find(a => a.id === selectedAid)?.label || 'مساعدة عامة';
    onDistribute(previewList, aidLabel, formData.location);
    setSuccess(true);
    setShowPreview(false);
    setSelectedBeneficiaries([]);
    setPreviewList([]);
    setTimeout(() => setSuccess(false), 5000);
  };

  const printReport = () => {
    window.print();
  };

  const totalPopulation = idps.length;
  const recipientCount = previewList.length;
  const percentage = totalPopulation > 0 ? ((recipientCount / totalPopulation) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20 md:pb-0 text-right" dir="rtl">
      <div className="lg:col-span-2 space-y-8">
        <div className="glass p-8 rounded-[2.5rem]">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3 no-print text-white">
            <i className="fas fa-hand-holding-heart text-purple-500"></i>
            توزيع مساعدات إنسانية
          </h2>
          
          {!showPreview ? (
            <div className="space-y-8 animate-in fade-in duration-300 no-print">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {AID_TYPES.map(aid => (
                  <button
                    type="button"
                    key={aid.id}
                    onClick={() => setSelectedAid(aid.id)}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 group ${
                      selectedAid === aid.id 
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <i className={`fas ${aid.icon} text-2xl group-hover:scale-110 transition-transform`}></i>
                    <span className="text-[10px] font-bold text-center leading-tight">{aid.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-6 pt-4 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 pr-2">مكان توزيع الطرد</label>
                    <input 
                      type="text" 
                      placeholder="مثلاً: الساحة المركزية"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-purple-500 outline-none text-white"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 pr-2">تاريخ توزيع الطرد</label>
                    <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-purple-500 outline-none text-right text-white"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 pr-2">الجهة المانحة</label>
                    <input 
                      type="text" 
                      placeholder="اسم المؤسسة أو المتبرع"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-purple-500 outline-none text-white"
                      value={formData.donor}
                      onChange={e => setFormData({...formData, donor: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 pr-2">تفاصيل إضافية للطرد</label>
                    <input 
                      type="text" 
                      placeholder="أي ملاحظات تخص المحتوى"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-purple-500 outline-none text-white"
                      value={formData.details}
                      onChange={e => setFormData({...formData, details: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-sm font-bold text-purple-400">الفئات المستهدفة (يمكن اختيار أكثر من فئة)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {beneficiaryGroups.map(group => (
                      <div key={group.id} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleBeneficiary(group.id)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl border transition-all text-right ${
                            selectedBeneficiaries.includes(group.id)
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-[10px] font-bold">{group.label}</span>
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            selectedBeneficiaries.includes(group.id) ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                          }`}>
                            {selectedBeneficiaries.includes(group.id) && <i className="fas fa-check text-[7px] text-white"></i>}
                          </div>
                        </button>

                        {(group.id === 'males_age' || group.id === 'females_age' || group.id === 'elderly_age') && selectedBeneficiaries.includes(group.id) && (
                          <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200 px-1 pb-2">
                            <input 
                              type="number" 
                              placeholder="من" 
                              className="w-1/2 bg-white/10 border border-white/10 rounded-lg py-1 px-1.5 text-[9px] text-center text-white"
                              onChange={e => {
                                const key = group.id.split('_')[0] as 'male' | 'female' | 'elderly';
                                setFormData({...formData, ageRanges: {...formData.ageRanges, [key]: {...formData.ageRanges[key as 'male' | 'female' | 'elderly'], from: e.target.value}}});
                              }}
                            />
                            <input 
                              type="number" 
                              placeholder="إلى" 
                              className="w-1/2 bg-white/10 border border-white/10 rounded-lg py-1 px-1.5 text-[9px] text-center text-white"
                              onChange={e => {
                                const key = group.id.split('_')[0] as 'male' | 'female' | 'elderly';
                                setFormData({...formData, ageRanges: {...formData.ageRanges, [key]: {...formData.ageRanges[key as 'male' | 'female' | 'elderly'], to: e.target.value}}});
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <label className="block text-xs font-bold text-gray-400 mb-3 pr-2">توزيع فردي لاسم محدد (اختياري)</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500 transition-colors appearance-none cursor-pointer text-white"
                    value={selectedIDP}
                    onChange={e => setSelectedIDP(e.target.value)}
                  >
                    <option value="" className="bg-slate-900">اختر اسماً لإضافته يدوياً...</option>
                    {idps.map(i => (
                      <option key={i.id} value={i.id} className="bg-slate-900">
                        {i.name} - ({i.idNumber}) - [{i.role === 'khariji' ? 'خارجي' : i.role === 'idari' ? 'إداري' : 'نازح'}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={generatePreview}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-5 rounded-3xl font-bold hover:brightness-110 transition-all shadow-xl shadow-purple-900/20 flex items-center justify-center gap-3 btn-glow text-white"
              >
                <span>إنشاء كشف المستحقين للمعاينة</span>
                <i className="fas fa-file-invoice"></i>
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-400" id="report-view">
              <div className="no-print flex flex-col md:flex-row justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 gap-4">
                <button onClick={() => setShowPreview(false)} className="text-sm text-gray-400 hover:text-white flex items-center gap-2">
                  <i className="fas fa-chevron-right"></i> تعديل الشروط
                </button>
                <div className="flex flex-wrap items-center gap-3 justify-center">
                  <span className="text-[10px] text-gray-500 font-bold">تعديل عرض الكشف:</span>
                  {(Object.keys(visibleColumns) as Array<keyof typeof visibleColumns>).map((col) => (
                    <button 
                      key={col}
                      onClick={() => setVisibleColumns(prev => ({...prev, [col]: !prev[col]}))}
                      className={`text-[9px] px-2 py-1 rounded-md border transition-all ${visibleColumns[col] ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-gray-600'}`}
                    >
                      {col === 'idNumber' ? 'الهوية' : col === 'phone' ? 'الجوال' : col === 'age' ? 'العمر' : col === 'birthDate' ? 'الميلاد' : col === 'wallet' ? 'المحفظة' : 'عدد الأسرة'}
                    </button>
                  ))}
                </div>
                <button onClick={printReport} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-white">
                  <i className="fas fa-print"></i> طباعة الكشف
                </button>
              </div>

              <div className="bg-white text-slate-900 rounded-[2.5rem] p-10 shadow-2xl printable-area border-[12px] border-slate-100 relative overflow-hidden text-right" dir="rtl">
                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
                  <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900">مخيم الكلية</h1>
                    <p className="text-sm font-bold text-slate-500">نظام الإدارة الإلكترونية المتكامل للنازحين</p>
                    <div className="flex gap-4 pt-4 text-[12px] font-bold">
                       <span className="bg-slate-100 px-3 py-1 rounded">اليوم: {new Intl.DateTimeFormat('ar-EG', {weekday: 'long'}).format(new Date(formData.date))}</span>
                       <span className="bg-slate-100 px-3 py-1 rounded">التاريخ: {formData.date}</span>
                    </div>
                  </div>
                  <div className="text-left space-y-2" dir="ltr">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Formal Aid Distribution List</p>
                    <p className="text-xl font-black text-right" dir="rtl">الجهة المانحة: <span className="text-indigo-700">{formData.donor || 'مؤسسة إنسانية'}</span></p>
                    <p className="text-sm font-bold text-slate-600 text-right" dir="rtl">نوع المساعدة: {AID_TYPES.find(a => a.id === selectedAid)?.label}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">إجمالي سكان المخيم</p>
                    <p className="text-3xl font-black">{totalPopulation}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">المستفيدين بهذا الكشف</p>
                    <p className="text-3xl font-black">{recipientCount}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">نسبة التغطية السكانية</p>
                    <p className="text-3xl font-black text-indigo-600">%{percentage}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">مكان الاستلام</p>
                    <p className="text-lg font-bold text-slate-700 truncate">{formData.location || 'الساحة المركزية'}</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                  <table className="w-full text-right text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="py-4 px-4 font-black border-l border-slate-800">#</th>
                        <th className="py-4 px-4 font-black border-l border-slate-800">الإسم الكامل للمستفيد</th>
                        <th className="py-4 px-4 font-black border-l border-slate-800">التصنيف</th>
                        {visibleColumns.idNumber && <th className="py-4 px-4 font-black border-l border-slate-800">رقم الهوية</th>}
                        {visibleColumns.phone && <th className="py-4 px-4 font-black border-l border-slate-800">رقم الجوال</th>}
                        {visibleColumns.age && <th className="py-4 px-4 font-black border-l border-slate-800">العمر</th>}
                        {visibleColumns.birthDate && <th className="py-4 px-4 font-black border-l border-slate-800">تاريخ الميلاد</th>}
                        {visibleColumns.wallet && <th className="py-4 px-4 font-black border-l border-slate-800">رقم المحفظة</th>}
                        {visibleColumns.familySize && <th className="py-4 px-4 font-black border-l border-slate-800">عدد الأسرة</th>}
                        <th className="py-4 px-4 font-black no-print">استبعاد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewList.length > 0 ? (
                        previewList.map((idp, idx) => (
                          <tr key={idp.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-300">{idx + 1}</td>
                            <td className="py-3.5 px-4 font-black text-slate-800">{idp.name}</td>
                            <td className="py-3.5 px-4">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${idp.role === 'khariji' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : idp.role === 'idari' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                {idp.role === 'khariji' ? 'خارجي' : idp.role === 'idari' ? 'إداري' : 'نازح'}
                              </span>
                            </td>
                            {visibleColumns.idNumber && <td className="py-3.5 px-4 font-mono">{idp.idNumber}</td>}
                            {visibleColumns.phone && <td className="py-3.5 px-4">{idp.phone || '-'}</td>}
                            {visibleColumns.age && <td className="py-3.5 px-4 font-bold">{calculateAge(idp.birthDate)}</td>}
                            {visibleColumns.birthDate && <td className="py-3.5 px-4">{idp.birthDate}</td>}
                            {visibleColumns.wallet && <td className="py-3.5 px-4 font-mono text-[11px]">{idp.walletNumber || '-'}</td>}
                            {visibleColumns.familySize && <td className="py-3.5 px-4 font-black text-indigo-600">{idp.familySize}</td>}
                            <td className="py-3.5 px-4 no-print">
                              <button 
                                onClick={() => removeFromPreview(idp.id)}
                                className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100"
                                title="حذف من الكشف الحالي"
                              >
                                <i className="fas fa-asterisk text-[10px]"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="py-20 text-center text-slate-300 italic text-lg">لم يتم العثور على مستفيدين ضمن هذه الشروط</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-12 pt-10 border-t-4 border-slate-100 flex justify-between items-end">
                  <div className="space-y-6 flex-1 text-right">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Additional Notes / ملاحظات إضافية</p>
                      <p className="text-sm font-bold text-slate-600 max-w-lg leading-relaxed">{formData.details || 'تم إنشاء هذا الكشف بناءً على معايير الاستحقاق المعتمدة من إدارة المخيم والجهة المانحة.'}</p>
                    </div>
                    <div className="flex gap-10 justify-end">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Timestamp</p>
                        <p className="text-xs">{new Date().toLocaleString('ar-EG')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Report ID</p>
                        <p className="text-xs font-mono">REP-{Date.now().toString().slice(-8)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center space-y-16 px-10 shrink-0">
                    <div className="space-y-1">
                      <p className="text-lg font-black text-slate-900">إدارة مخيم الكلية</p>
                      <div className="w-48 h-[2px] bg-slate-900 mx-auto"></div>
                      <p className="text-[10px] text-slate-500 font-bold">التوقيع والختم الرسمي</p>
                    </div>
                    <div className="relative w-36 h-36 border-4 border-slate-50 rounded-full flex items-center justify-center opacity-10 rotate-12 mx-auto">
                      <span className="font-black text-4xl">SEAL</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="no-print pt-6 flex flex-col md:flex-row gap-4">
                <button 
                  onClick={handleFinalDistribute}
                  disabled={previewList.length === 0}
                  className="flex-[2] bg-indigo-600 text-white font-bold py-5 rounded-3xl shadow-2xl shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                >
                  <i className="fas fa-paper-plane group-hover:translate-x-1 transition-transform"></i>
                  تأكيد الكشف وإرسال إشعارات الاستلام لـ ({previewList.length}) مستفيد
                </button>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="flex-1 bg-white/5 text-gray-400 py-5 rounded-3xl border border-white/10 hover:bg-white/10"
                >
                  إلغاء التوزيع
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-8 p-8 bg-green-500/10 border border-green-500/30 text-green-400 rounded-[3rem] flex items-center gap-6 animate-in fade-in slide-in-from-top-6 duration-500">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 shadow-2xl shadow-green-500/30 animate-bounce">
                <i className="fas fa-check-double text-2xl"></i>
              </div>
              <div className="space-y-1 text-right">
                <p className="font-bold text-2xl">تم الاعتماد النهائي بنجاح!</p>
                <p className="text-sm opacity-90 leading-relaxed">
                  تم إشعار جميع المستفيدين المدرجين بالكشف برسالة نصية فورية: 
                  <span className="text-white font-black block mt-1 underline">
                    "توجه للمكان المحدد في قسم توزيع المساعدات الفورية و بالوقت المحدد و نوعية المساعدة مع ضرورة إحضار الهوية الشخصية"
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 no-print">
        <div className="glass p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-900/40 via-transparent to-transparent border-indigo-500/20">
          <h3 className="font-bold text-lg mb-8 flex items-center gap-2 text-white">
            <i className="fas fa-chart-line text-indigo-400"></i>
            إحصائيات المخزون الحالية
          </h3>
          <div className="space-y-4">
            {[
              { label: 'سلال غذائية', value: '450', icon: 'fa-box', color: 'text-orange-400' },
              { label: 'أطقم ملابس', value: '312', icon: 'fa-shirt', color: 'text-blue-400' },
              { label: 'حقائب صحية', value: '128', icon: 'fa-hand-holding-medical', color: 'text-red-400' },
              { label: 'وجبات ساخنة', value: '850', icon: 'fa-utensils', color: 'text-green-400' },
              { label: 'حليب أطفال', value: '205', icon: 'fa-baby-bottle', color: 'text-purple-400' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${item.color}`}>
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <span className="text-gray-300 text-sm">{item.label}</span>
                </div>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-view, #report-view * { visibility: visible !important; }
          #report-view { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .printable-area { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default AidServices;
