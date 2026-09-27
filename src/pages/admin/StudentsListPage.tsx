import React, { useState } from 'react';
import { StudentItem, ClassItem, StageItem } from '../../types';
import {
  GraduationCap,
  Search,
  School,
  Download,
  Phone,
  User,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { formatDateArabic } from '../../utils/helpers';

interface StudentsListPageProps {
  students: StudentItem[];
  classes: ClassItem[];
  stages: StageItem[];
  onChangeStudentClass: (studentId: string, newClassId: string) => Promise<void>;
}

export const StudentsListPage: React.FC<StudentsListPageProps> = ({
  students,
  classes,
  stages,
  onChangeStudentClass,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState('all');
  const [selectedStudentForClassChange, setSelectedStudentForClassChange] = useState<StudentItem | null>(null);
  const [targetClassId, setTargetClassId] = useState('');
  const [updating, setUpdating] = useState(false);

  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.nationalId.includes(searchTerm) ||
      st.phone.includes(searchTerm);

    const matchesClass = selectedClassFilter === 'all' || st.classId === selectedClassFilter;
    const matchesStage = selectedStageFilter === 'all' || st.stageId === selectedStageFilter;

    return matchesSearch && matchesClass && matchesStage;
  });

  const handleUpdateClass = async () => {
    if (!selectedStudentForClassChange || !targetClassId) return;
    setUpdating(true);
    try {
      await onChangeStudentClass(selectedStudentForClassChange.id!, targetClassId);
      setSelectedStudentForClassChange(null);
    } catch (err) {
      alert('حدث خطأ أثناء تغيير الفصل.');
    } finally {
      setUpdating(false);
    }
  };

  const exportCSV = () => {
    const headers = ['الرقم الأكاديمي', 'اسم الطالب', 'الهوية', 'المرحلة', 'الصف', 'الفصل', 'هاتف ولي الأمر', 'الحالة'];
    const rows = filteredStudents.map((s) => [
      s.studentNumber,
      s.studentName,
      s.nationalId,
      s.stageName,
      s.grade,
      s.className,
      s.parentPhone || s.phone,
      s.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `قائمة_الطلاب_المقبولين_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">سجل الطلاب المقبولين</h1>
          <p className="text-xs text-stone-500 mt-1">
            قائمة الطلاب المنتظمين بمركز نور الإسلام، وتوزيعهم على الفصول الدراسية
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>تصدير قائمة الطلاب</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، الرقم الأكاديمي، أو الهوية..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none pl-9"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>

          <div>
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
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

          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
            >
              <option value="all">جميع الفصول ({classes.length} فصل)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-2">
              <GraduationCap className="w-10 h-10 mx-auto text-stone-300" />
              <p>لا يوجد طلاب مسجلون حالياً بهذه المعايير.</p>
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 border-b border-stone-100 text-stone-500">
                <tr>
                  <th className="px-5 py-3.5 font-bold">الرقم الأكاديمي</th>
                  <th className="px-5 py-3.5 font-bold">اسم الطالب</th>
                  <th className="px-5 py-3.5 font-bold">المرحلة والصف</th>
                  <th className="px-5 py-3.5 font-bold">الفصل المسجل به</th>
                  <th className="px-5 py-3.5 font-bold">هاتف ولي الأمر</th>
                  <th className="px-5 py-3.5 font-bold">تاريخ القبول</th>
                  <th className="px-5 py-3.5 font-bold text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id || st.studentNumber} className="hover:bg-stone-50/70 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-900 bg-emerald-50/30">
                      {st.studentNumber}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-stone-900">
                      <div>{st.studentName}</div>
                      <span className="text-[10px] text-stone-400 font-mono">{st.nationalId}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-stone-800">{st.grade}</span>
                      <p className="text-[10px] text-stone-400">{st.stageName}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        <School className="w-3 h-3 text-emerald-600" />
                        {st.className}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-stone-600">
                      {st.parentPhone || st.phone}
                    </td>
                    <td className="px-5 py-3.5 text-stone-400 font-mono text-[11px]">
                      {formatDateArabic(st.enrolledAt || st.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-left">
                      <button
                        onClick={() => {
                          setSelectedStudentForClassChange(st);
                          setTargetClassId(st.classId);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-[11px] transition cursor-pointer"
                      >
                        نقل الفصل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Change Class Modal */}
      {selectedStudentForClassChange && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-stone-200 shadow-2xl text-right">
            <h3 className="text-base font-bold text-stone-900 mb-1">
              تغيير الفصل الدراسي للطالب
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              الطالب: <strong>{selectedStudentForClassChange.studentName}</strong> (الصف: {selectedStudentForClassChange.grade})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  اختر الفصل الدراسي الجديد:
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-bold"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (السعة: {cls.capacity} | الحالي: {cls.currentStudents})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForClassChange(null)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleUpdateClass}
                  disabled={updating}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {updating ? 'جاري النقل...' : 'تأكيد النقل للفصل الجديد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
