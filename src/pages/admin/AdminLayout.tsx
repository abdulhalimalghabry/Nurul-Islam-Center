import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  GraduationCap,
  School,
  Layers,
  Settings,
  History,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Shield,
  BookMarked,
  Building2,
  Bell,
  Users,
  Images,
} from 'lucide-react';
import { CenterLogo } from '../../components/common/CenterLogo';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
  onExitAdmin: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
  onExitAdmin,
}) => {
  const { userProfile, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'hero-slides', label: 'المحتوى الرئيسي', icon: Images },
    { id: 'applications', label: 'طلبات التسجيل', icon: FileSpreadsheet },
    { id: 'students', label: 'الطلاب', icon: GraduationCap },
    { id: 'classes', label: 'الفصول والشعب', icon: School },
    { id: 'stages', label: 'المراحل الدراسية', icon: Layers },
    { id: 'tahfeez', label: 'قسم التحفيظ (3 فصول)', icon: BookMarked },
    { id: 'facilities', label: 'مرافق المركز (5)', icon: Building2 },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'users', label: 'المستخدمون', icon: Users },
    { id: 'logs', label: 'سجل العمليات', icon: History },
    { id: 'settings', label: 'الإعدادات والمحتوى', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f4f9f4] flex flex-col md:flex-row" dir="rtl">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-[#144519] text-white p-4 flex items-center justify-between shadow-md border-b-2 border-[#facc15]">
        <div className="flex items-center gap-2.5">
          <CenterLogo size="sm" variant="light" />
          <div>
            <span className="font-black text-sm text-white block">إدارة مركز نور الإسلام</span>
            <span className="text-[10px] text-[#facc15] font-bold block" dir="ltr">
              NURUL ISLAM CENTER MOYALE
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-emerald-100 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation — Official Green & Yellow Identity */}
      <aside
        className={`fixed md:sticky top-0 right-0 z-30 h-screen w-68 bg-gradient-to-b from-[#144519] via-[#113a14] to-[#0c2b0f] text-emerald-50 flex flex-col justify-between p-4 shadow-xl border-l-2 border-[#facc15]/40 transition-transform duration-300 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 px-2 py-3.5 border-b border-emerald-800/70 mb-4">
            <CenterLogo size="md" variant="light" />
            <div>
              <h2 className="font-black text-base text-white">مركز نور الإسلام</h2>
              <p className="text-[9px] text-[#facc15] font-bold font-sans" dir="ltr">
                NURUL ISLAM CENTER MOYALE
              </p>
              <span className="text-[10px] text-[#4ade80] font-bold flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3" />
                لوحة الإدارة الرسمية
              </span>
            </div>
          </div>

          {/* Admin Info */}
          <div className="bg-white/10 rounded-2xl p-3 mb-4 flex items-center gap-2.5 border border-white/15">
            <div className="w-8 h-8 rounded-lg bg-[#facc15] text-stone-950 flex items-center justify-center font-black text-xs shrink-0">
              {userProfile?.fullName?.[0] || 'م'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{userProfile?.fullName || 'مدير المركز'}</p>
              <p className="text-[10px] text-emerald-200 truncate">{userProfile?.email}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-right cursor-pointer z-10 ${
                    isActive
                      ? 'text-stone-950 font-black'
                      : 'text-emerald-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="adminSidebarActiveTab"
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                      className="absolute inset-0 rounded-xl bg-[#facc15] shadow-sm -z-10"
                    />
                  )}
                  <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-[#4ade80]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 mt-4 border-t border-emerald-800/70 space-y-1.5">
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-100 hover:bg-white/10 transition cursor-pointer text-right"
          >
            <ArrowRight className="w-4 h-4 text-[#facc15]" />
            <span>العودة للموقع الرسمي</span>
          </button>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition cursor-pointer text-right"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <main className="flex-1 p-4 sm:p-8 md:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
