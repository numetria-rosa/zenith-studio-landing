import type { Language } from "./types";

/* Replies that go out without the model: a handoff holding message, and the answers to a passport or card
   number, an image or document, a voice note, and STOP / START. Five languages, per CLAUDE.md section 1.
   The Arabic, Turkish, Urdu and French wording has not been reviewed by a native speaker yet. */

export const HOLDING_MESSAGES: Record<Language, string> = {
  en: "Thanks for your message. Someone from our team will get back to you shortly.",
  ar: "شكرًا لرسالتك. سيتواصل معك أحد أفراد فريقنا قريبًا.",
  tr: "Mesajınız için teşekkürler. Ekibimizden biri kısa süre içinde size dönecek.",
  ur: "آپ کے پیغام کا شکریہ۔ ہماری ٹیم کا کوئی رکن جلد آپ سے رابطہ کرے گا۔",
  fr: "Merci pour votre message. Un membre de notre équipe vous répondra très prochainement.",
};

/** Added to the holding message when the chat is handed off only because the answer isn't in the knowledge base
    (not a complaint or a request for a person), so the customer's wait gives the team their dates and party size. */
export const HOLDING_FOLLOW_UPS: Record<Language, string> = {
  en: "In the meantime, which dates are you thinking of, and how many people will be travelling?",
  ar: "في هذه الأثناء، ما هي التواريخ التي تفكر فيها وكم عدد المسافرين؟",
  tr: "Bu arada, hangi tarihleri düşünüyorsunuz ve kaç kişi seyahat edecek?",
  ur: "اس دوران، آپ کون سی تاریخیں سوچ رہے ہیں اور کتنے لوگ سفر کریں گے؟",
  fr: "En attendant, quelles dates envisagez-vous et combien de personnes voyageront ?",
};

export const SENSITIVE_DATA_REPLIES: Record<Language, string> = {
  en: "For your security, please don't send documents or card details here. Our team will collect anything needed securely.",
  ar: "لأمانك، يرجى عدم إرسال المستندات أو تفاصيل البطاقة هنا. سيقوم فريقنا بجمع أي شيء مطلوب بشكل آمن.",
  tr: "Güvenliğiniz için lütfen buraya belge veya kart bilgisi göndermeyin. Ekibimiz gerekenleri güvenli şekilde toplayacaktır.",
  ur: "آپ کی حفاظت کے لیے، براہ کرم دستاویزات یا کارڈ کی تفصیلات یہاں نہ بھیجیں۔ ہماری ٹیم محفوظ طریقے سے ضرورت کی چیزیں جمع کرے گی۔",
  fr: "Pour votre sécurité, merci de ne pas envoyer de documents ni de coordonnées bancaires ici. Notre équipe recueillera de manière sécurisée tout ce qui est nécessaire.",
};

export const VOICE_NOTE_REPLIES: Record<Language, string> = {
  en: "Thanks for your voice message. I can only read text messages, so a member of our team will listen to it and reply to you shortly.",
  ar: "شكرًا لرسالتك الصوتية. يمكنني قراءة الرسائل النصية فقط، لذا سيستمع أحد أفراد فريقنا إليها ويرد عليك قريبًا.",
  tr: "Sesli mesajınız için teşekkürler. Yalnızca yazılı mesajları okuyabiliyorum; ekibimizden biri dinleyip kısa süre içinde size dönecek.",
  ur: "آپ کے صوتی پیغام کا شکریہ۔ میں صرف تحریری پیغامات پڑھ سکتا ہوں، اس لیے ہماری ٹیم کا کوئی رکن اسے سن کر جلد آپ کو جواب دے گا۔",
  fr: "Merci pour votre message vocal. Je ne peux lire que les messages écrits ; un membre de notre équipe l'écoutera et vous répondra très prochainement.",
};

