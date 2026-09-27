import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeroSlideItem, CenterSettings } from '../../types';
import { isHeroSlideCurrentlyVisible } from '../../utils/helpers';
import { CenterLogo } from '../common/CenterLogo';
import { DiamondDivider } from '../common/IslamicOrnaments';
import {
  ChevronRight,
  ChevronLeft,
  FileCheck2,
  ArrowLeft,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

interface MainHeroSliderProps {
  slides: HeroSlideItem[];
  settings: CenterSettings | null;
  isAdmin?: boolean;
  onNavigate: (view: string) => void;
  onManageSlides?: () => void;
}

const SLIDE_DURATION_MS = 6000; // 6 seconds per slide (5-7s range)

export const MainHeroSlider: React.FC<MainHeroSliderProps> = ({
  slides,
  settings,
  isAdmin = false,
  onNavigate,
  onManageSlides,
}) => {
  // Filter only published slides within their valid startDate/endDate window
  // Sort: Featured slide first (if any), then by order ascending (1, 2, 3...)
  const visibleSlides = React.useMemo(() => {
    return slides
      .filter((s) => isHeroSlideCurrentlyVisible(s))
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (a.order ?? 99) - (b.order ?? 99);
      });
  }, [slides]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch swipe tracking for Mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (currentIndex >= visibleSlides.length && visibleSlides.length > 0) {
      setCurrentIndex(0);
    }
  }, [visibleSlides.length, currentIndex]);

  const handleNext = useCallback(() => {
    if (visibleSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % visibleSlides.length);
  }, [visibleSlides.length]);

  const handlePrev = useCallback(() => {
    if (visibleSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + visibleSlides.length) % visibleSlides.length);
  }, [visibleSlides.length]);

  // Auto Play Timer (5-7 seconds, pauses on mouse hover or touch)
  useEffect(() => {
    if (visibleSlides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [visibleSlides.length, isPaused, handleNext, currentIndex]);

  // Preload the next slide image in the background for instant transitions
  useEffect(() => {
    if (visibleSlides.length <= 1) return;
    const nextIdx = (currentIndex + 1) % visibleSlides.length;
    const nextSlide = visibleSlides[nextIdx];
    if (nextSlide?.desktopImageUrl) {
      const img = new Image();
      img.src = nextSlide.desktopImageUrl;
    }
  }, [currentIndex, visibleSlides]);

  // Mobile Swipe Handlers (RTL-aware)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      const minSwipe = 45;
      if (distance > minSwipe) {
        handleNext();
      } else if (distance < -minSwipe) {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    setIsPaused(false);
  };

  const handleSlideAction = (slide: HeroSlideItem) => {
    if (!slide.link) return;
    if (
      slide.linkType === 'external' ||
      slide.link.startsWith('http://') ||
      slide.link.startsWith('https://')
    ) {
      window.open(slide.link, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate(slide.link);
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

  // ============================================================================
  // CASE A: No Published Slides Yet -> Default Official Opening Hero Slide
  // ============================================================================
  if (visibleSlides.length === 0) {
    return (
      <section
        aria-label="الواجهة الرئيسية لمركز نور الإسلام"
        className="relative w-full overflow-hidden bg-gradient-to-b from-[#144519] via-[#1b5e20] to-[#113814] text-white border-b-4 border-[#facc15]"
        dir="rtl"
      >
        <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none" />
        <div className="absolute -top-32 right-1/2 translate-x-1/2 w-[700px] h-[350px] bg-[#4ade80]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 relative z-10">
          <div className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-[#facc15]/25 blur-xl pointer-events-none" />
                <CenterLogo size="hero" variant="light" className="relative z-10" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-2.5"
            >
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
                {settings?.centerName || 'مركز نور الإسلام'}
              </h1>
              <p
                className="text-sm sm:text-lg lg:text-xl font-extrabold tracking-wider text-[#facc15] font-sans"
                dir="ltr"
              >
                {settings?.centerNameEn || 'NURUL ISLAM CENTER MOYALE - ETHIOPIA'}
              </p>
            </motion.div>

            <DiamondDivider variant="yellow" />

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="text-lg sm:text-2xl font-bold text-emerald-50 max-w-2xl mx-auto"
            >
              {settings?.tagline || 'منارة للعلم والتربية الإسلامية'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-3"
            >
              {settings?.registrationOpen !== false ? (
                <button
                  onClick={() => onNavigate('register')}
                  className="px-8 py-4 rounded-2xl bg-[#facc15] hover:bg-[#fde047] text-stone-950 font-black text-sm sm:text-base transition shadow-lg cursor-pointer flex items-center gap-2.5"
                >
                  <FileCheck2 className="w-5 h-5 text-stone-950" />
                  <span>التسجيل الجديد</span>
                </button>
              ) : (
                <div className="px-6 py-3.5 rounded-2xl bg-white/15 text-amber-200 text-xs font-bold border border-white/20">
                  التسجيل الإلكتروني مغلق حالياً
                </div>
              )}

              <button
                onClick={() => onNavigate('login')}
                className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base transition border border-white/30 backdrop-blur-xs cursor-pointer flex items-center gap-2"
              >
                <span>متابعة طلب التسجيل</span>
                <ChevronLeft className="w-4 h-4 text-[#facc15]" />
              </button>

              {isAdmin && onManageSlides && (
                <button
                  onClick={onManageSlides}
                  className="px-5 py-4 rounded-2xl bg-[#0c2b0f]/80 hover:bg-[#0c2b0f] text-[#facc15] font-bold text-xs sm:text-sm transition border border-[#facc15]/50 cursor-pointer flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>إدارة شرائح المحتوى الرئيسي</span>
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  const currentSlide = visibleSlides[currentIndex] || visibleSlides[0];
  const hasTitle = Boolean(currentSlide.title && currentSlide.title.trim().length > 0);
  const hasDescription = Boolean(
    currentSlide.description && currentSlide.description.trim().length > 0
  );
  const hasButton = Boolean(
    currentSlide.buttonText &&
      currentSlide.buttonText.trim().length > 0 &&
      currentSlide.link &&
      currentSlide.link.trim().length > 0
  );
  const hasAnyOverlayContent = hasTitle || hasDescription || hasButton;

  // ============================================================================
  // CASE B: Full-Width Main Visual Hero Slider Directly Below Navbar
  // ============================================================================
  return (
    <section
      aria-label="المعرض البصري الرئيسي لمركز نور الإسلام"
      className="relative w-full bg-[#0c2b0f] border-b-4 border-[#facc15] select-none overflow-hidden"
      dir="rtl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Hero Viewport Container:
          Mobile: 340px-400px | Tablet: 460px-520px | Desktop: 540px-630px */}
      <div className="relative w-full h-[350px] sm:h-[460px] md:h-[520px] lg:h-[580px] xl:h-[630px] max-w-[1920px] mx-auto overflow-hidden bg-[#113814]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentSlide.id || currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => {
              if (!hasButton && currentSlide.link) {
                handleSlideAction(currentSlide);
              }
            }}
            className={`absolute inset-0 w-full h-full ${
              !hasButton && currentSlide.link ? 'cursor-pointer' : ''
            }`}
          >
            {/* Slide Image with calm, dignified Ken Burns slow motion */}
            <motion.picture
              initial={{ scale: 1 }}
              animate={{ scale: hasAnyOverlayContent ? 1.035 : 1.015 }}
              transition={{ duration: 6.5, ease: 'easeOut' }}
              className="w-full h-full block"
            >
              {currentSlide.mobileImageUrl && (
                <source media="(max-width: 639px)" srcSet={currentSlide.mobileImageUrl} />
              )}
              <img
                src={currentSlide.desktopImageUrl}
                alt={currentSlide.title || 'مركز نور الإسلام — مويالي'}
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
                fetchPriority={currentIndex === 0 ? 'high' : 'auto'}
                className={`w-full h-full object-cover ${getObjectPositionClass(
                  currentSlide.objectPosition
                )}`}
              />
            </motion.picture>

            {/* Professional Partial Gradient Overlay ONLY when text/button is present
                Does NOT cover the whole image so students and facilities stay bright and clear */}
            {hasAnyOverlayContent && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-[#09220c]/90 via-[#0f3512]/35 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-full sm:w-3/4 lg:w-2/3 bg-gradient-to-l from-[#09220c]/80 via-[#144519]/35 to-transparent pointer-events-none" />

                {/* Text & Button Content Box */}
                <div className="absolute inset-0 z-20 flex items-end pb-14 sm:pb-16 lg:pb-20">
                  <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
                      className="max-w-2xl space-y-2.5 sm:space-y-3.5 text-right"
                    >
                      {/* Optional Content Type Kicker */}
                      {currentSlide.contentType && (
                        <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#facc15] drop-shadow-xs">
                          <Sparkles className="w-3.5 h-3.5 text-[#facc15]" />
                          <span>{currentSlide.contentType}</span>
                          <span aria-hidden="true" className="text-emerald-300/80">·</span>
                          <span className="text-emerald-100/90 font-bold text-xs">
                            مركز نور الإسلام
                          </span>
                        </div>
                      )}

                      {/* Optional Title */}
                      {hasTitle && (
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-md">
                          {currentSlide.title}
                        </h2>
                      )}

                      {/* Optional Short Description */}
                      {hasDescription && (
                        <p className="text-xs sm:text-base lg:text-lg text-emerald-50/95 font-medium leading-relaxed line-clamp-2 sm:line-clamp-3 drop-shadow-xs max-w-xl">
                          {currentSlide.description}
                        </p>
                      )}

                      {/* Optional Action Button */}
                      {hasButton && (
                        <div className="pt-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSlideAction(currentSlide);
                            }}
                            className="inline-flex items-center gap-2.5 px-6 py-3 sm:px-8 sm:py-3.5 rounded-2xl bg-[#facc15] hover:bg-[#fde047] text-stone-950 font-black text-xs sm:text-sm lg:text-base transition shadow-lg hover:shadow-xl cursor-pointer"
                          >
                            <span>{currentSlide.buttonText}</span>
                            {currentSlide.linkType === 'external' ? (
                              <ExternalLink className="w-4 h-4" />
                            ) : (
                              <ArrowLeft className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Admin Quick Manage Button in Top-Left Corner */}
        {isAdmin && onManageSlides && (
          <div className="absolute top-4 left-4 z-30">
            <button
              type="button"
              onClick={onManageSlides}
              className="px-4 py-2 rounded-xl bg-[#0c2b0f]/85 hover:bg-[#144519] text-[#facc15] border border-[#facc15]/60 backdrop-blur-md text-xs font-black shadow-lg flex items-center gap-2 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>إدارة المحتوى الرئيسي ({slides.length})</span>
            </button>
          </div>
        )}

        {/* Left & Right Navigation Arrows (Inspired by Reference Hero Slider, RTL-compatible) */}
        {visibleSlides.length > 1 && (
          <>
            {/* Previous Slide Button (Right Edge in RTL) */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="الشريحة السابقة"
              title="الشريحة السابقة"
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/35 hover:bg-[#144519]/90 text-white hover:text-[#facc15] border border-white/30 hover:border-[#facc15] backdrop-blur-xs flex items-center justify-center transition duration-200 shadow-lg cursor-pointer"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>

            {/* Next Slide Button (Left Edge in RTL) */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="الشريحة التالية"
              title="الشريحة التالية"
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/35 hover:bg-[#144519]/90 text-white hover:text-[#facc15] border border-white/30 hover:border-[#facc15] backdrop-blur-xs flex items-center justify-center transition duration-200 shadow-lg cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </>
        )}

        {/* Bottom Navigation Dots (● ● ○ ●) */}
        {visibleSlides.length > 1 && (
          <div
            className="absolute bottom-4 inset-x-0 z-30 flex items-center justify-center gap-2.5 px-4"
            role="tablist"
            aria-label="شرائح العرض الرئيسي"
          >
            {visibleSlides.map((slide, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={slide.id || idx}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`الشريحة ${idx + 1}${slide.title ? `: ${slide.title}` : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'w-8 bg-[#facc15] shadow-md ring-2 ring-[#144519]/80'
                      : 'w-2.5 bg-white/70 hover:bg-white'
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Subtle Auto-Play Progress Line at Very Bottom of Hero Image */}
        {visibleSlides.length > 1 && !isPaused && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-black/30 z-30 overflow-hidden">
            <motion.div
              key={`hero-progress-${currentIndex}`}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: SLIDE_DURATION_MS / 1000, ease: 'linear' }}
              className="h-full bg-[#facc15]"
            />
          </div>
        )}
      </div>

      {/* Integrated Official Center Identity Bar Below the Hero Slider
          Preserves Center Logo, Name, Tagline, and Primary Registration CTAs without cluttering the photos */}
      <div className="bg-gradient-to-l from-[#144519] via-[#1b5e20] to-[#0f3512] text-white border-t border-white/15 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-right">
            <CenterLogo size="sm" variant="light" className="shrink-0" />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white">
                  {settings?.centerName || 'مركز نور الإسلام'}
                </h1>
                <span className="hidden sm:inline-block text-[#facc15]">•</span>
                <span className="text-xs sm:text-sm font-bold text-[#facc15]">
                  {settings?.tagline || 'منارة للعلم والتربية الإسلامية'}
                </span>
              </div>
              <p
                className="text-[11px] sm:text-xs font-extrabold text-emerald-200 tracking-wider font-sans mt-0.5"
                dir="ltr"
              >
                {settings?.centerNameEn || 'NURUL ISLAM CENTER MOYALE - ETHIOPIA'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            {settings?.registrationOpen !== false ? (
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#facc15] hover:bg-[#fde047] text-stone-950 font-black text-xs sm:text-sm transition shadow-md cursor-pointer flex items-center gap-2"
              >
                <FileCheck2 className="w-4 h-4 text-stone-950" />
                <span>التسجيل الجديد</span>
              </button>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-white/10 text-amber-200 text-xs font-bold border border-white/20">
                التسجيل مغلق حالياً
              </span>
            )}

            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition border border-white/25 cursor-pointer flex items-center gap-1.5"
            >
              <span>متابعة طلب التسجيل</span>
              <ChevronLeft className="w-4 h-4 text-[#facc15]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
