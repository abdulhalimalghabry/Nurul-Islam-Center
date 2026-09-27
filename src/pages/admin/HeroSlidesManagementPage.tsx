import React, { useState, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { HeroSlideItem, HeroSlideContentType } from '../../types';
import {
  uploadSlideImageToStorage,
  getHeroSlideStatusInfo,
  isHeroSlideCurrentlyVisible,
} from '../../utils/helpers';
import {
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
  CheckCircle2,
  AlertCircle,
  Monitor,
  Smartphone,
  Star,
  GripVertical,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  X,
  FileText,
  Clock,
} from 'lucide-react';

interface HeroSlidesManagementPageProps {
  slides: HeroSlideItem[];
}

const CONTENT_TYPES: HeroSlideContentType[] = [
  'صورة طلاب',
  'تحفيظ',
  'نشاط',
  'فعالية',
  'تخرج',
  'تسجيل',
  'إعلان',
  'خبر',
  'مرافق',
  'أخرى',
];

const INTERNAL_LINK_OPTIONS = [
  { value: 'register', label: 'صفحة التسجيل الجديد (إنشاء حساب طالب)' },
  { value: 'new-application', label: 'استمارة تقديم طلب التحاق طالب جديد' },
  { value: 'login', label: 'صفحة متابعة طلب التسجيل (تسجيل الدخول)' },
  { value: 'about', label: 'صفحة عن المركز (الرؤية والرسالة والمرافق)' },
  { value: 'contact', label: 'صفحة تواصل معنا وموقع المركز' },
];

export const HeroSlidesManagementPage: React.FC<HeroSlidesManagementPageProps> = ({
  slides,
}) => {
  const { currentUser } = useAuth();

  // Sort slides: Featured first, then by order ascending
  const sortedSlides = React.useMemo(() => {
    return [...slides].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }, [slides]);

  // Form & Preview Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [previewModalSlide, setPreviewModalSlide] = useState<HeroSlideItem | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Form Fields
  const [slideMode, setSlideMode] = useState<
    'image_only' | 'image_title' | 'image_title_desc' | 'full'
  >('full');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [desktopImageUrl, setDesktopImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [link, setLink] = useState('register');
  const [linkType, setLinkType] = useState<'internal' | 'external'>('internal');
  const [contentType, setContentType] = useState<HeroSlideContentType>('صورة طلاب');
  const [objectPosition, setObjectPosition] =
    useState<HeroSlideItem['objectPosition']>('center');
  const [order, setOrder] = useState<number>(sortedSlides.length + 1);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Counts for KPI Cards
  const publishedCount = slides.filter((s) => isHeroSlideCurrentlyVisible(s)).length;
  const draftCount = slides.filter((s) => !s.isPublished).length;
  const scheduledCount = slides.filter(
    (s) => s.isPublished && Boolean(s.startDate || s.endDate)
  ).length;

  const resetForm = () => {
    setEditingSlideId(null);
    setSlideMode('full');
    setTitle('');
    setDescription('');
    setDesktopImageUrl('');
    setMobileImageUrl('');
    setButtonText('');
    setLink('register');
    setLinkType('internal');
    setContentType('صورة طلاب');
    setObjectPosition('center');
    setOrder(sortedSlides.length + 1);
    setIsPublished(true);
    setIsFeatured(false);
    setStartDate('');
    setEndDate('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEdit = (slide: HeroSlideItem) => {
    setEditingSlideId(slide.id || null);
    setTitle(slide.title || '');
    setDescription(slide.description || '');
    setDesktopImageUrl(slide.desktopImageUrl || '');
    setMobileImageUrl(slide.mobileImageUrl || '');
    setButtonText(slide.buttonText || '');
    setLink(slide.link || 'register');
    setLinkType(slide.linkType || 'internal');
    setContentType(slide.contentType || 'صورة طلاب');
    setObjectPosition(slide.objectPosition || 'center');
    setOrder(slide.order ?? 1);
    setIsPublished(slide.isPublished !== false);
    setIsFeatured(Boolean(slide.isFeatured));
    setStartDate(slide.startDate || '');
    setEndDate(slide.endDate || '');

    // Determine mode based on existing fields
    if (!slide.title && !slide.description && !slide.buttonText) {
      setSlideMode('image_only');
    } else if (slide.title && !slide.description && !slide.buttonText) {
      setSlideMode('image_title');
    } else if (slide.title && slide.description && !slide.buttonText) {
      setSlideMode('image_title_desc');
    } else {
      setSlideMode('full');
    }

    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Upload Desktop Image to Firebase Storage (converted to WebP)
  const handleDesktopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotice('error', 'يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)');
      return;
    }

    try {
      setUploadingDesktop(true);
      const targetId = editingSlideId || `slide-${Date.now()}`;
      const uploadedUrl = await uploadSlideImageToStorage(file, targetId, 'desktop');
      setDesktopImageUrl(uploadedUrl);
      showNotice('success', 'تم رفع وتحويل الصورة الرئيسية (Desktop) بصيغة WebP بنجاح');
    } catch {
      showNotice('error', 'حدث خطأ أثناء رفع الصورة الرئيسية');
    } finally {
      setUploadingDesktop(false);
      if (desktopInputRef.current) desktopInputRef.current.value = '';
    }
  };

  // Upload Mobile Image to Firebase Storage (converted to WebP)
  const handleMobileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotice('error', 'يرجى اختيار ملف صورة صالح للهاتف');
      return;
    }

    try {
      setUploadingMobile(true);
      const targetId = editingSlideId || `slide-${Date.now()}`;
      const uploadedUrl = await uploadSlideImageToStorage(file, targetId, 'mobile');
      setMobileImageUrl(uploadedUrl);
      showNotice('success', 'تم رفع صورة الهاتف (Mobile) بصيغة WebP بنجاح');
    } catch {
      showNotice('error', 'حدث خطأ أثناء رفع صورة الهاتف');
    } finally {
      setUploadingMobile(false);
      if (mobileInputRef.current) mobileInputRef.current.value = '';
    }
  };

  // Save Slide to Firestore `heroSlides`
  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desktopImageUrl.trim()) {
      showNotice('error', 'يرجى رفع الصورة الرئيسية للشريحة أولاً');
      return;
    }

    try {
      setSaving(true);
      const slideId = editingSlideId || `slide-${Date.now()}`;

      // Respect the chosen display mode so Image-Only has no unwanted text
      const finalTitle = slideMode === 'image_only' ? '' : title.trim();
      const finalDesc =
        slideMode === 'image_only' || slideMode === 'image_title'
          ? ''
          : description.trim();
      const finalBtnText = slideMode === 'full' ? buttonText.trim() : '';
      const finalLink = finalBtnText || link.trim() ? link.trim() : '';

      // If this slide is marked Featured, unmark other featured slides so only 1 is Featured
      if (isFeatured) {
        const batch = writeBatch(db);
        slides.forEach((s) => {
          if (s.id && s.id !== slideId && s.isFeatured) {
            batch.update(doc(db, 'heroSlides', s.id), { isFeatured: false });
          }
        });
        await batch.commit();
      }

      const payload: Omit<HeroSlideItem, 'id'> = {
        title: finalTitle,
        description: finalDesc,
        desktopImageUrl: desktopImageUrl.trim(),
        mobileImageUrl: mobileImageUrl.trim(),
        buttonText: finalBtnText,
        link: finalLink,
        linkType,
        contentType,
        objectPosition: objectPosition || 'center',
        order: Number(order) || 1,
        isPublished,
        isFeatured,
        startDate: startDate || '',
        endDate: endDate || '',
        updatedAt: serverTimestamp(),
        createdBy: currentUser?.uid || currentUser?.email || 'admin',
      };

      if (editingSlideId) {
        await updateDoc(doc(db, 'heroSlides', editingSlideId), payload);
        await addDoc(collection(db, 'adminLogs'), {
          adminId: currentUser?.uid || '',
          adminEmail: currentUser?.email || '',
          action: 'تعديل شريحة في المحتوى الرئيسي',
          details: `تم تعديل الشريحة: ${finalTitle || contentType}`,
          createdAt: serverTimestamp(),
        });
        showNotice('success', 'تم حفظ التعديلات على الشريحة بنجاح');
      } else {
        await setDoc(doc(db, 'heroSlides', slideId), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        await addDoc(collection(db, 'adminLogs'), {
          adminId: currentUser?.uid || '',
          adminEmail: currentUser?.email || '',
          action: 'إضافة شريحة جديدة للمحتوى الرئيسي',
          details: `تم إضافة شريحة (${contentType}): ${finalTitle || 'صورة فقط'}`,
          createdAt: serverTimestamp(),
        });
        showNotice('success', 'تم إضافة الشريحة إلى الواجهة الرئيسية بنجاح');
      }

      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving hero slide:', err);
      showNotice('error', 'تعذر حفظ الشريحة، يرجى المحاولة مرة أخرى');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Publish / Draft
  const handleTogglePublish = async (slide: HeroSlideItem) => {
    if (!slide.id) return;
    try {
      const nextPublish = !slide.isPublished;
      await updateDoc(doc(db, 'heroSlides', slide.id), {
        isPublished: nextPublish,
        updatedAt: serverTimestamp(),
      });
      showNotice(
        'success',
        nextPublish
          ? 'تم نشر الشريحة في الواجهة الرئيسية'
          : 'تم تحويل الشريحة إلى مسودة وإخفاؤها من الواجهة'
      );
    } catch {
      showNotice('error', 'تعذر تغيير حالة النشر');
    }
  };

  // Set Featured Slide (Ensures only 1 slide is Featured at a time)
  const handleToggleFeatured = async (slide: HeroSlideItem) => {
    if (!slide.id) return;
    try {
      const nextFeatured = !slide.isFeatured;
      const batch = writeBatch(db);

      if (nextFeatured) {
        slides.forEach((s) => {
          if (s.id && s.id !== slide.id && s.isFeatured) {
            batch.update(doc(db, 'heroSlides', s.id), { isFeatured: false });
          }
        });
      }

      batch.update(doc(db, 'heroSlides', slide.id), {
        isFeatured: nextFeatured,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      showNotice(
        'success',
        nextFeatured
          ? 'تم تعيين هذه الشريحة كشريحة رئيسية (تظهر أولاً)'
          : 'تم إلغاء تمييز الشريحة كرئيسية'
      );
    } catch {
      showNotice('error', 'تعذر تحديث الشريحة الرئيسية');
    }
  };

  // Move Slide Order Up / Down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedSlides.length) return;

    const slideA = sortedSlides[index];
    const slideB = sortedSlides[targetIndex];
    if (!slideA.id || !slideB.id) return;

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'heroSlides', slideA.id), {
        order: targetIndex + 1,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'heroSlides', slideB.id), {
        order: index + 1,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      showNotice('success', 'تم تحديث ترتيب ظهور الشرائح');
    } catch {
      showNotice('error', 'تعذر تحديث ترتيب الشريحة');
    }
  };

  // Drag & Drop Reordering Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const reordered = [...sortedSlides];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);
    setDraggedIndex(null);

    try {
      const batch = writeBatch(db);
      reordered.forEach((item, idx) => {
        if (item.id) {
          batch.update(doc(db, 'heroSlides', item.id), {
            order: idx + 1,
            updatedAt: serverTimestamp(),
          });
        }
      });
      await batch.commit();
      showNotice('success', 'تم حفظ الترتيب الجديد للشرائح');
    } catch {
      showNotice('error', 'تعذر حفظ الترتيب الجديد');
    }
  };

  // Delete Slide
  const handleDeleteSlide = async (slideId: string) => {
    try {
      const target = slides.find((s) => s.id === slideId);
      await deleteDoc(doc(db, 'heroSlides', slideId));
      // If it was also migrated from legacy banners, delete from banners too so it doesn't re-sync
      try {
        await deleteDoc(doc(db, 'banners', slideId));
      } catch {
        // Ignore if not in legacy collection
      }
      await addDoc(collection(db, 'adminLogs'), {
        adminId: currentUser?.uid || '',
        adminEmail: currentUser?.email || '',
        action: 'حذف شريحة من المحتوى الرئيسي',
        details: `تم حذف الشريحة: ${target?.title || target?.contentType || slideId}`,
        createdAt: serverTimestamp(),
      });
      setDeleteConfirmId(null);
      showNotice('success', 'تم حذف الشريحة نهائياً');
    } catch {
      showNotice('error', 'حدث خطأ أثناء حذف الشريحة');
    }
  };

  const getObjectPositionClass = (pos?: HeroSlideItem['objectPosition']) => {
    switch (pos) {
      case 'top':
        return 'object-top';
      case 'bottom':
        return 'object-bottom';
      case 'left':
        return 'object-left';
      case 'right':
        return 'object-right';
      default:
        return 'object-center';
    }
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div className="space-y-1">
          <span className="text-xs font-black text-[#1b5e20] block">
            المحتوى الرئيسي — الواجهة البصرية للمركز (Main Hero Slider)
          </span>
          <h1 className="text-2xl font-black text-stone-900">
            إدارة شرائح الصفحة الرئيسية
          </h1>
          <p className="text-xs text-stone-500">
            ارفع صور طلاب المركز، حلقات التحفيظ، الفعاليات، التخرج، المرافق، والإعلانات لتظهر في أعلى الصفحة الرئيسية مباشرة بعد شريط التنقل.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-6 py-3.5 rounded-2xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-black text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>+ إضافة شريحة</span>
        </button>
      </div>

      {/* Feedback Notification */}
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
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-stone-400 hover:text-stone-700 px-2"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* 3 KPI Stat Cards: المنشورة | المسودة | المجدولة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs text-emerald-800 font-bold block">
              عدد الشرائح المنشورة
            </span>
            <strong className="text-3xl font-black text-[#1b5e20] font-mono mt-1 block">
              {publishedCount}
            </strong>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1b5e20] flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs text-stone-600 font-bold block">
              عدد الشرائح المسودة
            </span>
            <strong className="text-3xl font-black text-stone-800 font-mono mt-1 block">
              {draftCount}
            </strong>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs text-amber-800 font-bold block">
              عدد الشرائح المجدولة
            </span>
            <strong className="text-3xl font-black text-amber-700 font-mono mt-1 block">
              {scheduledCount}
            </strong>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ADD / EDIT SLIDE FORM ("إضافة محتوى رئيسي")                           */}
      {/* ===================================================================== */}
      {isFormOpen && (
        <div className="bg-white rounded-3xl border-2 border-[#1b5e20] shadow-xl overflow-hidden">
          <div className="bg-gradient-to-l from-[#144519] via-[#1b5e20] to-[#0f3512] text-white p-6 flex items-center justify-between border-b-2 border-[#facc15]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#facc15] text-stone-950 flex items-center justify-center font-black">
                {editingSlideId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  {editingSlideId ? 'تعديل الشريحة' : 'إضافة محتوى رئيسي (شريحة جديدة)'}
                </h2>
                <p className="text-xs text-emerald-100">
                  يمكنك نشر صورة كاملة بمفردها أو إضافة عنوان ووصف وزر اختياري فوقها
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
              إغلاق
            </button>
          </div>

          <form onSubmit={handleSaveSlide} className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Right Column: Form Controls (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Desktop & Mobile Image Uploads */}
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#1b5e20]" />
                      <span>1. رفع صور الشريحة (Desktop & Mobile) *</span>
                    </label>
                    <span className="text-[11px] text-emerald-800 font-bold">
                      تحويل وضغط تلقائي إلى WebP
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Desktop Image */}
                    <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2.5">
                      <span className="text-xs font-bold text-stone-800 block">
                        الصورة الرئيسية (Desktop Image) *
                      </span>
                      <p className="text-[11px] text-stone-500">
                        تظهر بعرض كبير في أعلى الصفحة الرئيسية
                      </p>
                      <input
                        ref={desktopInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleDesktopUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingDesktop}
                        onClick={() => desktopInputRef.current?.click()}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>
                          {uploadingDesktop
                            ? 'جاري رفع وضغط الصورة...'
                            : desktopImageUrl
                            ? 'تغيير الصورة الرئيسية'
                            : 'رفع الصورة الرئيسية'}
                        </span>
                      </button>
                    </div>

                    {/* Mobile Image (Optional) */}
                    <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800">
                          صورة الهاتف (Mobile Image - اختيارية)
                        </span>
                        {mobileImageUrl && (
                          <button
                            type="button"
                            onClick={() => setMobileImageUrl('')}
                            className="text-[11px] text-rose-600 font-bold hover:underline"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500">
                        إذا تُركت فارغة تُستخدم الصورة الرئيسية تلقائياً
                      </p>
                      <input
                        ref={mobileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleMobileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingMobile}
                        onClick={() => mobileInputRef.current?.click()}
                        className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4 text-[#1b5e20]" />
                        <span>
                          {uploadingMobile
                            ? 'جاري الرفع...'
                            : mobileImageUrl
                            ? 'تغيير صورة الهاتف'
                            : 'رفع صورة مخصصة للهاتف'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Image Position (To prevent cutting off student faces) */}
                  <div className="pt-2 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-stone-700 mb-1">
                        ضبط موضع الصورة (Image Position - لمنع قص وجوه الطلاب):
                      </label>
                      <select
                        value={objectPosition}
                        onChange={(e) =>
                          setObjectPosition(
                            e.target.value as HeroSlideItem['objectPosition']
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                      >
                        <option value="center">Center — وسط الصورة (افتراضي)</option>
                        <option value="top">Top — أعلى الصورة (ممتاز لصور الطلاب والأشخاص)</option>
                        <option value="bottom">Bottom — أسفل الصورة</option>
                        <option value="right">Right — يمين الصورة</option>
                        <option value="left">Left — يسار الصورة</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-stone-700 mb-1">
                        نوع المحتوى:
                      </label>
                      <select
                        value={contentType}
                        onChange={(e) =>
                          setContentType(e.target.value as HeroSlideContentType)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                      >
                        {CONTENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Optional Text Mode Selector */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-stone-900">
                    2. عناصر النص فوق الصورة (اختياري — يمكنك عرض الصورة وحدها بدون كتابة)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'image_only', label: 'صورة فقط (Image Only)' },
                      { id: 'image_title', label: 'صورة + عنوان' },
                      { id: 'image_title_desc', label: 'صورة + عنوان + وصف' },
                      { id: 'full', label: 'صورة + عنوان + وصف + زر' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setSlideMode(
                            m.id as
                              | 'image_only'
                              | 'image_title'
                              | 'image_title_desc'
                              | 'full'
                          )
                        }
                        className={`p-3 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                          slideMode === m.id
                            ? 'border-[#1b5e20] bg-emerald-50 text-[#1b5e20] font-black shadow-2xs'
                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Optional Title, Description, Button & Link Fields */}
                {slideMode !== 'image_only' && (
                  <div className="space-y-4 bg-stone-50 p-5 rounded-2xl border border-stone-200">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        عنوان الشريحة (اختياري)
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثال: جيل يتعلم... وقيم تُبنى | مع القرآن الكريم"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                      />
                    </div>

                    {(slideMode === 'image_title_desc' || slideMode === 'full') && (
                      <div>
                        <label className="block text-xs font-bold text-stone-800 mb-1">
                          وصف الشريحة القصير (اختياري)
                        </label>
                        <textarea
                          rows={2}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="مثال: نحو تعليم شرعي متميز يجمع بين العلم والتربية وحفظ القرآن."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs leading-relaxed focus:outline-none focus:border-[#1b5e20]"
                        />
                      </div>
                    )}

                    {slideMode === 'full' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-200">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">
                            نص الزر (اختياري):
                          </label>
                          <input
                            type="text"
                            value={buttonText}
                            onChange={(e) => setButtonText(e.target.value)}
                            placeholder="مثال: سجل الآن / قسم التحفيظ"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">
                            نوع الرابط:
                          </label>
                          <select
                            value={linkType}
                            onChange={(e) =>
                              setLinkType(e.target.value as 'internal' | 'external')
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                          >
                            <option value="internal">صفحة داخل الموقع</option>
                            <option value="external">رابط خارجي</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">
                            رابط الزر:
                          </label>
                          {linkType === 'internal' ? (
                            <select
                              value={link}
                              onChange={(e) => setLink(e.target.value)}
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
                              value={link}
                              onChange={(e) => setLink(e.target.value)}
                              placeholder="https://..."
                              dir="ltr"
                              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-mono focus:outline-none focus:border-[#1b5e20]"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Publication Status, Order, Featured & Schedule Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      حالة النشر
                    </label>
                    <select
                      value={isPublished ? 'published' : 'draft'}
                      onChange={(e) => setIsPublished(e.target.value === 'published')}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs font-bold focus:outline-none focus:border-[#1b5e20]"
                    >
                      <option value="published">منشور (يظهر في الرئيسية)</option>
                      <option value="draft">مسودة (مخفي حالياً)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ترتيب الظهور (Order)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:outline-none focus:border-[#1b5e20]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      تاريخ بداية الظهور
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
                      تاريخ نهاية الظهور
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:border-[#1b5e20]"
                    />
                  </div>
                </div>

                {/* Featured Checkbox */}
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[#1b5e20] rounded"
                  />
                  <div>
                    <span className="text-xs font-black text-stone-900 block">
                      تحديد كشريحة رئيسية مميزة (Featured Slide)
                    </span>
                    <span className="text-[11px] text-stone-600 block">
                      تظهر في مقدمة الشرائح دائماً (يتم إلغاء التمييز تلقائياً عن أي شريحة أخرى لمنع التعارض)
                    </span>
                  </div>
                </label>
              </div>

              {/* Left Column: Live Desktop & Mobile Preview (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-800">
                      معاينة حية (للتأكد من عدم تغطية وجوه الطلاب أو النصوص)
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
                        <span>Desktop</span>
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
                        <span>Mobile</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Viewport */}
                  <div
                    className={`relative rounded-2xl overflow-hidden bg-[#113814] border-2 border-[#facc15] shadow-lg mx-auto transition-all ${
                      previewDevice === 'mobile'
                        ? 'max-w-[280px] h-[250px]'
                        : 'w-full h-[270px]'
                    }`}
                  >
                    {desktopImageUrl ? (
                      <img
                        src={
                          previewDevice === 'mobile' && mobileImageUrl
                            ? mobileImageUrl
                            : desktopImageUrl
                        }
                        alt="معاينة الشريحة"
                        className={`w-full h-full object-cover ${getObjectPositionClass(
                          objectPosition
                        )}`}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-emerald-100/70 p-6 text-center space-y-2">
                        <ImageIcon className="w-8 h-8 text-[#facc15]" />
                        <span className="text-xs font-bold">
                          ارفع صورة الشريحة لمشاهدتها هنا قبل النشر
                        </span>
                      </div>
                    )}

                    {/* Preview Overlay ONLY if not image_only */}
                    {slideMode !== 'image_only' &&
                      (title.trim() || description.trim() || buttonText.trim()) && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#09220c]/90 via-[#0f3512]/35 to-transparent pointer-events-none" />
                          <div className="absolute inset-0 p-5 flex flex-col justify-end text-right space-y-1.5">
                            <span className="text-[10px] font-black text-[#facc15]">
                              {contentType} · مركز نور الإسلام
                            </span>
                            {title && (
                              <h4 className="text-sm sm:text-base font-black text-white line-clamp-1">
                                {title}
                              </h4>
                            )}
                            {(slideMode === 'image_title_desc' || slideMode === 'full') &&
                              description && (
                                <p className="text-[11px] text-emerald-50 line-clamp-2">
                                  {description}
                                </p>
                              )}
                            {slideMode === 'full' && buttonText && (
                              <div className="pt-1">
                                <span className="inline-block px-3 py-1 rounded-lg bg-[#facc15] text-stone-950 font-black text-[10px]">
                                  {buttonText}
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                  </div>
                </div>

                {/* Submit & Cancel */}
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
                    disabled={saving || uploadingDesktop || uploadingMobile}
                    className="px-7 py-3 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-black text-xs sm:text-sm transition shadow-md cursor-pointer"
                  >
                    {saving
                      ? 'جاري الحفظ...'
                      : editingSlideId
                      ? 'حفظ تعديلات الشريحة'
                      : 'حفظ ونشر الشريحة'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SLIDES CARDS GRID (With Drag & Drop + Preview + Publish + Delete)     */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-black text-stone-900">
            بطاقات شرائح المحتوى الرئيسي ({sortedSlides.length})
          </h2>
          <span className="text-xs text-stone-500">
            يمكنك سحب البطاقات (Drag & Drop) أو استخدام الأسهم لإعادة ترتيب ظهورها
          </span>
        </div>

        {sortedSlides.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#1b5e20] flex items-center justify-center mx-auto">
              <ImageIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-black text-stone-900">
                لا توجد شرائح مضافة بعد في المحتوى الرئيسي
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                عند عدم وجود شرائح مضافة، يعرض الموقع تلقائياً الشريحة الافتتاحية الرسمية لمركز نور الإسلام. اضغط على «+ إضافة شريحة» لرفع صور الطلاب والأنشطة والمرافق.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-6 py-3 rounded-2xl bg-[#1b5e20] text-[#facc15] font-black text-xs transition cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة أول شريحة</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSlides.map((slide, idx) => {
              const statusInfo = getHeroSlideStatusInfo(slide);
              const isImageOnly =
                !slide.title && !slide.description && !slide.buttonText;

              return (
                <div
                  key={slide.id || idx}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  className={`bg-white rounded-3xl overflow-hidden border-2 transition flex flex-col justify-between shadow-xs hover:shadow-md ${
                    slide.isFeatured
                      ? 'border-[#facc15] ring-2 ring-[#facc15]/40'
                      : statusInfo.statusKey === 'published'
                      ? 'border-emerald-800/20'
                      : 'border-stone-200 opacity-85'
                  }`}
                >
                  <div>
                    {/* Large Thumbnail Image */}
                    <div className="relative w-full aspect-[16/9] bg-[#113814] overflow-hidden group">
                      <img
                        src={slide.desktopImageUrl}
                        alt={slide.title || slide.contentType}
                        loading="lazy"
                        className={`w-full h-full object-cover ${getObjectPositionClass(
                          slide.objectPosition
                        )}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                      {/* Top Bar over Thumbnail: Order + Featured + ContentType */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 bg-black/65 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-xs font-mono font-black">
                          <GripVertical className="w-3.5 h-3.5 text-[#facc15] cursor-grab" />
                          <span>#{idx + 1}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {slide.isFeatured && (
                            <span className="bg-[#facc15] text-stone-950 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 shadow-xs">
                              <Star className="w-3 h-3 fill-stone-950" />
                              رئيسية
                            </span>
                          )}
                          <span className="bg-[#144519]/90 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold border border-white/20">
                            {slide.contentType}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Status Label over Thumbnail */}
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs text-white">
                        <span
                          className={`font-black flex items-center gap-1 ${
                            statusInfo.statusKey === 'published'
                              ? 'text-[#4ade80]'
                              : statusInfo.statusKey === 'scheduled'
                              ? 'text-[#facc15]'
                              : 'text-stone-300'
                          }`}
                        >
                          ● {statusInfo.label}
                        </span>
                        {isImageOnly && (
                          <span className="text-[11px] text-emerald-100 font-bold">
                            صورة فقط
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="p-5 space-y-2.5">
                      <h3 className="text-base font-black text-stone-900 line-clamp-1">
                        {slide.title || 'صورة عرض كاملة (بدون عنوان نصي)'}
                      </h3>

                      {slide.description ? (
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {slide.description}
                        </p>
                      ) : (
                        <p className="text-xs text-stone-400 italic">
                          تُعرض الصورة بوضوح كامل بدون نصوص إضافية فوقها
                        </p>
                      )}

                      {/* Metadata row: Schedule dates & Order controls */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                        <div className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {slide.startDate || slide.endDate ? (
                            <span>
                              {slide.startDate || 'الآن'} ← {slide.endDate || 'مفتوح'}
                            </span>
                          ) : (
                            <span>نشر دائم</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(idx, 'up')}
                            title="تقديم الشريحة"
                            className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 text-stone-700 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sortedSlides.length - 1}
                            onClick={() => handleMoveOrder(idx, 'down')}
                            title="تأخير الشريحة"
                            className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 text-stone-700 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons: تعديل | معاينة | نشر/إلغاء النشر | حذف */}
                  <div className="px-5 pb-5 pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(slide)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDevice('desktop');
                          setPreviewModalSlide(slide);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePublish(slide)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          slide.isPublished
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900'
                            : 'bg-[#1b5e20] text-[#facc15]'
                        }`}
                      >
                        {slide.isPublished ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>إلغاء النشر</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>نشر</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(slide)}
                        title="تحديد كشريحة رئيسية"
                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                          slide.isFeatured
                            ? 'bg-[#facc15] text-stone-950'
                            : 'bg-stone-100 hover:bg-amber-50 text-stone-500'
                        }`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            slide.isFeatured ? 'fill-stone-950' : ''
                          }`}
                        />
                      </button>

                      {deleteConfirmId === slide.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-xl border border-rose-200">
                          <button
                            type="button"
                            onClick={() => slide.id && handleDeleteSlide(slide.id)}
                            className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black cursor-pointer"
                          >
                            تأكيد
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-[10px] text-stone-600 font-bold px-1 cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(slide.id || null)}
                          title="حذف الشريحة"
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* DESKTOP & MOBILE PREVIEW MODAL                                        */}
      {/* ===================================================================== */}
      {previewModalSlide && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border-2 border-[#facc15]">
            <div className="bg-[#144519] text-white px-6 py-4 flex items-center justify-between border-b border-[#facc15]/40">
              <div className="flex items-center gap-3">
                <span className="font-black text-sm">
                  معاينة الشريحة: {previewModalSlide.title || previewModalSlide.contentType}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-[#facc15] text-stone-950 font-black'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Desktop Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-[#facc15] text-stone-950 font-black'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalSlide(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white mr-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-stone-900 flex justify-center">
              <div
                className={`relative rounded-2xl overflow-hidden bg-[#113814] border-2 border-[#facc15] shadow-xl transition-all ${
                  previewDevice === 'mobile'
                    ? 'w-[360px] h-[340px]'
                    : 'w-full h-[460px]'
                }`}
              >
                <img
                  src={
                    previewDevice === 'mobile' && previewModalSlide.mobileImageUrl
                      ? previewModalSlide.mobileImageUrl
                      : previewModalSlide.desktopImageUrl
                  }
                  alt={previewModalSlide.title || ''}
                  className={`w-full h-full object-cover ${getObjectPositionClass(
                    previewModalSlide.objectPosition
                  )}`}
                />

                {(previewModalSlide.title ||
                  previewModalSlide.description ||
                  previewModalSlide.buttonText) && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09220c]/90 via-[#0f3512]/35 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end text-right space-y-2.5">
                      <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#facc15]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{previewModalSlide.contentType}</span>
                      </div>
                      {previewModalSlide.title && (
                        <h3 className="text-xl sm:text-3xl font-black text-white">
                          {previewModalSlide.title}
                        </h3>
                      )}
                      {previewModalSlide.description && (
                        <p className="text-xs sm:text-sm text-emerald-50 max-w-xl leading-relaxed">
                          {previewModalSlide.description}
                        </p>
                      )}
                      {previewModalSlide.buttonText && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#facc15] text-stone-950 font-black text-xs">
                            <span>{previewModalSlide.buttonText}</span>
                            {previewModalSlide.linkType === 'external' ? (
                              <ExternalLink className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowLeft className="w-3.5 h-3.5" />
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
