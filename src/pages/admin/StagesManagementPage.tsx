import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { StageItem, ClassItem } from '../../types';
import { Layers, Edit2, Save, X, CheckCircle2 } from 'lucide-react';

interface StagesManagementPageProps {
  stages: StageItem[];
  classes: ClassItem[];
}

export const StagesManagementPage: React.FC<StagesManagementPageProps> = ({ stages, classes }) => {
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editGradesText, setEditGradesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const startEdit = (stage: StageItem) => {
    setEditingStageId(stage.id || null);
    setEditName(stage.name);
    setEditDesc(stage.description);
    setEditGradesText(stage.grades.join('، '));
  };

  const handleSaveStage = async (stageId?: string) => {
    if (!stageId) return;
    setSaving(true);
    try {
      const parsedGrades = editGradesText
        .split(/[,،\n]/)
        .map((g) => g.trim())
        .filter(Boolean);
      const currentStage = stages.find((s) => s.id === stageId);
      await setDoc(
        doc(db, 'stages', stageId),
        {
          ...(currentStage || {}),
          id: stageId,
          name: editName.trim(),
          description: editDesc.trim(),
          grades: parsedGrades,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setEditingStageId(null);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            إدارة المراحل التعليمية بالمركز (3 مراحل)
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            المرحلة الابتدائية، المرحلة المتوسطة، والمرحلة الثانوية — مع إمكانية تعديل مسميات الصفوف والوصف
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-bold text-[#1b5e20]">
          ملاحظة: المبنى الفعلي يضم 11 فصلاً دراسياً + 3 فصول تحفيظ
        </div>
      </div>

      {savedMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-2.5 text-emerald-900 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>تم تحديث بيانات المرحلة الدراسية بنجاح.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stages.map((stage) => {
          const stageClasses = classes.filter((c) => c.stageId === stage.id);
          const enrolled = stageClasses.reduce((sum, c) => sum + c.currentStudents, 0);
          const totalSeats = stageClasses.reduce((sum, c) => sum + c.capacity, 0);
          const isEditing = editingStageId === stage.id;

          return (
            <div
              key={stage.id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center font-bold shadow-md">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 bg-[#fef9c3] px-3 py-1 rounded-full border border-[#facc15]">
                      المرحلة {stage.order}
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(stage)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-[#1b5e20] hover:bg-emerald-50 transition cursor-pointer"
                        title="تعديل المرحلة"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">اسم المرحلة</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">وصف المرحلة</label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        الصفوف الدراسية (مفصولة بفاصلة)
                      </label>
                      <input
                        type="text"
                        value={editGradesText}
                        onChange={(e) => setEditGradesText(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveStage(stage.id)}
                        className="flex-1 py-2 rounded-xl bg-[#1b5e20] text-[#facc15] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStageId(null)}
                        className="px-3 py-2 rounded-xl bg-stone-100 text-stone-600 text-xs font-bold cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-stone-900">{stage.name}</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">{stage.description}</p>

                    <div className="pt-3 border-t border-stone-100">
                      <span className="text-xs font-bold text-stone-700 block mb-2">الصفوف المشمولة:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {stage.grades.map((gr: string) => (
                          <span
                            key={gr}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 text-[11px] font-semibold border border-stone-200"
                          >
                            {gr}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Stats Footer */}
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block">الشعب في النظام</span>
                  <strong className="text-stone-900 font-mono">{stageClasses.length} شعب</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block">الطلاب الحاليون</span>
                  <strong className="text-[#1b5e20] font-mono font-bold">{enrolled} طالب</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block">الطاقة الكلية</span>
                  <strong className="text-stone-900 font-mono">{totalSeats} مقعد</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
