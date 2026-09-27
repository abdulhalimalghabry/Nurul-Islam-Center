import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BannerItem, CenterSettings } from '../../types';
import { isBannerCurrentlyActive } from '../../utils/helpers';
import { BrochureRibbonTitle } from '../common/IslamicOrnaments';
import { CenterLogo } from '../common/CenterLogo';
import {
  ChevronRight,
  ChevronLeft,
  Megaphone,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Calendar,
  Settings,
  FileCheck2,
} from 'lucide-react';

interface AnnouncementsCarouselProps {
  banners: BannerItem[];
  settings: CenterSettings | null;
  isAdmin?: boolean;
  onNavigate: (view: string) => void;
  onManageBanners?: () => void;
}

const AUTO_PLAY_INTERVAL = 6000; // 6 seconds (within the 5-7s specification)

export const AnnouncementsCarousel: React.FC<AnnouncementsCarouselProps> = ({
  banners,
  settings,
  isAdmin = false,
  onNavigate,
  onManageBanners,
}) => {
  // Filter only active and currently scheduled banners, sorted by order
  const activeBanners = React.useMemo(() => {
    return banners
      .filter((b) => isBannerCurrentlyActive(b))
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }, [banners]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<number>(1); // 1 = next, -1 = prev

  // Touch swipe state for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Keep index valid when activeBanners list changes
  useEffect(() => {
    if (currentIndex >= activeBanners.length && activeBanners.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  const handleNext = useCallback(() => {
    if (activeBanners.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const handlePrev = useCallback(() => {
    if (activeBanners.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  const handleSelectDot = (idx: number) => {
    if (idx === currentIndex) return;
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  // Auto Play timer (5-7 seconds, pauses on hover or touch)
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused, handleNext, currentIndex]);

  // Mobile Touch / Swipe Handlers (RTL-compatible)
  const onTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 45;

      // In RTL layout:
      // Swiping right-to-left (distance > 0) or left-to-right (distance < 0)
      if (distance > minSwipeDistance) {
        handleNext();
      } else if (distance < -minSwipeDistance) {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    setIsPaused(false);
  };

  // Handle CTA Button Click
  const handleBannerAction = (banner: BannerItem) => {
    if (!banner.buttonLink) return;
    if (
      banner.linkType === 'external' ||
      banner.buttonLink.startsWith('http://') ||
      banner.buttonLink.startsWith('https://')
    ) {
      window.open(banner.buttonLink, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate(banner.buttonLink);
    }
  };

  const getObjectPositionClass = (pos?: BannerItem['objectPosition']) => {
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

  // ============================================================================
  // CASE 1: No Active Banners in Firestore -> Official Default Center Banner
  // ============================================================================
  if (activeBanners.length === 0) {
    return (
      <section
        aria-label="إعلانات مركز نور الإسلام"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 relative z-20"
        dir="rtl"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#144519] via-[#1b5e20] to-[#0f3512] border-2 border-[#facc15] shadow-xl p-6 sm:p-10 text-white">
          <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-[#facc15]/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right">
              <div className="shrink-0">
                <CenterLogo size="md" variant="light" />
              </div>
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-black text-[#facc15]">
                  <Megaphone className="w-4 h-4" />
                  <span>الإعلانات والتنويهات الرسمية — {settings?.academicYear || '1447-1448هـ'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {settings?.announcement ||
                    'مرحباً بكم في البوابة الرسمية لمركز نور الإسلام (مويالي - إثيوبيا) — التسجيل مفتوح للعام الدراسي الجديد'}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  نسعد باستقبال طلبات التحاق الطلاب والطالبات في جميع المراحل الدراسية وحلقات تحفيظ القرآن الكريم عبر البوابة الإلكترونية.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              {settings?.registrationOpen !== false && (
                <button
                  onClick={() => onNavigate('register')}
                  className="px-6 py-3.5 rounded-2xl bg-[#facc15] hover:bg-[#fde047] text-stone-950 font-black text-xs sm:text-sm transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>سجل الآن إلكترونياً</span>
                </button>
              )}
              {isAdmin && onManageBanners && (
                <button
                  onClick={onManageBanners}
                  className="px-4 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition border border-white/30 flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#facc15]" />
                  <span>إدارة الإعلانات والبنرات</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  // ============================================================================
  // CASE 2: Dynamic Interactive Announcements Carousel / Hero Slider
  // ============================================================================
  return (
    <section
      aria-label="إعلانات وفعاليات مركز نور الإسلام"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 scroll-mt-24"
      dir="rtl"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrochureRibbonTitle variant="yellow" size="md">
            <span className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-stone-950" />
              <span>أحدث الإعلانات والفعاليات</span>
            </span>
          </BrochureRibbonTitle>
          <span className="hidden md:inline-block text-xs font-bold text-stone-500">
            عروض وأخبار مركز نور الإسلام — مويالي
          </span>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {isAdmin && onManageBanners && (
            <button
              onClick={onManageBanners}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] border border-emerald-200 text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>إدارة الإعلانات ({banners.length})</span>
            </button>
          )}

          {/* Slide Counter Text */}
          {activeBanners.length > 1 && (
            <div className="text-xs font-bold text-stone-500 font-mono">
              <span>إعلان {currentIndex + 1}</span>
              <span className="mx-1">/</span>
              <span>{activeBanners.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Slider Container */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative group rounded-3xl overflow-hidden bg-gradient-to-br from-[#144519] via-[#1b5e20] to-[#0f3512] border-2 border-[#facc15] shadow-xl select-none"
      >
        {/* Top Ornamental Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-l from-[#facc15] via-[#4ade80] to-[#1d4ed8] z-30" />

        {/* Aspect Ratio Wrapper: 4:3 on mobile, 16:7 on desktop */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/8] lg:aspect-[16/6.6] min-h-[300px] sm:min-h-[360px] lg:min-h-[430px] overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentBanner.id || currentIndex}
              custom={direction}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Responsive Picture Element: Supports separate Mobile & Desktop images */}
              <picture className="w-full h-full block">
                {currentBanner.mobileImageUrl && (
                  <source media="(max-width: 639px)" srcSet={currentBanner.mobileImageUrl} />
                )}
                <img
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title || 'إعلان مركز نور الإسلام'}
                  loading="eager"
                  className={`w-full h-full object-cover ${getObjectPositionClass(
                    currentBanner.objectPosition
                  )}`}
                />
              </picture>

              {/* MODE A: Image + Text Overlay */}
              {currentBanner.displayType !== 'image_only' ? (
                <>
                  {/* RTL Islamic Dark Green & Gold Gradient Overlay for High Text Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-l from-[#0c2b0f]/95 via-[#144519]/80 to-black/25 sm:via-[#144519]/70 sm:to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c2b0f]/90 via-transparent to-black/20" />
                  <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none" />

                  {/* Content Overlay Container */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-end sm:justify-center p-6 sm:p-12 lg:p-16">
                    <div className="max-w-2xl space-y-3 sm:space-y-4 text-right">
                      {/* Optional Kicker / Badge */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-black text-[#facc15]"
                      >
                        <Sparkles className="w-4 h-4 text-[#facc15] shrink-0" />
                        <span>{currentBanner.badgeText || 'إعلان رسمي — مركز نور الإسلام'}</span>
                        {currentBanner.endDate && (
                          <>
                            <span aria-hidden="true" className="text-emerald-300">·</span>
                            <span className="text-emerald-100 font-medium flex items-center gap-1 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-[#4ade80]" />
                              متاح حتى {currentBanner.endDate}
                            </span>
                          </>
                        )}
                      </motion.div>

                      {/* Title */}
                      {currentBanner.title && (
                        <motion.h3
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.45, delay: 0.22 }}
                          className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-sm"
                        >
                          {currentBanner.title}
                        </motion.h3>
                      )}

                      {/* Short Description */}
                      {currentBanner.description && (
                        <motion.p
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.45, delay: 0.3 }}
                          className="text-xs sm:text-base text-emerald-50/95 leading-relaxed line-clamp-3 font-medium max-w-xl"
                        >
                          {currentBanner.description}
                        </motion.p>
                      )}

                      {/* Optional CTA Button */}
                      {currentBanner.buttonText && currentBanner.buttonLink && (
                        <motion.div
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.45, delay: 0.38 }}
                          className="pt-2"
                        >
                          <button
                            onClick={() => handleBannerAction(currentBanner)}
                            className="inline-flex items-center gap-2.5 px-6 py-3 sm:px-7 sm:py-3.5 rounded-2xl bg-[#facc15] hover:bg-[#fde047] text-stone-950 font-black text-xs sm:text-sm transition shadow-lg hover:shadow-xl cursor-pointer"
                          >
                            <span>{currentBanner.buttonText}</span>
                            {currentBanner.linkType === 'external' ? (
                              <ExternalLink className="w-4 h-4" />
                            ) : (
                              <ArrowLeft className="w-4 h-4" />
                            )}
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* MODE B: Full Image Banner Only (Ready-made graphic poster) */
                <div
                  onClick={() => currentBanner.buttonLink && handleBannerAction(currentBanner)}
                  className={`absolute inset-0 z-20 flex flex-col justify-end p-4 sm:p-6 ${
                    currentBanner.buttonLink ? 'cursor-pointer' : ''
                  }`}
                >
                  {/* Subtle bottom gradient only if there's a CTA button */}
                  {currentBanner.buttonText && currentBanner.buttonLink && (
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBannerAction(currentBanner);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-[#facc15] hover:bg-[#fde047] text-stone-950 font-black text-xs sm:text-sm transition shadow-xl border-2 border-[#144519] cursor-pointer"
                      >
                        <span>{currentBanner.buttonText}</span>
                        {currentBanner.linkType === 'external' ? (
                          <ExternalLink className="w-4 h-4" />
                        ) : (
                          <ArrowLeft className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Subtle Center Watermark Badge in Top-Left Corner (Desktop) */}
          <div className="hidden sm:flex items-center gap-2 absolute top-5 left-5 z-20 bg-[#144519]/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#facc15]/50 shadow-md pointer-events-none">
            <CenterLogo size="sm" variant="light" />
            <div className="text-right">
              <span className="text-[11px] font-black text-white block leading-none">
                مركز نور الإسلام
              </span>
              <span className="text-[9px] font-bold text-[#facc15] block mt-0.5" dir="ltr">
                NURUL ISLAM CENTER
              </span>
            </div>
          </div>

          {/* Navigation Arrows (السابق / التالي) - Only shown when more than 1 active banner */}
          {activeBanners.length > 1 && (
            <>
              {/* Previous Button (Right side in RTL) */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="الإعلان السابق"
                title="الإعلان السابق"
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#144519]/80 hover:bg-[#1b5e20] text-white hover:text-[#facc15] border border-[#facc15]/60 backdrop-blur-md flex items-center justify-center shadow-lg transition opacity-85 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Next Button (Left side in RTL) */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="الإعلان التالي"
                title="الإعلان التالي"
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#144519]/80 hover:bg-[#1b5e20] text-white hover:text-[#facc15] border border-[#facc15]/60 backdrop-blur-md flex items-center justify-center shadow-lg transition opacity-85 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Auto-Play Progress Indicator Bar at Bottom of Banner */}
          {activeBanners.length > 1 && !isPaused && (
            <div className="absolute bottom-0 inset-x-0 h-1 bg-black/30 z-30 overflow-hidden">
              <motion.div
                key={`progress-${currentIndex}`}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: 'linear' }}
                className="h-full bg-[#facc15]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls: Navigation Dots (● ● ● ●) & Prev/Next Quick Buttons */}
      {activeBanners.length > 1 && (
        <div className="flex items-center justify-between sm:justify-center gap-4 pt-1">
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#1b5e20] border border-emerald-800/20 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          {/* Dots */}
          <div
            className="flex items-center justify-center gap-2"
            role="tablist"
            aria-label="التنقل بين الإعلانات"
          >
            {activeBanners.map((banner, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={banner.id || idx}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`الانتقال إلى الإعلان ${idx + 1}: ${banner.title || ''}`}
                  onClick={() => handleSelectDot(idx)}
                  className={`h-3 rounded-full transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'w-9 bg-[#1b5e20] ring-2 ring-[#facc15] shadow-xs'
                      : 'w-3 bg-stone-300 hover:bg-emerald-700/50'
                  }`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#1b5e20] border border-emerald-800/20 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <span>التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};
