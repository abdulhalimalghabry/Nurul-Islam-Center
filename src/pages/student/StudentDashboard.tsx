import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Application } from '../../types';
import { ApplicationTimeline } from '../../components/student/ApplicationTimeline';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CenterLogo } from '../../components/common/CenterLogo';
import {
  FilePlus,
  GraduationCap,
  Calendar,
  School,
  FileText,
  Clock,
  User,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Phone,
  CheckCircle,
} from 'lucide-react';
import { formatDateArabic } from '../../utils/helpers';

interface StudentDashboardProps {
  onNavigate: (view: string) => void;
  onEditApplication: (app: Application) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onEditApplication,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'applications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const apps: Application[] = [];
        snapshot.forEach((d) => {
          apps.push({ id: d.id, ...(d.data() as Omit<Application, 'id'>) });
        });
        setApplications(apps);
        setLoading(false);
      },
      (error) => {
        console.warn('Error fetching student applications:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return <LoadingSpinner text="جاري تحميل بيانات حساب الطالب..." className="py-24" />;
  }

  const latestApp = applications[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8" dir="rtl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 p-6 sm:p-8 text-white shadow-md border border-emerald-700/50">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <CenterLogo size="lg" variant="light" className="hidden sm:inline-flex" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-amber-300 border border-emerald-600/60">
                <Sparkles className="w-3.5 h-3.5" />
                <span>بوابة أولياء الأمور والطلاب</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                مرحبًا، {userProfile?.fullName || 'عزيزنا الطالب'}!
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                يمكنك من خلال هذه اللوحة متابعة مسار طلب التسجيل بمركز نور الإسلام، واستعراض نتائج القبول، والفصل الدراسي المخصص.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {!latestApp || latestApp.status === 'rejected' ? (
              <button
                onClick={() => onNavigate('new-application')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-xs sm:text-sm transition shadow-md cursor-pointer"
              >
                <FilePlus className="w-4 h-4 text-stone-900" />
                <span>تقديم طلب تسجيل جديد</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Decorative background Islamic pattern */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-700/20 blur-2xl pointer-events-none" />
      </div>

      {/* Main Content Area */}
      {applications.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-2xl mx-auto shadow-xs space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
            <GraduationCap className="w-10 h-10" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-stone-900">لا يوجد طلب تسجيل مقدم حالياً</h3>
            <p className="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
              لم تقم بتقديم طلب تسجيل لطالب في مركز نور الإسلام بعد. قم بتعبئة الاستمارة الإلكترونية الآن للانضمام إلى المركز في العام الدراسي الجديد.
            </p>
          </div>
          <div>
            <button
              onClick={() => onNavigate('new-application')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
            >
              <FilePlus className="w-4 h-4 text-amber-300" />
              <span>بدء تعبئة استمارة التسجيل</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Application Status Display */
        <div className="space-y-8">
          {applications.map((app) => (
            <div key={app.id || app.applicationNumber} className="space-y-6">
              {/* Application Timeline & Decision View */}
              <ApplicationTimeline
                application={app}
                onEditRequested={() => onEditApplication(app)}
              />

              {/* Application Details Summary Card */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-700" />
                    بيانات الطالب المسجلة في الطلب
                  </h3>
                  <StatusBadge status={app.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-stone-400 block mb-1">اسم الطالب</span>
                    <span className="font-bold text-stone-900">{app.studentName}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-1">المرحلة والصف</span>
                    <span className="font-bold text-stone-900">
                      {app.stageName || 'الابتدائية'} - {app.targetGrade}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-1">ولي الأمر</span>
                    <span className="font-bold text-stone-900">
                      {app.parentName} ({app.parentRelationship || 'ولي الأمر'})
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-1">رقم هاتف التواصل</span>
                    <span className="font-mono text-stone-900">{app.phone || app.parentPhone}</span>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                {app.documents && Object.keys(app.documents).length > 0 && (
                  <div className="mt-5 pt-4 border-t border-stone-100">
                    <span className="text-xs font-bold text-stone-700 block mb-2">
                      الوثائق المرفوعة في الطلب:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {app.documents.photoUrl && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-[11px] text-stone-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>الصورة الشخصية</span>
                        </div>
                      )}
                      {app.documents.certificateUrl && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-[11px] text-stone-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>الشهادة الدراسية</span>
                        </div>
                      )}
                      {app.documents.idDocumentUrl && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-[11px] text-stone-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>وثيقة الهوية / الإقامة</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Support / Help Card */}
      <div className="bg-stone-100/70 rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-600">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-[#1b5e20] shrink-0" />
          <p>
            هل لديك أي استفسار حول إجراءات القبول بمركز نور الإسلام (مويالي - إثيوبيا)؟ تواصل مباشرة مع قسم شؤون الطلاب.
          </p>
        </div>
        <button
          onClick={() => onNavigate('contact')}
          className="flex items-center gap-2 text-[#1b5e20] font-bold bg-white hover:bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 transition cursor-pointer shrink-0"
        >
          <Phone className="w-3.5 h-3.5 text-[#1b5e20]" />
          <span>تواصل معنا</span>
        </button>
      </div>
    </div>
  );
};
