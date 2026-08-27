import { GoogleGenAI, Type } from '@google/genai';
import { AiChatMessage, SuspiciousMessageAnalysis, RiskLevel, AudioTranscriptionResult, IssueCategory } from '../types';

let genAIClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return genAIClient;
}

const SYSTEM_INSTRUCTION = `
You are the SafeCart AI Cybercrime & E-Commerce Fraud Defense Specialist (SafeCart AI ஆலோசகர்).
You are an expert in protecting Indian online shoppers and social media users against:
1. Instagram DM to WhatsApp redirection traps (forcing users to pay via advance UPI/QR code then blocking them).
2. Fake courier tracking slips (DTDC/Delhivery bogus screenshots demanding "customs clearance / holding charges").
3. Fake online e-commerce websites with 90% discount lures, non-delivery, and payment credential harvesting.
4. Part-time job / task-based Telegram scams, lottery traps, and investment frauds.
5. Immediate emergency recourse when a user loses money (calling National Cyber Crime Helpline 1930 within the golden hour, filing a grievance on cybercrime.gov.in, raising a UPI chargeback via NPCI & bank app).

Language & Communication style:
- You seamlessly understand and answer in English, Tamil (தமிழ்), and Tanglish (Tamil written in English script like "bro indha link scam aa?").
- If the user asks in Tamil or Tanglish, answer warmly with clear Tamil/Tanglish guidance alongside key safety terms in English.
- Always provide clear, direct, actionable advice without fluff.
- Highlight whether something is SAFE, SUSPICIOUS, or DANGEROUS/SCAM.
- Include practical emergency steps (e.g. Call 1930, block UPI handle, report to bank).
`;

/**
 * Handle AI conversational chat
 */
export async function askAiFraudAssistant(
  prompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{
  reply: string;
  verdict: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | 'INFO';
  riskScore: number;
  threatCategory: string;
  recommendedSteps: string[];
  suggestedFollowUps: string[];
}> {
  const client = getGeminiClient();

  if (client) {
    try {
      // Build conversation contents
      const conversationContents: any[] = [];
      for (const h of history.slice(-6)) {
        conversationContents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        });
      }

      conversationContents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const response = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: conversationContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7
        }
      });

      const reply = response.text || 'Unable to generate response. Please try again.';

      // Determine verdict heuristic from generated text & prompt
      const lower = (prompt + ' ' + reply).toLowerCase();
      let verdict: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | 'INFO' = 'INFO';
      let riskScore = 20;
      let threatCategory = 'General Cyber Safety';

      if (
        lower.includes('100% scam') ||
        lower.includes('scam') ||
        lower.includes('fraud') ||
        lower.includes('fake') ||
        lower.includes('blocked') ||
        lower.includes('மோசடி') ||
        lower.includes('ஏமாத்து')
      ) {
        verdict = 'DANGEROUS';
        riskScore = 90;
        threatCategory = 'Confirmed / High Risk Fraud';
      } else if (
        lower.includes('suspicious') ||
        lower.includes('caution') ||
        lower.includes('warning') ||
        lower.includes('advance') ||
        lower.includes('எச்சரிக்கை')
      ) {
        verdict = 'SUSPICIOUS';
        riskScore = 65;
        threatCategory = 'Suspicious Off-Platform Trap';
      } else if (lower.includes('safe') || lower.includes('genuine') || lower.includes('verified')) {
        verdict = 'SAFE';
        riskScore = 10;
        threatCategory = 'Verified Official Channel';
      }

      const recommendedSteps = extractRecommendedSteps(reply, lower);
      const suggestedFollowUps = generateFollowUps(prompt, lower);

      return {
        reply,
        verdict,
        riskScore,
        threatCategory,
        recommendedSteps,
        suggestedFollowUps
      };
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to built-in fraud knowledge engine:', err?.message);
    }
  }

  // Fallback intelligent reasoning engine
  return generateFallbackAiResponse(prompt);
}

