import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CenterSettings } from '../../types';
import { CenterLogo } from '../../components/common/CenterLogo';
import { BrochureRibbonTitle, DiamondDivider } from '../../components/common/IslamicOrnaments';
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Send,
  CheckCircle2,
  ExternalLink,
  QrCode,
} from 'lucide-react';

interface ContactPageProps {
  settings: CenterSettings | null;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setPhone('');
      setMessage('');
    }, 4000);
  };

  return (
    <div className="space-y-14 pb-16 text-right" dir="rtl">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#144519] via-[#1b5e20] to-[#143d17] text-white py-12 sm:py-16 border-b-4 border-[#facc15]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex justify-center">
            <CenterLogo size="xl" variant="light" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">تواصل معنا | موقع المركز</h1>
          <p className="text-sm sm:text-base font-extrabold text-[#facc15] font-sans" dir="ltr">
            {settings?.centerNameEn || 'NURUL ISLAM CENTER MOYALE - ETHIOPIA'}
          </p>
          <DiamondDivider variant="yellow" />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details & Location Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-800/15 shadow-sm space-y-8"
          >
            <div className="space-y-2">
              <BrochureRibbonTitle variant="lightGreen" size="md">
                بيانات الاتصال الرسمية
              </BrochureRibbonTitle>
              <p className="text-xs sm:text-sm text-stone-600 pt-2 leading-relaxed">
                يمكنكم التواصل مع إدارة مركز نور الإسلام (مويالي - إثيوبيا) أو زيارة مقر المركز عبر بيانات الاتصال الموضحة أدناه:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Address */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3 sm:col-span-2">
                <div className="w-10 h-10 rounded-xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">عنوان المركز:</span>
                  <strong className="text-sm font-black text-stone-900">
                    {settings?.address || 'مويالي - إثيوبيا | Moyale - Ethiopia'}
                  </strong>
                </div>
              </div>

              {/* Phone */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">رقم الهاتف:</span>
                  {settings?.phone ? (
                    <strong className="text-sm font-mono font-bold text-stone-900" dir="ltr">
                      {settings.phone}
                    </strong>
                  ) : (
                    <span className="text-stone-500 italic">
                      (يُضاف من إعدادات لوحة الإدارة)
                    </span>
                  )}
                </div>
              </div>

              {/* WhatsApp */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">رقم واتساب (WhatsApp):</span>
                  {settings?.whatsapp ? (
                    <strong className="text-sm font-mono font-bold text-stone-900" dir="ltr">
                      {settings.whatsapp}
                    </strong>
                  ) : (
                    <span className="text-stone-500 italic">
                      (يُضاف من إعدادات لوحة الإدارة)
                    </span>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3 sm:col-span-2">
                <div className="w-10 h-10 rounded-xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">البريد الإلكتروني:</span>
                  {settings?.email ? (
                    <strong className="text-sm font-mono font-bold text-stone-900" dir="ltr">
                      {settings.email}
                    </strong>
                  ) : (
                    <span className="text-stone-500 italic">
                      (يُضاف من إعدادات لوحة الإدارة)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Our Location | موقعنا Box inspired by Brochure QR Section */}
            <div className="bg-gradient-to-br from-[#144519] via-[#1b5e20] to-[#113a14] text-white rounded-3xl p-6 sm:p-8 border-2 border-[#facc15] space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white text-stone-900 flex items-center justify-center shrink-0 shadow-md border-2 border-[#facc15]">
                    <QrCode className="w-9 h-9 text-[#1b5e20]" />
                  </div>
                  <div className="space-y-1 text-center sm:text-right">
                    <h3 className="text-lg font-black text-[#facc15]">
                      موقعنا | Our Location
                    </h3>
                    <p className="text-xs text-emerald-100">
                      {settings?.address || 'مويالي - إثيوبيا | Moyale - Ethiopia'}
                    </p>
                  </div>
                </div>

                {settings?.locationUrl ? (
                  <a
                    href={settings.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#facc15] hover:bg-[#fde047] text-stone-950 font-black text-xs shadow-md transition shrink-0"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>موقعنا (Google Maps)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div className="px-4 py-2.5 rounded-xl bg-white/15 border border-white/20 text-xs text-[#fde047] font-bold text-center">
                    زر "موقعنا" جاهز — يمكن إضافة رابط Google Maps (`locationUrl`) من لوحة الإدارة
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Direct Message Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 bg-white rounded-3xl p-8 border-2 border-emerald-800/15 shadow-sm space-y-6"
          >
            <div>
              <BrochureRibbonTitle variant="yellow" size="sm">
                مراسلة إدارة المركز
              </BrochureRibbonTitle>
              <h3 className="text-lg font-black text-stone-900 mt-3">
                أرسل استفسارك إلى شؤون الطلاب
              </h3>
            </div>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-6 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-700" />
                <p className="font-bold text-sm">تم استلام رسالتكم بنجاح!</p>
                <p className="text-xs text-stone-600">سيتم التواصل معكم في أقرب وقت.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسم الطالب أو ولي الأمر"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">رقم الهاتف أو الواتساب</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="أدخل رقم الهاتف للتواصل"
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">رسالتك أو استفسارك</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال الرسالة</span>
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};
