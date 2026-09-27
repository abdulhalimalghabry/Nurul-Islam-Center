import React, { useState } from 'react';
import { Application, ClassItem, StageItem } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/Badge';
import {
  User,
  GraduationCap,
  BookOpen,
  FileText,
  School,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  Download,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { formatDateTimeArabic } from '../../utils/helpers';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  classes: ClassItem[];
  stages: StageItem[];
  onAccept: (app: Application, stageId: string, grade: string, classId: string, notes: string) => Promise<void>;
  onReject: (app: Application, reason: string, notes: string) => Promise<void>;
  onRequestCorrection: (app: Application, notes: string) => Promise<void>;
  onSetUnderReview: (app: Application) => Promise<void>;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  isOpen,
  onClose,
  application,
  classes,
  stages,
  onAccept,
  onReject,
  onRequestCorrection,
  onSetUnderReview,
}) => {
  if (!application) return null;

  const [activeAction, setActiveAction] = useState<'view' | 'accept' | 'reject' | 'correction'>('view');
  const [loading, setLoading] = useState(false);

  // Accept Form State
  const [selectedStageId, setSelectedStageId] = useState(application.stageId || stages[0]?.id || '');
  const [selectedGrade, setSelectedGrade] = useState(application.targetGrade || 'الصف الأول');
  const [selectedClassId, setSelectedClassId] = useState(
    application.classId || classes.find((c) => c.stageId === selectedStageId)?.id || ''
  );
  const [adminNotes, setAdminNotes] = useState(application.adminNotes || '');

  // Reject Form State
  const [rejectionReason, setRejectionReason] = useState('');

  // Correction Form State
  const [correctionNotes, setCorrectionNotes] = useState('');

  const currentStage = stages.find((s) => s.id === selectedStageId);
  const stageClasses = classes.filter((c) => c.stageId === selectedStageId && c.isActive);
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const availableSeats = selectedClass ? Math.max(0, selectedClass.capacity - selectedClass.currentStudents) : 0;
  const isClassFull = selectedClass ? selectedClass.currentStudents >= selectedClass.capacity : false;

  const handleConfirmAccept = async () => {
    if (!selectedClassId) {
      alert('يرجى اختيار الفصل الدراسي لتوزيع الطالب.');
      return;
    }
    setLoading(true);
    try {
      await onAccept(application, selectedStageId, selectedGrade, selectedClassId, adminNotes);
      setActiveAction('view');
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء قبول الطلب.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('يرجى إدخال سبب الرفض لتوضيحه لولي الأمر.');
      return;
    }
    setLoading(true);
    try {
      await onReject(application, rejectionReason, adminNotes);
      setActiveAction('view');
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء رفض الطلب.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCorrection = async () => {
    if (!correctionNotes.trim()) {
      alert('يرجى كتابة الملاحظات والتعديلات المطلوبة من الطالب.');
      return;
    }
    setLoading(true);
    try {
      await onRequestCorrection(application, correctionNotes);
      setActiveAction('view');
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إرسال طلب التعديل.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetReview = async () => {
    setLoading(true);
    try {
      await onSetUnderReview(application);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setActiveAction('view');
        onClose();
      }}
      title={`طلب التسجيل: ${application.applicationNumber}`}
      subtitle={`تاريخ التقديم: ${formatDateTimeArabic(application.submittedAt || application.createdAt)}`}
      maxWidth="4xl"
    >
      <div className="space-y-6 text-right" dir="rtl">
        {/* Status Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 font-medium">الحالة الحالية للطلب:</span>
            <StatusBadge status={application.status} size="md" />
          </div>

          {/* Quick Status Changers */}
          {activeAction === 'view' && (
            <div className="flex flex-wrap gap-2">
              {application.status === 'submitted' && (
                <button
                  type="button"
                  onClick={handleSetReview}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  وضع قيد المراجعة
                </button>
              )}

              {application.status !== 'accepted' && (
                <button
                  type="button"
                  onClick={() => setActiveAction('accept')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  قبول وتوزيع على فصل
                </button>
              )}

              {application.status !== 'needs_correction' && application.status !== 'accepted' && (
                <button
                  type="button"
                  onClick={() => setActiveAction('correction')}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  طلب تعديل
                </button>
              )}

              {application.status !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => setActiveAction('reject')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  رفض الطلب
                </button>
              )}
            </div>
          )}
        </div>

        {/* ACCEPT FORM VIEW */}
        {activeAction === 'accept' && (
          <div className="bg-emerald-50/80 border-2 border-emerald-400 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
              <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                إجراء قبول الطالب وتوزيعه على الفصل الدراسي
              </h4>
              <button
                onClick={() => setActiveAction('view')}
                className="text-xs text-stone-500 hover:text-stone-800"
              >
                إلغاء والعودة
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Stage */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">المرحلة الدراسية</label>
                <select
                  value={selectedStageId}
                  onChange={(e) => {
                    setSelectedStageId(e.target.value);
                    const st = stages.find((s) => s.id === e.target.value);
                    if (st?.grades?.[0]) setSelectedGrade(st.grades[0]);
                  }}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold"
                >
                  {stages.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">الصف الدراسي</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold"
                >
                  {currentStage?.grades.map((gr: string) => (
                    <option key={gr} value={gr}>
                      {gr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Classroom */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  الفصل الدراسي المخصص <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold"
                >
                  <option value="">-- اختر الفصل --</option>
                  {stageClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (السعة: {cls.capacity} | الحالي: {cls.currentStudents})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Capacity Indicator Banner */}
            {selectedClass && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                  isClassFull
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-white border-emerald-300 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isClassFull ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <School className="w-4 h-4 text-emerald-700" />
                  )}
                  <span>
                    <strong>{selectedClass.name}:</strong> السعة الكلية: {selectedClass.capacity} | المسجلون حاليًا: {selectedClass.currentStudents}
                  </span>
                </div>
                <div className="font-bold">
                  {isClassFull ? (
                    <span className="text-rose-600">تحذير: الفصل مكتمل السعة!</span>
                  ) : (
                    <span className="text-emerald-700">المقاعد المتاحة: {availableSeats} مقاعد</span>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ملاحظات أو توجيهات للطالب عند الحضور (تظهر في لوحة الطالب):
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="مثال: يرجى إحضار أصل الهوية والشهادة لاستلام الحقيبة الدراسية والزي الموحد يوم الأحد القادم..."
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveAction('view')}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-200 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={loading || !selectedClassId}
                className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Award className="w-4 h-4 text-amber-300" />
                {loading ? 'جاري الاعتماد...' : 'تأكيد القبول وتوليد الرقم الأكاديمي'}
              </button>
            </div>
          </div>
        )}

        {/* REJECT FORM VIEW */}
        {activeAction === 'reject' && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-200 pb-3">
              <h4 className="font-bold text-sm text-rose-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-700" />
                رفض طلب التسجيل
              </h4>
              <button
                onClick={() => setActiveAction('view')}
                className="text-xs text-stone-500 hover:text-stone-800"
              >
                إلغاء والعودة
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-900 mb-1.5">
                سبب الرفض (إلزامي - سيظهر للطالب في لوحته): <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="مثال: اكتمال الطاقة الاستيعابية للصف الدراسي المطلوب / عدم مطابقة شرط السن..."
                className="w-full px-4 py-2.5 bg-white rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ملاحظات إدارية إضافية:
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="ملاحظات داخلية أو نصيحة لولي الأمر..."
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveAction('view')}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-200 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={loading || !rejectionReason.trim()}
                className="px-6 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'جاري التنفيذ...' : 'تأكيد رفض الطلب وإشعار الطالب'}
              </button>
            </div>
          </div>
        )}

        {/* CORRECTION FORM VIEW */}
        {activeAction === 'correction' && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-orange-200 pb-3">
              <h4 className="font-bold text-sm text-orange-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-700" />
                طلب تعديل بيانات أو وثائق من الطالب
              </h4>
              <button
                onClick={() => setActiveAction('view')}
                className="text-xs text-stone-500 hover:text-stone-800"
              >
                إلغاء والعودة
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-orange-900 mb-1.5">
                التعديلات والمستندات المطلوبة (سيتم إشعار الطالب بها لفتح باب التعديل له): <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                placeholder="مثال: يرجى رفع صورة واضحة لشهادة الصف السابق بدقة أعلى، وتحديث رقم هاتف ولي الأمر..."
                className="w-full px-4 py-2.5 bg-white rounded-xl border border-orange-300 text-xs focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveAction('view')}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-200 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmCorrection}
                disabled={loading || !correctionNotes.trim()}
                className="px-6 py-2 bg-orange-700 hover:bg-orange-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال طلب التعديل للطالب'}
              </button>
            </div>
          </div>
        )}

        {/* READ-ONLY APPLICATION DETAILS TABS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Section 1: Personal Info */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 border-b border-stone-200 pb-2 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              البيانات الشخصية وبيانات ولي الأمر
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-stone-400 block">اسم الطالب بالعربية:</span>
                <span className="font-bold text-stone-900">{application.studentName}</span>
              </div>
              <div>
                <span className="text-stone-400 block">الاسم بالإنجليزية:</span>
                <span className="font-mono text-stone-800">{application.studentNameEn || '—'}</span>
              </div>
              <div>
                <span className="text-stone-400 block">تاريخ الميلاد:</span>
                <span className="text-stone-900">{application.dateOfBirth}</span>
              </div>
              <div>
                <span className="text-stone-400 block">الجنس:</span>
                <span className="font-semibold text-stone-900">
                  {application.gender === 'male' ? 'ذكر' : 'أنثى'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">الجنسية:</span>
                <span className="text-stone-900">{application.nationality}</span>
              </div>
              <div>
                <span className="text-stone-400 block">رقم الهوية / الجواز:</span>
                <span className="font-mono font-bold text-stone-900">{application.nationalId}</span>
              </div>
              <div>
                <span className="text-stone-400 block">ولي الأمر:</span>
                <span className="font-bold text-stone-900">
                  {application.parentName} ({application.parentRelationship || 'ولي أمر'})
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">هاتف ولي الأمر:</span>
                <span className="font-mono text-stone-900">{application.parentPhone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-stone-400 block">العنوان:</span>
                <span className="text-stone-800">{application.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Educational Info */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 border-b border-stone-200 pb-2 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              البيانات الأكاديمية والسابقة
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-stone-400 block">المرحلة المطلوبة:</span>
                <span className="font-bold text-stone-900">{application.stageName || 'الابتدائية'}</span>
              </div>
              <div>
                <span className="text-stone-400 block">الصف المطلوب:</span>
                <span className="font-bold text-emerald-800">{application.targetGrade}</span>
              </div>
              <div>
                <span className="text-stone-400 block">المدرسة السابقة:</span>
                <span className="text-stone-900">{application.previousSchool || '—'}</span>
              </div>
              <div>
                <span className="text-stone-400 block">الصف السابق:</span>
                <span className="text-stone-900">{application.previousGrade || '—'}</span>
              </div>
              <div>
                <span className="text-stone-400 block">النتيجة / التقدير:</span>
                <span className="text-stone-900">{application.lastAcademicResult || '—'}</span>
              </div>
              <div>
                <span className="text-stone-400 block">دراسة سابقة بالمركز:</span>
                <span className="font-semibold text-stone-900">
                  {application.hasPreviousStudyInCenter ? 'نعم' : 'لا'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-stone-400 block">ملاحظات الطالب / ولي الأمر:</span>
                <span className="text-stone-800">{application.notes || 'لا توجد'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Uploaded Documents */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
          <h4 className="text-xs font-bold text-emerald-900 border-b border-stone-200 pb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            الوثائق والمستندات المرفقة
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Photo */}
            <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0 border">
                  {application.documents?.photoUrl ? (
                    <img src={application.documents.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 m-2 text-stone-400" />
                  )}
                </div>
                <div className="text-xs truncate">
                  <p className="font-bold text-stone-800">الصورة الشخصية</p>
                  <span className="text-[10px] text-stone-400">
                    {application.documents?.photoUrl ? 'مرفوعة' : 'غير متوفرة'}
                  </span>
                </div>
              </div>
              {application.documents?.photoUrl && (
                <a
                  href={application.documents.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                  title="عرض"
                >
                  <Eye className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Certificate */}
            <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-xs truncate">
                  <p className="font-bold text-stone-800">الشهادة الدراسية</p>
                  <span className="text-[10px] text-stone-400">
                    {application.documents?.certificateUrl ? 'مرفوعة' : 'غير متوفرة'}
                  </span>
                </div>
              </div>
              {application.documents?.certificateUrl && (
                <a
                  href={application.documents.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                  title="عرض"
                >
                  <Eye className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* ID Document */}
            <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-xs truncate">
                  <p className="font-bold text-stone-800">الهوية / الجواز</p>
                  <span className="text-[10px] text-stone-400">
                    {application.documents?.idDocumentUrl ? 'مرفوعة' : 'غير متوفرة'}
                  </span>
                </div>
              </div>
              {application.documents?.idDocumentUrl && (
                <a
                  href={application.documents.idDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                  title="عرض"
                >
                  <Eye className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
