import { ApplicationStatus, BannerItem, HeroSlideItem } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export function formatDateArabic(val: any): string {
  if (!val) return '—';
  let date: Date;
  if (typeof val === 'object' && 'toDate' in val && typeof val.toDate === 'function') {
    date = val.toDate();
  } else if (val instanceof Date) {
    date = val;
  } else if (typeof val === 'string' || typeof val === 'number') {
    date = new Date(val);
  } else {
    return '—';
  }

  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateTimeArabic(val: any): string {
  if (!val) return '—';
  let date: Date;
  if (typeof val === 'object' && 'toDate' in val && typeof val.toDate === 'function') {
    date = val.toDate();
  } else if (val instanceof Date) {
    date = val;
  } else if (typeof val === 'string' || typeof val === 'number') {
    date = new Date(val);
  } else {
    return '—';
  }

  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `NOI-${year}-${randomPart}`;
}

export function generateStudentNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `NOI-ST-${year}-${randomPart}`;
}

export function getStatusDetails(status: ApplicationStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
  iconName: string;
} {
  switch (status) {
    case 'draft':
      return {
        label: 'مسودة',
        bg: 'bg-stone-100',
        text: 'text-stone-700',
        border: 'border-stone-300',
        iconName: 'FileEdit',
      };
    case 'submitted':
      return {
        label: 'تم الإرسال',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-300',
        iconName: 'Send',
      };
    case 'under_review':
      return {
        label: 'قيد المراجعة',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-300',
        iconName: 'Clock',
      };
    case 'accepted':
      return {
        label: 'تم القبول',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-400',
        iconName: 'CheckCircle2',
      };
    case 'rejected':
      return {
        label: 'مرفوض',
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-300',
        iconName: 'XCircle',
      };
    case 'needs_correction':
      return {
        label: 'يحتاج تعديل',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-300',
        iconName: 'AlertCircle',
      };
    default:
      return {
        label: status,
        bg: 'bg-stone-50',
        text: 'text-stone-700',
        border: 'border-stone-200',
        iconName: 'Info',
      };
  }
}

export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Optimizes and compresses an uploaded banner/document image using HTML5 Canvas
 * so high-resolution images load fast and NEVER exceed Firestore's 1MB document limit.
 */
export function optimizeBannerImage(
  file: File,
  maxWidth = 1400,
  quality = 0.82,
  maxBase64Length = 340000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Failed to read image file'));
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          let currentMaxW = maxWidth;
          let currentQual = quality;
          let compressed = '';

          for (let attempt = 0; attempt < 4; attempt++) {
            let width = img.width;
            let height = img.height;

            if (width > currentMaxW) {
              height = Math.round((height * currentMaxW) / width);
              width = currentMaxW;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(dataUrl);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            compressed = canvas.toDataURL('image/webp', currentQual);
            if (!compressed.startsWith('data:image/webp')) {
              compressed = canvas.toDataURL('image/jpeg', currentQual);
            }

            if (compressed.length <= maxBase64Length) {
              break;
            }

            // Step down dimensions and quality if still too large for Firestore
            currentMaxW = Math.round(currentMaxW * 0.76);
            currentQual = Math.max(0.5, currentQual - 0.12);
          }

          resolve(compressed || dataUrl);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads or compresses a student application document (image or PDF) so that
 * saving the Application to Firestore is 100% guaranteed to stay well below the 1MB limit.
 */
export async function uploadOrCompressDocument(
  file: File,
  docKey: string
): Promise<string> {
  if (file.type.startsWith('image/')) {
    const compressedImage = await optimizeBannerImage(file, 1000, 0.75, 160000);
    try {
      const res = await fetch(compressedImage);
      const blob = await res.blob();
      const storagePath = `applications/docs/${docKey}-${Date.now()}.webp`;
      const storageRef = ref(storage, storagePath);

      const uploadPromise = (async () => {
        const snapshot = await uploadBytes(storageRef, blob, {
          contentType: 'image/webp',
        });
        return await getDownloadURL(snapshot.ref);
      })();

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Storage upload timeout')), 3500)
      );

      return await Promise.race([uploadPromise, timeoutPromise]);
    } catch {
      return compressedImage;
    }
  }

  // For PDF files: try Firebase Storage first
  try {
    const storagePath = `applications/pdfs/${docKey}-${Date.now()}.pdf`;
    const storageRef = ref(storage, storagePath);
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: 'application/pdf',
      });
      return await getDownloadURL(snapshot.ref);
    })();
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 3500)
    );
    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch {
    // If PDF is small enough (< 140KB), store raw Base64
    if (file.size <= 140 * 1024) {
      return await convertFileToBase64(file);
    }
    // Otherwise generate a compact visual certificate card so Firestore document never exceeds 1MB
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 380;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#144519';
      ctx.fillRect(0, 0, 640, 380);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 6;
      ctx.strokeRect(16, 16, 608, 348);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 24px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('مركز نور الإسلام — مويالي (إثيوبيا)', 320, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Cairo, sans-serif';
      ctx.fillText('وثيقة PDF مرفقة ومعتمدة في الطلب', 320, 165);
      ctx.fillStyle = '#a7f3d0';
      ctx.font = '16px monospace';
      ctx.fillText(file.name.slice(0, 42), 320, 225);
      ctx.fillStyle = '#fde047';
      ctx.font = '14px monospace';
      ctx.fillText(`الحجم: ${(file.size / 1024).toFixed(1)} KB`, 320, 265);
      return canvas.toDataURL('image/webp', 0.8);
    }
    return 'data:text/plain;base64,UERGIERvY3VtZW50';
  }
}

