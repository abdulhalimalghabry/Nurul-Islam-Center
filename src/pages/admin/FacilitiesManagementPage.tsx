import React, { useState, useEffect } from 'react';
import { CenterSettings, FacilityItem } from '../../types';
import { OFFICIAL_FACILITIES } from '../../firebase/seedData';
import { Building2, Save, CheckCircle2, RotateCcw } from 'lucide-react';

interface FacilitiesManagementPageProps {
  settings: CenterSettings | null;
  onSaveSettings: (newSettings: CenterSettings) => Promise<void>;
}

export const FacilitiesManagementPage: React.FC<FacilitiesManagementPageProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [facilitiesIntro, setFacilitiesIntro] = useState(
    settings?.facilitiesIntro ||
      'يضم مركز نور الإسلام مجموعة من المرافق التعليمية والإدارية والخدمية التي تهيئ بيئة مناسبة للتعليم والتحفيظ والأنشطة الطلابية المختلفة، ومن أبرز هذه المكونات:'
  );
  const [classroomsCount, setClassroomsCount] = useState<number>(settings?.classroomsCount ?? 11);
  const [facilities, setFacilities] = useState<FacilityItem[]>(
    settings?.facilities && settings.facilities.length > 0
      ? settings.facilities
      : OFFICIAL_FACILITIES
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.facilitiesIntro) setFacilitiesIntro(settings.facilitiesIntro);
      setClassroomsCount(settings.classroomsCount ?? 11);
      if (settings.facilities && settings.facilities.length > 0) {
        setFacilities(settings.facilities);
      }
    }
  }, [settings]);

  const handleFacilityChange = (
    idx: number,
    field: keyof FacilityItem,
    value: string
  ) => {
    const updated = [...facilities];
    updated[idx] = { ...updated[idx], [field]: value };
    setFacilities(updated);
  };

  const handleResetDefaults = () => {
    setFacilities(OFFICIAL_FACILITIES);
    setClassroomsCount(11);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      await onSaveSettings({
        ...settings,
        facilitiesIntro,
        classroomsCount: Number(classroomsCount),
        facilities,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              إدارة مكونات ومرافق المركز (5 مرافق رسمية)
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              الفصول الدراسية (11 فصلاً)، قسم التحفيظ (3 فصول)، المكتبة، القاعة الكبرى، والمكاتب الإدارية
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>استعادة نصوص الملف التعريفي</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-2.5 text-emerald-900 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>تم حفظ تحديثات مرافق ومكونات المركز بنجاح.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              عدد الفصول الدراسية الفعلية بالمبنى
            </label>
            <input
              type="number"
              min={1}
              value={classroomsCount}
              onChange={(e) => setClassroomsCount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold font-mono"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              مقدمة قسم مكونات ومرافق المركز
            </label>
            <textarea
              rows={2}
              value={facilitiesIntro}
              onChange={(e) => setFacilitiesIntro(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {facilities.map((fac, idx) => (
            <div
              key={fac.id || idx}
              className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    العنوان المرقّم (باللون الأزرق)
                  </label>
                  <input
                    type="text"
                    value={fac.numberLabel}
                    onChange={(e) => handleFacilityChange(idx, 'numberLabel', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    الشارة التوضيحية (مثال: 11 فصلاً)
                  </label>
                  <input
                    type="text"
                    value={fac.badge || ''}
                    onChange={(e) => handleFacilityChange(idx, 'badge', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  الوصف التفصيلي للمرفق
                </label>
                <textarea
                  rows={3}
                  value={fac.description}
                  onChange={(e) => handleFacilityChange(idx, 'description', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs leading-relaxed"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ بيانات المرافق'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
