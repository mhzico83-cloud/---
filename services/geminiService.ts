
import { GoogleGenAI } from "@google/genai";
import { IDP } from "../types";

export const generateSmartReport = async (idps: IDP[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    أنت خبير في إدارة المخيمات والعمل الإنساني. قم بتحليل بيانات النازحين التالية لمخيم الكلية وقدم تقريراً استراتيجياً باللغة العربية.
    
    البيانات المتاحة: ${JSON.stringify(idps.map(i => ({
      name: i.name,
      status: i.status,
      familySize: i.familySize,
      health: i.healthStatus,
      housing: i.housingStatus,
      shelter: i.shelterType
    })))}
    
    يجب أن يتضمن التقرير الأقسام التالية بتنسيق Markdown احترافي:
    1. **الوضع الراهن**: ملخص إحصائي سريع.
    2. **تحليل الفئات الأكثر احتياجاً**: تحديد الحالات الطبية والطارئة.
    3. **توصيات لوجستية**: كيف يمكن توزيع المساعدات بشكل أذكى؟
    4. **رؤية مستقبلية**: مقترحات لتحسين ظروف السكن (خيم/صفوف).
    
    اجعل التقرير ملهماً، عملياً، ومكتوباً بلهجة رسمية واثقة.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "عذراً، حدث خطأ أثناء الاتصال بنظام الذكاء الاصطناعي. يرجى المحاولة لاحقاً.";
  }
};
