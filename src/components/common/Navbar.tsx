import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  FilePlus,
  Shield,
  GraduationCap,
  CheckCheck,
  ChevronDown,
  Home,
  Info,
  Target,
  Compass,
  Calendar,
  Layers,
  BookOpen,
  Building2,
  Phone,
  LogIn,
  UserPlus,
  ChevronLeft,
} from 'lucide-react';
import { formatDateTimeArabic } from '../../utils/helpers';
import { CenterLogo } from './CenterLogo';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when side menu drawer is open on mobile/tablet
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (view: string, hash?: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    onNavigate('home');
  };

  const sideMenuItems = [
    {
      label: 'الرئيسية',
      view: 'home',
      icon: Home,
      isActive: currentView === 'home',
    },
    {
      label: 'عن المركز',
      view: 'about',
      icon: Info,
      isActive: currentView === 'about',
    },
    {
      label: 'أهداف المركز',
      view: 'home',
      hash: 'goals-section',
      icon: Target,
      isActive: false,
    },
    {
      label: 'رؤيتنا ورسالتنا',
      view: 'home',
      hash: 'vision-mission',
      icon: Compass,
      isActive: false,
    },
    {
      label: 'تاريخ التأسيس (1422هـ / 2001م)',
      view: 'home',
      hash: 'history-section',
      icon: Calendar,
      isActive: false,
    },
    {
      label: 'المراحل الدراسية',
      view: 'home',
      hash: 'stages-section',
      icon: Layers,
      isActive: false,
    },
    {
      label: 'قسم تحفيظ القرآن',
      view: 'home',
      hash: 'tahfeez-section',
      icon: BookOpen,
      isActive: false,
    },
    {
      label: 'مرافق المركز',
      view: 'home',
      hash: 'facilities-section',
      icon: Building2,
      isActive: false,
    },
    {
      label: 'تواصل معنا',
      view: 'contact',
      icon: Phone,
      isActive: currentView === 'contact',
    },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl border-b-2 border-[#1b5e20]/20 shadow-md'
            : 'bg-white border-b border-stone-200 shadow-2xs'
        }`}
      >
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            {/* Official Brand Logo + Arabic & English Names (Right Edge in RTL) */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2.5 sm:gap-3 group text-right cursor-pointer min-w-0 shrink-0"
            >
              <CenterLogo
                size="md"
                className="group-hover:scale-105 transition-transform duration-300 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-base sm:text-xl text-[#144519] tracking-tight truncate">
                    مركز نور الإسلام
                  </span>
                  <span className="hidden md:inline-block text-[10px] bg-[#fef9c3] text-stone-900 font-bold px-2 py-0.5 rounded-md border border-[#facc15] shrink-0">
                    مويالي - إثيوبيا
                  </span>
                </div>
                <p
                  className="text-[9px] sm:text-[11px] text-[#1d4ed8] font-extrabold tracking-wide font-sans truncate"
                  dir="ltr"
                >
                  NURUL ISLAM CENTER MOYALE - ETHIOPIA
                </p>
              </div>
            </button>

            {/* Uncluttered Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-stone-700">
              <button
                onClick={() => handleNavClick('home')}
                className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                  currentView === 'home'
                    ? 'bg-[#1b5e20] text-[#facc15]'
                    : 'hover:bg-emerald-50 hover:text-[#1b5e20]'
                }`}
              >
                الرئيسية
              </button>

              <button
                onClick={() => handleNavClick('about')}
                className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                  currentView === 'about'
                    ? 'bg-[#1b5e20] text-[#facc15]'
                    : 'hover:bg-emerald-50 hover:text-[#1b5e20]'
                }`}
              >
                عن المركز
              </button>

              <button
                onClick={() => handleNavClick('home', 'stages-section')}
                className="px-3.5 py-2 rounded-xl hover:bg-emerald-50 hover:text-[#1b5e20] transition cursor-pointer"
              >
                المراحل الدراسية
              </button>

              <button
                onClick={() => handleNavClick('home', 'tahfeez-section')}
                className="px-3.5 py-2 rounded-xl hover:bg-emerald-50 hover:text-[#1b5e20] transition cursor-pointer"
              >
                قسم تحفيظ القرآن
              </button>

              <button
                onClick={() => handleNavClick('home', 'facilities-section')}
                className="px-3.5 py-2 rounded-xl hover:bg-emerald-50 hover:text-[#1b5e20] transition cursor-pointer"
              >
                مرافق المركز
              </button>

              <button
                onClick={() => handleNavClick('contact')}
                className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                  currentView === 'contact'
                    ? 'bg-[#1b5e20] text-[#facc15]'
                    : 'hover:bg-emerald-50 hover:text-[#1b5e20]'
                }`}
              >
                تواصل معنا
              </button>

              {/* "المزيد" Dropdown for secondary sections */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className="px-3.5 py-2 rounded-xl hover:bg-emerald-50 hover:text-[#1b5e20] transition flex items-center gap-1 cursor-pointer"
                >
                  <span>المزيد</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      moreDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {moreDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-right"
                    >
                      <button
                        onClick={() => handleNavClick('home', 'goals-section')}
                        className="w-full px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-emerald-50 hover:text-[#1b5e20] text-right transition cursor-pointer"
                      >
                        أهداف المركز (7 أهداف)
                      </button>
                      <button
                        onClick={() => handleNavClick('home', 'vision-mission')}
                        className="w-full px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-emerald-50 hover:text-[#1b5e20] text-right transition cursor-pointer"
                      >
                        رؤيتنا ورسالتنا
                      </button>
                      <button
                        onClick={() => handleNavClick('home', 'history-section')}
                        className="w-full px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-emerald-50 hover:text-[#1b5e20] text-right transition cursor-pointer"
                      >
                        تاريخ التأسيس (1422هـ / 2001م)
                      </button>
                      <div className="border-t border-stone-100 my-1" />
                      <button
                        onClick={() =>
                          handleNavClick(currentUser ? 'student-dashboard' : 'login')
                        }
                        className="w-full px-4 py-2.5 text-xs font-bold text-[#1b5e20] hover:bg-emerald-50 text-right transition cursor-pointer"
                      >
                        متابعة طلب التسجيل
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* User Actions & Edge Menu Button (Left Edge in RTL) */}
            <div className="flex items-center gap-2 shrink-0">
              {currentUser ? (
                <>
                  {/* Notifications Bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="relative p-2.5 text-stone-600 hover:text-[#1b5e20] hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                      title="الإشعارات"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
                          {unreadCount > 9 ? '+9' : unreadCount}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {notificationsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.96 }}
                          className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200 z-50 py-2 text-right"
                        >
                          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 text-sm">الإشعارات</span>
                              {unreadCount > 0 && (
                                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                  {unreadCount} جديدة
                                </span>
                              )}
                            </div>
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="text-xs text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                تحديد الكل كمقروء
                              </button>
                            )}
                          </div>

                          <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
                            {notifications.length === 0 ? (
                              <div className="py-8 text-center text-stone-400 text-sm">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                                لا توجد إشعارات حالياً
                              </div>
                            ) : (
                              notifications.map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => {
                                    if (n.id && !n.isRead) markAsRead(n.id);
                                    if (n.link) handleNavClick(n.link);
                                    setNotificationsOpen(false);
                                  }}
                                  className={`p-3.5 hover:bg-stone-50 transition cursor-pointer ${
                                    !n.isRead ? 'bg-emerald-50/40 font-medium' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-xs font-bold text-stone-800">{n.title}</h4>
                                    <span className="text-[10px] text-stone-400 shrink-0">
                                      {formatDateTimeArabic(n.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                                    {n.message}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Dashboard Shortcut Button */}
                  {isAdmin ? (
                    <button
                      onClick={() => handleNavClick('admin-dashboard')}
                      className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#144519] text-[#facc15] hover:bg-[#1b5e20] text-xs font-bold transition shadow-xs cursor-pointer border border-[#facc15]/40"
                    >
                      <Shield className="w-4 h-4 text-[#facc15]" />
                      <span>لوحة الإدارة</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleNavClick('student-dashboard')}
                      className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1b5e20] text-[#facc15] hover:bg-[#144519] text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4 text-[#facc15]" />
                      <span>متابعة الطلب</span>
                    </button>
                  )}

                  {/* User Dropdown */}
                  <div className="relative" ref={userRef}>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-100 transition cursor-pointer border border-transparent hover:border-stone-200"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#1b5e20] flex items-center justify-center font-bold text-sm">
                        {userProfile?.fullName?.[0] || currentUser.email?.[0] || 'م'}
                      </div>
                      <div className="hidden xl:block text-right">
                        <p className="text-xs font-bold text-stone-800 max-w-[100px] truncate">
                          {userProfile?.fullName || 'المستخدم'}
                        </p>
                        <p className="text-[10px] text-[#1b5e20] font-semibold">
                          {isAdmin ? 'مدير المركز' : 'طالب / ولي أمر'}
                        </p>
                      </div>
                    </button>

                    <AnimatePresence>
                      {userDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.96 }}
                          className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 z-50 py-2 text-right"
                        >
                          <div className="px-4 py-2.5 border-b border-stone-100">
                            <p className="text-xs font-bold text-stone-900">
                              {userProfile?.fullName || 'المستخدم'}
                            </p>
                            <p className="text-[11px] text-stone-500 truncate">
                              {currentUser.email}
                            </p>
                          </div>

                          <div className="py-1">
                            {isAdmin ? (
                              <button
                                onClick={() => {
                                  setUserDropdownOpen(false);
                                  handleNavClick('admin-dashboard');
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-[#1b5e20] transition text-right cursor-pointer"
                              >
                                <Shield className="w-4 h-4 text-[#1b5e20]" />
                                لوحة الإدارة
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setUserDropdownOpen(false);
                                    handleNavClick('student-dashboard');
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-[#1b5e20] transition text-right cursor-pointer"
                                >
                                  <LayoutDashboard className="w-4 h-4 text-[#1b5e20]" />
                                  متابعة طلب التسجيل
                                </button>
                                <button
                                  onClick={() => {
                                    setUserDropdownOpen(false);
                                    handleNavClick('new-application');
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-[#1b5e20] transition text-right cursor-pointer"
                                >
                                  <FilePlus className="w-4 h-4 text-[#1b5e20]" />
                                  طلب تسجيل جديد
                                </button>
                              </>
                            )}
                          </div>

                          <div className="border-t border-stone-100 pt-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-right cursor-pointer"
                            >
                              <LogOut className="w-4 h-4 text-rose-600" />
                              تسجيل الخروج
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => handleNavClick('login')}
                    className="px-3.5 py-2 text-xs font-bold text-stone-700 hover:text-[#1b5e20] hover:bg-stone-100 rounded-xl transition cursor-pointer"
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    onClick={() => handleNavClick('register')}
                    className="px-4 py-2.5 text-xs font-black bg-[#1b5e20] text-[#facc15] hover:bg-[#144519] rounded-xl shadow-xs transition cursor-pointer border border-emerald-700"
                  >
                    التسجيل الجديد
                  </button>
                </div>
              )}

              {/* Mobile & iPad Side Drawer Toggle Button (On the Edge) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden inline-flex items-center justify-center w-11 h-11 text-stone-700 hover:text-[#1b5e20] bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-[#1b5e20]/30 rounded-xl transition cursor-pointer"
                aria-label="القائمة الجانبية"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile & iPad Side Menu Drawer (على الطرف) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" dir="rtl">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs"
            />

            {/* Side Drawer Panel anchored to the Left Edge (where the menu button is) */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 sm:w-80 max-w-[85vw] bg-white shadow-2xl border-r border-stone-200 z-50 flex flex-col justify-between overflow-y-auto"
            >
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100 bg-gradient-to-l from-[#144519] to-[#1b5e20] text-white">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CenterLogo size="sm" />
                    <div className="min-w-0 text-right">
                      <p className="font-black text-sm text-white truncate">
                        مركز نور الإسلام
                      </p>
                      <p className="text-[10px] text-[#facc15] font-bold truncate">
                        القائمة الرئيسية
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                    aria-label="إغلاق القائمة"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Vertical Navigation Links on the Side */}
                <nav className="p-3 space-y-1 text-right">
                  {sideMenuItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleNavClick(item.view, item.hash)}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                          item.isActive
                            ? 'bg-[#1b5e20] text-[#facc15] shadow-xs'
                            : 'text-stone-800 hover:bg-emerald-50 hover:text-[#1b5e20]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              item.isActive ? 'text-[#facc15]' : 'text-[#1b5e20]'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <ChevronLeft
                          className={`w-4 h-4 shrink-0 ${
                            item.isActive ? 'text-[#facc15]' : 'text-stone-400'
                          }`}
                        />
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Footer: Auth & Dashboard Buttons */}
              <div className="p-4 border-t border-stone-200 bg-stone-50/80 space-y-2.5">
                {currentUser ? (
                  <>
                    <div className="px-3 py-2 bg-white rounded-xl border border-stone-200/80 text-right mb-2">
                      <p className="text-xs font-bold text-stone-900 truncate">
                        {userProfile?.fullName || 'المستخدم'}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    {isAdmin ? (
                      <button
                        onClick={() => handleNavClick('admin-dashboard')}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#144519] text-[#facc15] font-black text-xs shadow-xs hover:bg-[#1b5e20] transition cursor-pointer"
                      >
                        <Shield className="w-4 h-4" />
                        <span>لوحة الإدارة</span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleNavClick('student-dashboard')}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1b5e20] text-[#facc15] font-black text-xs shadow-xs hover:bg-[#144519] transition cursor-pointer"
                        >
                          <GraduationCap className="w-4 h-4" />
                          <span>متابعة طلب التسجيل</span>
                        </button>
                        <button
                          onClick={() => handleNavClick('new-application')}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-emerald-700/30 text-[#1b5e20] font-bold text-xs hover:bg-emerald-50 transition cursor-pointer"
                        >
                          <FilePlus className="w-4 h-4" />
                          <span>طلب تسجيل جديد</span>
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleNavClick('register')}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 text-center text-xs font-black bg-[#1b5e20] text-[#facc15] hover:bg-[#144519] rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>التسجيل الجديد</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('login')}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 text-center text-xs font-bold bg-white border border-stone-300 hover:border-[#1b5e20] rounded-xl text-stone-800 hover:text-[#1b5e20] transition cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>تسجيل الدخول</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
