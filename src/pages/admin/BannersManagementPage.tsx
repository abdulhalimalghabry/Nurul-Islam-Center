import React, { useState, useRef } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { BannerItem } from '../../types';
import {
  optimizeBannerImage,
  isBannerCurrentlyActive,
  formatDateArabic,
} from '../../utils/helpers';
import {
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  Calendar,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
  Monitor,
  Smartphone,
  Link as LinkIcon,
  Layers,
  AlertCircle,
  Wand2,
} from 'lucide-react';

interface BannersManagementPageProps {
  banners: BannerItem[];
}

const INTERNAL_LINK_OPTIONS = [
  { value: 'register', label: 'صفحة التسجيل الجديد (إنشاء حساب طالب)' },
  { value: 'new-application', label: 'استمارة تقديم طلب التحاق طالب جديد' },
  { value: 'login', label: 'صفحة متابعة حالة الطلب (تسجيل الدخول)' },
  { value: 'about', label: 'صفحة عن المركز (الرؤية والرسالة والمرافق)' },
  { value: 'contact', label: 'صفحة تواصل معنا وموقع المركز' },
];

/**
 * Generates an authentic, high-resolution Islamic geometric banner dataURL
 * using the official Nurul Islam Center Moyale colors (#144519, #1b5e20, #facc15, #1d4ed8)
 * so admins can either upload their own photo OR generate a themed graphic background.
 */
function generateOfficialThemeBannerDataUrl(
  themeVariant: 'emerald_gold' | 'royal_green' | 'quran_light' = 'emerald_gold'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  if (themeVariant === 'emerald_gold') {
    grad.addColorStop(0, '#0c2b0f');
    grad.addColorStop(0.5, '#144519');
    grad.addColorStop(1, '#1b5e20');
  } else if (themeVariant === 'royal_green') {
    grad.addColorStop(0, '#0f3512');
    grad.addColorStop(0.55, '#166534');
    grad.addColorStop(1, '#1e3a8a');
  } else {
    grad.addColorStop(0, '#144519');
    grad.addColorStop(0.6, '#15803d');
    grad.addColorStop(1, '#ca8a04');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle geometric Islamic star / octagon lattice on the left side
  ctx.save();
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.14)';
  ctx.lineWidth = 2;

  const step = 110;
  for (let x = 0; x < canvas.width; x += step) {
    for (let y = 0; y < canvas.height; y += step) {
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeRect(-28, -28, 56, 56);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-28, -28, 56, 56);
      ctx.restore();
    }
  }
  ctx.restore();

  // Decorative glowing golden & light-green curves on the left side (for RTL visual balance)
  ctx.save();
  const radial = ctx.createRadialGradient(350, 350, 40, 350, 350, 420);
  radial.addColorStop(0, 'rgba(250, 204, 21, 0.28)');
  radial.addColorStop(0.5, 'rgba(74, 222, 128, 0.12)');
  radial.addColorStop(1, 'rgba(20, 69, 25, 0)');
  ctx.fillStyle = radial;
  ctx.beginPath();
  ctx.arc(350, 350, 420, 0, Math.PI * 2);
  ctx.fill();

  // Ornamental Golden Arch / Frame on Left Side
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(340, 350, 210, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(340, 350, 185, 0, Math.PI * 2);
  ctx.stroke();

  // 8-pointed Islamic Star inside the left medallion
  ctx.translate(340, 350);
  ctx.fillStyle = 'rgba(250, 204, 21, 0.12)';
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 2; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    ctx.fillRect(-95, -95, 190, 190);
    ctx.strokeRect(-95, -95, 190, 190);
    ctx.restore();
  }
  ctx.restore();

  // Gold top and bottom border accents
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, canvas.width, 8);
  ctx.fillRect(0, canvas.height - 8, canvas.width, 8);

  return canvas.toDataURL('image/webp', 0.88);
}

