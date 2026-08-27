import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, ExternalLink, AlertCircle, HeartHandshake, PhoneCall } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { language } = useLanguage();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
      {/* Disclaimer Banner */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center text-slate-300 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong className="text-white uppercase tracking-wider">
              {language === 'ta' ? 'பாதுகாப்பு அறிவிப்பு:' : 'Operational Disclaimer:'}
            </strong>{' '}
            {language === 'ta'
              ? 'SafeCart தானியங்கி அல்காரிதம் மற்றும் சமூகத் தரவுகள் மூலம் எச்சரிக்கை வழங்குகிறது. புதிய இணையதளங்களில் பணம் செலுத்தும் முன் சுயசரிபார்ப்பு செய்யவும்.'
              : 'SafeCart provides heuristic risk indicators and community guidance. Always independently verify unfamiliar merchants before submitting payment.'}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Brand & Purpose */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-black text-base text-white tracking-tight uppercase">SafeCart</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed font-medium">
            {language === 'ta'
              ? 'ஆன்லைன் ஷாப்பிங் மற்றும் சமூக வலைத்தள மோசடிகளில் இருந்து நுகர்வோரை பாதுகாக்கும் நிகழ்நேர சைபர் பாதுகாப்பு தளம்.'
              : 'Empowering consumers with real-time cybersecurity intelligence, domain heuristics, community reports, and payment protection before placing online orders.'}
          </p>
          <div className="text-[10px] text-blue-400/80 font-mono font-bold uppercase tracking-wider">
            {language === 'ta' ? 'SSRF பாதுகாப்பு • விதிமுறை எஞ்சின் • AI ஆலோசகர்' : 'SSRF-Protected • Rule-Based Engine • Zero Tracking'}
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-2.5">
          <h4 className="font-black text-xs text-white uppercase tracking-widest">
            {language === 'ta' ? 'பாதுகாப்பு கருவிகள்' : 'Detection Tools'}
          </h4>
          <ul className="space-y-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <li>
              <Link to="/scanner" className="hover:text-blue-400 transition">
                {language === 'ta' ? 'இணையதள ஸ்கேனர்' : 'Website URL Scanner'}
              </Link>
            </li>
            <li>
              <Link to="/social-scanner" className="hover:text-pink-400 transition text-pink-300">
                {language === 'ta' ? 'Instagram / WhatsApp ஷீல்டு' : 'Insta / WhatsApp Shield'}
              </Link>
            </li>
            <li>
              <Link to="/ai-assistant" className="hover:text-purple-400 transition text-purple-300">
                {language === 'ta' ? 'AI ஆலோசகர் (Copilot)' : 'AI Copilot Assistant'}
              </Link>
            </li>
            <li>
              <Link to="/history" className="hover:text-blue-400 transition">
                {language === 'ta' ? 'ஆய்வு செய்த தளங்களின் வரலாறு' : 'Scanned Domains History'}
              </Link>
            </li>
            <li>
              <Link to="/report" className="hover:text-blue-400 transition">
                {language === 'ta' ? 'மோசடி புகார் பதிவு' : 'Report E-Commerce Fraud'}
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Resources & Guides */}
        <div className="space-y-2.5">
          <h4 className="font-black text-xs text-white uppercase tracking-widest">
            {language === 'ta' ? 'சைபர் விழிப்புணர்வு' : 'Cybersecurity Education'}
          </h4>
          <ul className="space-y-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <li>
              <Link to="/safety-tips" className="hover:text-blue-400 transition">
                {language === 'ta' ? 'போலி கடை எச்சரிக்கை அறிகுறிகள்' : 'Fake Store Red Flags'}
              </Link>
            </li>
            <li>
              <Link to="/safety-tips" className="hover:text-blue-400 transition">
                {language === 'ta' ? 'ஆபத்தான பேமெண்ட் முறைகள்' : 'Dangerous Payment Methods'}
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-blue-400 transition">
                {language === 'ta' ? 'பாதுகாப்பு அல்காரிதம் விவரம்' : 'Risk Engine Methodology'}
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-blue-400 transition">
                {language === 'ta' ? 'சமூக நம்பிக்கை கட்டமைப்பு' : 'Community Trust System'}
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Official Reporting Portals */}
        <div className="space-y-2.5">
          <h4 className="font-black text-xs text-white uppercase tracking-widest">
            {language === 'ta' ? 'அதிகாரப்பூர்வ புகார் உதவி' : 'Official Incident Reporting'}
          </h4>
          <p className="text-slate-400 text-xs font-medium leading-relaxed">
            {language === 'ta'
              ? 'பண இழப்பு அல்லது சைபர் மோசடி ஏற்பட்டால் உடனடியாக புகார் அளியுங்கள்:'
              : 'If you are a victim of financial theft, file reports directly with certified cybercrime authorities:'}
          </p>
          <ul className="space-y-1.5 text-xs font-semibold">
            <li className="flex items-center gap-1.5 text-slate-300">
              <PhoneCall className="w-3 h-3 text-red-400 shrink-0" />
              <span>National Cyber Helpline: <strong>1930</strong></span>
            </li>
            <li className="flex items-center gap-1.5 text-slate-300">
              <span>National Portal (cybercrime.gov.in)</span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </li>
            <li className="flex items-center gap-1.5 text-slate-300">
              <span>National Consumer Helpline (NCH): 1915</span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-6 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-medium">© {new Date().getFullYear()} SafeCart Security Platform. All rights reserved.</div>
          <div className="flex items-center gap-4 font-bold uppercase tracking-wider text-[11px]">
            <Link to="/about" className="hover:text-slate-300 transition">
              {language === 'ta' ? 'கட்டமைப்பு' : 'Architecture'}
            </Link>
            <Link to="/safety-tips" className="hover:text-slate-300 transition">
              {language === 'ta' ? 'பாதுகாப்பு குறிப்புகள்' : 'Safety Tips'}
            </Link>
            <Link to="/admin/login" className="hover:text-red-400 text-slate-400 font-mono text-[11px] transition">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