/**
 * Analyze a raw suspicious text message / WhatsApp chat / SMS / email
 */
export async function analyzeSuspiciousTextMessage(
  text: string
): Promise<SuspiciousMessageAnalysis> {
  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `
Analyze this suspicious SMS, WhatsApp message, Instagram DM, or offer message from an Indian e-commerce / cyber safety perspective:

"""
${text}
"""

Return your analysis in valid JSON format matching this structure:
{
  "riskScore": number (0 to 100),
  "threatLevel": "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH",
  "scamCategory": string,
  "isLikelyScam": boolean,
  "verdictTamil": string (Concise 1-2 line summary in Tamil / Tanglish),
  "verdictEnglish": string (Concise 1-2 line summary in English),
  "redFlags": string[] (3-5 specific red flags detected),
  "detectedIndicators": {
    "fakeUrgency": boolean,
    "advancePaymentDemand": boolean,
    "unrealisticDiscount": boolean,
    "offPlatformRedirection": boolean,
    "fakeCourierOrCustoms": boolean,
    "phishingLink": boolean
  },
  "recommendedActions": string[] (3-4 step checklist for the user),
  "helplineInfo": {
    "cyberHelpline": "1930",
    "reportingPortal": "cybercrime.gov.in",
    "urgentActionNote": string
  }
}
`;

      const response = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.riskScore !== undefined) {
        return parsed as SuspiciousMessageAnalysis;
      }
    } catch (err: any) {
      console.warn('Gemini message analysis error, using heuristic fallback:', err?.message);
    }
  }

  return heuristicMessageAnalysis(text);
}

/**
 * Intelligent Heuristic Fallback Engine
 */
