import type { Language } from "./types";

/* Replies that go out without the model: a handoff holding message, and the answers to a passport or card
   number, an image or document, a voice note, and STOP / START. Four languages, per CLAUDE.md section 1.
   The Arabic, Turkish and Urdu wording has not been reviewed by a native speaker yet. */

export const HOLDING_MESSAGES: Record<Language, string> = {
  en: "Thanks for your message. Someone from our team will get back to you shortly.",
  ar: "شكرًا لرسالتك. سيتواصل معك أحد أفراد فريقنا قريبًا.",
  tr: "Mesajınız için teşekkürler. Ekibimizden biri kısa süre içinde size dönecek.",
  ur: "آپ کے پیغام کا شکریہ۔ ہماری ٹیم کا کوئی رکن جلد آپ سے رابطہ کرے گا۔",
};

export const SENSITIVE_DATA_REPLIES: Record<Language, string> = {
  en: "For your security, please don't send documents or card details here. Our team will collect anything needed securely.",
  ar: "لأمانك، يرجى عدم إرسال المستندات أو تفاصيل البطاقة هنا. سيقوم فريقنا بجمع أي شيء مطلوب بشكل آمن.",
  tr: "Güvenliğiniz için lütfen buraya belge veya kart bilgisi göndermeyin. Ekibimiz gerekenleri güvenli şekilde toplayacaktır.",
  ur: "آپ کی حفاظت کے لیے، براہ کرم دستاویزات یا کارڈ کی تفصیلات یہاں نہ بھیجیں۔ ہماری ٹیم محفوظ طریقے سے ضرورت کی چیزیں جمع کرے گی۔",
};

export const VOICE_NOTE_REPLIES: Record<Language, string> = {
  en: "Thanks for your voice message. I can only read text messages, so a member of our team will listen to it and reply to you shortly.",
  ar: "شكرًا لرسالتك الصوتية. يمكنني قراءة الرسائل النصية فقط، لذا سيستمع أحد أفراد فريقنا إليها ويرد عليك قريبًا.",
  tr: "Sesli mesajınız için teşekkürler. Yalnızca yazılı mesajları okuyabiliyorum; ekibimizden biri dinleyip kısa süre içinde size dönecek.",
  ur: "آپ کے صوتی پیغام کا شکریہ۔ میں صرف تحریری پیغامات پڑھ سکتا ہوں، اس لیے ہماری ٹیم کا کوئی رکن اسے سن کر جلد آپ کو جواب دے گا۔",
};

export const OPT_OUT_REPLIES: Record<Language, string> = {
  en: "You've been unsubscribed and won't receive further messages from this assistant. Send START if you change your mind.",
  ar: "تم إلغاء اشتراكك ولن تصلك رسائل أخرى من هذا المساعد. أرسل START إذا غيّرت رأيك.",
  tr: "Aboneliğiniz iptal edildi, bu asistandan artık mesaj almayacaksınız. Fikrinizi değiştirirseniz START yazın.",
  ur: "آپ کی رکنیت ختم کر دی گئی ہے اور آپ کو اس اسسٹنٹ کی طرف سے مزید پیغامات نہیں ملیں گے۔ اگر آپ کا ارادہ بدل جائے تو START بھیجیں۔",
};

export const OPT_IN_REPLIES: Record<Language, string> = {
  en: "Welcome back. You'll receive replies from this assistant again. How can we help?",
  ar: "مرحبًا بعودتك. ستتلقى ردودًا من هذا المساعد مرة أخرى. كيف يمكننا مساعدتك؟",
  tr: "Tekrar hoş geldiniz. Bu asistandan yeniden yanıt alacaksınız. Size nasıl yardımcı olabiliriz?",
  ur: "خوش آمدید۔ آپ کو اس اسسٹنٹ کی طرف سے دوبارہ جوابات ملیں گے۔ ہم آپ کی کیا مدد کر سکتے ہیں؟",
};