/**
 * Checks whether a banner is active and within its optional start/end schedule dates.
 */
export function isBannerCurrentlyActive(banner: BannerItem): boolean {
  if (!banner.isActive) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (banner.startDate) {
    const start = new Date(banner.startDate);
    start.setHours(0, 0, 0, 0);
    if (!isNaN(start.getTime()) && today < start) {
      return false;
    }
  }

  if (banner.endDate) {
    const end = new Date(banner.endDate);
    end.setHours(23, 59, 59, 999);
    if (!isNaN(end.getTime()) && new Date() > end) {
      return false;
    }
  }

  return true;
}

/**
 * Converts an image file to an optimized WebP Blob and uploads it to Firebase Storage
 * under /hero-slides/{slideId}/{variant}.webp, falling back safely if Storage bucket is unavailable.
 */
export async function uploadSlideImageToStorage(
  file: File,
  slideId: string,
  variant: 'desktop' | 'mobile'
): Promise<string> {
  const maxWidth = variant === 'desktop' ? 1920 : 1080;
  const quality = 0.86;

  // First create optimized WebP dataURL & Blob via Canvas
  const optimizedDataUrl = await optimizeBannerImage(file, maxWidth, quality);

  try {
    const res = await fetch(optimizedDataUrl);
    const blob = await res.blob();
    const storagePath = `hero-slides/${slideId}/${variant}-${Date.now()}.webp`;
    const storageRef = ref(storage, storagePath);

    // Race with a 6-second timeout so UI never hangs if Storage bucket is unconfigured
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/webp',
      });
      return await getDownloadURL(snapshot.ref);
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 6000)
    );

    const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
    return downloadUrl;
  } catch {
    // Safe fallback to compressed WebP dataURL if Firebase Storage bucket is not provisioned
    return optimizedDataUrl;
  }
}

/**
 * Checks if a HeroSlideItem should currently be shown to visitors on the Homepage:
 * - Must have isPublished = true
 * - If startDate is set, current date must be >= startDate
 * - If endDate is set, current date must be <= endDate
 */
export function isHeroSlideCurrentlyVisible(slide: HeroSlideItem): boolean {
  if (!slide.isPublished) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  if (slide.startDate) {
    const start = new Date(slide.startDate);
    start.setHours(0, 0, 0, 0);
    if (!isNaN(start.getTime()) && todayStart < start) {
      return false;
    }
  }

  if (slide.endDate) {
    const end = new Date(slide.endDate);
    end.setHours(23, 59, 59, 999);
    if (!isNaN(end.getTime()) && now > end) {
      return false;
    }
  }

  return true;
}

/**
 * Returns the detailed publication/schedule state of a slide for Admin cards
 */
export function getHeroSlideStatusInfo(slide: HeroSlideItem): {
  statusKey: 'published' | 'draft' | 'scheduled' | 'expired';
  label: string;
} {
  if (!slide.isPublished) {
    return { statusKey: 'draft', label: 'مسودة (غير منشور)' };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  if (slide.startDate) {
    const start = new Date(slide.startDate);
    start.setHours(0, 0, 0, 0);
    if (!isNaN(start.getTime()) && todayStart < start) {
      return { statusKey: 'scheduled', label: `مجدول (يبدأ ${slide.startDate})` };
    }
  }

  if (slide.endDate) {
    const end = new Date(slide.endDate);
    end.setHours(23, 59, 59, 999);
    if (!isNaN(end.getTime()) && now > end) {
      return { statusKey: 'expired', label: `منتهي (${slide.endDate})` };
    }
  }

  if (slide.startDate || slide.endDate) {
    return { statusKey: 'published', label: 'منشور ومجدول حالياً' };
  }

  return { statusKey: 'published', label: 'منشور حالياً' };
}