function generateFallbackAiResponse(prompt: string): {
  reply: string;
  verdict: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | 'INFO';
  riskScore: number;
  threatCategory: string;
  recommendedSteps: string[];
  suggestedFollowUps: string[];
} {
  const p = prompt.toLowerCase();

  if (p.includes('1930') || p.includes('cyber') || p.includes('complaint') || p.includes('police') || p.includes('புகார்')) {
    return {
      reply: `🛡️ **National Cybercrime Helpline & Reporting Guide (தேசிய சைபர் குற்ற உதவி):**

1. **Immediate Call (Golden Hour):** Dial **1930** immediately if you lost money via UPI/Netbanking. The Indian Cyber Crime Coordination Centre (I4C) will freeze the scammer's bank account before they withdraw it.
2. **Online Portal:** Register a formal complaint at **[cybercrime.gov.in](https://cybercrime.gov.in)**. Keep transaction ID, screenshot of WhatsApp chat, and the scammer's UPI ID/Phone number ready.
3. **Bank & UPI App:** Open your GPay / PhonePe / Paytm app, go to transaction details -> "Report a Problem" -> "Fraudulent Transaction / Seller Scam".
4. **NPCI Dispute:** You can also raise a dispute on the NPCI portal (npci.org.in) under Dispute Redressal Mechanism.`,
      verdict: 'INFO',
      riskScore: 20,
      threatCategory: 'Cybercrime Reporting Procedure',
      recommendedSteps: [
        'Call 1930 immediately to freeze fraudulent funds.',
        'File detailed evidence on cybercrime.gov.in',
        'Raise a dispute on your UPI banking app.'
      ],
      suggestedFollowUps: [
        'How to get refund for GPay scam?',
        'What documents are needed for cybercrime complaint?',
        'How to verify if a WhatsApp seller is genuine?'
      ]
    };
  }

  if (p.includes('whatsapp') || p.includes('advance') || p.includes('insta') || p.includes('gpay') || p.includes('phonepe') || p.includes('qr') || p.includes('ஏமாத்து')) {
    return {
      reply: `⚠️ **Social Media & WhatsApp Advance Payment Scam Warning:**

இன்ஸ்டாகிராம் மற்றும் வாட்ஸ்அப்பில் நடக்கும் இந்த மோசடியை கவனியுங்கள்:

1. **How they operate (எப்படி ஏமாத்துவாங்க):**
   - Instagram-ல 80-90% discount-ல iPhone, branded shoes அல்லது sarees விளம்பரம் போடுவாங்க.
   - "DM for Price" அல்லது Bio-ல வாட்ஸ்அப் லிங்க் கொடுத்து பிரைவேட்டா பேச வைப்பாங்க.
   - COD (Cash on Delivery) சொன்னாலும், "₹300 - ₹500 courier advance கட்டணும்"னு GPay/PhonePe-ல பணம் வாங்குவாங்க.
   - பணம் அனுப்புன உடனே போலி DTDC/Delhivery tracking receipt அனுப்பி, அப்புறம் பிளாக் (Block) பண்ணிடுவாங்க.

2. **Defense Rules (தற்காப்பு விதிகள்):**
   - எக்காரணத்தை கொண்டும் வாட்ஸ்அப் வழியாக முன்பணம் (Advance UPI) செலுத்தாதீர்கள்.
   - QR code scan பண்ணி "பணம் வரும்"னு சொன்னா நம்பாதீங்க (QR scan பண்ணா உங்க கணக்கில் இருந்துதான் பணம் போகும்).
   - சம்பந்தப்பட்ட Instagram பக்கத்தில் comments block பண்ணியிருக்காங்களானு பாருங்க.`,
      verdict: 'DANGEROUS',
      riskScore: 92,
      threatCategory: 'Instagram-to-WhatsApp UPI Trap',
      recommendedSteps: [
        'Never pay advance courier fees on WhatsApp.',
        'Do not scan any QR code to receive money.',
        'Verify GST number on gst.gov.in before any transaction.'
      ],
      suggestedFollowUps: [
        'How to report a fake Instagram account?',
        'I already paid ₹1500 to a WhatsApp seller, what should I do now?',
        'Is Cash on Delivery 100% safe?'
      ]
    };
  }

  if (p.includes('customs') || p.includes('courier') || p.includes('dtdc') || p.includes('holding fee') || p.includes('tracking')) {
    return {
      reply: `🚨 **Bogus Courier & Customs Fee Extortion Trap (போலி கூரியர் மோசடி):**

1. **Modus Operandi:** The seller creates a fabricated tracking slip using fake tracking websites (e.g. \`dtdc-express-delivery.xyz\` or edited Canva images).
2. **The Secondary Scam:** They will contact you saying: *"Your parcel is detained by airport customs / courier hub. Pay ₹1,999 clearance fee to release it."*
3. **Fact:** Real courier companies like DTDC, Blue Dart, or Delhivery **NEVER** ask you to pay customs fees into private UPI IDs or personal savings accounts.
4. **Action:** Do NOT pay any additional amount. Block the number and report on SafeCart.`,
      verdict: 'DANGEROUS',
      riskScore: 95,
      threatCategory: 'Fake Courier & Customs Extortion',
      recommendedSteps: [
        'Refuse to pay any holding or customs fees.',
        'Track tracking numbers ONLY on official dtdc.in or delhivery.com portals.',
        'File complaint with the sender phone number on 1930.'
      ],
      suggestedFollowUps: [
        'How to tell if a courier tracking slip is fake?',
        'Can courier companies demand OTP or UPI transfer?',
        'Check a WhatsApp number for scam reports.'
      ]
    };
  }

  return {
    reply: `👋 Hello! I am your **SafeCart AI Fraud Defense Specialist (SafeCart AI ஆலோசகர்)**.

I can help you analyze and protect yourself against:
- 📱 **Instagram DM to WhatsApp Traps** (Unverified sellers asking for advance UPI/GPay).
- 📦 **Fake Courier & Customs Charges** (Bogus DTDC/Delhivery tracking receipts).
- 🌐 **Suspicious Shopping Websites** (Checking if a domain is a clone or counterfeit store).
- 💳 **UPI & QR Code Frauds** (What to do if money was debited from your account).
- 🚨 **Cybercrime Helpline 1930 Guidance** (Step-by-step reporting to freeze stolen funds).

நீங்க சந்தேகப்படும் message, Instagram ID அல்லது வாட்ஸ்அப் விவரங்களை கீழே டைப் பண்ணி கேளுங்க! I'm here to help in English, Tamil, and Tanglish.`,
    verdict: 'INFO',
    riskScore: 10,
    threatCategory: 'General Safety Assistant',
    recommendedSteps: [
      'Type any suspect link, handle, or WhatsApp number to inspect.',
      'Paste suspicious message text for instant risk breakdown.',
      'Check our Scam Threat Registry before making online purchases.'
    ],
    suggestedFollowUps: [
      'Is 90% discount on Nike Jordan real on Instagram?',
      'Someone asked me to scan QR code to receive refund, is it safe?',
      'What should I do if a seller blocked me after GPay payment?'
    ]
  };
}

