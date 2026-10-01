import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ScrollBrowsingEnhancements } from './components/common/ScrollBrowsingEnhancements';
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { CompleteProfilePage } from './pages/auth/CompleteProfilePage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { RegistrationForm } from './components/student/RegistrationForm';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ApplicationsListPage } from './pages/admin/ApplicationsListPage';
import { StudentsListPage } from './pages/admin/StudentsListPage';
import { ClassesManagementPage } from './pages/admin/ClassesManagementPage';
import { StagesManagementPage } from './pages/admin/StagesManagementPage';
import { TahfeezManagementPage } from './pages/admin/TahfeezManagementPage';
import { FacilitiesManagementPage } from './pages/admin/FacilitiesManagementPage';
import { NotificationsManagementPage } from './pages/admin/NotificationsManagementPage';
import { UsersManagementPage } from './pages/admin/UsersManagementPage';
import { AdminLogsPage } from './pages/admin/AdminLogsPage';
import { CenterSettingsPage } from './pages/admin/CenterSettingsPage';
import { HeroSlidesManagementPage } from './pages/admin/HeroSlidesManagementPage';
import { ApplicationDetailModal } from './pages/admin/ApplicationDetailModal';
import { LoadingSpinner } from './components/common/LoadingSpinner';

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase/config';
import {
  Application,
  ClassItem,
  StageItem,
  StudentItem,
  CenterSettings,
  UserProfile,
  BannerItem,
  HeroSlideItem,
} from './types';
import { generateStudentNumber } from './utils/helpers';
import {
  INITIAL_STAGES,
  INITIAL_CLASSES,
  INITIAL_SETTINGS,
  mergeWithOfficialSettings,
} from './firebase/seedData';

