import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { UserProfile, UserRole } from '../../types';
import {
  Users,
  Shield,
  GraduationCap,
  Search,
  UserPlus,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_UID } from '../../context/AuthContext';
import { formatDateArabic } from '../../utils/helpers';

export const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [newAdminIdentifier, setNewAdminIdentifier] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        const data = d.data() as UserProfile;
        list.push({
          ...data,
          uid: data.uid || d.id,
        });
      });
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setUsers(list);
    });
    return () => unsub();
  }, []);

  const handleToggleRole = async (u: UserProfile) => {
    const nextRole: UserRole = u.role === 'admin' ? 'student' : 'admin';
    await setDoc(
      doc(db, 'users', u.uid),
      {
        ...u,
        uid: u.uid,
        role: nextRole,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    if (nextRole === 'admin') {
      await setDoc(
        doc(db, 'admins', u.uid),
        { uid: u.uid, email: u.email?.toLowerCase().trim() || '', role: 'admin', createdAt: serverTimestamp() },
        { merge: true }
      );
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = newAdminIdentifier.trim();
    if (!raw) return;
    setAddingAdmin(true);
    try {
      const isEmail = raw.includes('@');
      if (isEmail) {
        const cleanEmail = raw.toLowerCase();
        let hash = 0;
        for (let i = 0; i < cleanEmail.length; i++) {
          hash = (hash << 5) - hash + cleanEmail.charCodeAt(i);
          hash |= 0;
        }
        const safeAscii = cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 14);
        const emailKey = `email-${safeAscii}-${Math.abs(hash).toString(36)}`;

        await setDoc(
          doc(db, 'admins', emailKey),
          {
            email: cleanEmail,
            fullName: newAdminName.trim() || 'مدير النظام',
            role: 'admin',
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        const existing = users.find((u) => u.email?.toLowerCase().trim() === cleanEmail);
        if (existing) {
          await updateDoc(doc(db, 'users', existing.uid), {
            role: 'admin',
            updatedAt: serverTimestamp(),
          });
          await setDoc(
            doc(db, 'admins', existing.uid),
            { uid: existing.uid, email: cleanEmail, role: 'admin', createdAt: serverTimestamp() },
            { merge: true }
          );
        }
        setSuccessMsg(`تم اعتماد البريد (${cleanEmail}) كحساب إدارة بنجاح.`);
      } else {
        const targetUid = raw;
        await setDoc(
          doc(db, 'admins', targetUid),
          {
            uid: targetUid,
            fullName: newAdminName.trim() || 'مدير النظام',
            role: 'admin',
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
        await setDoc(
          doc(db, 'users', targetUid),
          {
            uid: targetUid,
            ...(newAdminName.trim() ? { fullName: newAdminName.trim() } : {}),
            role: 'admin',
            profileCompleted: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        setSuccessMsg(`تم اعتماد المعرف (${targetUid}) كحساب إدارة بنجاح.`);
      }

      setNewAdminIdentifier('');
      setNewAdminName('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setAddingAdmin(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.uid?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search) ||
      u.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              إدارة المستخدمين والحسابات المسجلة ({users.length})
            </h1>
            <p className="text-xs text-stone-500 mt-0.5 flex flex-wrap items-center gap-2">
              <span>معرف حساب الإدارة المعتمد (UID):</span>
              <span
                className="font-mono font-bold text-[#1b5e20] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                dir="ltr"
              >
                {BOOTSTRAP_ADMIN_UID}
              </span>
              <span className="text-stone-400">|</span>
              <span className="font-mono text-stone-600" dir="ltr">
                {BOOTSTRAP_ADMIN_EMAIL}
              </span>
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد أو الهاتف أو UID..."
            className="w-full px-4 py-2.5 pr-9 rounded-xl border border-stone-300 text-xs"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
        </div>
      </div>

      {/* Add Admin by UID or Email Form */}
      <form
        onSubmit={handleAddAdmin}
        className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-black text-[#1b5e20]">
          <UserPlus className="w-4 h-4" />
          <span>إضافة أو اعتماد حساب إدارة جديد (برقم المعرف UID أو البريد الإلكتروني)</span>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
            placeholder="اسم المدير (اختياري)"
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs"
          />
          <input
            type="text"
            required
            value={newAdminIdentifier}
            onChange={(e) => setNewAdminIdentifier(e.target.value)}
            placeholder="معرف الحساب (UID) أو البريد الإلكتروني"
            dir="ltr"
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs text-left font-mono"
          />
          <button
            type="submit"
            disabled={addingAdmin}
            className="px-5 py-2.5 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-bold text-xs transition cursor-pointer disabled:opacity-50"
          >
            {addingAdmin ? 'جاري الاعتماد...' : 'اعتماد كمدير للنظام'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            لا توجد حسابات مطابقة للبحث
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">الاسم الكامل والصفة</th>
                  <th className="py-3.5 px-4 font-bold">البريد الإلكتروني والمعرف (UID)</th>
                  <th className="py-3.5 px-4 font-bold">رقم الهاتف والعنوان</th>
                  <th className="py-3.5 px-4 font-bold">طريقة التسجيل وحالة البيانات</th>
                  <th className="py-3.5 px-4 font-bold">تاريخ التسجيل</th>
                  <th className="py-3.5 px-4 font-bold">الصلاحية</th>
                  <th className="py-3.5 px-4 font-bold">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((u) => {
                  const isComplete =
                    u.role === 'admin' ||
                    (u.profileCompleted !== false && Boolean(u.phone?.trim()) && Boolean(u.fullName?.trim()));
                  return (
                    <tr key={u.uid} className="hover:bg-stone-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{u.fullName || 'بدون اسم بعد'}</div>
                        {u.guardianRelation && (
                          <div className="text-[11px] text-stone-500 mt-0.5">{u.guardianRelation}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-stone-700 flex items-center gap-1" dir="ltr">
                          <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{u.email || '—'}</span>
                        </div>
                        <div className="font-mono text-[10px] text-stone-400 mt-0.5" dir="ltr">
                          UID: {u.uid}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-stone-700 flex items-center gap-1" dir="ltr">
                          <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{u.phone || 'لم يُدخل بعد'}</span>
                        </div>
                        {u.address && (
                          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{u.address}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-bold text-[10px]">
                            {u.authProvider === 'google' ? 'حساب Google' : 'بريد إلكتروني'}
                          </span>
                          {isComplete ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              مكتمل البيانات
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                              <Clock className="w-3 h-3" />
                              بانتظار استكمال البيانات
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">
                        {formatDateArabic(u.createdAt || u.updatedAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#144519] text-[#facc15] font-bold text-[11px]">
                            <Shield className="w-3 h-3" />
                            مدير نظام
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-bold text-[11px] border border-emerald-200">
                            <GraduationCap className="w-3 h-3" />
                            طالب / ولي أمر
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleRole(u)}
                          className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-[11px] transition cursor-pointer"
                        >
                          تغيير إلى {u.role === 'admin' ? 'طالب' : 'مدير'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