function heuristicMessageAnalysis(text: string): SuspiciousMessageAnalysis {
  const t = text.toLowerCase();

  let riskScore = 25;
  const redFlags: string[] = [];
  const detectedIndicators = {
    fakeUrgency: false,
    advancePaymentDemand: false,
    unrealisticDiscount: false,
    offPlatformRedirection: false,
    fakeCourierOrCustoms: false,
    phishingLink: false
  };

  if (/hurry|urgent|expires in|today only|last \d+|limited time|உடனே|இன்றே/i.test(t)) {
    detectedIndicators.fakeUrgency = true;
    riskScore += 20;
    redFlags.push('High artificial urgency pressure designed to prevent careful verification.');
  }

  if (/advance|gpay|phonepe|paytm|upi|qr code|scan|முன்பணம்|பணம் அனுப்பு/i.test(t)) {
    detectedIndicators.advancePaymentDemand = true;
    riskScore += 30;
    redFlags.push('Demands un-escrowed advance payment or QR code scan via personal UPI.');
  }

  if (/\d{2}% off|80%|90%|free gift|lottery|winner|வெற்றி|iphone for/i.test(t)) {
    detectedIndicators.unrealisticDiscount = true;
    riskScore += 25;
    redFlags.push('Unrealistically huge discount or giveaway lure far below market cost.');
  }

  if (/whatsapp|wa\.me|dm for price|inbox|telegram|t\.me/i.test(t)) {
    detectedIndicators.offPlatformRedirection = true;
    riskScore += 20;
    redFlags.push('Redirects off official platform onto private messaging to evade consumer protection.');
  }

  if (/customs|courier fee|holding charge|release parcel|clearance fee|delivery charge advance/i.test(t)) {
    detectedIndicators.fakeCourierOrCustoms = true;
    riskScore += 30;
    redFlags.push('Demands bogus customs clearance or secondary holding fee for alleged parcel.');
  }

  if (/http|bit\.ly|tinyurl|\.xyz|\.top|\.shop|\.cfd/i.test(t)) {
    detectedIndicators.phishingLink = true;
    riskScore += 20;
    redFlags.push('Contains shortened or suspicious web links that may harvest credentials.');
  }

  riskScore = Math.min(100, Math.max(20, riskScore));

  let threatLevel: RiskLevel = 'LOW';
  if (riskScore >= 80) threatLevel = 'VERY HIGH';
  else if (riskScore >= 60) threatLevel = 'HIGH';
  else if (riskScore >= 35) threatLevel = 'MEDIUM';

  const isLikelyScam = riskScore >= 50;

  return {
    riskScore,
    threatLevel,
    scamCategory: detectedIndicators.fakeCourierOrCustoms
      ? 'Fake Courier / Customs Extortion'
      : detectedIndicators.offPlatformRedirection
      ? 'Instagram / WhatsApp Redirection Trap'
      : detectedIndicators.advancePaymentDemand
      ? 'Advance UPI Payment Scam'
      : 'Suspicious Marketing Solicitation',
    isLikelyScam,
    verdictTamil: isLikelyScam
      ? '⚠️ எச்சரிக்கை: இந்த மெசேஜ் 90% மோசடி (Scam) வாய்ப்பு கொண்டது. எக்காரணத்தை கொண்டும் முன்பணம் அல்லது QR code scan செய்யாதீர்கள்!'
      : 'விவரங்களை சரிபார்த்த பிறகு மட்டும் தொடரவும். பொதுவான விளம்பரம் போல் தெரிகிறது.',
    verdictEnglish: isLikelyScam
      ? '🚨 HIGH THREAT DETECTED: This message matches classic social e-commerce scam patterns. Do NOT transfer funds or scan QR codes.'
      : 'Moderate caution advised. Always verify seller GST and credentials through registered platforms.',
    redFlags: redFlags.length > 0 ? redFlags : ['Unverified sender identity', 'Lacks registered company documentation'],
    detectedIndicators,
    recommendedActions: [
      'Do NOT send money via UPI or scan any QR code received in this chat.',
      'Do NOT pay advance shipping charges under the promise of Cash on Delivery.',
      'Check if the sender is reported in SafeCart or dial Cybercrime Helpline 1930 if money was already transferred.'
    ],
    helplineInfo: {
      cyberHelpline: '1930',
      reportingPortal: 'https://cybercrime.gov.in',
      urgentActionNote: 'If funds were debited, call 1930 within 2 hours to freeze the recipient bank account.'
    }
  };
}

