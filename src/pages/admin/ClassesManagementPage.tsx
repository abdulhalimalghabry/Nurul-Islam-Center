import React, { useState } from 'react';
import { ClassItem, StageItem } from '../../types';
import { School, Edit2, Plus, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface ClassesManagementPageProps {
  classes: ClassItem[];
  stages: StageItem[];
  onUpdateClass: (classId: string, updates: Partial<ClassItem>) => Promise<void>;
  onCreateClass: (newClass: Omit<ClassItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const ClassesManagementPage: React.FC<ClassesManagementPageProps> = ({
  classes,
  stages,
  onUpdateClass,
  onCreateClass,
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(25);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Class Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newStageId, setNewStageId] = useState(stages[0]?.id || '');
  const [newGrade, setNewGrade] = useState('الصف الأول');
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState(25);

  const handleOpenEdit = (cls: ClassItem) => {
    setSelectedClass(cls);
    setName(cls.name);
    setCapacity(cls.capacity);
    setIsActive(cls.isActive);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedClass?.id) return;
    setSaving(true);
    try {
      await onUpdateClass(selectedClass.id, {
        name,
        capacity: Number(capacity),
        isActive,
      });
      setEditModalOpen(false);
    } catch (err) {
      alert('حدث خطأ أثناء تعديل الفصل.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      alert('يرجى كتابة اسم الفصل');
      return;
    }
    setSaving(true);
    try {
      const stage = stages.find((s) => s.id === newStageId);
      await onCreateClass({
        name: newName.trim(),
        grade: newGrade,
        stageId: newStageId,
        stageName: stage?.name || '',
        capacity: Number(newCapacity),
        currentStudents: 0,
        isActive: true,
        order: classes.length + 1,
      });
      setCreateModalOpen(false);
      setNewName('');
    } catch (err) {
      alert('حدث خطأ أثناء إنشاء الفصل الجديد.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">إدارة الفصول الدراسية (12 صفاً)</h1>
          <p className="text-xs text-stone-500 mt-1">
            متابعة الطاقة الاستيعابية، المقاعد الشاغرة، وتوزيع الطلاب على الشعب الدراسية
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>إضافة شعبة / فصل دراسي جديد</span>
        </button>
      </div>

      {/* Grouped by 3 Stages */}
      {stages.map((stage) => {
        const stageClasses = classes.filter((c) => c.stageId === stage.id);
        const totalCapacity = stageClasses.reduce((acc, c) => acc + c.capacity, 0);
        const totalStudents = stageClasses.reduce((acc, c) => acc + c.currentStudents, 0);

        return (
          <div key={stage.id} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">{stage.name}</h3>
                  <p className="text-xs text-stone-400">{stage.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs bg-stone-50 px-3.5 py-1.5 rounded-xl border border-stone-200">
                <span className="text-stone-500">إجمالي طلاب المرحلة:</span>
                <strong className="text-emerald-900 font-mono text-sm">{totalStudents}</strong>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500">الطاقة الكلية:</span>
                <strong className="text-stone-900 font-mono text-sm">{totalCapacity}</strong>
              </div>
            </div>

            {/* Classes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stageClasses.map((cls) => {
                const pct = Math.min(100, Math.round((cls.currentStudents / (cls.capacity || 1)) * 100));
                const available = Math.max(0, cls.capacity - cls.currentStudents);
                const isFull = available === 0;

                return (
                  <div
                    key={cls.id}
                    className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition relative space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-stone-900">{cls.name}</h4>
                      <button
                        onClick={() => handleOpenEdit(cls)}
                        className="p-1.5 text-stone-400 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                        title="تعديل السعة"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs text-stone-500">
                      الصف الدراسي: <strong className="text-stone-800">{cls.grade}</strong>
                    </div>

                    {/* Progress Fill Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">نسبة الإشغال:</span>
                        <span className="font-mono font-bold text-stone-800">{pct}%</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFull ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats details */}
                    <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 block">الطلاب المسجلون:</span>
                        <strong className="font-mono text-stone-900">{cls.currentStudents}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">السعة الكلية:</span>
                        <strong className="font-mono text-stone-900">{cls.capacity}</strong>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-stone-400 block">المتاح:</span>
                        <strong
                          className={`font-mono ${isFull ? 'text-rose-600 font-black' : 'text-emerald-700'}`}
                        >
                          {available} مقاعد
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Edit Class Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="تعديل بيانات وسعة الفصل"
        maxWidth="sm"
      >
        <div className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">اسم الفصل</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              السعة الاستيعابية (عدد المقاعد)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveClass"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
            />
            <label htmlFor="isActiveClass" className="text-xs font-bold text-stone-800 cursor-pointer">
              الفصل متاح ونشط لاستقبال الطلاب
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Class Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="إضافة فصل أو شعبة جديدة"
        maxWidth="md"
      >
        <div className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">المرحلة الدراسية</label>
            <select
              value={newStageId}
              onChange={(e) => {
                setNewStageId(e.target.value);
                const s = stages.find((st) => st.id === e.target.value);
                if (s?.grades?.[0]) setNewGrade(s.grades[0]);
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
            >
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">الصف الدراسي</label>
            <input
              type="text"
              value={newGrade}
              onChange={(e) => setNewGrade(e.target.value)}
              placeholder="مثال: الصف الأول"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              اسم الشعبة / الفصل
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="مثال: الصف الأول - ب"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">الطاقة الاستيعابية</label>
            <input
              type="number"
              min="1"
              max="100"
              value={newCapacity}
              onChange={(e) => setNewCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {saving ? 'جاري الإنشاء...' : 'إضافة الفصل'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