export const BannersManagementPage: React.FC<BannersManagementPageProps> = ({
  banners,
}) => {
  const { currentUser } = useAuth();

  // Sort banners by order ascending
  const sortedBanners = [...banners].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  // Form Modal / Panel State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [badgeText, setBadgeText] = useState('إعلان رسمي');
  const [imageUrl, setImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [displayType, setDisplayType] = useState<'image_with_text' | 'image_only'>(
    'image_with_text'
  );
  const [objectPosition, setObjectPosition] =
    useState<BannerItem['objectPosition']>('center');
  const [buttonText, setButtonText] = useState('سجل الآن');
  const [linkType, setLinkType] = useState<'internal' | 'external'>('internal');
  const [buttonLink, setButtonLink] = useState('register');
  const [order, setOrder] = useState<number>(sortedBanners.length + 1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const desktopFileRef = useRef<HTMLInputElement | null>(null);
  const mobileFileRef = useRef<HTMLInputElement | null>(null);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const resetForm = () => {
    setEditingBannerId(null);
    setTitle('');
    setDescription('');
    setBadgeText('إعلان رسمي — مركز نور الإسلام');
    setImageUrl('');
    setMobileImageUrl('');
    setDisplayType('image_with_text');
    setObjectPosition('center');
    setButtonText('سجل الآن');
    setLinkType('internal');
    setButtonLink('register');
    setOrder(sortedBanners.length + 1);
    setIsActive(true);
    setStartDate('');
    setEndDate('');
  };

  const handleOpenAdd = () => {
    resetForm();
    // Pre-generate an official themed graphic so the admin has a ready preview or can replace it with their own image
    setImageUrl(generateOfficialThemeBannerDataUrl('emerald_gold'));
    setIsFormOpen(true);
  };

  const handleOpenEdit = (banner: BannerItem) => {
    setEditingBannerId(banner.id || null);
    setTitle(banner.title || '');
    setDescription(banner.description || '');
    setBadgeText(banner.badgeText || '');
    setImageUrl(banner.imageUrl || '');
    setMobileImageUrl(banner.mobileImageUrl || '');
    setDisplayType(banner.displayType || 'image_with_text');
    setObjectPosition(banner.objectPosition || 'center');
    setButtonText(banner.buttonText || '');
    setLinkType(banner.linkType || 'internal');
    setButtonLink(banner.buttonLink || '');
    setOrder(banner.order ?? 1);
    setIsActive(banner.isActive !== false);
    setStartDate(banner.startDate || '');
    setEndDate(banner.endDate || '');
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Desktop Image File Upload
  const handleDesktopImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotice('error', 'يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)');
      return;
    }

    try {
      setUploadingDesktop(true);
      const optimizedDataUrl = await optimizeBannerImage(file, 1600, 0.84);
      setImageUrl(optimizedDataUrl);
      showNotice('success', 'تم رفع وضبط أبعاد صورة الإعلان بنجاح');
    } catch {
      showNotice('error', 'حدث خطأ أثناء معالجة الصورة، يرجى المحاولة مرة أخرى');
    } finally {
      setUploadingDesktop(false);
      if (desktopFileRef.current) desktopFileRef.current.value = '';
    }
  };

  // Handle Mobile Image File Upload
  const handleMobileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotice('error', 'يرجى اختيار ملف صورة صالح للهاتف');
      return;
    }

    try {
      setUploadingMobile(true);
      const optimizedDataUrl = await optimizeBannerImage(file, 1080, 0.84);
      setMobileImageUrl(optimizedDataUrl);
      showNotice('success', 'تم رفع صورة الهاتف المخصصة بنجاح');
    } catch {
      showNotice('error', 'حدث خطأ أثناء معالجة صورة الهاتف');
    } finally {
      setUploadingMobile(false);
      if (mobileFileRef.current) mobileFileRef.current.value = '';
    }
  };

  // Save (Create or Update) Banner in Firestore
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      showNotice('error', 'يرجى رفع صورة الإعلان أو إدخال رابط الصورة أولاً');
      return;
    }

    try {
      setSaving(true);
      const payload: Omit<BannerItem, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        badgeText: badgeText.trim(),
        imageUrl: imageUrl.trim(),
        mobileImageUrl: mobileImageUrl.trim(),
        displayType,
        objectPosition: objectPosition || 'center',
        buttonText: buttonText.trim(),
        buttonLink: buttonText.trim() ? buttonLink.trim() : '',
        linkType,
        order: Number(order) || 1,
        isActive,
        startDate: startDate || '',
        endDate: endDate || '',
        updatedAt: serverTimestamp(),
      };

      if (editingBannerId) {
        await updateDoc(doc(db, 'banners', editingBannerId), payload);
        await addDoc(collection(db, 'adminLogs'), {
          adminId: currentUser?.uid || '',
          adminEmail: currentUser?.email || '',
          action: 'تعديل إعلان في الرئيسية',
          details: `تم تحديث الإعلان: ${title || 'بنر إعلاني'}`,
          createdAt: serverTimestamp(),
        });
        showNotice('success', 'تم حفظ التعديلات على الإعلان بنجاح');
      } else {
        await addDoc(collection(db, 'banners'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        await addDoc(collection(db, 'adminLogs'), {
          adminId: currentUser?.uid || '',
          adminEmail: currentUser?.email || '',
          action: 'إضافة إعلان جديد',
          details: `تم إضافة إعلان جديد للصفحة الرئيسية: ${title || 'بنر إعلاني'}`,
          createdAt: serverTimestamp(),
        });
        showNotice('success', 'تم نشر الإعلان الجديد في الصفحة الرئيسية بنجاح');
      }

      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving banner:', err);
      showNotice('error', 'تعذر حفظ الإعلان، يرجى التحقق من الاتصال والمحاولة مجدداً');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active / Hidden Status
  const handleToggleActive = async (banner: BannerItem) => {
    if (!banner.id) return;
    try {
      const nextState = !banner.isActive;
      await updateDoc(doc(db, 'banners', banner.id), {
        isActive: nextState,
        updatedAt: serverTimestamp(),
      });
      showNotice(
        'success',
        nextState
          ? `تم تفعيل إظهار الإعلان "${banner.title || 'بدون عنوان'}" في الصفحة الرئيسية`
          : `تم إخفاء الإعلان "${banner.title || 'بدون عنوان'}" مؤقتاً`
      );
    } catch {
      showNotice('error', 'حدث خطأ أثناء تغيير حالة الإعلان');
    }
  };

  // Change Banner Order (Move Up / Down)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedBanners.length) return;

    const currentBanner = sortedBanners[index];
    const swapBanner = sortedBanners[targetIndex];
    if (!currentBanner.id || !swapBanner.id) return;

    try {
      const orderA = index + 1;
      const orderB = targetIndex + 1;
      await Promise.all([
        updateDoc(doc(db, 'banners', currentBanner.id), {
          order: orderB,
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'banners', swapBanner.id), {
          order: orderA,
          updatedAt: serverTimestamp(),
        }),
      ]);
      showNotice('success', 'تم تحديث ترتيب ظهور الإعلانات');
    } catch {
      showNotice('error', 'تعذر تحديث ترتيب الإعلان');
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (bannerId: string) => {
    try {
      const target = banners.find((b) => b.id === bannerId);
      await deleteDoc(doc(db, 'banners', bannerId));
      await addDoc(collection(db, 'adminLogs'), {
        adminId: currentUser?.uid || '',
        adminEmail: currentUser?.email || '',
        action: 'حذف إعلان من الرئيسية',
        details: `تم حذف الإعلان: ${target?.title || bannerId}`,
        createdAt: serverTimestamp(),
      });
      setDeleteConfirmId(null);
      showNotice('success', 'تم حذف الإعلان نهائياً');
    } catch {
      showNotice('error', 'حدث خطأ أثناء حذف الإعلان');
    }
  };

  // Seed 3 Official Sample Announcements into Firestore (100% Editable & Deletable)
  const handleSeedOfficialSampleBanners = async () => {
    try {
      setSaving(true);
      const samples: Array<Omit<BannerItem, 'id'>> = [
        {
          title: 'فتح باب القبول والتسجيل للعام الدراسي الجديد',
          description:
            'يسر مركز نور الإسلام (مويالي - إثيوبيا) الإعلان عن بدء استقبال طلبات الالتحاق للطلاب الجدد في المراحل الابتدائية والمتوسطة والثانوية عبر البوابة الإلكترونية.',
          badgeText: 'التسجيل مفتوح الآن',
          imageUrl: generateOfficialThemeBannerDataUrl('emerald_gold'),
          displayType: 'image_with_text',
          objectPosition: 'center',
          buttonText: 'سجل الآن إلكترونياً',
          buttonLink: 'register',
          linkType: 'internal',
          order: sortedBanners.length + 1,
          isActive: true,
          startDate: '',
          endDate: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        {
          title: 'حلقات وفصول قسم تحفيظ القرآن الكريم (3 فصول متخصصة)',
          description:
            'برامج متكاملة لتحفيظ كتاب الله الكريم وتصحيح التلاوة والتجويد والختم والإتقان بإشراف نخبة من المعلمين المجازين في أجواء إيمانية هادئة.',
          badgeText: 'قسم تحفيظ القرآن الكريم',
          imageUrl: generateOfficialThemeBannerDataUrl('quran_light'),
          displayType: 'image_with_text',
          objectPosition: 'center',
          buttonText: 'تعرف على المركز ومرافقه',
          buttonLink: 'about',
          linkType: 'internal',
          order: sortedBanners.length + 2,
          isActive: true,
          startDate: '',
          endDate: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        {
          title: 'المسابقة السنوية الكبرى في حفظ القرآن والعلوم الشرعية',
          description:
            'تُقام في القاعة الكبرى لمركز نور الإسلام التصفيات السنوية لمسابقة حفظ القرآن الكريم والمتون العلمية لطلاب جميع المراحل الدراسية.',
          badgeText: 'الفعاليات والأنشطة العلمية',
          imageUrl: generateOfficialThemeBannerDataUrl('royal_green'),
          displayType: 'image_with_text',
          objectPosition: 'center',
          buttonText: 'تواصل مع إدارة المركز',
          buttonLink: 'contact',
          linkType: 'internal',
          order: sortedBanners.length + 3,
          isActive: true,
          startDate: '',
          endDate: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      ];

      for (const sample of samples) {
        await addDoc(collection(db, 'banners'), sample);
      }

      showNotice('success', 'تم إضافة 3 إعلانات رسمية قابلة للتعديل والتحكم الكامل');
    } catch {
      showNotice('error', 'حدث خطأ أثناء إضافة الإعلانات النموذجية');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = banners.filter((b) => isBannerCurrentlyActive(b)).length;

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-black text-[#1b5e20]">
            <Megaphone className="w-4 h-4" />
            <span>نظام الإعلانات والبنرات الديناميكي (Hero Slider)</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900">
            إدارة الإعلانات والبنرات في الصفحة الرئيسية
          </h1>
          <p className="text-xs text-stone-500">
            أضف صور الإعلانات، العروض، مواسم التسجيل، والفعاليات مع التحكم الكامل في الترتيب، التفعيل، وتواريخ العرض.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {banners.length === 0 && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSeedOfficialSampleBanners}
              className="px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] border border-emerald-200 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>إضافة 3 إعلانات رسمية جاهزة للتجربة</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-5 py-3 rounded-2xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-black text-xs sm:text-sm transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة إعلان جديد</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-stone-400 hover:text-stone-700 px-2"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-bold block">إجمالي الإعلانات المضافة</span>
            <strong className="text-2xl font-black text-stone-900 font-mono mt-1 block">
              {banners.length}
            </strong>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 font-bold block">
              نشط ويظهر حالياً في الرئيسية
            </span>
            <strong className="text-2xl font-black text-[#1b5e20] font-mono mt-1 block">
              {activeCount}
            </strong>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#1b5e20] flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-800 font-bold block">مخفي أو خارج فترة الجدولة</span>
            <strong className="text-2xl font-black text-amber-700 font-mono mt-1 block">
              {banners.length - activeCount}
            </strong>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ADD / EDIT BANNER FORM PANEL WITH LIVE PREVIEW                        */}
      {/* ===================================================================== */}
      {isFormOpen && (
        <div className="bg-white rounded-3xl border-2 border-[#1b5e20] shadow-xl overflow-hidden">
          <div className="bg-gradient-to-l from-[#144519] via-[#1b5e20] to-[#0f3512] text-white p-6 flex items-center justify-between border-b-2 border-[#facc15]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#facc15] text-stone-950 flex items-center justify-center font-black">
                {editingBannerId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  {editingBannerId ? 'تعديل بيانات الإعلان' : 'إضافة إعلان / بنر جديد للصفحة الرئيسية'}
                </h2>
                <p className="text-xs text-emerald-100">
                  يمكنك رفع صورة بنر جاهزة أو إضافة صورة مع عنوان ووصف وزر توجيه مباشر
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
            >
              إلغاء وإغلاق
            </button>
          </div>

          <form onSubmit={handleSaveBanner} className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Right Column: Form Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Display Mode Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-stone-800">
                    1. نوع تصميم الإعلان وطريقة العرض
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDisplayType('image_with_text')}
                      className={`p-4 rounded-2xl border-2 text-right transition cursor-pointer ${
                        displayType === 'image_with_text'
                          ? 'border-[#1b5e20] bg-emerald-50/70'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <span className="font-black text-xs text-stone-900 block">
                        صورة + عنوان ووصف وزر إجراء
                      </span>
                      <span className="text-[11px] text-stone-500 mt-1 block">
                        يعرض تدرجاً أخضر إسلامياً أنيقاً مع نص واضح وزر فوق الصورة
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDisplayType('image_only')}
                      className={`p-4 rounded-2xl border-2 text-right transition cursor-pointer ${
                        displayType === 'image_only'
                          ? 'border-[#1b5e20] bg-emerald-50/70'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <span className="font-black text-xs text-stone-900 block">
                        صورة إعلان كاملة فقط (تصميم جاهز)
                      </span>
                      <span className="text-[11px] text-stone-500 mt-1 block">
                        مثالي إذا كانت الصورة تحتوي مسبقاً على التصميم والكتابة الكاملة
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Image Upload / URL / Theme Generator */}
                <div className="space-y-3 bg-stone-50 p-5 rounded-2xl border border-stone-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#1b5e20]" />
                      <span>2. صورة الإعلان الأساسية (Desktop Banner 16:7) *</span>
                    </label>
                    <span className="text-[11px] text-stone-500">
                      تُضغط وتُحسّن تلقائياً لسرعة التصفح
                    </span>
                  </div>

                  {/* Upload from device button + Theme generator buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      ref={desktopFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleDesktopImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingDesktop}
                      onClick={() => desktopFileRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {uploadingDesktop ? 'جاري معالجة الصورة...' : 'رفع صورة من الجهاز'}
                      </span>
                    </button>

                    {/* Official Center Theme Background Generators */}
                    <button
                      type="button"
                      onClick={() =>
                        setImageUrl(generateOfficialThemeBannerDataUrl('emerald_gold'))
                      }
                      className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200 text-[11px] font-bold transition cursor-pointer"
                    >
                      خلفية الهوية الخضراء والذهبية
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImageUrl(generateOfficialThemeBannerDataUrl('quran_light'))
                      }
                      className="px-3 py-2 rounded-xl bg-white hover:bg-amber-50 text-stone-700 border border-stone-200 text-[11px] font-bold transition cursor-pointer"
                    >
                      خلفية النور الذهبي
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImageUrl(generateOfficialThemeBannerDataUrl('royal_green'))
                      }
                      className="px-3 py-2 rounded-xl bg-white hover:bg-blue-50 text-stone-700 border border-stone-200 text-[11px] font-bold transition cursor-pointer"
                    >
                      خلفية الأخضر والأزرق
                    </button>
                  </div>

                  {/* Or paste external URL */}
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      أو ضع رابط صورة مباشر (URL):
                    </label>
                    <input
                      type="text"
                      value={imageUrl.startsWith('data:image/') ? '' : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/banner.jpg (اتركه فارغاً إذا رفعت صورة من جهازك)"
                      dir="ltr"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-mono focus:outline-none focus:border-[#1b5e20]"
                    />
                  </div>

                  {/* Object Position & Optional Mobile Image */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200/80">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        موضع تركيز الصورة (لمنع قص العناصر المهمة):
                      </label>
                      <select
                        value={objectPosition}
                        onChange={(e) =>
                          setObjectPosition(e.target.value as BannerItem['objectPosition'])
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                      >
                        <option value="center">الوسط (Center - افتراضي)</option>
                        <option value="top">أعلى الصورة (Top)</option>
                        <option value="bottom">أسفل الصورة (Bottom)</option>
                        <option value="right">يمين الصورة (Right)</option>
                        <option value="left">يسار الصورة (Left)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        صورة مخصصة للهاتف (اختياري):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={mobileFileRef}
                          type="file"
                          accept="image/*"
                          onChange={handleMobileImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={uploadingMobile}
                          onClick={() => mobileFileRef.current?.click()}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-xs font-bold text-stone-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-[#1b5e20]" />
                          <span>
                            {uploadingMobile
                              ? 'جاري الرفع...'
                              : mobileImageUrl
                              ? 'تغيير صورة الهاتف'
                              : 'رفع صورة للهاتف'}
                          </span>
                        </button>
                        {mobileImageUrl && (
                          <button
                            type="button"
                            onClick={() => setMobileImageUrl('')}
                            className="text-[11px] text-rose-600 hover:underline font-bold"
                          >
                            إزالة
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Text Content (Title, Badge, Short Description) */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        شارة / تصنيف الإعلان (فوق العنوان)
                      </label>
                      <input
                        type="text"
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value)}
                        placeholder="مثال: التسجيل مفتوح الآن | إعلان هام"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        عنوان الإعلان {displayType === 'image_only' && '(مرجعي للإدارة)'}
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثال: فتح باب القبول والتسجيل للعام الدراسي الجديد"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                      />
                    </div>
                  </div>

                  {displayType === 'image_with_text' && (
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        الوصف المختصر للإعلان
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="اكتب نبذة مختصرة وجذابة توضح تفاصيل الإعلان أو الفعالية..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs leading-relaxed focus:outline-none focus:border-[#1b5e20]"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Optional CTA Button & Link */}
                <div className="space-y-4 bg-stone-50 p-5 rounded-2xl border border-stone-200">
                  <label className="block text-xs font-black text-stone-800 flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 text-[#1b5e20]" />
                    <span>4. زر الإجراء والرابط عند الضغط (اختياري)</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        نص الزر (اتركه فارغاً لإخفاء الزر):
                      </label>
                      <input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="مثال: سجل الآن / التفاصيل"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        نوع الوجهة:
                      </label>
                      <select
                        value={linkType}
                        onChange={(e) => {
                          const nextType = e.target.value as 'internal' | 'external';
                          setLinkType(nextType);
                          if (nextType === 'internal' && !buttonLink) {
                            setButtonLink('register');
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                      >
                        <option value="internal">صفحة داخل موقع المركز</option>
                        <option value="external">رابط خارجي (URL / واتساب)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        الصفحة أو الرابط المستهدف:
                      </label>
                      {linkType === 'internal' ? (
                        <select
                          value={buttonLink}
                          onChange={(e) => setButtonLink(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                        >
                          {INTERNAL_LINK_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="url"
                          value={buttonLink}
                          onChange={(e) => setButtonLink(e.target.value)}
                          placeholder="https://..."
                          dir="ltr"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-mono focus:outline-none focus:border-[#1b5e20]"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Order, Status & Schedule Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ترتيب الظهور
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:outline-none focus:border-[#1b5e20]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      حالة الإعلان
                    </label>
                    <select
                      value={isActive ? 'active' : 'hidden'}
                      onChange={(e) => setIsActive(e.target.value === 'active')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                    >
                      <option value="active">نشط (يظهر في الرئيسية)</option>
                      <option value="hidden">مخفي (مسودة / غير مفعل)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      تاريخ بداية العرض (اختياري)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:border-[#1b5e20]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      تاريخ انتهاء العرض (اختياري)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:border-[#1b5e20]"
                    />
                  </div>
                </div>
              </div>

              {/* Left Column: Live Preview (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-800">
                      معاينة حية لشكل الإعلان في الموقع
                    </span>
                    <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                          previewDevice === 'desktop'
                            ? 'bg-white text-[#1b5e20] shadow-2xs'
                            : 'text-stone-500'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>حاسوب</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                          previewDevice === 'mobile'
                            ? 'bg-white text-[#1b5e20] shadow-2xs'
                            : 'text-stone-500'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>هاتف</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Preview Frame */}
                  <div
                    className={`relative rounded-3xl overflow-hidden bg-[#144519] border-2 border-[#facc15] shadow-lg mx-auto transition-all ${
                      previewDevice === 'mobile'
                        ? 'max-w-[290px] aspect-[4/3]'
                        : 'w-full aspect-[16/7] min-h-[240px]'
                    }`}
                  >
                    {imageUrl ? (
                      <img
                        src={
                          previewDevice === 'mobile' && mobileImageUrl
                            ? mobileImageUrl
                            : imageUrl
                        }
                        alt="معاينة الإعلان"
                        className={`w-full h-full object-cover ${
                          objectPosition === 'top'
                            ? 'object-top'
                            : objectPosition === 'bottom'
                            ? 'object-bottom'
                            : objectPosition === 'left'
                            ? 'object-left'
                            : objectPosition === 'right'
                            ? 'object-right'
                            : 'object-center'
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-emerald-200 text-xs">
                        لم يتم اختيار صورة بعد
                      </div>
                    )}

                    {displayType === 'image_with_text' && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-l from-[#0c2b0f]/95 via-[#144519]/75 to-transparent" />
                        <div className="absolute inset-0 p-5 flex flex-col justify-end sm:justify-center text-right space-y-2">
                          {badgeText && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-black text-[#facc15]">
                              <Sparkles className="w-3 h-3" />
                              <span>{badgeText}</span>
                            </div>
                          )}
                          <h4 className="text-sm sm:text-base font-black text-white line-clamp-2">
                            {title || 'عنوان الإعلان يظهر هنا'}
                          </h4>
                          {description && (
                            <p className="text-[11px] text-emerald-50 line-clamp-2 leading-relaxed">
                              {description}
                            </p>
                          )}
                          {buttonText && (
                            <div className="pt-1">
                              <span className="inline-block px-3.5 py-1.5 rounded-xl bg-[#facc15] text-stone-950 font-black text-[10px]">
                                {buttonText}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    ملاحظة: يتم عرض الإعلانات النشطة بالتتابع التلقائي السلس كل 6 ثوانٍ، مع إمكانية التنقل بالأسهم أو السحب باللمس على الهاتف.
                  </p>
                </div>

                {/* Form Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      resetForm();
                    }}
                    className="px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-7 py-3 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-black text-xs sm:text-sm transition shadow-md cursor-pointer"
                  >
                    {saving
                      ? 'جاري الحفظ...'
                      : editingBannerId
                      ? 'حفظ التعديلات'
                      : 'نشر الإعلان الآن'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* EXISTING BANNERS LIST & REORDERING                                    */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-stone-900">
            قائمة الإعلانات والبنرات الحالية ({sortedBanners.length})
          </h2>
          <span className="text-xs text-stone-500">
            استخدم أسهم الترتيب للتحكم في الإعلان الأول والثاني والثالث
          </span>
        </div>

        {sortedBanners.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#1b5e20] flex items-center justify-center mx-auto">
              <Megaphone className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-black text-stone-900">
                لا توجد إعلانات مصورة مضافة حالياً
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                عند عدم وجود إعلانات مضافة، يعرض الموقع تلقائياً بطاقة الترحيب الرسمية لمركز نور الإسلام. يمكنك إضافة إعلان جديد أو توليد باقة إعلانات نموذجية بضغطة زر.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-5 py-2.5 rounded-xl bg-[#1b5e20] text-[#facc15] font-black text-xs transition cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول إعلان</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSeedOfficialSampleBanners}
                className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition cursor-pointer flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4 text-[#1b5e20]" />
                <span>إضافة 3 إعلانات رسمية جاهزة</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedBanners.map((banner, idx) => {
              const currentlyShowing = isBannerCurrentlyActive(banner);

              return (
                <div
                  key={banner.id || idx}
                  className={`bg-white rounded-3xl p-4 sm:p-5 border-2 transition flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 ${
                    currentlyShowing
                      ? 'border-emerald-700/25 shadow-xs'
                      : 'border-stone-200 opacity-80 bg-stone-50/50'
                  }`}
                >
                  {/* Thumbnail + Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    {/* Order Badge & Up/Down Arrows */}
                    <div className="flex sm:flex-col items-center gap-1 bg-stone-100 p-1.5 rounded-2xl shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveOrder(idx, 'up')}
                        title="تحريك لأعلى"
                        className="p-1.5 rounded-xl hover:bg-white disabled:opacity-30 text-stone-700 transition cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-black font-mono text-[#1b5e20] px-2">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        disabled={idx === sortedBanners.length - 1}
                        onClick={() => handleMoveOrder(idx, 'down')}
                        title="تحريك لأسفل"
                        className="p-1.5 rounded-xl hover:bg-white disabled:opacity-30 text-stone-700 transition cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Banner Image Preview */}
                    <div className="relative w-full sm:w-52 aspect-[16/7] rounded-2xl overflow-hidden bg-[#144519] border border-stone-200 shrink-0">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title || 'صورة الإعلان'}
                        className="w-full h-full object-cover"
                      />
                      {banner.displayType === 'image_only' && (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          صورة كاملة
                        </span>
                      )}
                    </div>

                    {/* Text & Metadata */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {currentlyShowing ? (
                          <span className="text-emerald-700 font-black flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            نشط (يظهر في الرئيسية)
                          </span>
                        ) : (
                          <span className="text-stone-500 font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            {banner.isActive ? 'خارج فترة الجدولة' : 'مخفي مؤقتاً'}
                          </span>
                        )}

                        {banner.badgeText && (
                          <>
                            <span aria-hidden="true" className="text-stone-300">·</span>
                            <span className="text-[#1d4ed8] font-bold">{banner.badgeText}</span>
                          </>
                        )}

                        {(banner.startDate || banner.endDate) && (
                          <>
                            <span aria-hidden="true" className="text-stone-300">·</span>
                            <span className="text-stone-500 font-mono text-[11px] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {banner.startDate || 'الآن'} → {banner.endDate || 'مفتوح'}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-black text-stone-900 truncate">
                        {banner.title || 'إعلان مصور بدون عنوان نصي'}
                      </h3>

                      {banner.description && (
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {banner.description}
                        </p>
                      )}

                      {banner.buttonText && banner.buttonLink && (
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-0.5">
                          <span className="font-bold text-[#1b5e20]">
                            الزر: «{banner.buttonText}»
                          </span>
                          <span>←</span>
                          <span className="font-mono">{banner.buttonLink}</span>
                          {banner.linkType === 'external' && <ExternalLink className="w-3 h-3" />}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        banner.isActive
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] border border-emerald-200'
                      }`}
                    >
                      {banner.isActive ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>إخفاء</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>تفعيل</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(banner)}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    {deleteConfirmId === banner.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200">
                        <button
                          type="button"
                          onClick={() => banner.id && handleDeleteBanner(banner.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black cursor-pointer"
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-[11px] text-stone-600 font-bold cursor-pointer"
                        >
                          تراجع
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(banner.id || null)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                        title="حذف الإعلان"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
