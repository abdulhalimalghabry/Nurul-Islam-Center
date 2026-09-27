import React from 'react';
import { Application, ClassItem, StudentItem, UserProfile } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import {
  Users,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  School,
  ArrowUpRight,
  UserCheck,
  Megaphone,
} from 'lucide-react';
import { formatDateArabic } from '../../utils/helpers';

interface AdminDashboardProps {
  applications: Application[];
  students: StudentItem[];
  classes: ClassItem[];
  users?: UserProfile[];
  bannersCount?: number;
  onSelectApplication: (app: Application) => void;
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  applications,
  students,
  classes,
  users = [],
  bannersCount = 0,
  onSelectApplication,
  onNavigateTab,
}) => {
  const totalApps = applications.length;
  const newApps = applications.filter((a) => a.status === 'submitted').length;
  const reviewApps = applications.filter((a) => a.status === 'under_review').length;
  const acceptedApps = applications.filter((a) => a.status === 'accepted').length;
  const rejectedApps = applications.filter((a) => a.status === 'rejected').length;
  const correctionApps = applications.filter((a) => a.status === 'needs_correction').length;
  const totalRegisteredUsers = users.length;

  const recentApplications = [...applications]
    .sort((a, b) => {
      const timeA = a.submittedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const timeB = b.submittedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    })
    .slice(0, 6);

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">لوحة الإدارة والمتابعة</h1>
          <p className="text-xs text-stone-500 mt-1">
            نظرة عامة فورية على طلبات التسجيل، الطاقة الاستيعابية للفصول، وأعداد الطلاب المقبولين
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('hero-slides')}
            className="px-4 py-2.5 bg-[#facc15] hover:bg-[#fde047] text-stone-950 rounded-xl text-xs font-black transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Megaphone className="w-4 h-4" />
            <span>المحتوى الرئيسي ({bannersCount})</span>
          </button>
          <button
            onClick={() => onNavigateTab('users')}
            className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-[#1b5e20] border border-emerald-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>الحسابات المسجلة ({totalRegisteredUsers})</span>
          </button>
          <button
            onClick={() => onNavigateTab('applications')}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>عرض كل الطلبات</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="الحسابات المسجلة"
          count={totalRegisteredUsers}
          icon={<UserCheck className="w-5 h-5" />}
          bgGradient="bg-[#1b5e20]"
          textColor="text-[#1b5e20]"
          onClick={() => onNavigateTab('users')}
        />
        <StatCard
          title="إجمالي الطلبات"
          count={totalApps}
          icon={<Users className="w-5 h-5" />}
          bgGradient="bg-stone-800"
          textColor="text-stone-900"
          onClick={() => onNavigateTab('applications')}
        />
        <StatCard
          title="طلبات جديدة"
          count={newApps}
          icon={<FileCheck2 className="w-5 h-5" />}
          bgGradient="bg-blue-600"
          textColor="text-blue-700"
          onClick={() => onNavigateTab('applications')}
        />
        <StatCard
          title="قيد المراجعة"
          count={reviewApps}
          icon={<Clock className="w-5 h-5" />}
          bgGradient="bg-amber-500"
          textColor="text-amber-700"
          onClick={() => onNavigateTab('applications')}
        />
        <StatCard
          title="تم القبول"
          count={acceptedApps}
          icon={<CheckCircle2 className="w-5 h-5" />}
          bgGradient="bg-emerald-600"
          textColor="text-emerald-700"
          onClick={() => onNavigateTab('students')}
        />
        <StatCard
          title="يحتاج تعديل / مرفوض"
          count={correctionApps + rejectedApps}
          icon={<AlertCircle className="w-5 h-5" />}
          bgGradient="bg-orange-500"
          textColor="text-orange-700"
          onClick={() => onNavigateTab('applications')}
        />
      </div>

      {/* Two columns: Recent Applications & Classes Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-base font-bold text-stone-900">أحدث طلبات التسجيل الواردة</h3>
              <p className="text-xs text-stone-400 mt-0.5">آخر الطلبات المقدمة عبر البوابة الإلكترونية</p>
            </div>
            <button
              onClick={() => onNavigateTab('applications')}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              عرض الكل ({applications.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentApplications.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                لا توجد طلبات تسجيل حتى الآن.
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-stone-400 border-b border-stone-100">
                    <th className="py-3 font-semibold">رقم الطلب</th>
                    <th className="py-3 font-semibold">اسم الطالب</th>
                    <th className="py-3 font-semibold">الصف المطلوب</th>
                    <th className="py-3 font-semibold">الحالة</th>
                    <th className="py-3 font-semibold">التاريخ</th>
                    <th className="py-3 font-semibold text-left">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {recentApplications.map((app) => (
                    <tr key={app.id || app.applicationNumber} className="hover:bg-stone-50/60 transition">
                      <td className="py-3 font-mono font-bold text-stone-900">{app.applicationNumber}</td>
                      <td className="py-3 font-bold text-stone-800">{app.studentName}</td>
                      <td className="py-3 text-stone-600">{app.targetGrade}</td>
                      <td className="py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3 text-stone-400 font-mono text-[11px]">
                        {formatDateArabic(app.submittedAt || app.createdAt)}
                      </td>
                      <td className="py-3 text-left">
                        <button
                          onClick={() => onSelectApplication(app)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-[11px] transition cursor-pointer"
                        >
                          مراجعة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Classes Capacity Summary (1 Col) */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <School className="w-5 h-5 text-emerald-700" />
                سعة الفصول الدراسية (12)
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">نسب الإشغال والمقاعد المتاحة</p>
            </div>
            <button
              onClick={() => onNavigateTab('classes')}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              إدارة الفصول
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {classes.map((cls) => {
              const pct = Math.min(100, Math.round((cls.currentStudents / (cls.capacity || 25)) * 100));
              const available = Math.max(0, cls.capacity - cls.currentStudents);
              const isFull = available === 0;

              return (
                <div key={cls.id} className="p-3 rounded-2xl border border-stone-100 bg-stone-50/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800">{cls.name}</span>
                    <span className="text-[11px] font-mono text-stone-500">
                      {cls.currentStudents} / {cls.capacity} ({available} مقاعد)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
