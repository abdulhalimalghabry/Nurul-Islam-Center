import React, { useState, useEffect } from 'react';
import { CenterSettings, GoalItem } from '../../types';
import { Save, CheckCircle2, Plus, Trash2, MapPin } from 'lucide-react';
import { CenterLogo } from '../../components/common/CenterLogo';
import { OFFICIAL_GOALS } from '../../firebase/seedData';

interface CenterSettingsPageProps {
  settings: CenterSettings | null;
  onSaveSettings: (settings: CenterSettings) => Promise<void>;
}

export const CenterSettingsPage: React.FC<CenterSettingsPageProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [centerName, setCenterName] = useState(settings?.centerName || 'مركز نور الإسلام');
  const [centerNameEn, setCenterNameEn] = useState(
    settings?.centerNameEn || 'NURUL ISLAM CENTER MOYALE - ETHIOPIA'
  );
  const [tagline, setTagline] = useState(settings?.tagline || 'منارة للعلم والتربية الإسلامية');
  const [description, setDescription] = useState(settings?.description || '');
  const [foundingYearHijri, setFoundingYearHijri] = useState(settings?.foundingYearHijri || '1422هـ');
  const [foundingYearGregorian, setFoundingYearGregorian] = useState(
    settings?.foundingYearGregorian || '2001م'
  );
  const [historyText, setHistoryText] = useState(settings?.historyText || '');
  const [vision, setVision] = useState(settings?.vision || '');
  const [mission, setMission] = useState(settings?.mission || '');
  const [goals, setGoals] = useState<GoalItem[]>(
    settings?.goals && settings.goals.length > 0 ? settings.goals : OFFICIAL_GOALS
  );

  const [phone, setPhone] = useState(settings?.phone || '');
  const [whatsapp, setWhatsapp] = useState(settings?.whatsapp || '');
  const [email, setEmail] = useState(settings?.email || '');
  const [address, setAddress] = useState(
    settings?.address || 'مويالي - إثيوبيا | Moyale - Ethiopia'
  );
  const [locationUrl, setLocationUrl] = useState(settings?.locationUrl || '');

  const [academicYear, setAcademicYear] = useState(
    settings?.academicYear || '1447-1448هـ / 2026-2027م'
  );
  const [registrationOpen, setRegistrationOpen] = useState(settings?.registrationOpen ?? true);
  const [announcement, setAnnouncement] = useState(settings?.announcement || '');
  const [maxApplications, setMaxApplications] = useState(settings?.maxApplications || 500);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setCenterName(settings.centerName || 'مركز نور الإسلام');
      setCenterNameEn(settings.centerNameEn || 'NURUL ISLAM CENTER MOYALE - ETHIOPIA');
      setTagline(settings.tagline || 'منارة للعلم والتربية الإسلامية');
      setDescription(settings.description || '');
      setFoundingYearHijri(settings.foundingYearHijri || '1422هـ');
      setFoundingYearGregorian(settings.foundingYearGregorian || '2001م');
      setHistoryText(settings.historyText || '');
      setVision(settings.vision || '');
      setMission(settings.mission || '');
      if (settings.goals && settings.goals.length > 0) setGoals(settings.goals);
      setPhone(settings.phone || '');
      setWhatsapp(settings.whatsapp || '');
      setEmail(settings.email || '');
      setAddress(settings.address || 'مويالي - إثيوبيا | Moyale - Ethiopia');
      setLocationUrl(settings.locationUrl || '');
      setAcademicYear(settings.academicYear || '1447-1448هـ / 2026-2027م');
      setRegistrationOpen(settings.registrationOpen ?? true);
      setAnnouncement(settings.announcement || '');
      setMaxApplications(settings.maxApplications || 500);
    }
  }, [settings]);

  const handleGoalChange = (idx: number, field: keyof GoalItem, value: string) => {
    const updated = [...goals];
    updated[idx] = { ...updated[idx], [field]: value };
    setGoals(updated);
  };

  const handleAddGoal = () => {
    setGoals([
      ...goals,
      {
        id: `goal-${Date.now()}`,
        title: `هدف جديد ${goals.length + 1}`,
        description: '',
      },
    ]);
  };

  const handleRemoveGoal = (idx: number) => {
    if (goals.length <= 1) return;
    setGoals(goals.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await onSaveSettings({
        ...settings,
        centerName,
        centerNameEn,
        tagline,
        description,
        foundingYearHijri,
        foundingYearGregorian,
        historyText,
        vision,
        mission,
        goals,
        phone,
        whatsapp,
        email,
        address,
        locationUrl,
        academicYear,
        registrationOpen,
        announcement,
        maxApplications: Number(maxApplications),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6 text-right" dir="rtl">
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
        <CenterLogo size="lg" />
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            إعدادات الهوية ومحتوى مركز نور الإسلام (مويالي - إثيوبيا)
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            تعديل النبذة، تاريخ التأسيس، الرؤية، الرسالة، الأهداف السبعة، معلومات التواصل، ورابط الموقع الجغرافي (`locationUrl`)
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>تم حفظ وتحديث محتوى وإعدادات المركز بنجاح في قاعدة البيانات.</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-8"
      >
        {/* 1. Registration Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
          <div>
            <h4 className="text-sm font-bold text-stone-900">حالة فتح التسجيل الإلكتروني</h4>
            <p className="text-xs text-stone-500 mt-0.5">
              التحكم في استقبال طلبات التسجيل الجديدة للطلاب عبر البوابة.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRegistrationOpen(!registrationOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              registrationOpen ? 'bg-[#1b5e20] text-[#facc15]' : 'bg-rose-700 text-white'
            }`}
          >
            {registrationOpen ? 'التسجيل مفتوح حالياً ✓' : 'التسجيل مغلق ✕'}
          </button>
        </div>

        {/* 2. Official Names & Founding Year */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#144519] border-b border-stone-100 pb-2">
            أولاً: الهوية الرسمية وتاريخ التأسيس
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">الاسم العربي للمركز</label>
              <input
                type="text"
                required
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">الاسم الإنجليزي الرسمي</label>
              <input
                type="text"
                required
                value={centerNameEn}
                onChange={(e) => setCenterNameEn(e.target.value)}
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-left font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">العبارة التعريفية (Tagline)</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">العام الدراسي الحالي</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">عام التأسيس (هجري)</label>
              <input
                type="text"
                value={foundingYearHijri}
                onChange={(e) => setFoundingYearHijri(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">عام التأسيس (ميلادي)</label>
              <input
                type="text"
                value={foundingYearGregorian}
                onChange={(e) => setFoundingYearGregorian(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">نص تاريخ التأسيس</label>
              <textarea
                rows={2}
                value={historyText}
                onChange={(e) => setHistoryText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">نبذة عن مركز نور الإسلام</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 3. Vision & Mission */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#144519] border-b border-stone-100 pb-2">
            ثانياً: رؤية ورسالة المركز
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">رؤية المركز</label>
              <textarea
                rows={3}
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">رسالة المركز</label>
              <textarea
                rows={3}
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 4. Official Goals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-sm font-black text-[#144519]">
              ثالثاً: أهداف المركز ({goals.length} أهداف)
            </h3>
            <button
              type="button"
              onClick={handleAddGoal}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-[#1b5e20] text-xs font-bold border border-emerald-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة هدف</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g, idx) => (
              <div key={g.id || idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#1b5e20]">الهدف #{idx + 1}</span>
                  {goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(idx)}
                      className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={g.title}
                  onChange={(e) => handleGoalChange(idx, 'title', e.target.value)}
                  placeholder="عنوان الهدف المختصر"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold"
                />
                <textarea
                  rows={2}
                  value={g.description}
                  onChange={(e) => handleGoalChange(idx, 'description', e.target.value)}
                  placeholder="نص الهدف الرسمي"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 5. Contact & LocationUrl */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#144519] border-b border-stone-100 pb-2">
            رابعاً: معلومات التواصل والموقع الجغرافي (`locationUrl`)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">رقم الهاتف الرسمي</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="أدخل رقم الهاتف الرسمي للمركز"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-mono text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">رقم واتساب (WhatsApp)</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="أدخل رقم الواتساب إن وجد"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-mono text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="أدخل البريد الإلكتروني للمركز"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-mono text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">العنوان</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1d4ed8] mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>رابط موقع المركز على Google Maps (`locationUrl` الخاص بـ QR Code "موقعنا | Our Location")</span>
              </label>
              <input
                type="url"
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-mono text-left"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">الإعلان العام في الموقع</label>
              <input
                type="text"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] text-xs font-black transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ جميع التغييرات'}
          </button>
        </div>
      </form>
    </div>
  );
};
