import React from 'react';
import { Phone, Mail, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { CenterSettings } from '../../types';
import { CenterLogo } from './CenterLogo';

interface FooterProps {
  settings?: CenterSettings | null;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  return (
    <footer
      className="bg-gradient-to-b from-[#144519] via-[#113a14] to-[#0b290e] text-emerald-50 border-t-4 border-[#facc15]"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Official Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CenterLogo size="md" variant="light" />
              <div>
                <span className="font-black text-xl text-white block">
                  {settings?.centerName || 'مركز نور الإسلام'}
                </span>
                <span
                  className="text-[11px] text-[#facc15] font-extrabold block font-sans"
                  dir="ltr"
                >
                  {settings?.centerNameEn || 'NURUL ISLAM CENTER MOYALE - ETHIOPIA'}
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-emerald-100/90">
              {settings?.description ||
                'يُعد مركز نور الإسلام من المراكز التعليمية الشرعية المتميزة، تأسس ليكون منارة للعلم والتربية الإسلامية، ويهدف إلى إعداد جيل حافظ للقرآن، متمكن من اللغة العربية، وقادر على خدمة مجتمعه وفق منهج أهل السنة والجماعة.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#facc15] font-bold pt-1">
              <Calendar className="w-4 h-4" />
              <span>
                تأسس عام: {settings?.foundingYearHijri || '1422هـ'} /{' '}
                {settings?.foundingYearGregorian || '2001م'}
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-black text-[#facc15] mb-4 border-r-3 border-[#4ade80] pr-2.5">
              روابط الموقع
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#facc15] transition cursor-pointer"
                >
                  الرئيسية
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#facc15] transition cursor-pointer"
                >
                  عن المركز (الملف التعريفي)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('register')}
                  className="hover:text-[#facc15] transition cursor-pointer"
                >
                  التسجيل الجديد
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('login')}
                  className="hover:text-[#facc15] transition cursor-pointer"
                >
                  متابعة طلب التسجيل
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-[#facc15] transition cursor-pointer"
                >
                  تواصل معنا
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin-dashboard')}
                  className="hover:text-[#facc15] transition cursor-pointer text-emerald-300/80"
                >
                  بوابة إدارة المركز
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Official Facilities Summary */}
          <div>
            <h3 className="text-sm font-black text-[#facc15] mb-4 border-r-3 border-[#4ade80] pr-2.5">
              مكونات ومرافق المركز
            </h3>
            <ul className="space-y-2 text-xs text-emerald-100">
              <li>• الفصول الدراسية ({settings?.classroomsCount ?? 11} فصلاً دراسياً)</li>
              <li>• قسم تحفيظ القرآن الكريم ({settings?.tahfeezClassesCount ?? 3} فصول)</li>
              <li>• مكتبة الكتب والمراجع الشرعية</li>
              <li>• القاعة الكبرى متعددة الاستخدامات</li>
              <li>• المكاتب الإدارية وشؤون الطلاب</li>
            </ul>
          </div>

          {/* Column 4: Location & Contact */}
          <div>
            <h3 className="text-sm font-black text-[#facc15] mb-4 border-r-3 border-[#4ade80] pr-2.5">
              موقعنا ومعلومات التواصل
            </h3>
            <div className="space-y-3 text-xs text-emerald-100">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#facc15] shrink-0 mt-0.5" />
                <span>{settings?.address || 'مويالي - إثيوبيا | Moyale - Ethiopia'}</span>
              </div>
              {settings?.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#facc15] shrink-0" />
                  <span dir="ltr" className="font-mono">
                    {settings.phone}
                  </span>
                </div>
              )}
              {settings?.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#facc15] shrink-0" />
                  <span dir="ltr" className="font-mono">
                    {settings.email}
                  </span>
                </div>
              )}
              <div className="pt-2">
                {settings?.locationUrl ? (
                  <a
                    href={settings.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#facc15] text-stone-950 font-black text-xs hover:bg-[#fde047] transition"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>موقعنا | Our Location</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <button
                    onClick={() => onNavigate('contact')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#facc15] text-stone-950 font-black text-xs hover:bg-[#fde047] transition cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>موقعنا | تواصل معنا</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-12 pt-6 border-t border-emerald-800/70 text-center flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-200 gap-4">
          <p className="font-bold text-white">
            © مركز نور الإسلام - جميع الحقوق محفوظة
          </p>
          <p className="text-[11px] text-[#facc15] font-extrabold font-sans" dir="ltr">
            NURUL ISLAM CENTER MOYALE - ETHIOPIA
          </p>
        </div>
      </div>
    </footer>
  );
};