function extractRecommendedSteps(reply: string, lower: string): string[] {
  const steps: string[] = [];
  if (lower.includes('1930')) steps.push('Call National Cybercrime Helpline 1930 immediately.');
  if (lower.includes('cybercrime.gov.in')) steps.push('Register an official complaint on cybercrime.gov.in.');
  if (lower.includes('qr')) steps.push('Never scan QR codes to receive funds.');
  if (lower.includes('upi') || lower.includes('gpay')) steps.push('Report the fraudulent transaction inside your UPI app.');
  if (steps.length === 0) {
    steps.push('Never pay advance charges on unverified private WhatsApp chats.');
    steps.push('Verify GST & official business website before any transfer.');
  }
  return steps;
}

function generateFollowUps(prompt: string, lower: string): string[] {
  if (lower.includes('1930') || lower.includes('lost') || lower.includes('paid')) {
    return [
      'How to request a chargeback from my bank?',
      'Can cyber police recover money sent through UPI?',
      'How to report the scammer\'s phone number?'
    ];
  }
  return [
    'How do scammers make fake DTDC courier slips?',
    'Is it safe to pay ₹300 courier charge for Cash on Delivery?',
    'How to check if an Instagram shopping page is authentic?'
  ];
}

/**
 * Transcribes user voice recording describing a scam incident and uses AI to extract
 * structured fields for the fraud report (url, reason, detailed description, category, financial loss).
 */
