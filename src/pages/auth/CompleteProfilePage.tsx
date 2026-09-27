import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { CenterLogo } from '../../components/common/CenterLogo';
import { formatArabicErrorMessage } from '../../firebase/errors';

interface CompleteProfilePageProps {
  onCompleted: () => void;
}

export const CompleteProfilePage: React.FC<CompleteProfilePageProps> = ({ onCompleted }) => {
  const { currentUser, userProfile, completeUserProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(
    userProfile?.fullName || currentUser?.displayName || ''
  );
  const [phone, setPhone] = useState(
    userProfile?.phone || currentUser?.phoneNumber || ''
  );
  const [guardianRelation, setGuardianRelation] = useState(
    userProfile?.guardianRelation || 'طالب متقدم للتسجيل'
  );
  const [gender, setGender] = useState<'male' | 'female'>(
    userProfile?.gender || 'male'
  );
  const [address, setAddress] = useState(
    userProfile?.address || 'مويالي - إثيوبيا'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile?.fullName && !fullName) {
      setFullName(userProfile.fullName);
    }
    if (userProfile?.phone && !phone) {
      setPhone(userProfile.phone);
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    if (!cleanName || cleanName.length < 3) {
      setError('يرجى إدخال الاسم الكامل (ثلاثي أو رباعي) بشكل صحيح.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 6) {
      setError('يرجى إدخال رقم الهاتف المحمول (أو واتساب) للتواصل بخصوص القبول.');
      return;
    }

    if (!cleanAddress) {
      setError('يرجى إدخال العنوان أو المنطقة السكنية.');
      return;
    }

    setLoading(true);
    try {
      await completeUserProfile({
        fullName: cleanName,
        phone: cleanPhone,
        guardianRelation,
        gender,
        address: cleanAddress,
      });
      onCompleted();
    } catch (err: unknown) {
      console.error('Error completing Google profile:', err);
      setError(formatArabicErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-50"
      dir="rtl"
    >
      <div className="max-w-lg w-full space-y-6 bg-white p-7 sm:p-10 rounded-3xl border-2 border-[#1b5e20]/20 shadow-lg">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <CenterLogo size="xl" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#1b5e20] text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-[#1b5e20]" />
            <span>تم التحقق من حساب Google بنجاح</span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            استكمال المعلومات الأساسية للتسجيل الجديد
          </h2>
          <p className="text-[11px] font-extrabold text-[#1d4ed8] font-sans" dir="ltr">
            NURUL ISLAM CENTER MOYALE - ETHIOPIA
          </p>
          <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
            لإتمام إنشاء حسابك الجديد في قاعدة بيانات مركز نور الإسلام، يرجى تعبئة بياناتك الأساسية التالية قبل المتابعة.
          </p>
        </div>

        {/* Verified Google Email Badge */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#1b5e20] flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0 text-right">
              <span className="text-[11px] text-stone-500 block font-bold">
                البريد الإلكتروني المرتبط بالحساب:
              </span>
              <span
                className="text-xs font-mono font-bold text-stone-900 truncate block"
                dir="ltr"
              >
                {currentUser?.email || userProfile?.email}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 shrink-0 cursor-pointer"
            title="تغيير الحساب"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تغيير الحساب</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs font-bold">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Basic Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              الاسم الكامل الرباعي (للطالب أو ولي الأمر) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: محمد عبد الله أحمد"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none pr-10"
              />
              <User className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              رقم الهاتف المحمول / واتساب للتواصل <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 9XXXXXXXX / 09XXXXXXXX"
                dir="ltr"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none pr-10 text-left font-mono"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                صفة صاحب الحساب <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <select
                  value={guardianRelation}
                  onChange={(e) => setGuardianRelation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-none pr-9 bg-white"
                >
                  <option value="طالب متقدم للتسجيل">طالب متقدم للتسجيل</option>
                  <option value="ولي أمر طالب (الأب)">ولي أمر طالب (الأب)</option>
                  <option value="ولي أمر طالب (الأم)">ولي أمر طالب (الأم)</option>
                  <option value="ولي أمر طالب (أخ / عم / وصي)">ولي أمر طالب (أخ / عم / وصي)</option>
                </select>
                <Users className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                الجنس <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    gender === 'male'
                      ? 'border-[#1b5e20] bg-emerald-50 text-[#1b5e20]'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  ذكر
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    gender === 'female'
                      ? 'border-[#1b5e20] bg-emerald-50 text-[#1b5e20]'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  أنثى
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              العنوان / المدينة أو الحي السكني <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مويالي - إثيوبيا"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none pr-10"
              />
              <MapPin className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>جاري حفظ بيانات الحساب في قاعدة البيانات...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#facc15]" />
                  <span>حفظ البيانات الأساسية والمتابعة</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
