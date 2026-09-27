import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';

export const ScrollBrowsingEnhancements: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;
      setScrollPercent(pct);
      setShowScrollTop(scrollTop > 280);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollPercent / 100) * circumference;

  return (
    <>
      {/* Top Scroll Progress Bar */}
      <motion.div
        style={{ scaleX, transformOrigin: 'right' }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-l from-emerald-700 via-amber-500 to-emerald-500 z-50 pointer-events-none shadow-xs"
      />

      {/* Floating Scroll-To-Top Button with Circular Progress Ring */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 24 }}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            onClick={scrollToTop}
            title="العودة إلى الأعلى"
            aria-label="العودة إلى الأعلى"
            className="fixed bottom-6 left-6 z-40 w-13 h-13 rounded-full bg-white/95 backdrop-blur-md text-emerald-900 shadow-lg hover:shadow-xl border border-stone-200/80 flex items-center justify-center cursor-pointer group"
          >
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                stroke="#e7e5e4"
                strokeWidth="2.5"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                stroke="#047857"
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-150"
              />
            </svg>
            <ArrowUp className="w-5 h-5 text-emerald-800 group-hover:text-amber-600 transition-colors relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