export async function transcribeAndExtractFraudReport(params: {
  audioBase64?: string;
  mimeType?: string;
  clientTranscript?: string;
  language?: string;
}): Promise<AudioTranscriptionResult> {
  const client = getGeminiClient();
  const { audioBase64, mimeType = 'audio/webm', clientTranscript = '', language = 'auto' } = params;

  if (client && (audioBase64 || clientTranscript)) {
    try {
      const parts: any[] = [];

      // Clean base64 string
      if (audioBase64) {
        const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '').trim();
        if (cleanBase64.length > 0) {
          let normalizedMime = mimeType;
          if (normalizedMime.includes('webm')) normalizedMime = 'audio/webm';
          else if (normalizedMime.includes('ogg')) normalizedMime = 'audio/ogg';
          else if (normalizedMime.includes('wav')) normalizedMime = 'audio/wav';
          else if (normalizedMime.includes('mp4') || normalizedMime.includes('m4a')) normalizedMime = 'audio/mp4';
          else if (normalizedMime.includes('mp3') || normalizedMime.includes('mpeg')) normalizedMime = 'audio/mp3';

          parts.push({
            inlineData: {
              mimeType: normalizedMime,
              data: cleanBase64
            }
          });
        }
      }

      const promptInstructions = `
You are SafeCart AI Fraud Voice Transcription & Incident Extraction Specialist.
The user is providing an audio voice description (and optional speech draft: "${clientTranscript}") describing an online shopping fraud, Instagram scam, WhatsApp UPI extortion, fake courier trap, or fake e-commerce store in English, Tamil (தமிழ்), or Tanglish.

Your tasks:
1. Accurately transcribe what the user spoke ('fullTranscript'). If they spoke in Tamil, provide accurate Tamil script. If Tanglish or English, capture accurately.
2. Extract the website URL, store name, or Instagram/WhatsApp handle mentioned ('extractedUrl'). If none mentioned, return empty string "".
3. Generate a concise, impactful 1-sentence summary of the incident ('extractedReason', e.g. "Paid ₹1,800 on fake Instagram clothing page, seller sent bogus tracking slip and blocked on WhatsApp").
4. Formulate a comprehensive, chronological description of the event ('extractedDescription') including:
   - Item ordered or lure
   - Advance payment / UPI / payment method demanded
   - The fraudulent action (bogus tracking number, refusal of COD, ghosting, extortion)
   - Specific red flags.
5. Classify the incident into exactly ONE of the following:
   - "Instagram DM to WhatsApp Redirection Trap"
   - "WhatsApp UPI / Advance Payment Fraud"
   - "Fake Instagram Shopping Store"
   - "Fake Courier Tracking Receipt"
   - "Product not delivered"
   - "Fake product"
   - "Refund issue"
   - "Seller stopped responding"
   - "Phishing or Credential Harvesting"
   - "Payment requested"
   - "Other"
6. Extract numerical financial loss amount ('financialLossAmount') in INR/USD. If none stated, return 0.
7. Return list of detected keywords ('detectedKeywords').
8. Identify detected language ('detectedLanguage': "Tamil" | "English" | "Tanglish" | "Mixed").
9. Provide confidence score (0.1 to 1.0).
`;

      parts.push({ text: promptInstructions });

      const response = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [{ parts }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullTranscript: { type: Type.STRING },
              extractedUrl: { type: Type.STRING },
              extractedReason: { type: Type.STRING },
              extractedDescription: { type: Type.STRING },
              suggestedCategory: { type: Type.STRING },
              financialLossAmount: { type: Type.NUMBER },
              detectedKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              detectedLanguage: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER }
            },
            required: ['fullTranscript', 'extractedReason', 'extractedDescription', 'suggestedCategory']
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        const validCategories: IssueCategory[] = [
          'Instagram DM to WhatsApp Redirection Trap',
          'WhatsApp UPI / Advance Payment Fraud',
          'Fake Instagram Shopping Store',
          'Fake Courier Tracking Receipt',
          'Product not delivered',
          'Fake product',
          'Refund issue',
          'Seller stopped responding',
          'Phishing or Credential Harvesting',
          'Payment requested',
          'No transaction',
          'Other'
        ];

        const matchedCategory: IssueCategory = validCategories.includes(parsed.suggestedCategory as IssueCategory)
          ? (parsed.suggestedCategory as IssueCategory)
          : 'Product not delivered';

        return {
          fullTranscript: parsed.fullTranscript || clientTranscript || 'Voice recorded complaint',
          extractedUrl: parsed.extractedUrl || '',
          extractedReason: parsed.extractedReason || 'Online e-commerce fraud complaint',
          extractedDescription: parsed.extractedDescription || parsed.fullTranscript || 'Victim reported scam transaction.',
          suggestedCategory: matchedCategory,
          financialLossAmount: typeof parsed.financialLossAmount === 'number' ? parsed.financialLossAmount : 0,
          detectedKeywords: Array.isArray(parsed.detectedKeywords) ? parsed.detectedKeywords : ['Voice Report'],
          detectedLanguage: parsed.detectedLanguage || (language === 'ta' ? 'Tamil' : 'English'),
          confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95
        };
      }
    } catch (err) {
      console.error('Gemini Voice transcription error:', err);
      // fallback continues below
    }
  }

  // Graceful rule-based extraction if clientTranscript provided or fallback
  return fallbackVoiceReportExtractor(clientTranscript, language);
}

