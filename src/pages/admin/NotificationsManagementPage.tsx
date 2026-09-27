import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { NotificationItem, StudentItem } from '../../types';
import { Bell, Send, Trash2, CheckCircle2 } from 'lucide-react';
import { formatDateTimeArabic } from '../../utils/helpers';

interface NotificationsManagementPageProps {
  students: StudentItem[];
}

export const NotificationsManagementPage: React.FC<NotificationsManagementPageProps> = ({
  students,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'notifications'), (snap) => {
      const list: NotificationItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) }));
      setNotifications(list);
    });
    return () => unsub();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setSentSuccess(false);
    try {
      if (targetUserId === 'all') {
        const uniqueUserIds = Array.from(new Set(students.map((s) => s.userId).filter(Boolean)));
        if (uniqueUserIds.length === 0) {
          await addDoc(collection(db, 'notifications'), {
            userId: 'broadcast',
            title: title.trim(),
            message: message.trim(),
            type,
            isRead: false,
            link: 'student-dashboard',
            createdAt: serverTimestamp(),
          });
        } else {
          for (const uid of uniqueUserIds) {
            await addDoc(collection(db, 'notifications'), {
              userId: uid,
              title: title.trim(),
              message: message.trim(),
              type,
              isRead: false,
              link: 'student-dashboard',
              createdAt: serverTimestamp(),
            });
          }
        }
      } else {
        await addDoc(collection(db, 'notifications'), {
          userId: targetUserId,
          title: title.trim(),
          message: message.trim(),
          type,
          isRead: false,
          link: 'student-dashboard',
          createdAt: serverTimestamp(),
        });
      }
      setTitle('');
      setMessage('');
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3500);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(db, 'notifications', id));
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center gap-3.5 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center shadow-md">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900">
            إدارة الإشعارات والتنبيهات
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            إرسال إشعارات مباشرة للطلاب وأولياء الأمور ومتابعة سجل التنبيهات المرسلة
          </p>
        </div>
      </div>

      {sentSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-2.5 text-emerald-900 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>تم إرسال الإشعار بنجاح.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Send Notification Form */}
        <form
          onSubmit={handleSend}
          className="lg:col-span-5 bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4 h-fit"
        >
          <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-3">
            إرسال إشعار جديد
          </h3>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">المستلم</label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-bold"
            >
              <option value="all">جميع الطلاب المسجلين ({students.length})</option>
              {students.map((st) => (
                <option key={st.id} value={st.userId}>
                  {st.studentName} ({st.studentNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">نوع الإشعار</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-bold"
            >
              <option value="info">معلومة عامة (Info)</option>
              <option value="success">قبول / تهنئة (Success)</option>
              <option value="warning">تنبيه مهم (Warning)</option>
              <option value="error">إشعار عاجل (Alert)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">عنوان الإشعار</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: موعد بدء الدراسة للعام الجديد"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">نص الرسالة</label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب تفاصيل الإشعار هنا..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'جاري الإرسال...' : 'إرسال الإشعار الآن'}</span>
          </button>
        </form>

        {/* Sent Notifications List */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-3">
            سجل الإشعارات المرسلة ({notifications.length})
          </h3>

          {notifications.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              لا توجد إشعارات مسجلة حالياً
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900">{n.title}</span>
                      <span className="text-[10px] text-stone-400">
                        {formatDateTimeArabic(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">{n.message}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="حذف الإشعار"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