const MainApp: React.FC = () => {
  const { currentUser, userProfile, isAdmin, needsProfileCompletion, loading: authLoading } = useAuth();

  // Navigation state
  const [currentView, setCurrentView] = useState<string>('home');
  const [adminTab, setAdminTab] = useState<string>('dashboard');

  // Application to edit in Student Form
  const [appToEdit, setAppToEdit] = useState<Application | null>(null);

  // Application selected in Admin Modal
  const [selectedAdminApp, setSelectedAdminApp] = useState<Application | null>(null);

  // Core Firestore Collections
  const [settings, setSettings] = useState<CenterSettings | null>(INITIAL_SETTINGS);
  const [stages, setStages] = useState<StageItem[]>(INITIAL_STAGES);
  const [classes, setClasses] = useState<ClassItem[]>(INITIAL_CLASSES as ClassItem[]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlideItem[]>([]);
  const [legacyBanners, setLegacyBanners] = useState<BannerItem[]>([]);

  // Scroll to top on view change
  const handleNavigateView = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Subscribe to Center Settings & Merge with Official Brochure Defaults
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'center'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(mergeWithOfficialSettings(docSnap.data() as Partial<CenterSettings>));
      } else {
        setSettings(INITIAL_SETTINGS);
      }
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Stages
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'stages'), (snap) => {
      const list: StageItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<StageItem, 'id'>) }));
      if (list.length > 0) {
        list.sort((a, b) => a.order - b.order);
        setStages(list);
      }
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to Classes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
      const list: ClassItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ClassItem, 'id'>) }));
      if (list.length > 0) {
        list.sort((a, b) => a.order - b.order);
        setClasses(list);
      }
    });
    return () => unsub();
  }, []);

  // 3.5 Subscribe to Main Hero Slides (heroSlides collection) + Migrate any previously uploaded banners
  useEffect(() => {
    const unsubHero = onSnapshot(collection(db, 'heroSlides'), (snap) => {
      const list: HeroSlideItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<HeroSlideItem, 'id'>) }));
      list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setHeroSlides(list);
    });

    const unsubLegacy = onSnapshot(collection(db, 'banners'), (snap) => {
      const list: BannerItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<BannerItem, 'id'>) }));
      setLegacyBanners(list);
    });

    return () => {
      unsubHero();
      unsubLegacy();
    };
  }, []);

  // Automatically migrate any legacy banner uploaded by Admin into heroSlides so no uploaded photo is lost
  useEffect(() => {
    if (!isAdmin || legacyBanners.length === 0) return;
    const existingIds = new Set(heroSlides.map((s) => s.id));
    legacyBanners.forEach(async (b) => {
      if (b.id && !existingIds.has(b.id) && b.imageUrl) {
        try {
          await setDoc(doc(db, 'heroSlides', b.id), {
            title: b.displayType === 'image_only' ? '' : b.title || '',
            description: b.displayType === 'image_only' ? '' : b.description || '',
            desktopImageUrl: b.imageUrl,
            mobileImageUrl: b.mobileImageUrl || '',
            buttonText: b.buttonText || '',
            link: b.buttonLink || '',
            linkType: b.linkType || 'internal',
            contentType: 'إعلان',
            objectPosition: b.objectPosition || 'center',
            order: b.order ?? 1,
            isPublished: b.isActive !== false,
            isFeatured: false,
            startDate: b.startDate || '',
            endDate: b.endDate || '',
            createdAt: b.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Ignore if already migrated
        }
      }
    });
  }, [isAdmin, legacyBanners, heroSlides]);

  // Combine heroSlides with any unmigrated legacy banners for immediate display
  const combinedHeroSlides = React.useMemo(() => {
    const existingIds = new Set(heroSlides.map((s) => s.id));
    const convertedLegacy: HeroSlideItem[] = legacyBanners
      .filter((b) => b.id && !existingIds.has(b.id) && b.imageUrl)
      .map((b) => ({
        id: b.id,
        title: b.displayType === 'image_only' ? '' : b.title || '',
        description: b.displayType === 'image_only' ? '' : b.description || '',
        desktopImageUrl: b.imageUrl,
        mobileImageUrl: b.mobileImageUrl || '',
        buttonText: b.buttonText || '',
        link: b.buttonLink || '',
        linkType: b.linkType || 'internal',
        contentType: 'إعلان',
        objectPosition: b.objectPosition || 'center',
        order: b.order ?? 1,
        isPublished: b.isActive !== false,
        isFeatured: false,
        startDate: b.startDate || '',
        endDate: b.endDate || '',
      }));
    return [...heroSlides, ...convertedLegacy].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }, [heroSlides, legacyBanners]);

  // 4. Subscribe to Applications (For Admins)
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(
      collection(db, 'applications'),
      (snap) => {
        const list: Application[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Application, 'id'>) }));
        setApplications(list);
      },
      (err) => console.warn('Applications snapshot note:', err)
    );
    return () => unsub();
  }, [isAdmin]);

  // 5. Subscribe to Enrolled Students (For Admins)
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(
      collection(db, 'students'),
      (snap) => {
        const list: StudentItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<StudentItem, 'id'>) }));
        setStudents(list);
      },
      (err) => console.warn('Students snapshot note:', err)
    );
    return () => unsub();
  }, [isAdmin]);

  // 6. Subscribe to Registered Users (For Admins)
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list: UserProfile[] = [];
        snap.forEach((d) => {
          const data = d.data() as UserProfile;
          list.push({ ...data, uid: data.uid || d.id });
        });
        setUsers(list);
      },
      (err) => console.warn('Users snapshot note:', err)
    );
    return () => unsub();
  }, [isAdmin]);

  // ---------------- Administrative Handlers ----------------

  const handleAcceptApplication = async (
    app: Application,
    stageId: string,
    grade: string,
    classId: string,
    notes: string
  ) => {
    if (!app.id) return;
    const studentNumber = generateStudentNumber();
    const stageObj = stages.find((s) => s.id === stageId);
    const classObj = classes.find((c) => c.id === classId);

    const studentDocId = `student-${app.id}`;
    const studentRecord: StudentItem = {
      id: studentDocId,
      studentNumber,
      applicationId: app.id,
      userId: app.userId,
      studentName: app.studentName,
      studentNameEn: app.studentNameEn || '',
      nationalId: app.nationalId,
      stageId,
      stageName: stageObj?.name || app.stageName || 'المرحلة المقررة',
      grade,
      classId,
      className: classObj?.name || 'الفصل المخصص',
      phone: app.phone,
      parentName: app.parentName,
      parentPhone: app.parentPhone,
      status: 'active',
      enrolledAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'students', studentDocId), studentRecord, { merge: true });

    await setDoc(
      doc(db, 'applications', app.id),
      {
        status: 'accepted',
        assignedStageId: stageId,
        assignedStageName: stageObj?.name || app.stageName,
        assignedGrade: grade,
        assignedClassId: classId,
        assignedClassName: classObj?.name || '',
        studentIdGenerated: studentNumber,
        adminNotes: notes,
        reviewedAt: serverTimestamp(),
        reviewedBy: userProfile?.fullName || currentUser?.email || 'الإدارة',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (classId) {
      await setDoc(
        doc(db, 'classes', classId),
        {
          ...(classObj || {}),
          currentStudents: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await addDoc(collection(db, 'notifications'), {
      userId: app.userId,
      title: 'تهانينا! تم قبول طلب التسجيل رسميًا 🎉',
      message: `تم قبول الطالب (${app.studentName}) في ${classObj?.name || 'الفصل المخصص'} برقم أكاديمي: ${studentNumber}. ${notes ? `ملاحظات: ${notes}` : ''}`,
      type: 'success',
      isRead: false,
      link: 'student-dashboard',
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'adminLogs'), {
      adminId: currentUser?.uid || '',
      adminEmail: currentUser?.email || '',
      action: 'قبول طلب تسجيل',
      targetApplicationId: app.id,
      targetApplicationNumber: app.applicationNumber,
      details: `تم قبول الطالب ${app.studentName} وإلحاقه بفصل ${classObj?.name} بالرقم الأكاديمي ${studentNumber}`,
      createdAt: serverTimestamp(),
    });
  };

  const handleRejectApplication = async (app: Application, reason: string, notes: string) => {
    if (!app.id) return;
    await setDoc(
      doc(db, 'applications', app.id),
      {
        status: 'rejected',
        rejectionReason: reason,
        adminNotes: notes,
        reviewedAt: serverTimestamp(),
        reviewedBy: userProfile?.fullName || currentUser?.email || 'الإدارة',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await addDoc(collection(db, 'notifications'), {
      userId: app.userId,
      title: 'تحديث بخصوص طلب التسجيل',
      message: `نعتذر عن عدم قبول طلب تسجيل الطالب (${app.studentName}). سبب الرفض: ${reason}`,
      type: 'error',
      isRead: false,
      link: 'student-dashboard',
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'adminLogs'), {
      adminId: currentUser?.uid || '',
      adminEmail: currentUser?.email || '',
      action: 'رفض طلب تسجيل',
      targetApplicationId: app.id,
      targetApplicationNumber: app.applicationNumber,
      details: `تم رفض طلب الطالب ${app.studentName}. السبب: ${reason}`,
      createdAt: serverTimestamp(),
    });
  };

  const handleRequestCorrection = async (app: Application, notes: string) => {
    if (!app.id) return;
    await setDoc(
      doc(db, 'applications', app.id),
      {
        status: 'needs_correction',
        adminNotes: notes,
        reviewedAt: serverTimestamp(),
        reviewedBy: userProfile?.fullName || currentUser?.email || 'الإدارة',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await addDoc(collection(db, 'notifications'), {
      userId: app.userId,
      title: 'مطلوب تعديل أو استكمال بيانات في طلب التسجيل ⚠️',
      message: `طلب التسجيل للطالب (${app.studentName}) يتطلب تعديلات: ${notes}. يرجى الدخول للوحة الطالب والتعديل وإعادة الإرسال.`,
      type: 'warning',
      isRead: false,
      link: 'student-dashboard',
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'adminLogs'), {
      adminId: currentUser?.uid || '',
      adminEmail: currentUser?.email || '',
      action: 'طلب استكمال بيانات',
      targetApplicationId: app.id,
      targetApplicationNumber: app.applicationNumber,
      details: `طلب تعديل بيانات للطالب ${app.studentName}: ${notes}`,
      createdAt: serverTimestamp(),
    });
  };

  const handleSetUnderReview = async (app: Application) => {
    if (!app.id) return;
    await setDoc(
      doc(db, 'applications', app.id),
      {
        status: 'under_review',
        reviewedAt: serverTimestamp(),
        reviewedBy: userProfile?.fullName || currentUser?.email || 'الإدارة',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await addDoc(collection(db, 'notifications'), {
      userId: app.userId,
      title: 'طلبك قيد المراجعة والتدقيق الآن ⏳',
      message: `تم البدء في مراجعة وتدقيق ملف الطالب (${app.studentName}) من قبل لجنة القبول بالمركز.`,
      type: 'info',
      isRead: false,
      link: 'student-dashboard',
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'adminLogs'), {
      adminId: currentUser?.uid || '',
      adminEmail: currentUser?.email || '',
      action: 'تغيير حالة لمراجعة',
      targetApplicationId: app.id,
      targetApplicationNumber: app.applicationNumber,
      details: `تم وضع طلب ${app.studentName} قيد المراجعة`,
      createdAt: serverTimestamp(),
    });
  };

  const handleChangeStudentClass = async (studentId: string, newClassId: string) => {
    const student = students.find((s) => s.id === studentId);
    const newClass = classes.find((c) => c.id === newClassId);
    if (!student || !newClass) return;

    const oldClassId = student.classId;

    await setDoc(
      doc(db, 'students', studentId),
      {
        classId: newClassId,
        className: newClass.name,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (oldClassId && oldClassId !== newClassId) {
      await setDoc(
        doc(db, 'classes', oldClassId),
        {
          currentStudents: increment(-1),
        },
        { merge: true }
      );
    }
    await setDoc(
      doc(db, 'classes', newClassId),
      {
        currentStudents: increment(1),
      },
      { merge: true }
    );

    await addDoc(collection(db, 'adminLogs'), {
      adminId: currentUser?.uid || '',
      adminEmail: currentUser?.email || '',
      action: 'نقل طالب لفصل جديد',
      details: `تم نقل الطالب ${student.studentName} إلى ${newClass.name}`,
      createdAt: serverTimestamp(),
    });
  };

  const handleUpdateClass = async (classId: string, updates: Partial<ClassItem>) => {
    const existingCls = classes.find((c) => c.id === classId);
    await setDoc(
      doc(db, 'classes', classId),
      {
        ...(existingCls || {}),
        ...updates,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await addDoc(collection(db, 'adminLogs'), {
      adminId: currentUser?.uid || '',
      adminEmail: currentUser?.email || '',
      action: 'تعديل فصل دراسي',
      details: `تم تحديث بيانات الفصل ${classId}`,
      createdAt: serverTimestamp(),
    });
  };

  const handleCreateClass = async (newClass: Omit<ClassItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addDoc(collection(db, 'classes'), {
      ...newClass,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'adminLogs'), {
      adminId: currentUser?.uid || '',
      adminEmail: currentUser?.email || '',
      action: 'إنشاء فصل دراسي جديد',
      details: `تم إنشاء الفصل ${newClass.name} في ${newClass.stageName}`,
      createdAt: serverTimestamp(),
    });
  };

  const handleSaveSettings = async (newSettings: CenterSettings) => {
    await setDoc(
      doc(db, 'settings', 'center'),
      {
        ...newSettings,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await addDoc(collection(db, 'adminLogs'), {
      adminId: currentUser?.uid || '',
      adminEmail: currentUser?.email || '',
      action: 'تعديل إعدادات ومحتوى المركز',
      details: `تم تحديث محتوى وإعدادات مركز نور الإسلام (مويالي - إثيوبيا)`,
      createdAt: serverTimestamp(),
    });
  };

  // ---------------- Route Guarding & View Render ----------------

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <LoadingSpinner size="lg" text="جاري تشغيل البوابة الرسمية لمركز نور الإسلام — مويالي..." />
      </div>
    );
  }

  // Admin Portal Layout
  if (currentView === 'admin-dashboard') {
    if (!currentUser) {
      return <LoginPage onNavigate={handleNavigateView} />;
    }

    return (
      <>
        <ScrollBrowsingEnhancements />
        <AdminLayout
          currentTab={adminTab}
          onSelectTab={setAdminTab}
          onExitAdmin={() => handleNavigateView('home')}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={adminTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {adminTab === 'dashboard' && (
                <AdminDashboard
                  applications={applications}
                  students={students}
                  classes={classes}
                  users={users}
                  bannersCount={combinedHeroSlides.length}
                  onSelectApplication={(app) => setSelectedAdminApp(app)}
                  onNavigateTab={setAdminTab}
                />
              )}
              {(adminTab === 'hero-slides' || adminTab === 'banners') && (
                <HeroSlidesManagementPage slides={combinedHeroSlides} />
              )}
              {adminTab === 'applications' && (
                <ApplicationsListPage
                  applications={applications}
                  stages={stages}
                  onSelectApplication={(app) => setSelectedAdminApp(app)}
                />
              )}
              {adminTab === 'students' && (
                <StudentsListPage
                  students={students}
                  classes={classes}
                  stages={stages}
                  onChangeStudentClass={handleChangeStudentClass}
                />
              )}
              {adminTab === 'classes' && (
                <ClassesManagementPage
                  classes={classes}
                  stages={stages}
                  onUpdateClass={handleUpdateClass}
                  onCreateClass={handleCreateClass}
                />
              )}
              {adminTab === 'stages' && (
                <StagesManagementPage stages={stages} classes={classes} />
              )}
              {adminTab === 'tahfeez' && (
                <TahfeezManagementPage
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                />
              )}
              {adminTab === 'facilities' && (
                <FacilitiesManagementPage
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                />
              )}
              {adminTab === 'notifications' && (
                <NotificationsManagementPage students={students} />
              )}
              {adminTab === 'users' && <UsersManagementPage />}
              {adminTab === 'logs' && <AdminLogsPage />}
              {adminTab === 'settings' && (
                <CenterSettingsPage
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Modal for viewing & deciding on application */}
          <ApplicationDetailModal
            isOpen={!!selectedAdminApp}
            onClose={() => setSelectedAdminApp(null)}
            application={selectedAdminApp}
            classes={classes}
            stages={stages}
            onAccept={handleAcceptApplication}
            onReject={handleRejectApplication}
            onRequestCorrection={handleRequestCorrection}
            onSetUnderReview={handleSetUnderReview}
          />
        </AdminLayout>
      </>
    );
  }

  // Public / Student Portal Layout
  // If user is signed in (e.g. via Google) and has not completed their basic registration info, require completion first
  if (currentUser && !isAdmin && (needsProfileCompletion || currentView === 'complete-profile')) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-[#1b5e20] selection:text-[#facc15]">
        <ScrollBrowsingEnhancements />
        <Navbar currentView={currentView} onNavigate={handleNavigateView} />
        <main className="flex-1">
          <CompleteProfilePage
            onCompleted={() => handleNavigateView('student-dashboard')}
          />
        </main>
        <Footer settings={settings} onNavigate={handleNavigateView} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-[#1b5e20] selection:text-[#facc15]">
      <ScrollBrowsingEnhancements />
      <Navbar currentView={currentView} onNavigate={handleNavigateView} />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {currentView === 'home' && (
              <HomePage
                settings={settings}
                stages={stages}
                heroSlides={combinedHeroSlides}
                isAdmin={isAdmin}
                onNavigate={handleNavigateView}
                onManageSlides={() => {
                  setAdminTab('hero-slides');
                  handleNavigateView('admin-dashboard');
                }}
              />
            )}

            {currentView === 'about' && (
              <AboutPage
                settings={settings}
                stages={stages}
                onNavigate={handleNavigateView}
              />
            )}

            {currentView === 'contact' && (
              <ContactPage settings={settings} />
            )}

            {currentView === 'login' && (
              <LoginPage onNavigate={handleNavigateView} />
            )}

            {currentView === 'register' && (
              <RegisterPage onNavigate={handleNavigateView} />
            )}

            {currentView === 'student-dashboard' && (
              <StudentDashboard
                onNavigate={handleNavigateView}
                onEditApplication={(app) => {
                  setAppToEdit(app);
                  handleNavigateView('edit-application');
                }}
              />
            )}

            {currentView === 'new-application' && (
              <div className="py-10 px-4">
                <RegistrationForm
                  onSuccess={() => handleNavigateView('student-dashboard')}
                  onCancel={() => handleNavigateView('student-dashboard')}
                />
              </div>
            )}

            {currentView === 'edit-application' && (
              <div className="py-10 px-4">
                <RegistrationForm
                  existingApplication={appToEdit}
                  onSuccess={() => {
                    setAppToEdit(null);
                    handleNavigateView('student-dashboard');
                  }}
                  onCancel={() => {
                    setAppToEdit(null);
                    handleNavigateView('student-dashboard');
                  }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer settings={settings} onNavigate={handleNavigateView} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