function fallbackVoiceReportExtractor(transcript: string, lang: string): AudioTranscriptionResult {
  const text = transcript.trim() || (lang === 'ta'
    ? 'இன்ஸ்டாகிராம் பக்கத்தில் ஆர்டர் செய்து பணம் செலுத்திய பின் கூரியர் வரவில்லை, வாட்ஸ்அப்பில் பிளாக் செய்துவிட்டார்கள்.'
    : 'Ordered product through social media store and paid in advance via UPI, but received fake tracking number and seller stopped responding.');

  const lower = text.toLowerCase();

  // Extract amount
  let financialLossAmount = 0;
  const amountMatch = text.match(/(?:₹|rs\.?|inr|\$)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i) ||
                     text.match(/(\d+)\s*(?:rupees|rs|rubai|roobai|dollars)/i);
  if (amountMatch) {
    financialLossAmount = parseFloat(amountMatch[1].replace(/,/g, '')) || 0;
  }

  // Extract URL or handle
  let extractedUrl = '';
  const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:com|in|shop|xyz|top|org|net)[a-zA-Z0-9/_.-]*)/i);
  const instaMatch = text.match(/@([a-zA-Z0-9_.]+)/);
  if (urlMatch) {
    extractedUrl = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
  } else if (instaMatch) {
    extractedUrl = `https://instagram.com/${instaMatch[1]}`;
  }

  // Category determination
  let suggestedCategory: IssueCategory = 'Product not delivered';
  if (lower.includes('dtdc') || lower.includes('delhivery') || lower.includes('courier') || lower.includes('tracking')) {
    suggestedCategory = 'Fake Courier Tracking Receipt';
  } else if (lower.includes('whatsapp') && (lower.includes('upi') || lower.includes('advance') || lower.includes('gpay') || lower.includes('phonepe'))) {
    suggestedCategory = 'WhatsApp UPI / Advance Payment Fraud';
  } else if (lower.includes('instagram') && lower.includes('whatsapp')) {
    suggestedCategory = 'Instagram DM to WhatsApp Redirection Trap';
  } else if (lower.includes('instagram') || lower.includes('insta')) {
    suggestedCategory = 'Fake Instagram Shopping Store';
  } else if (lower.includes('fake') || lower.includes('damaged') || lower.includes('duplicate')) {
    suggestedCategory = 'Fake product';
  } else if (lower.includes('blocked') || lower.includes('not responding') || lower.includes('ghost')) {
    suggestedCategory = 'Seller stopped responding';
  }

  const extractedReason = lang === 'ta'
    ? `${suggestedCategory} - ${financialLossAmount > 0 ? `ரூ. ${financialLossAmount} இழப்பு` : 'மோசடி புகார்'}`
    : `Scam Incident: ${suggestedCategory}${financialLossAmount > 0 ? ` - Lost $${financialLossAmount}` : ''}`;

  return {
    fullTranscript: text,
    extractedUrl,
    extractedReason,
    extractedDescription: text,
    suggestedCategory,
    financialLossAmount,
    detectedKeywords: ['Voice Input', suggestedCategory],
    detectedLanguage: lang === 'ta' ? 'Tamil' : 'English',
    confidenceScore: 0.85
  };
}
