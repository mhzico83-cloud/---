
import { GoogleGenAI } from "@google/genai";
import { IDP } from "../types";

export const generateSmartReport = async (idps: IDP[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    بصفتك خبيراً في العمل الإنساني، قم بتحليل البيانات التالية للنازحين وقدم تقريراً استراتيجياً موجزاً وأنيقاً باللغة العربية.
    البيانات: ${JSON.stringify(idps)}
    المطلوب:
    1. ملخص للوضع الحالي.
    2. قائمة بالاحتياجات الأكثر إلحاحاً.
    3. توصيات لتحسين عملية توزيع المساعدات.
    اجعل التقرير منظماً باستخدام نقاط واضحة.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "عذراً، حدث خطأ أثناء إنشاء التقرير الذكي. يرجى المحاولة لاحقاً.";
  }
};
