import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { AdminLog } from '../../types';
import { History, Shield, User, Clock, FileText } from 'lucide-react';
import { formatDateTimeArabic } from '../../utils/helpers';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'adminLogs'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items: AdminLog[] = [];
        snap.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as Omit<AdminLog, 'id'>) });
        });
        setLogs(items);
        setLoading(false);
      },
      (error) => {
        console.warn('Logs index or fetch note:', error);
        // Fallback without order if pending index
        const simpleQ = query(collection(db, 'adminLogs'), limit(50));
        onSnapshot(simpleQ, (s) => {
          const items: AdminLog[] = [];
          s.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<AdminLog, 'id'>) }));
          setLogs(items);
          setLoading(false);
        });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">سجل العمليات الإدارية</h1>
        <p className="text-xs text-stone-500 mt-1">
          سجل تدقيق يوثق كافة القرارات المتخذة (قبول، رفض، طلب تعديل، تحديث فصول) مع اسم المسؤول والتاريخ
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="جاري تحميل سجل التدقيق..." className="py-12" />
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs space-y-2">
            <History className="w-10 h-10 mx-auto text-stone-300" />
            <p>لا توجد سجلات عمليات حتى الآن.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 border-b border-stone-100 text-stone-500">
                <tr>
                  <th className="px-5 py-3.5 font-bold">نوع الإجراء</th>
                  <th className="px-5 py-3.5 font-bold">التفاصيل</th>
                  <th className="px-5 py-3.5 font-bold">المسؤول المنفذ</th>
                  <th className="px-5 py-3.5 font-bold">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/70 transition">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-bold text-[11px] border border-stone-200">
                        <Shield className="w-3.5 h-3.5 text-emerald-700" />
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-stone-700 max-w-md">
                      <p className="font-medium leading-relaxed">{log.details}</p>
                      {log.targetApplicationNumber && (
                        <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                          {log.targetApplicationNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-stone-800">
                      {log.adminEmail || 'الإدارة'}
                    </td>
                    <td className="px-5 py-3.5 text-stone-400 font-mono text-[11px]">
                      {formatDateTimeArabic(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
