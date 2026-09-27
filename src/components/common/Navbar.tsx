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
    onNavigate('home');
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b-2 border-[#1b5e20]/20 shadow-md'
          : 'bg-white border-b border-stone-200 shadow-2xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Official Brand Logo + Arabic & English Names */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 group text-right cursor-pointer"
          >
            <CenterLogo
              size="md"
              className="group-hover:scale-105 transition-transform duration-300"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl text-[#144519] tracking-tight">
                  مركز نور الإسلام
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-[#fef9c3] text-stone-900 font-bold px-2 py-0.5 rounded-md border border-[#facc15]">
                  مويالي - إثيوبيا
                </span>
              </div>
              <p
                className="text-[10px] sm:text-[11px] text-[#1d4ed8] font-extrabold tracking-wide font-sans"
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
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreDropdownOpen ? 'rotate-180' : ''}`} />
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

          {/* User Actions & Auth */}
          <div className="flex items-center gap-2.5">
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
                                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{n.message}</p>
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
                          <p className="text-xs font-bold text-stone-900">{userProfile?.fullName || 'المستخدم'}</p>
                          <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
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
              <div className="flex items-center gap-2">
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

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition cursor-pointer"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-6 space-y-2 shadow-lg overflow-hidden"
          >
            <nav className="grid grid-cols-2 gap-1.5 text-right">
              <button
                onClick={() => handleNavClick('home')}
                className="p-2.5 rounded-xl text-xs font-bold text-stone-800 hover:bg-emerald-50 text-right"
              >
                الرئيسية
              </button>
              <button
                onClick={() => handleNavClick('about')}
                className="p-2.5 rounded-xl text-xs font-bold text-stone-800 hover:bg-emerald-50 text-right"
              >
                عن المركز
              </button>
              <button
                onClick={() => handleNavClick('home', 'goals-section')}
                className="p-2.5 rounded-xl text-xs font-bold text-stone-800 hover:bg-emerald-50 text-right"
              >
                أهداف المركز
              </button>
              <button
                onClick={() => handleNavClick('home', 'vision-mission')}
                className="p-2.5 rounded-xl text-xs font-bold text-stone-800 hover:bg-emerald-50 text-right"
              >
                رؤيتنا ورسالتنا
              </button>
              <button
                onClick={() => handleNavClick('home', 'stages-section')}
                className="p-2.5 rounded-xl text-xs font-bold text-stone-800 hover:bg-emerald-50 text-right"
              >
                المراحل الدراسية
              </button>
              <button
                onClick={() => handleNavClick('home', 'tahfeez-section')}
                className="p-2.5 rounded-xl text-xs font-bold text-stone-800 hover:bg-emerald-50 text-right"
              >
                قسم تحفيظ القرآن
              </button>
              <button
                onClick={() => handleNavClick('home', 'facilities-section')}
                className="p-2.5 rounded-xl text-xs font-bold text-stone-800 hover:bg-emerald-50 text-right"
              >
                مرافق المركز
              </button>
              <button
                onClick={() => handleNavClick('contact')}
                className="p-2.5 rounded-xl text-xs font-bold text-stone-800 hover:bg-emerald-50 text-right"
              >
                تواصل معنا
              </button>
            </nav>

            <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
              {currentUser ? (
                <>
                  {isAdmin ? (
                    <button
                      onClick={() => handleNavClick('admin-dashboard')}
                      className="w-full py-2.5 rounded-xl bg-[#144519] text-[#facc15] font-bold text-xs"
                    >
                      لوحة الإدارة
                    </button>
                  ) : (
                    <button
                      onClick={() => handleNavClick('student-dashboard')}
                      className="w-full py-2.5 rounded-xl bg-[#1b5e20] text-[#facc15] font-bold text-xs"
                    >
                      متابعة طلب التسجيل
                    </button>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleNavClick('login')}
                    className="w-full py-2.5 text-center text-xs font-bold border border-stone-300 rounded-xl text-stone-800"
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    onClick={() => handleNavClick('register')}
                    className="w-full py-2.5 text-center text-xs font-bold bg-[#1b5e20] text-[#facc15] rounded-xl"
                  >
                    التسجيل الجديد
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
