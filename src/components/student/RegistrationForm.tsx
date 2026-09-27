import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  Application,
  ApplicationDocuments,
  StageItem,
  ClassItem,
} from '../../types';
import {
  generateApplicationNumber,
  convertFileToBase64,
} from '../../utils/helpers';
import {
  User,
  GraduationCap,
  BookOpen,
  FileText,
  Upload,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  FileCheck,
  Eye,
  Trash2,
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { CenterLogo } from '../common/CenterLogo';

interface RegistrationFormProps {
  existingApplication?: Application | null;
  onSuccess: (app: Application) => void;
  onCancel?: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  existingApplication,
  onSuccess,
  onCancel,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Available Stages & Classes from Firestore
  const [stages, setStages] = useState<StageItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // Step 1: Personal Info
  const isGuardianAccount =
    userProfile?.guardianRelation && userProfile.guardianRelation.includes('ولي أمر');
  const [studentName, setStudentName] = useState(
    existingApplication?.studentName || (!isGuardianAccount ? userProfile?.fullName || '' : '')
  );
  const [studentNameEn, setStudentNameEn] = useState(existingApplication?.studentNameEn || '');
  const [dateOfBirth, setDateOfBirth] = useState(existingApplication?.dateOfBirth || '');
  const [gender, setGender] = useState<'male' | 'female'>(
    existingApplication?.gender || userProfile?.gender || 'male'
  );
  const [nationality, setNationality] = useState(existingApplication?.nationality || 'إثيوبي');
  const [nationalId, setNationalId] = useState(existingApplication?.nationalId || '');
  const [phone, setPhone] = useState(existingApplication?.phone || userProfile?.phone || '');
  const [email, setEmail] = useState(
    existingApplication?.email || currentUser?.email || userProfile?.email || ''
  );
  const [address, setAddress] = useState(
    existingApplication?.address || userProfile?.address || 'مويالي - إثيوبيا'
  );
  const [parentName, setParentName] = useState(
    existingApplication?.parentName || (isGuardianAccount ? userProfile?.fullName || '' : '')
  );
  const [parentPhone, setParentPhone] = useState(
    existingApplication?.parentPhone || (isGuardianAccount ? userProfile?.phone || '' : '')
  );
  const [parentRelationship, setParentRelationship] = useState(
    existingApplication?.parentRelationship ||
      (userProfile?.guardianRelation?.includes('الأم')
        ? 'أم'
        : userProfile?.guardianRelation?.includes('وصي')
        ? 'وصي قانوني'
        : 'أب')
  );

  // Step 2: Educational Stage & Grade
  const [stageId, setStageId] = useState(existingApplication?.stageId || 'stage-primary');
  const [targetGrade, setTargetGrade] = useState(existingApplication?.targetGrade || 'الصف الأول');
  const [classId, setClassId] = useState(existingApplication?.classId || '');

  // Step 3: Educational Background
  const [previousSchool, setPreviousSchool] = useState(existingApplication?.previousSchool || '');
  const [previousGrade, setPreviousGrade] = useState(existingApplication?.previousGrade || '');
  const [lastAcademicResult, setLastAcademicResult] = useState(existingApplication?.lastAcademicResult || '');
  const [hasPreviousStudyInCenter, setHasPreviousStudyInCenter] = useState<boolean>(
    existingApplication?.hasPreviousStudyInCenter || false
  );
  const [notes, setNotes] = useState(existingApplication?.notes || '');

  // Step 4: Documents
  const [documents, setDocuments] = useState<ApplicationDocuments>(
    existingApplication?.documents || {}
  );
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Fetch stages and classes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stagesSnap, classesSnap] = await Promise.all([
          getDocs(collection(db, 'stages')),
          getDocs(collection(db, 'classes')),
        ]);

        const stagesList: StageItem[] = [];
        stagesSnap.forEach((d) => {
          stagesList.push({ id: d.id, ...(d.data() as Omit<StageItem, 'id'>) });
        });
        stagesList.sort((a, b) => a.order - b.order);
        setStages(stagesList);

        const classesList: ClassItem[] = [];
        classesSnap.forEach((d) => {
          classesList.push({ id: d.id, ...(d.data() as Omit<ClassItem, 'id'>) });
        });
        classesList.sort((a, b) => a.order - b.order);
        setClasses(classesList);

        if (stagesList.length > 0 && !stageId) {
          setStageId(stagesList[0].id!);
          if (stagesList[0].grades?.[0]) {
            setTargetGrade(stagesList[0].grades[0]);
          }
        }
      } catch (err) {
        console.warn('Error fetching stages/classes:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const selectedStage = stages.find((s) => s.id === stageId);
  const filteredClasses = classes.filter((c) => c.stageId === stageId && c.isActive);

  // Step Validation
  const validateStep = (stepNumber: number): boolean => {
    setErrorMsg('');
    if (stepNumber === 1) {
      if (!studentName.trim()) {
        setErrorMsg('يرجى إدخال اسم الطالب بالعربية');
        return false;
      }
      if (!dateOfBirth) {
        setErrorMsg('يرجى تحديد تاريخ الميلاد');
        return false;
      }
      if (!nationalId.trim()) {
        setErrorMsg('يرجى إدخال رقم الهوية أو الإقامة أو جواز السفر');
        return false;
      }
      if (!phone.trim()) {
        setErrorMsg('يرجى إدخال رقم هاتف الطالب أو ولي الأمر');
        return false;
      }
      if (!parentName.trim()) {
        setErrorMsg('يرجى إدخال اسم ولي الأمر');
        return false;
      }
      if (!parentPhone.trim()) {
        setErrorMsg('يرجى إدخال رقم هاتف ولي الأمر');
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (!stageId) {
        setErrorMsg('يرجى اختيار المرحلة الدراسية');
        return false;
      }
      if (!targetGrade) {
        setErrorMsg('يرجى اختيار الصف الدراسي المطلوب');
        return false;
      }
      return true;
    }

    if (stepNumber === 3) {
      // Optional academic fields, but at least previous school if not first grade
      return true;
    }

    if (stepNumber === 4) {
      // Documents optional or at least photo recommended
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setErrorMsg('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = async (
    field: keyof ApplicationDocuments,
    nameField: keyof ApplicationDocuments,
    file: File
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الملف يجب ألا يتجاوز 5 ميجابايت.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('نوع الملف غير مدعوم. يرجى رفع ملف بصيغة JPG أو PNG أو PDF.');
      return;
    }

    setUploadingDoc(field);
    try {
      const base64 = await convertFileToBase64(file);
      setDocuments((prev) => ({
        ...prev,
        [field]: base64,
        [nameField]: file.name,
      }));
    } catch (err) {
      console.error('File read error:', err);
      alert('تعذر قراءة الملف، يرجى المحاولة مرة أخرى.');
    } finally {
      setUploadingDoc(null);
    }
  };

  const removeDoc = (field: keyof ApplicationDocuments, nameField: keyof ApplicationDocuments) => {
    setDocuments((prev) => {
      const next = { ...prev };
      delete next[field];
      delete next[nameField];
      return next;
    });
  };

  const handleSubmitApplication = async () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const appId = existingApplication?.id || `app-${currentUser.uid}-${Date.now()}`;
      const appNumber = existingApplication?.applicationNumber || generateApplicationNumber();

      const stageObj = stages.find((s) => s.id === stageId);
      const classObj = classes.find((c) => c.id === classId);

      const appData: Application = {
        applicationNumber: appNumber,
        userId: currentUser.uid,
        studentName,
        studentNameEn: studentNameEn || '',
        dateOfBirth,
        gender,
        nationality,
        nationalId,
        phone,
        email: email || currentUser.email || '',
        address,
        parentName,
        parentPhone,
        parentRelationship,
        stageId,
        stageName: stageObj?.name || 'المرحلة الابتدائية',
        targetGrade,
        classId: classId || '',
        className: classObj?.name || '',
        previousSchool,
        previousGrade,
        lastAcademicResult,
        hasPreviousStudyInCenter,
        notes,
        documents,
        status: 'submitted',
        submittedAt: serverTimestamp(),
        createdAt: existingApplication?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'applications', appId), appData, { merge: true });

      // Create notification for student
      await addDoc(collection(db, 'notifications'), {
        userId: currentUser.uid,
        title: 'تم استلام طلب التسجيل بنجاح',
        message: `تم تقديم طلب التسجيل للطالب (${studentName}) برقم ${appNumber}. طلبك الآن في مرحلة المراجعة والتدقيق من قبل الإدارة.`,
        type: 'success',
        isRead: false,
        link: 'student-dashboard',
        createdAt: serverTimestamp(),
      });

      onSuccess({ ...appData, id: appId });
    } catch (err) {
      console.error('Error submitting application:', err);
      setErrorMsg('حدث خطأ أثناء حفظ طلب التسجيل، يرجى التحقق من اتصالك والمحاولة مجددًا.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <LoadingSpinner text="جاري تحميل نموذج التسجيل والفصول الدراسية..." />;
  }

  const stepTitles = [
    { num: 1, title: 'بيانات الطالب', icon: User },
    { num: 2, title: 'المرحلة والصف', icon: GraduationCap },
    { num: 3, title: 'البيانات التعليمية', icon: BookOpen },
    { num: 4, title: 'رفع الوثائق', icon: FileText },
    { num: 5, title: 'مراجعة الطلب', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-10" dir="rtl">
      {/* Header */}
      <div className="border-b border-stone-100 pb-6 mb-8 text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <CenterLogo size="lg" />
          <div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {existingApplication ? 'تعديل طلب التسجيل' : 'طلب التحاق طالب جديد'}
            </span>
            <h2 className="text-2xl font-bold text-stone-900 mt-2">استمارة تسجيل طالب بمركز نور الإسلام</h2>
            <p className="text-xs text-stone-500 mt-1">
              يرجى ملء كافة البيانات بدقة لضمان سرعة مراجعة وقبول الطلب
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-stone-500 hover:text-stone-800 border border-stone-200 px-3.5 py-2 rounded-xl"
          >
            إلغاء والعودة
          </button>
        )}
      </div>

      {/* Stepper Navigation */}
      <div className="mb-10">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {stepTitles.map((step) => {
            const Icon = step.icon;
            const isDone = currentStep > step.num;
            const isActive = currentStep === step.num;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  if (step.num < currentStep) setCurrentStep(step.num);
                }}
                disabled={step.num > currentStep}
                className={`flex flex-col items-center p-2 rounded-xl transition text-center cursor-pointer disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                    : isDone
                    ? 'text-emerald-700 hover:bg-stone-50'
                    : 'text-stone-400 opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition ${
                    isActive
                      ? 'bg-emerald-800 text-amber-300 ring-2 ring-emerald-200'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 text-stone-500 border border-stone-200'
                  }`}
                >
                  {isDone ? '✓' : step.num}
                </div>
                <span className="text-[11px] sm:text-xs truncate max-w-full font-medium hidden xs:block">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="mb-6 bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Steps */}
      <div className="space-y-6">
        {/* STEP 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-700" />
              البيانات الشخصية وبيانات التواصل
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  اسم الطالب الرباعي (باللغة العربية) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="مثال: عبد الله محمد أحمد الصالح"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  اسم الطالب باللغة الإنجليزية (إن وجد)
                </label>
                <input
                  type="text"
                  value={studentNameEn}
                  onChange={(e) => setStudentNameEn(e.target.value)}
                  placeholder="Abdullah Mohammed Al-Saleh"
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  تاريخ الميلاد <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  الجنس <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm font-medium transition ${
                      gender === 'male'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'male'}
                      onChange={() => setGender('male')}
                      className="hidden"
                    />
                    ذكر
                  </label>
                  <label
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm font-medium transition ${
                      gender === 'female'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'female'}
                      onChange={() => setGender('female')}
                      className="hidden"
                    />
                    أنثى
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  الجنسية <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="سعودي / يمني / مصري..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  رقم الهوية الوطنية / الإقامة / جواز السفر <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="رقم السجل المدني أو الإقامة"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  رقم هاتف الطالب / واتساب <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none font-mono"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@domain.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  العنوان السكني
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="المدينة، الحي، الشارع..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Parent Info Subsection */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-sm font-bold text-stone-800 mb-3">بيانات ولي الأمر</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    اسم ولي الأمر <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="اسم الأب أو الوصي"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    رقم هاتف ولي الأمر <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none font-mono"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    صلة القرابة
                  </label>
                  <select
                    value={parentRelationship}
                    onChange={(e) => setParentRelationship(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  >
                    <option value="أب">الأب</option>
                    <option value="أم">الأم</option>
                    <option value="أخ">الأخ</option>
                    <option value="عم">العم</option>
                    <option value="خال">الخال</option>
                    <option value="وصي قانوني">وصي قانوني</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Stage & Grade Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-700" />
              اختيار المرحلة الدراسية والصف المطلوب
            </h3>

            {/* Stage Selection Cards */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-3">
                اختر المرحلة الدراسية: <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stages.map((stage) => {
                  const isSelected = stageId === stage.id;
                  return (
                    <div
                      key={stage.id}
                      onClick={() => {
                        setStageId(stage.id!);
                        if (stage.grades?.[0]) setTargetGrade(stage.grades[0]);
                      }}
                      className={`p-5 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-50/70 shadow-sm'
                          : 'border-stone-200 hover:border-emerald-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-stone-900">{stage.name}</h4>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-emerald-700 bg-emerald-700 text-white'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <span className="text-[10px]">✓</span>}
                        </div>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {stage.description}
                      </p>
                      <div className="mt-3 pt-2 border-t border-stone-100 text-[11px] text-emerald-800 font-medium">
                        الفصول المتاحة: {stage.grades?.length || 4} فصول
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Target Grade Selection */}
            {selectedStage && (
              <div className="pt-4 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  اختر الصف الدراسي المطلوب: <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedStage.grades.map((gradeName: string) => {
                    const isSelected = targetGrade === gradeName;
                    return (
                      <button
                        key={gradeName}
                        type="button"
                        onClick={() => setTargetGrade(gradeName)}
                        className={`p-3.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-amber-300 border-emerald-800 shadow-xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {gradeName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional Class Preference */}
            {filteredClasses.length > 0 && (
              <div className="pt-4 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  الفصل المقترح (توزيع نهائي يتم بمعرفة الإدارة):
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="">تحديد تلقائي من قبل الإدارة بعد فحص السعة والمقاعد</option>
                  {filteredClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (السعة: {cls.capacity} | المقاعد الشاغرة: {Math.max(0, cls.capacity - cls.currentStudents)})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-400 mt-1">
                  * ستقوم الإدارة بتوزيع الطالب على الفصل المناسب حسب المقاعد الشاغرة وتكافؤ الأعداد.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Educational Background */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700" />
              البيانات التعليمية والسابقة
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  المدرسة / المركز السابق
                </label>
                <input
                  type="text"
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  placeholder="اسم المدرسة السابقة أو روضة الأطفال"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  آخر صف دراسي اجتازه الطالب
                </label>
                <input
                  type="text"
                  value={previousGrade}
                  onChange={(e) => setPreviousGrade(e.target.value)}
                  placeholder="مثال: الصف الرابع الابتدائي"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  التقدير أو النتيجة الأخيرة
                </label>
                <input
                  type="text"
                  value={lastAcademicResult}
                  onChange={(e) => setLastAcademicResult(e.target.value)}
                  placeholder="ممتاز / جيد جداً / 95%"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  هل سبق للطالب الدراسة في مركز نور الإسلام؟
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHasPreviousStudyInCenter(true)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      hasPreviousStudyInCenter
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    نعم، درس سابقاً
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasPreviousStudyInCenter(false)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      !hasPreviousStudyInCenter
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    لا، تسجيل لأول مرة
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ملاحظات إضافية (أجزاء الحفظ في القرآن، مواهب، حالات صحية، إلخ)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: الطالب يحفظ 5 أجزاء من القرآن الكريم، يرغب بالالتحاق بحلقة التجويد المكثفة..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Documents Upload */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              رفع الوثائق والمستندات الثبوتية
            </h3>

            <p className="text-xs text-stone-500">
              صيغ الملفات المسموح بها: <strong>JPG, PNG, PDF</strong> بحد أقصى 5 ميجابايت للملف الواحد.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Document 1: Photo */}
              <div className="border border-dashed border-stone-300 rounded-2xl p-5 bg-stone-50/50 hover:bg-stone-50 transition text-center">
                <span className="text-xs font-bold text-stone-800 block mb-1">صورة شخصية حديثة للطالب</span>
                <p className="text-[11px] text-stone-400 mb-4">خلفية بيضاء واضحة للملف الأكاديمي</p>

                {documents.photoUrl ? (
                  <div className="space-y-2">
                    <div className="relative mx-auto w-24 h-24 rounded-xl overflow-hidden border border-stone-200 bg-white shadow-xs">
                      <img src={documents.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-stone-600 truncate font-mono">{documents.photoName || 'الصورة الشخصية'}</p>
                    <button
                      type="button"
                      onClick={() => removeDoc('photoUrl', 'photoName')}
                      className="text-xs text-rose-600 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition cursor-pointer shadow-xs">
                      <Upload className="w-4 h-4 text-emerald-700" />
                      {uploadingDoc === 'photoUrl' ? 'جاري الرفع...' : 'اختر الصورة'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload('photoUrl', 'photoName', f);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Document 2: Certificate */}
              <div className="border border-dashed border-stone-300 rounded-2xl p-5 bg-stone-50/50 hover:bg-stone-50 transition text-center">
                <span className="text-xs font-bold text-stone-800 block mb-1">شهادة أو إثبات دراسي سابق</span>
                <p className="text-[11px] text-stone-400 mb-4">آخر شهادة أو إشعار درجات</p>

                {documents.certificateUrl ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-stone-600 truncate font-mono">{documents.certificateName || 'الشهادة الدراسية'}</p>
                    <button
                      type="button"
                      onClick={() => removeDoc('certificateUrl', 'certificateName')}
                      className="text-xs text-rose-600 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition cursor-pointer shadow-xs">
                      <Upload className="w-4 h-4 text-emerald-700" />
                      {uploadingDoc === 'certificateUrl' ? 'جاري الرفع...' : 'اختر الملف'}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload('certificateUrl', 'certificateName', f);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Document 3: ID / Passport */}
              <div className="border border-dashed border-stone-300 rounded-2xl p-5 bg-stone-50/50 hover:bg-stone-50 transition text-center">
                <span className="text-xs font-bold text-stone-800 block mb-1">صورة الهوية / جواز السفر</span>
                <p className="text-[11px] text-stone-400 mb-4">وثيقة إثبات الهوية للطالب</p>

                {documents.idDocumentUrl ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-stone-600 truncate font-mono">{documents.idDocumentName || 'الهوية / الجواز'}</p>
                    <button
                      type="button"
                      onClick={() => removeDoc('idDocumentUrl', 'idDocumentName')}
                      className="text-xs text-rose-600 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition cursor-pointer shadow-xs">
                      <Upload className="w-4 h-4 text-emerald-700" />
                      {uploadingDoc === 'idDocumentUrl' ? 'جاري الرفع...' : 'اختر الملف'}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload('idDocumentUrl', 'idDocumentName', f);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Document 4: Other Documents */}
              <div className="border border-dashed border-stone-300 rounded-2xl p-5 bg-stone-50/50 hover:bg-stone-50 transition text-center">
                <span className="text-xs font-bold text-stone-800 block mb-1">وثائق ومستندات إضافية</span>
                <p className="text-[11px] text-stone-400 mb-4">شهادة حفظ، تزكية، شهادة تطعيمات...</p>

                {documents.otherDocumentUrl ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-stone-600 truncate font-mono">{documents.otherDocumentName || 'وثيقة إضافية'}</p>
                    <button
                      type="button"
                      onClick={() => removeDoc('otherDocumentUrl', 'otherDocumentName')}
                      className="text-xs text-rose-600 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition cursor-pointer shadow-xs">
                      <Upload className="w-4 h-4 text-emerald-700" />
                      {uploadingDoc === 'otherDocumentUrl' ? 'جاري الرفع...' : 'اختر الملف'}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload('otherDocumentUrl', 'otherDocumentName', f);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              مراجعة وتأكيد بيانات طلب التسجيل
            </h3>

            <p className="text-xs text-stone-500">
              يرجى مراجعة كافة البيانات المدخلة قبل الضغط على "إرسال الطلب". يمكنك الرجوع لأي خطوة للتعديل.
            </p>

            {/* Section 1 Review */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> بيانات الطالب وولي الأمر
                </h4>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-emerald-700 hover:underline font-bold"
                >
                  تعديل
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-stone-400 block">اسم الطالب:</span>
                  <span className="font-bold text-stone-900">{studentName}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">تاريخ الميلاد:</span>
                  <span className="font-semibold text-stone-800">{dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">الجنس:</span>
                  <span className="font-semibold text-stone-800">{gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">الهوية / الجواز:</span>
                  <span className="font-mono text-stone-800">{nationalId}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">ولي الأمر:</span>
                  <span className="font-bold text-stone-900">{parentName} ({parentRelationship})</span>
                </div>
                <div>
                  <span className="text-stone-400 block">هاتف ولي الأمر:</span>
                  <span className="font-mono text-stone-800">{parentPhone}</span>
                </div>
              </div>
            </div>

            {/* Section 2 Review */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" /> المرحلة والصف المطلوب
                </h4>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-emerald-700 hover:underline font-bold"
                >
                  تعديل
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-stone-400 block">المرحلة:</span>
                  <span className="font-bold text-stone-900">{selectedStage?.name || 'الابتدائية'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">الصف المطلوب:</span>
                  <span className="font-bold text-emerald-800">{targetGrade}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">الفصل المقترح:</span>
                  <span className="text-stone-700">{classes.find((c) => c.id === classId)?.name || 'توزيع الإدارة'}</span>
                </div>
              </div>
            </div>

            {/* Section 3 & 4 Review */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> الوثائق والملاحظات
                </h4>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="text-xs text-emerald-700 hover:underline font-bold"
                >
                  تعديل
                </button>
              </div>
              <div className="text-xs space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${documents.photoUrl ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-stone-100 text-stone-500'}`}>
                    {documents.photoUrl ? '✓ تم إرفاق الصورة' : 'لم ترفق صورة'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${documents.certificateUrl ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-stone-100 text-stone-500'}`}>
                    {documents.certificateUrl ? '✓ تم إرفاق الشهادة' : 'لم ترفق شهادة'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${documents.idDocumentUrl ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-stone-100 text-stone-500'}`}>
                    {documents.idDocumentUrl ? '✓ تم إرفاق الهوية' : 'لم ترفق هوية'}
                  </span>
                </div>
                {notes && (
                  <p className="text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200 mt-2">
                    <strong>ملاحظات:</strong> {notes}
                  </p>
                )}
              </div>
            </div>

            {/* Terms Acknowledgment */}
            <div className="bg-emerald-50/70 border border-emerald-300/80 rounded-2xl p-4 text-xs text-emerald-900 leading-relaxed">
              <p className="font-semibold">
                أقر أنا ولي أمر الطالب بأن كافة البيانات والوثائق المدخلة صحيحة ودقيقة، وأوافق على الالتزام بلوائح وأنظمة مركز نور الإسلام التعليمية.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-10 pt-6 border-t border-stone-100 flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handlePrev}
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitApplication}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 text-amber-300 text-sm font-black transition shadow-md cursor-pointer disabled:opacity-50"
          >
            {loading ? 'جاري الإرسال والتسجيل...' : 'إرسال طلب التسجيل نهائياً'}
            <CheckCircle2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
