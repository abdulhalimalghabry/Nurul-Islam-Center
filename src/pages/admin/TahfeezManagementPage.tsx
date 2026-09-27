import React, { useState, useEffect } from 'react';
import { CenterSettings, TahfeezRoomItem } from '../../types';
import { OFFICIAL_TAHFEEZ_ROOMS } from '../../firebase/seedData';
import { BookMarked, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface TahfeezManagementPageProps {
  settings: CenterSettings | null;
  onSaveSettings: (newSettings: CenterSettings) => Promise<void>;
}

export const TahfeezManagementPage: React.FC<TahfeezManagementPageProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [tahfeezClassesCount, setTahfeezClassesCount] = useState<number>(
    settings?.tahfeezClassesCount ?? 3
  );
  const [tahfeezDescription, setTahfeezDescription] = useState<string>(
    settings?.tahfeezDescription ||
      'خصص المركز ثلاثة (3) فصول دراسية لقسم تحفيظ القرآن الكريم، تُعنى بتحفيظ كتاب الله ومراجعته، مع توفير الأجواء الهادئة التي تساعد الطلاب على الحفظ والإتقان.'
  );
  const [rooms, setRooms] = useState<TahfeezRoomItem[]>(
    settings?.tahfeezRooms && settings.tahfeezRooms.length > 0
      ? settings.tahfeezRooms
      : OFFICIAL_TAHFEEZ_ROOMS
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setTahfeezClassesCount(settings.tahfeezClassesCount ?? 3);
      if (settings.tahfeezDescription) setTahfeezDescription(settings.tahfeezDescription);
      if (settings.tahfeezRooms && settings.tahfeezRooms.length > 0) {
        setRooms(settings.tahfeezRooms);
      }
    }
  }, [settings]);

  const handleRoomChange = (index: number, field: keyof TahfeezRoomItem, value: string | number) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], [field]: value };
    setRooms(updated);
  };

  const handleAddRoom = () => {
    setRooms([
      ...rooms,
      {
        id: `tahfeez-room-${Date.now()}`,
        name: `فصل التحفيظ ${rooms.length + 1}`,
        focus: 'تحفيظ ومراجعة القرآن الكريم',
        description: 'حلقة قرآنية مخصصة لتحفيظ ومراجعة كتاب الله الكريم.',
        capacity: 25,
      },
    ]);
  };

  const handleRemoveRoom = (index: number) => {
    if (rooms.length <= 1) return;
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      await onSaveSettings({
        ...settings,
        tahfeezClassesCount: Number(tahfeezClassesCount),
        tahfeezDescription,
        tahfeezRooms: rooms,
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
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              إدارة قسم تحفيظ القرآن الكريم
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              إدارة بيانات قسم التحفيظ والفصول الثلاثة المخصصة للقرآن الكريم في المركز
            </p>
          </div>
        </div>
        <div className="bg-[#fef9c3] border border-[#facc15] px-4 py-2 rounded-2xl text-xs font-black text-stone-900">
          عدد فصول التحفيظ الرسمية: {tahfeezClassesCount} فصول
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-2.5 text-emerald-900 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>تم حفظ تحديثات قسم تحفيظ القرآن الكريم بنجاح.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              عدد فصول قسم التحفيظ (حسب الملف التعريفي: 3)
            </label>
            <input
              type="number"
              min={1}
              value={tahfeezClassesCount}
              onChange={(e) => setTahfeezClassesCount(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              الوصف الرسمي لقسم تحفيظ القرآن الكريم
            </label>
            <textarea
              rows={2}
              value={tahfeezDescription}
              onChange={(e) => setTahfeezDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs"
            />
          </div>
        </div>

        <div className="border-t border-stone-100 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-stone-900">
              تفاصيل فصول وحلقات قسم التحفيظ ({rooms.length})
            </h3>
            <button
              type="button"
              onClick={handleAddRoom}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-xs font-bold border border-emerald-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فصل تحفيظ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rooms.map((room, idx) => (
              <div
                key={room.id || idx}
                className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#1b5e20]">فصل #{idx + 1}</span>
                  {rooms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(idx)}
                      className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">اسم الفصل</label>
                  <input
                    type="text"
                    value={room.name}
                    onChange={(e) => handleRoomChange(idx, 'name', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">التخصص / المسار</label>
                  <input
                    type="text"
                    value={room.focus}
                    onChange={(e) => handleRoomChange(idx, 'focus', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">الوصف</label>
                  <textarea
                    rows={2}
                    value={room.description}
                    onChange={(e) => handleRoomChange(idx, 'description', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ بيانات قسم التحفيظ'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
