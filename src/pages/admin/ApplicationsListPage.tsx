import React, { useState } from 'react';
import { Application, ApplicationStatus, StageItem } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import {
  Search,
  Filter,
  Eye,
  FileSpreadsheet,
  Download,
  Calendar,
  User,
  GraduationCap,
} from 'lucide-react';
import { formatDateArabic } from '../../utils/helpers';

interface ApplicationsListPageProps {
  applications: Application[];
  stages: StageItem[];
  onSelectApplication: (app: Application) => void;
}

export const ApplicationsListPage: React.FC<ApplicationsListPageProps> = ({
  applications,
  stages,
  onSelectApplication,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone.includes(searchTerm) ||
      app.nationalId.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesStage = stageFilter === 'all' || app.stageId === stageFilter;

    return matchesSearch && matchesStatus && matchesStage;
  });

  const exportCSV = () => {
    const headers = ['رقم الطلب', 'اسم الطالب', 'الهوية', 'المرحلة', 'الصف', 'ولي الأمر', 'رقم الهاتف', 'الحالة'];
    const rows = filteredApplications.map((a) => [
      a.applicationNumber,
      a.studentName,
      a.nationalId,
      a.stageName || '',
      a.targetGrade,
      a.parentName,
      a.phone,
      a.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `طلبات_التسجيل_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">إدارة طلبات التسجيل</h1>
          <p className="text-xs text-stone-500 mt-1">
            استعراض، فرز، والبت في طلبات التسجيل المقدمة بمركز نور الإسلام
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-700" />
          <span>تصدير البيانات (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، رقم الطلب، الهوية، أو الهاتف..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none pl-9"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
            >
              <option value="all">جميع الحالات ({applications.length})</option>
              <option value="submitted">تم الإرسال (جديد)</option>
              <option value="under_review">قيد المراجعة</option>
              <option value="accepted">تم القبول</option>
              <option value="needs_correction">يحتاج تعديل</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
            >
              <option value="all">جميع المراحل الدراسية</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredApplications.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-2">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-stone-300" />
              <p>لا توجد طلبات تطابق معايير البحث والفرز المحددة.</p>
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 border-b border-stone-100 text-stone-500">
                <tr>
                  <th className="px-5 py-3.5 font-bold">رقم الطلب</th>
                  <th className="px-5 py-3.5 font-bold">اسم الطالب</th>
                  <th className="px-5 py-3.5 font-bold">المرحلة والصف</th>
                  <th className="px-5 py-3.5 font-bold">ولي الأمر والهاتف</th>
                  <th className="px-5 py-3.5 font-bold">الحالة</th>
                  <th className="px-5 py-3.5 font-bold">تاريخ التقديم</th>
                  <th className="px-5 py-3.5 font-bold text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredApplications.map((app) => (
                  <tr key={app.id || app.applicationNumber} className="hover:bg-stone-50/70 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-stone-900">
                      {app.applicationNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-stone-900">{app.studentName}</div>
                      <span className="text-[10px] text-stone-400 font-mono">{app.nationalId}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-stone-800">{app.targetGrade}</span>
                      <p className="text-[10px] text-stone-400">{app.stageName || 'المرحلة'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-stone-800 font-medium">{app.parentName}</div>
                      <span className="font-mono text-stone-500 text-[11px]">{app.phone || app.parentPhone}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3.5 text-stone-400 font-mono text-[11px]">
                      {formatDateArabic(app.submittedAt || app.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-left">
                      <button
                        onClick={() => onSelectApplication(app)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-300" />
                        <span>مراجعة والبت</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
