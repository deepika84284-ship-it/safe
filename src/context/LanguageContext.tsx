import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultVal?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    'nav.brandSubtitle': 'E-Commerce Threat Intel',
    'nav.searchPlaceholder': 'Quick scan domain (e.g. nike.com or suspect.shop)...',
    'nav.scanBtn': 'Scan',
    'nav.scanner': 'Scanner',
    'nav.socialShield': 'Insta/WhatsApp Shield',
    'nav.gpayEscrow': 'GPay Shield (ஜிபே)',
    'nav.aiCopilot': 'AI Copilot',
    'nav.history': 'History',
    'nav.reportScam': 'Report Scam',
    'nav.safetyTips': 'Safety Tips',
    'nav.about': 'About',
    'nav.dashboard': 'Dashboard',
    'nav.adminPanel': 'Admin Panel',
    'nav.login': 'Log In',
    'nav.getStarted': 'Get Started',
    'nav.logout': 'Sign Out',
    'nav.langSwitch': 'தமிழ்',

    // Landing Page
    'hero.badge': 'INDIA E-COMMERCE & SOCIAL SHOPPING DEFENSE',
    'hero.title1': 'Real-Time Scam Detection for',
    'hero.title2': 'Online Shopping & Social Deals',
    'hero.desc': 'Protect yourself from fake shopping websites, fraudulent Instagram stores, WhatsApp advance fee traps, and bogus courier charges before paying.',
    'hero.inputPlaceholder': 'Enter store link, domain or URL (e.g., myshop.in)...',
    'hero.scanNow': 'Scan Website',
    'hero.instaScan': 'Check Instagram / WhatsApp Store',
    'hero.aiDoubtBtn': 'Ask AI Doubt (AI-கிட்ட சந்தேகம்)',
    'hero.helpline1930': 'Cyber Helpline: 1930',

    // AI Doubt Section
    'doubt.badge': 'AI Chat & Fraud Doubt Solver',
    'doubt.title': 'Ask SafeCart AI Any Shopping Doubt',
    'doubt.desc': 'Ask questions about suspicious WhatsApp sellers, fake DTDC courier tracking, advance UPI traps, or 1930 Cyber helpline in Tamil or English!',
    'doubt.boxTitle': 'SafeCart AI Doubt Solver',
    'doubt.boxSubtitle': 'Ask any question about online shopping, WhatsApp deals, Instagram offers or UPI transactions in Tamil or English!',
    'doubt.askBtn': 'Ask AI',
    'doubt.placeholder': 'Type your shopping doubt here in Tamil or English...',
    'doubt.listening': 'Listening to your voice...',
    'doubt.speakBtn': 'Speak doubt',
    'doubt.quickPresets': 'Quick Doubts:',

    // Social Shield Spotlight
    'spotlight.aiTitle': 'SafeCart AI Copilot',
    'spotlight.aiDesc': 'Get immediate fraud assessment on SMS, WhatsApp deals, and QR code refund traps in Tamil & English.',
    'spotlight.aiAction': 'Launch AI Copilot',
    'spotlight.socialTitle': 'Social Store & UPI Verifier',
    'spotlight.socialDesc': 'Verify unofficial Instagram stores, advance courier fee traps, fake DTDC tracking, and blacklisted WhatsApp seller phone numbers.',
    'spotlight.socialAction': 'Open Social Shield',

    // Features Section
    'features.title': 'Multi-Vector E-Commerce Protection',
    'features.subtitle': 'Our intelligence engine continuously correlates domain registrations, UPI handles, social profiles, and cyber complaint records.',
    'features.domainAnalysis': 'Domain & WHOIS Forensics',
    'features.domainAnalysisDesc': 'Checks domain age, hidden registrar records, suspicious TLDs (.top, .shop, .xyz), and cloned DNS servers.',
    'features.sslCheck': 'SSL & Identity Validation',
    'features.sslCheckDesc': 'Verifies certificate validity, Let\'s Encrypt free certificate expiry, and fraudulent identity impersonation.',
    'features.socialIntel': 'Instagram & WhatsApp Shield',
    'features.socialIntelDesc': 'Analyzes follower-to-engagement ratio, frequent handle renames, missing return policies, and blacklisted phone numbers.',
    'features.upiDefense': 'UPI & QR Code Defense',
    'features.upiDefenseDesc': 'Detects advance payment extortion, fake reverse QR codes ("Scan to receive refund"), and unverified personal UPI IDs.',
    'features.geminiAi': 'Gemini 3.7 AI Copilot',
    'features.geminiAiDesc': 'Interactive Tamil & English assistant explaining complex cyber scams, phishing scripts, and step-by-step 1930 recovery.',
    'features.threatDb': 'Community Threat Database',
    'features.threatDbDesc': 'Crowdsourced reports vetted by automated forensics to protect thousands of Indian online shoppers in real time.',

    // Stats
    'stats.domainsAnalyzed': 'Websites Analyzed',
    'stats.threatsBlocked': 'Threats Identified',
    'stats.socialStores': 'Social Stores Audited',
    'stats.protectionRate': 'Detection Accuracy',

    // Scanner Page
    'scanner.title': 'E-Commerce Website Threat Scanner',
    'scanner.subtitle': 'Deep forensic inspection of domain infrastructure, merchant credentials, SSL certificates, payment security, and malicious threat signals.',
    'scanner.inputLabel': 'Store URL or Domain',
    'scanner.inputPlaceholder': 'Enter URL (e.g. https://cheap-deals-india.shop or nike.com)...',
    'scanner.analyzeBtn': 'Analyze Security',
    'scanner.analyzing': 'Analyzing Infrastructure & Risk Signals...',
    'scanner.recentScans': 'Recent Threat Analyses',

    // Social Scanner
    'social.title': 'Instagram & WhatsApp Store Verifier',
    'social.subtitle': 'Verify suspicious Instagram pages, unverified WhatsApp seller phone numbers, advance courier fee scams, and fake DTDC receipts.',
    'social.tabInsta': 'Instagram Handle Checker',
    'social.tabPhone': 'WhatsApp Seller / Phone Auditor',
    'social.tabCourier': 'Fake Courier & Advance Fee Detector',

    // AI Assistant Page
    'aiPage.title': 'SafeCart AI Fraud Defense Copilot',
    'aiPage.subtitle': 'Interactive Tamil & English cyber safety advisor powered by Gemini 3.7 AI.',
    'aiPage.chatTab': 'AI Doubt & Advisory Chat',
    'aiPage.auditTab': 'Suspicious Message & Chat Auditor',
    'aiPage.helplineTitle': 'National Cyber Crime Reporting Helpline',
    'aiPage.helplineDesc': 'Dial 1930 immediately within the golden hour if you sent money to a scammer.',

    // Report Scam Page
    'report.title': 'Report an E-Commerce or Social Scam',
    'report.subtitle': 'Help protect the community. Your submission will be analyzed by automated forensics and added to the threat intelligence database.',
    'report.typeLabel': 'Scam Type',
    'report.targetLabel': 'Target Domain / Handle / Phone',
    'report.amountLabel': 'Loss Amount (₹ / $)',
    'report.descLabel': 'Incident Description',
    'report.submitBtn': 'Submit Scam Report',
    'report.voiceTitle': 'Record Voice Description (AI Auto-Fill)',
    'report.voiceSubtitle': 'Speak in Tamil, Tanglish, or English about your scam experience. SafeCart AI will transcribe your voice and automatically extract the URL, summary, category, loss amount, and detailed report into the form.',
    'report.recordStart': 'Start Voice Recording',
    'report.recordStop': 'Stop & Transcribe with AI',
    'report.recording': 'Recording in progress... Speak clearly into your microphone',
    'report.transcribing': 'Gemini AI is transcribing and extracting report fields...',
    'report.voiceSuccess': 'Voice transcribed successfully! Form fields have been auto-populated below.',
    'report.voiceReRecord': 'Re-record Voice',
    'report.voicePlay': 'Play Audio Recording',
    'report.voicePause': 'Pause Audio',
    'report.voiceTip': 'Tip: Mention the website or Instagram handle, amount paid via UPI, and what happened.',

    // Footer
    'footer.desc': 'SafeCart is an intelligent threat intelligence platform protecting Indian consumers from fraudulent e-commerce stores, Instagram traps, WhatsApp extortion, and fake courier schemes.',
    'footer.navigation': 'Platform',
    'footer.resources': 'Resources',
    'footer.legal': 'Emergency Helpline',
    'footer.emergencyText': 'If you have been scammed of money, immediately call 1930 to freeze transactions or report at cybercrime.gov.in.'
  },
  ta: {
    // Brand & Header
    'nav.brandSubtitle': 'ஆன்லைன் மோசடி தடுப்பு தளம்',
    'nav.searchPlaceholder': 'இணையதள முகவரியை ஸ்கேன் செய்க (எ.கா: suspect.shop)...',
    'nav.scanBtn': 'ஸ்கேன்',
    'nav.scanner': 'இணையதள ஸ்கேனர்',
    'nav.socialShield': 'இன்ஸ்டா/வாட்ஸ்அப் பாதுகாப்பு',
    'nav.gpayEscrow': 'GPay ஷீல்டு (ஜிபே)',
    'nav.aiCopilot': 'AI ஆலோசகர்',
    'nav.history': 'வரலாறு',
    'nav.reportScam': 'மோசடி புகார்',
    'nav.safetyTips': 'பாதுகாப்பு குறிப்புகள்',
    'nav.about': 'எங்களை பற்றி',
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.adminPanel': 'நிர்வாகக் குழு',
    'nav.login': 'உள்நுழைக',
    'nav.getStarted': 'தொடங்குக',
    'nav.logout': 'வெளியேறுக',
    'nav.langSwitch': 'English',

    // Landing Page
    'hero.badge': 'இந்தியாவின் நம்பகமான ஆன்லைன் ஷாப்பிங் பாதுகாப்பு தளம்',
    'hero.title1': 'ஆன்லைன் ஷாப்பிங் & சோஷியல் மீடியா',
    'hero.title2': 'போலி மோசடிகளை உடனே கண்டறியுங்கள்',
    'hero.desc': 'போலி ஷாப்பிங் இணையதளங்கள், போலியான Instagram பக்கங்கள், WhatsApp முன்பணம் கேட்கும் மோசடிகள் மற்றும் போலி கூரியர் கட்டணங்களில் இருந்து உங்களை பாதுகாத்துக் கொள்ளுங்கள்.',
    'hero.inputPlaceholder': 'ஷாப்பிங் இணையதள முகவரியை உள்ளிடவும் (எ.கா: myshop.in)...',
    'hero.scanNow': 'தளத்தை ஸ்கேன் செய்க',
    'hero.instaScan': 'இன்ஸ்டா / வாட்ஸ்அப் கடையை சரிபார்க்க',
    'hero.aiDoubtBtn': 'AI-கிட்ட சந்தேகம் கேளுங்கள்',
    'hero.helpline1930': 'சைபர் உதவி எண்: 1930',

    // AI Doubt Section
    'doubt.badge': 'AI சேட் & ஆன்லைன் மோசடி சந்தேக தீர்வு',
    'doubt.title': 'SafeCart AI-யிடம் உங்கள் ஷாப்பிங் சந்தேகங்களை கேளுங்கள்',
    'doubt.desc': 'சந்தேகப்படும் வாட்ஸ்அப் விற்பனையாளர்கள், போலி DTDC கூரியர் டிராக்கிங், அட்வான்ஸ் UPI மோசடிகள் அல்லது 1930 புகார் முறை பற்றி தமிழில் அல்லது ஆங்கிலத்தில் கேளுங்கள்!',
    'doubt.boxTitle': 'SafeCart AI சந்தேகம் தீர்க்கும் அரட்டை (Doubt Solver)',
    'doubt.boxSubtitle': 'எந்தவொரு ஆன்லைன் ஷாப்பிங், வாட்ஸ்அப் டீல், இன்ஸ்டாகிராம் ஆஃபர் அல்லது UPI பரிவர்த்தனை சந்தேகத்தையும் தமிழில் கேளுங்கள்!',
    'doubt.askBtn': 'கேளுங்கள்',
    'doubt.placeholder': 'உங்கள் ஷாப்பிங் சந்தேகத்தை இங்கே தமிழில் அல்லது ஆங்கிலத்தில் தட்டச்சு செய்யவும்...',
    'doubt.listening': 'உங்கள் குரலை கேட்கிறது...',
    'doubt.speakBtn': 'பேசி கேளுங்கள்',
    'doubt.quickPresets': 'விரைவு சந்தேகங்கள்:',

    // Social Shield Spotlight
    'spotlight.aiTitle': 'SafeCart AI ஆலோசகர் (Copilot)',
    'spotlight.aiDesc': 'உங்களுக்கு வந்த SMS, வாட்ஸ்அப் ஆஃபர் மற்றும் QR கோட் ரீஃபண்ட் மோசடிகள் பற்றிய உடனடி பகுப்பாய்வு பெறுங்கள்.',
    'spotlight.aiAction': 'AI ஆலோசகரை திறக்க',
    'spotlight.socialTitle': 'சோஷியல் ஸ்டோர் & UPI சரிபார்ப்பு',
    'spotlight.socialDesc': 'அங்கீகரிக்கப்படாத Instagram கடைகள், கூரியர் முன்பண மோசடிகள், போலி DTDC ரசீதுகள் மற்றும் வாட்ஸ்அப் எண்களை சரிபாருங்கள்.',
    'spotlight.socialAction': 'சோஷியல் ஷீல்டை திறக்க',

    // Features Section
    'features.title': 'முழுமையான மின்-வணிக பாதுகாப்பு அம்சங்கள்',
    'features.subtitle': 'டொமைன் பதிவு, UPI ஐடிகள், சமூக ஊடக பக்கங்கள் மற்றும் சைபர் புகார்களை தானாக ஆராய்ந்து எச்சரிக்கும் அதிநவீன தொழில்நுட்பம்.',
    'features.domainAnalysis': 'டொமைன் & WHOIS பகுப்பாய்வு',
    'features.domainAnalysisDesc': 'வலைத்தளத்தின் வயது, மறைக்கப்பட்ட உரிமையாளர் விவரங்கள், சந்தேகத்திற்கிடமான TLDகள் (.shop, .xyz) ஆகியவற்றை ஆராய்கிறது.',
    'features.sslCheck': 'SSL & பாதுகாப்பு சான்றிதழ்',
    'features.sslCheckDesc': 'பாதுகாப்பு சான்றிதழின் உண்மைத்தன்மை மற்றும் போலி நிறுவன ஆள்மாறாட்டத்தை துல்லியமாக கண்டறிகிறது.',
    'features.socialIntel': 'Instagram & WhatsApp பாதுகாப்பு',
    'features.socialIntelDesc': 'போலி ஃபாலோயர்கள், அடிக்கடி பெயர் மாற்றிய பக்கங்கள், திரும்பப் பெறும் கொள்கை இல்லாத கடைகளை கண்டறிகிறது.',
    'features.upiDefense': 'UPI & QR Code தற்காப்பு',
    'features.upiDefenseDesc': 'முன்பணம் கேட்டு மிரட்டுதல், "பணம் வர QR கோடை ஸ்கேன் செய்" போன்ற போலி ரீஃபண்ட் தந்திரங்களை எச்சரிக்கிறது.',
    'features.geminiAi': 'Gemini 3.7 AI ஆலோசகர்',
    'features.geminiAiDesc': 'சைபர் மோசடிகள், ஃபிஷிங் மெசேஜ்கள் மற்றும் 1930 மீட்பு வழிகாட்டுதல்களை எளிய தமிழில் விளக்கும் AI.',
    'features.threatDb': 'சமூக மோசடி தரவுத்தளம்',
    'features.threatDbDesc': 'பொதுமக்கள் புகாரளித்த போலி கடைகளின் தகவல்கள் உடனுக்குடன் சரிபார்க்கப்பட்டு அனைவருக்கும் பகிரப்படுகிறது.',

    // Stats
    'stats.domainsAnalyzed': 'ஆராயப்பட்ட தளங்கள்',
    'stats.threatsBlocked': 'கண்டறியப்பட்ட மோசடிகள்',
    'stats.socialStores': 'சரிபார்க்கப்பட்ட இன்ஸ்டா கடைகள்',
    'stats.protectionRate': 'துல்லிய விகிதம்',

    // Scanner Page
    'scanner.title': 'இணையதள மோசடி கண்டறியும் ஸ்கேனர்',
    'scanner.subtitle': 'வலைத்தள உள்கட்டமைப்பு, விற்பனையாளர் நம்பகத்தன்மை, SSL சான்றிதழ் மற்றும் பேமெண்ட் பாதுகாப்பு பற்றிய விரிவான ஆய்வு.',
    'scanner.inputLabel': 'ஷாப்பிங் தளத்தின் URL அல்லது டொமைன்',
    'scanner.inputPlaceholder': 'URL முகவரியை உள்ளிடவும் (எ.கா: https://cheap-deals.shop அல்லது nike.com)...',
    'scanner.analyzeBtn': 'பாதுகாப்பை சோதிக்க',
    'scanner.analyzing': 'பாதுகாப்பு மற்றும் ஆபத்து காரணிகளை ஆராய்கிறது...',
    'scanner.recentScans': 'சமீபத்திய ஆய்வுகள்',

    // Social Scanner
    'social.title': 'Instagram & WhatsApp கடை சரிபார்ப்பு',
    'social.subtitle': 'சந்தேகத்திற்குரிய இன்ஸ்டாகிராம் பக்கங்கள், வாட்ஸ்அப் விற்பனையாளர் எண்கள், போலி DTDC கூரியர் கட்டண மோசடிகளை கண்டறியவும்.',
    'social.tabInsta': 'Instagram பக்கம் சரிபார்ப்பு',
    'social.tabPhone': 'WhatsApp எண் & UPI சோதனை',
    'social.tabCourier': 'போலி கூரியர் & அட்வான்ஸ் கட்டண சோதனை',

    // AI Assistant Page
    'aiPage.title': 'SafeCart AI ஆன்லைன் மோசடி ஆலோசகர்',
    'aiPage.subtitle': 'Gemini 3.7 AI மூலம் இயங்கும் தமிழ் & ஆங்கில சைபர் பாதுகாப்பு வழிகாட்டி.',
    'aiPage.chatTab': 'AI நேரடி அரட்டை (Doubt Solver)',
    'aiPage.auditTab': 'சந்தேக மெசேஜ் பரிசோதனை',
    'aiPage.helplineTitle': 'தேசிய சைபர் குற்ற உதவி எண் (National Cyber Helpline)',
    'aiPage.helplineDesc': 'பணம் இழப்பு ஏற்பட்டால் பொன்னான நேரத்திற்குள் (Golden Hour) உடனடியாக 1930 எண்ணை அழைக்கவும்.',

    // Report Scam Page
    'report.title': 'ஆன்லைன் மோசடி பற்றி புகாரளிக்கவும்',
    'report.subtitle': 'மற்ற பொதுமக்களை காக்க உதவுங்கள். நீங்கள் அளிக்கும் விவரங்கள் தானியங்கி முறையில் சரிபார்க்கப்பட்டு எச்சரிக்கை தரவுத்தளத்தில் சேர்க்கப்படும்.',
    'report.typeLabel': 'மோசடி வகை',
    'report.targetLabel': 'மோசடி தளம் / இன்ஸ்டா பக்கம் / தொலைபேசி எண்',
    'report.amountLabel': 'இழந்த தொகை (₹)',
    'report.descLabel': 'மோசடி பற்றிய முழு விவரம்',
    'report.submitBtn': 'புகாரை சமர்ப்பிக்க',
    'report.voiceTitle': 'குரல் மூலம் புகார் கூற (AI தானியங்கி பூர்த்தி)',
    'report.voiceSubtitle': 'உங்கள் மோசடி அனுபவத்தை தமிழ், Tanglish அல்லது ஆங்கிலத்தில் குரலாக பேசுங்கள். SafeCart AI அதை உடனடியாக உரை வடிவமாக மாற்றி படிவத்தை நிரப்பும்.',
    'report.recordStart': 'குரல் பதிவை தொடங்கவும்',
    'report.recordStop': 'நிறுத்தி AI மூலம் மாற்றவும்',
    'report.recording': 'பதிவாகிறது... உங்கள் மைக்ரோஃபோனில் தெளிவாக பேசவும்',
    'report.transcribing': 'Gemini AI குரலை பகுப்பாய்வு செய்து படிவத்தை நிரப்புகிறது...',
    'report.voiceSuccess': 'குரல் வெற்றிகரமாக மாற்றப்பட்டது! விவரங்கள் கீழே தானாகவே பூர்த்தி செய்யப்பட்டுள்ளன.',
    'report.voiceReRecord': 'மீண்டும் பதிவு செய்க',
    'report.voicePlay': 'பதிவு செய்ததை கேட்க',
    'report.voicePause': 'நிறுத்தவும்',
    'report.voiceTip': 'குறிப்பு: இணையதள பெயர், வாட்ஸ்அப் எண், UPI மூலம் அனுப்பிய தொகை மற்றும் நடந்தவற்றை தெளிவாக கூறவும்.',

    // Footer
    'footer.desc': 'SafeCart என்பது போலி ஆன்லைன் கடைகள், இன்ஸ்டாகிராம் மோசடிகள், வாட்ஸ்அப் மிரட்டல்கள் மற்றும் போலி கூரியர் திட்டங்களில் இருந்து பொதுமக்களை பாதுகாக்கும் தளமாகும்.',
    'footer.navigation': 'முக்கிய பக்கங்கள்',
    'footer.resources': 'வளங்கள்',
    'footer.legal': 'அவசர உதவி எண்',
    'footer.emergencyText': 'நீங்கள் ஆன்லைனில் பணம் ஏமாந்திருந்தால், உடனடியாக 1930 எண்ணை அழைத்து வங்கிப் பணப் பரிவர்த்தனையை முடக்கவும் அல்லது cybercrime.gov.in-ல் புகாரளிக்கவும்.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('safecart_language');
      return (saved === 'ta' || saved === 'en') ? saved : 'ta'; // Default to Tamil as requested
    } catch {
      return 'ta';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('safecart_language', lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === 'en' ? 'ta' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: string, defaultVal?: string): string => {
    const currentDict = translations[language];
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    // Fallback to English
    if (translations.en[key]) {
      return translations.en[key];
    }
    return defaultVal || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