export const OPT_OUT_REPLIES: Record<Language, string> = {
  en: "You've been unsubscribed and won't receive further messages from this assistant. Send START if you change your mind.",
  ar: "تم إلغاء اشتراكك ولن تصلك رسائل أخرى من هذا المساعد. أرسل START إذا غيّرت رأيك.",
  tr: "Aboneliğiniz iptal edildi, bu asistandan artık mesaj almayacaksınız. Fikrinizi değiştirirseniz START yazın.",
  ur: "آپ کی رکنیت ختم کر دی گئی ہے اور آپ کو اس اسسٹنٹ کی طرف سے مزید پیغامات نہیں ملیں گے۔ اگر آپ کا ارادہ بدل جائے تو START بھیجیں۔",
  fr: "Vous êtes désabonné(e) et ne recevrez plus de messages de cet assistant. Envoyez START si vous changez d'avis.",
};

export const OPT_IN_REPLIES: Record<Language, string> = {
  en: "Welcome back. You'll receive replies from this assistant again. How can we help?",
  ar: "مرحبًا بعودتك. ستتلقى ردودًا من هذا المساعد مرة أخرى. كيف يمكننا مساعدتك؟",
  tr: "Tekrar hoş geldiniz. Bu asistandan yeniden yanıt alacaksınız. Size nasıl yardımcı olabiliriz?",
  ur: "خوش آمدید۔ آپ کو اس اسسٹنٹ کی طرف سے دوبارہ جوابات ملیں گے۔ ہم آپ کی کیا مدد کر سکتے ہیں؟",
  fr: "Bon retour parmi nous. Vous recevrez de nouveau les réponses de cet assistant. Comment pouvons-nous vous aider ?",
};

/** Turned down politely, in the customer's language, and the chat stays with the agent (Meta bans open-ended
    assistants on the platform, CLAUDE.md section 2, so this is a refusal, not a handoff). */
export const OFF_TOPIC_REPLIES: Record<Language, string> = {
  en: "I can only help with our Umrah and Hajj packages and your booking. Is there anything about your trip I can help with?",
  ar: "يمكنني المساعدة فقط في باقات العمرة والحج الخاصة بنا وحجزك. هل هناك شيء يخص رحلتك يمكنني مساعدتك به؟",
  tr: "Yalnızca Umre ve Hac paketlerimiz ve rezervasyonunuzla ilgili yardımcı olabilirim. Yolculuğunuzla ilgili yardımcı olabileceğim bir şey var mı?",
  ur: "میں صرف ہمارے عمرہ اور حج کے پیکجز اور آپ کی بکنگ میں مدد کر سکتا ہوں۔ کیا آپ کے سفر کے بارے میں کوئی ایسی بات ہے جس میں میں مدد کر سکوں؟",
  fr: "Je peux seulement vous aider pour nos forfaits Omra et Hajj et votre réservation. Y a-t-il quelque chose concernant votre voyage pour lequel je peux vous aider ?",
};

/** "Are you a real person or a bot?" Never claims to be human (CLAUDE.md 3.1), and offers a person. */
export function identityReply(language: Language, agentName: string, agencyName: string): string {
  const text: Record<Language, string> = {
    en: `I'm ${agentName}, ${agencyName}'s virtual assistant. I can answer questions about our packages, and a member of our team can step in whenever you'd like.`,
    ar: `أنا ${agentName}، المساعد الافتراضي لـ ${agencyName}. يمكنني الإجابة عن أسئلتك حول باقاتنا، ويمكن لأحد أفراد فريقنا التدخل متى أردت.`,
    tr: `Ben ${agentName}, ${agencyName} sanal asistanıyım. Paketlerimizle ilgili sorularınızı yanıtlayabilirim; dilerseniz ekibimizden biri de devreye girebilir.`,
    ur: `میں ${agentName} ہوں، ${agencyName} کا ورچوئل اسسٹنٹ۔ میں ہمارے پیکجز کے بارے میں آپ کے سوالات کے جواب دے سکتا ہوں، اور آپ چاہیں تو ہماری ٹیم کا کوئی رکن بھی بات کر سکتا ہے۔`,
    fr: `Je suis ${agentName}, l'assistant virtuel de ${agencyName}. Je peux répondre à vos questions sur nos forfaits, et un membre de notre équipe peut prendre le relais dès que vous le souhaitez.`,
  };
  return text[language];
}
