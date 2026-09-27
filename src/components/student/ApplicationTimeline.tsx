import React from 'react';
import { motion } from 'motion/react';
import { Application } from '../../types';
import {
  CheckCircle2,
  Clock,
  Send,
  FileCheck2,
  AlertCircle,
  XCircle,
  Award,
  Sparkles,
  School,
  FileEdit,
} from 'lucide-react';
import { formatDateTimeArabic } from '../../utils/helpers';

interface ApplicationTimelineProps {
  application: Application;
  onEditRequested?: () => void;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  application,
  onEditRequested,
}) => {
  const status = application.status;

  const isDraft = status === 'draft';
  const isSubmitted = status === 'submitted';
  const isUnderReview = status === 'under_review';
  const isAccepted = status === 'accepted';
  const isRejected = status === 'rejected';
  const isNeedsCorrection = status === 'needs_correction';

  const step1Done = true;
  const step2Done = !isDraft;
  const step3Done = isAccepted || isRejected || isNeedsCorrection;
  const step4Done = isAccepted || isRejected;

  const progressWidth = step4Done
    ? '100%'
    : step3Done || isUnderReview
    ? '75%'
    : step2Done
    ? '50%'
    : '25%';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-8"
      dir="rtl"
    >
      {/* Title & App Number */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <span className="text-xs font-semibold text-stone-500">رقم طلب التسجيل:</span>
          <h3 className="text-lg font-mono font-bold text-emerald-900 tracking-wider">
            {application.applicationNumber}
          </h3>
        </div>
        <div className="text-left">
          <span className="text-xs text-stone-400 block">تاريخ التقديم</span>
          <span className="text-xs font-semibold text-stone-700">
            {formatDateTimeArabic(application.submittedAt || application.createdAt)}
          </span>
        </div>
      </div>

      {/* Visual Timeline Stepper */}
      <div className="relative">
        <div className="grid grid-cols-4 gap-2 text-center relative z-10">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm mb-2 shadow-xs transition-all duration-300 ${
                step1Done ? 'bg-emerald-700 text-white ring-4 ring-emerald-100' : 'bg-stone-200 text-stone-500'
              }`}
            >
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-stone-900">إنشاء الطلب</span>
            <span className="text-[11px] text-emerald-700 font-medium mt-0.5">مكتمل ✓</span>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm mb-2 shadow-xs transition-all duration-300 ${
                step2Done
                  ? 'bg-emerald-700 text-white ring-4 ring-emerald-100'
                  : 'bg-stone-100 text-stone-400 border border-stone-300'
              }`}
            >
              <Send className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-stone-900">إرسال الطلب</span>
            <span className="text-[11px] text-stone-500 mt-0.5">
              {step2Done ? 'تم الإرسال ✓' : 'في انتظار الإرسال'}
            </span>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm mb-2 shadow-xs transition-all duration-300 ${
                step3Done
                  ? 'bg-emerald-700 text-white ring-4 ring-emerald-100'
                  : isUnderReview || isSubmitted
                  ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                  : 'bg-stone-100 text-stone-400 border border-stone-300'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-stone-900">مراجعة الإدارة</span>
            <span className="text-[11px] font-medium mt-0.5 text-stone-500">
              {step3Done ? 'تمت المراجعة ✓' : isUnderReview || isSubmitted ? 'قيد المراجعة ⏳' : 'في الانتظار'}
            </span>
          </motion.div>

          {/* Step 4 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center"
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm mb-2 shadow-xs transition-all duration-300 ${
                isAccepted
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-200'
                  : isRejected
                  ? 'bg-rose-600 text-white ring-4 ring-rose-200'
                  : isNeedsCorrection
                  ? 'bg-orange-500 text-white ring-4 ring-orange-200'
                  : 'bg-stone-100 text-stone-400 border border-stone-300'
              }`}
            >
              {isAccepted ? (
                <Award className="w-5 h-5 text-amber-300" />
              ) : isRejected ? (
                <XCircle className="w-5 h-5" />
              ) : isNeedsCorrection ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <span className="text-xs font-bold text-stone-900">نتيجة الطلب</span>
            <span className="text-[11px] font-semibold mt-0.5">
              {isAccepted ? (
                <span className="text-emerald-700">مقبول 🎉</span>
              ) : isRejected ? (
                <span className="text-rose-600">نعتذر، مرفوض</span>
              ) : isNeedsCorrection ? (
                <span className="text-orange-700">مطلوب تعديل</span>
              ) : (
                <span className="text-stone-400">بانتظار القرار</span>
              )}
            </span>
          </motion.div>
        </div>

        {/* Animated Progress Line behind steps */}
        <div className="absolute top-5 left-12 right-12 h-1.5 bg-stone-200 rounded-full -z-0 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: progressWidth }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full bg-gradient-to-l from-emerald-700 via-emerald-500 to-amber-500 rounded-full"
          />
        </div>
      </div>

      {/* Decision Detailed Message Cards */}
      {isAccepted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-2 border-emerald-400/80 rounded-2xl p-6 text-emerald-950"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-amber-300 flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-emerald-900">
                  تهانينا! تم قبول طلب تسجيل الطالب في مركز نور الإسلام 🎉
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-emerald-800">
                يسر إدارة مركز نور الإسلام إبلاغكم بقبول الطالب رسميًا وتوزيعه على الفصل الدراسي المخصص. يرجى مراجعة تفاصيل القبول أدناه لإتمام إجراءات الحضور.
              </p>

              {/* Assignment Details Badge Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-emerald-200 mt-4">
                <div>
                  <span className="text-[11px] text-stone-500 block">المرحلة الدراسية:</span>
                  <span className="text-sm font-bold text-stone-900">
                    {application.assignedStageName || application.stageName || 'المرحلة المقررة'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 block">الصف الدراسي:</span>
                  <span className="text-sm font-bold text-stone-900">
                    {application.assignedGrade || application.targetGrade}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-500 block">الفصل المخصص:</span>
                  <span className="text-sm font-bold text-emerald-800 flex items-center gap-1">
                    <School className="w-4 h-4 text-emerald-600" />
                    {application.assignedClassName || 'الفصل الأول - أ'}
                  </span>
                </div>
              </div>

              {application.studentIdGenerated && (
                <div className="mt-3 flex items-center gap-2 bg-emerald-900 text-white px-3.5 py-2 rounded-xl text-xs font-mono">
                  <span>الرقم الأكاديمي للطالب:</span>
                  <strong className="text-amber-300 text-sm font-bold">
                    {application.studentIdGenerated}
                  </strong>
                </div>
              )}

              {application.adminNotes && (
                <div className="mt-3 bg-white/70 p-3 rounded-xl border border-emerald-200/80 text-xs">
                  <span className="font-bold text-emerald-900 block mb-1">ملاحظات الإدارة للمقبول:</span>
                  <p className="text-stone-700">{application.adminNotes}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {isRejected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-rose-950"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <h4 className="text-base font-bold text-rose-900">
                نعتذر، لم يتم قبول طلب التسجيل في الوقت الحالي
              </h4>
              <p className="text-xs leading-relaxed text-rose-800">
                نشكركم على ثقتكم بمركز نور الإسلام، ونحيطكم علمًا بأنه تعذر قبول الطلب للأسباب التالية:
              </p>
              {application.rejectionReason && (
                <div className="bg-white/80 p-3.5 rounded-xl border border-rose-200 mt-2 text-xs">
                  <span className="font-bold text-rose-900 block mb-1">سبب الرفض:</span>
                  <p className="text-stone-800">{application.rejectionReason}</p>
                </div>
              )}
              {application.adminNotes && (
                <div className="bg-white/80 p-3.5 rounded-xl border border-rose-200 mt-2 text-xs">
                  <span className="font-bold text-stone-700 block mb-1">ملاحظات إضافية:</span>
                  <p className="text-stone-700">{application.adminNotes}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {isNeedsCorrection && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6 text-orange-950"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <h4 className="text-base font-bold text-orange-900">
                  طلبك يحتاج إلى تعديل أو استكمال بيانات
                </h4>
                <p className="text-xs text-orange-800 mt-1">
                  قامت الإدارة بمراجعة الطلب ووجدت بعض البيانات أو الوثائق التي تتطلب تحديثًا من طرفكم لإتمام القبول.
                </p>
              </div>

              {application.adminNotes && (
                <div className="bg-white/90 p-3.5 rounded-xl border border-orange-200 text-xs">
                  <span className="font-bold text-orange-900 block mb-1">الملاحظات والتعديلات المطلوبة:</span>
                  <p className="text-stone-800 font-medium leading-relaxed">{application.adminNotes}</p>
                </div>
              )}

              {onEditRequested && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={onEditRequested}
                  className="inline-flex items-center gap-2 bg-orange-700 hover:bg-orange-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <FileEdit className="w-4 h-4" />
                  تعديل بيانات الطلب وإعادة الإرسال
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {(isSubmitted || isUnderReview) && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-6 h-6 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-900 leading-relaxed">
            طلبك الآن <strong>{isUnderReview ? 'قيد المراجعة والتدقيق' : 'تم استلامه بنجاح'}</strong> لدى لجنة القبول والتسجيل بمركز نور الإسلام. ستصلك إشعارات وتحديثات فور اتخاذ القرار.
          </p>
        </div>
      )}
    </motion.div>
  );
};
