import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { StageItem, ClassItem, CenterSettings, GoalItem, FacilityItem, TahfeezRoomItem } from '../types';

export const OFFICIAL_GOALS: GoalItem[] = [
  {
    id: 'goal-1',
    title: 'تعزيز العقيدة الصحيحة',
    description: 'تعزيز العقيدة الإسلامية الصحيحة في نفوس الطلاب، وفق منهج أهل السنة والجماعة.',
    iconName: 'ShieldCheck',
  },
  {
    id: 'goal-2',
    title: 'تدريس العلوم الشرعية',
    description: 'تدريس العلوم الشرعية الأصيلة مثل: التفسير، الحديث، الفقه، العقيدة، والسيرة النبوية.',
    iconName: 'BookOpen',
  },
  {
    id: 'goal-3',
    title: 'إعداد الدعاة بالحكمة',
    description: 'إعداد جيل مسلم واعٍ يحمل العلم الشرعي، قادر على الدعوة إلى الله بالحكمة والموعظة الحسنة.',
    iconName: 'Compass',
  },
  {
    id: 'goal-4',
    title: 'غرس القيم والأخلاق',
    description: 'غرس القيم والأخلاق الإسلامية الرفيعة في نفوس الطلاب كالصدق، والأمانة، والاحترام.',
    iconName: 'HeartHandshake',
  },
  {
    id: 'goal-5',
    title: 'الارتباط بالقرآن الكريم',
    description: 'ربط الطلاب بالقرآن الكريم حفظًا وتفسيرًا وتدبرًا وعملًا في حياتهم اليومية.',
    iconName: 'Sparkles',
  },
  {
    id: 'goal-6',
    title: 'التأهيل الأكاديمي الشرعي',
    description: 'تأهيل طلاب قادرين على استكمال دراستهم الشرعية في المعاهد والكليات الشرعية المتخصصة.',
    iconName: 'GraduationCap',
  },
  {
    id: 'goal-7',
    title: 'تحصين النشء فكريًا وسلوكيًا',
    description: 'تحصين النشء من الانحرافات الفكرية والسلوكية من خلال الفهم الصحيح للدين.',
    iconName: 'Shield',
  },
];

export const OFFICIAL_FACILITIES: FacilityItem[] = [
  {
    id: 'facility-classrooms',
    numberLabel: '1. الفصول الدراسية:',
    title: 'الفصول الدراسية',
    badge: '11 فصلًا دراسيًا',
    description:
      'يحتوي المركز على أحد عشر (11) فصلًا دراسيًا مجهزة لاستقبال الطلاب في مختلف المراحل، وتُستخدم في تقديم الدروس اليومية وفق المنهج المقرر، مما يهيئ للطلاب بيئة تعليمية مريحة ومنظمة.',
    iconName: 'School',
  },
  {
    id: 'facility-tahfeez',
    numberLabel: '2. فصول قسم التحفيظ:',
    title: 'قسم تحفيظ القرآن الكريم',
    badge: '3 فصول دراسية',
    description:
      'خصص المركز ثلاثة (3) فصول دراسية لقسم تحفيظ القرآن الكريم، تُعنى بتحفيظ كتاب الله ومراجعته، مع توفير الأجواء الهادئة التي تساعد الطلاب على الحفظ والإتقان.',
    iconName: 'BookMarked',
  },
  {
    id: 'facility-library',
    numberLabel: '3. مكتبة الكتب:',
    title: 'مكتبة المركز',
    badge: 'مراجع علمية وشرعية',
    description:
      'يضم المركز مكتبة تحتوي على مجموعة من الكتب والمراجع العلمية والشرعية التي يستفيد منها الطلاب والمعلمون على حد سواء.',
    iconName: 'Library',
  },
  {
    id: 'facility-hall',
    numberLabel: '4. القاعة الكبرى:',
    title: 'القاعة الكبرى',
    badge: 'متعددة الاستخدامات',
    description:
      'توجد بالمركز قاعة كبيرة متعددة الاستخدامات، مخصصة لإقامة حفلات التخرج، وتنظيم المسابقات، واستضافة الفعاليات الثقافية والعلمية، مما يسهم في صقل مهارات الطلاب وإبراز مواهبهم.',
    iconName: 'Award',
  },
  {
    id: 'facility-admin',
    numberLabel: '5. المكاتب الإدارية:',
    title: 'المكاتب الإدارية',
    badge: 'إشراف وتنظيم',
    description:
      'يضم المركز عددًا من المكاتب الإدارية التي تُعنى بمتابعة شؤون الطلاب والمعلمين، وتنظيم العمل اليومي، والإشراف على مختلف الأنشطة التربوية والتعليمية.',
    iconName: 'Building2',
  },
];

export const OFFICIAL_TAHFEEZ_ROOMS: TahfeezRoomItem[] = [
  {
    id: 'tahfeez-room-1',
    name: 'فصل التحفيظ الأول',
    focus: 'التأسيس وتصحيح التلاوة والحفظ',
    description: 'مخصص لتحفيظ القرآن الكريم وتثبيت المخارج وأحكام التجويد الأساسية في أجواء هادئة.',
    capacity: 25,
  },
  {
    id: 'tahfeez-room-2',
    name: 'فصل التحفيظ الثاني',
    focus: 'الحفظ المتقدم والمراجعة الدورية',
    description: 'يُعنى بمتابعة الحفظ اليومي والمراجعة المنتظمة للأجزاء المحفوظة بإشراف معلمين متقنين.',
    capacity: 25,
  },
  {
    id: 'tahfeez-room-3',
    name: 'فصل التحفيظ الثالث',
    focus: 'الإتقان والختم والتدبر',
    description: 'مخصص لتثبيت الختمات الكاملة والمراجعة المكثفة وربط الطلاب بتدبر آيات كتاب الله.',
    capacity: 25,
  },
];

export const INITIAL_STAGES: StageItem[] = [
  {
    id: 'stage-primary',
    name: 'المرحلة الابتدائية',
    stageKey: 'primary',
    description: 'تأسيس الطلاب في حفظ القرآن الكريم، اللغة العربية، والعقيدة والآداب الإسلامية من الصف الأول حتى الرابع.',
    grades: ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع'],
    isActive: true,
    order: 1,
  },
  {
    id: 'stage-middle',
    name: 'المرحلة المتوسطة',
    stageKey: 'middle',
    description: 'دراسة العلوم الشرعية (التفسير، الحديث، الفقه، العقيدة، السيرة) وتعميق اللغة العربية وحفظ القرآن من الصف الخامس حتى الثامن.',
    grades: ['الصف الخامس', 'الصف السادس', 'الصف السابع', 'الصف الثامن'],
    isActive: true,
    order: 2,
  },
  {
    id: 'stage-secondary',
    name: 'المرحلة الثانوية',
    stageKey: 'secondary',
    description: 'التأصيل العلمي الشرعي وإعداد الطلاب لاستكمال دراستهم في المعاهد والكليات الشرعية المتخصصة من الصف التاسع حتى الثاني عشر.',
    grades: ['الصف التاسع', 'الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر'],
    isActive: true,
    order: 3,
  },
];

export const INITIAL_CLASSES: Array<Omit<ClassItem, 'createdAt' | 'updatedAt'>> = [
  {
    id: 'class-grade-1',
    name: 'الصف الأول - أ',
    grade: 'الصف الأول',
    stageId: 'stage-primary',
    stageName: 'المرحلة الابتدائية',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 1,
  },
  {
    id: 'class-grade-2',
    name: 'الصف الثاني - أ',
    grade: 'الصف الثاني',
    stageId: 'stage-primary',
    stageName: 'المرحلة الابتدائية',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 2,
  },
  {
    id: 'class-grade-3',
    name: 'الصف الثالث - أ',
    grade: 'الصف الثالث',
    stageId: 'stage-primary',
    stageName: 'المرحلة الابتدائية',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 3,
  },
  {
    id: 'class-grade-4',
    name: 'الصف الرابع - أ',
    grade: 'الصف الرابع',
    stageId: 'stage-primary',
    stageName: 'المرحلة الابتدائية',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 4,
  },
  {
    id: 'class-grade-5',
    name: 'الصف الخامس - أ',
    grade: 'الصف الخامس',
    stageId: 'stage-middle',
    stageName: 'المرحلة المتوسطة',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 5,
  },
  {
    id: 'class-grade-6',
    name: 'الصف السادس - أ',
    grade: 'الصف السادس',
    stageId: 'stage-middle',
    stageName: 'المرحلة المتوسطة',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 6,
  },
  {
    id: 'class-grade-7',
    name: 'الصف السابع - أ',
    grade: 'الصف السابع',
    stageId: 'stage-middle',
    stageName: 'المرحلة المتوسطة',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 7,
  },
  {
    id: 'class-grade-8',
    name: 'الصف الثامن - أ',
    grade: 'الصف الثامن',
    stageId: 'stage-middle',
    stageName: 'المرحلة المتوسطة',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 8,
  },
  {
    id: 'class-grade-9',
    name: 'الصف التاسع - أ',
    grade: 'الصف التاسع',
    stageId: 'stage-secondary',
    stageName: 'المرحلة الثانوية',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 9,
  },
  {
    id: 'class-grade-10',
    name: 'الصف العاشر - أ',
    grade: 'الصف العاشر',
    stageId: 'stage-secondary',
    stageName: 'المرحلة الثانوية',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 10,
  },
  {
    id: 'class-grade-11',
    name: 'الصف الحادي عشر - أ',
    grade: 'الصف الحادي عشر',
    stageId: 'stage-secondary',
    stageName: 'المرحلة الثانوية',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 11,
  },
  {
    id: 'class-grade-12',
    name: 'الصف الثاني عشر - أ',
    grade: 'الصف الثاني عشر',
    stageId: 'stage-secondary',
    stageName: 'المرحلة الثانوية',
    capacity: 25,
    currentStudents: 0,
    isActive: true,
    order: 12,
  },
];

export const INITIAL_SETTINGS: CenterSettings = {
  centerName: 'مركز نور الإسلام',
  centerNameEn: 'NURUL ISLAM CENTER MOYALE - ETHIOPIA',
  tagline: 'منارة للعلم والتربية الإسلامية',
  description:
    'يُعد مركز نور الإسلام من المراكز التعليمية الشرعية المتميزة، تأسس ليكون منارة للعلم والتربية الإسلامية، ويهدف إلى إعداد جيل حافظ للقرآن، متمكن من اللغة العربية، وقادر على خدمة مجتمعه وفق منهج أهل السنة والجماعة.',
  foundingYearHijri: '1422هـ',
  foundingYearGregorian: '2001م',
  historyText:
    'تأسس مركز نور الإسلام في عام (1422هـ / 1993 إث / 2001م)، ومنذ انطلاقته وهو يسعى لغرس القيم الإسلامية، وتعليم العلوم الشرعية، مع الجمع بين حفظ القرآن الكريم والدراسة.',
  vision:
    'أن يكون المركز مرجعًا موثوقًا في التعليم الشرعي والتأصيل العلمي، ويسهم في إعداد دعاة وعلماء ربانيين يخدمون دينهم وأمتهم.',
  mission:
    'تقديم تعليم شرعي متميز، يعزز القيم الإسلامية وينمي شخصية الطالب علميًا وفكريًا وسلوكيًا، من خلال بيئة تعليمية، وكادر تربوي مؤهل، لإعداد جيل واعٍ، يسهم في بناء مجتمعه وفق منهج إسلامي قويم.',
  goals: OFFICIAL_GOALS,
  facilitiesIntro:
    'يضم مركز نور الإسلام مجموعة من المرافق التعليمية والإدارية والخدمية التي تهيئ بيئة مناسبة للتعليم والتحفيظ والأنشطة الطلابية المختلفة، ومن أبرز هذه المكونات:',
  facilities: OFFICIAL_FACILITIES,
  tahfeezDescription:
    'خصص المركز ثلاثة (3) فصول دراسية لقسم تحفيظ القرآن الكريم، تُعنى بتحفيظ كتاب الله ومراجعته، مع توفير الأجواء الهادئة التي تساعد الطلاب على الحفظ والإتقان.',
  tahfeezRooms: OFFICIAL_TAHFEEZ_ROOMS,
  classroomsCount: 11,
  tahfeezClassesCount: 3,
  phone: '',
  whatsapp: '',
  email: '',
  address: 'مويالي - إثيوبيا | Moyale - Ethiopia',
  locationUrl: '',
  registrationOpen: true,
  maxApplications: 500,
  academicYear: '1447-1448هـ / 2026-2027م',
  announcement:
    'مرحباً بكم في الموقع الرسمي لمركز نور الإسلام (مويالي - إثيوبيا) — منارة للعلم والتربية الإسلامية منذ عام 1422هـ / 2001م.',
};

/**
 * Helper to merge saved settings with official brochure defaults so no official field is ever missing
 */
export function mergeWithOfficialSettings(data?: Partial<CenterSettings> | null): CenterSettings {
  if (!data) return INITIAL_SETTINGS;

  // Replace legacy placeholder values if they came from the old generic template
  const isLegacyAddress = data.address?.includes('الرياض');
  const isLegacyPhone = data.phone === '+966 50 123 4567';
  const isLegacyEmail = data.email === 'contact@markaz-noorulislam.org';
  const isLegacyDesc = data.description?.includes('القراءات');

  return {
    ...INITIAL_SETTINGS,
    ...data,
    centerName: data.centerName || INITIAL_SETTINGS.centerName,
    centerNameEn: data.centerNameEn || INITIAL_SETTINGS.centerNameEn,
    tagline: data.tagline || INITIAL_SETTINGS.tagline,
    description: isLegacyDesc || !data.description ? INITIAL_SETTINGS.description : data.description,
    foundingYearHijri: data.foundingYearHijri || INITIAL_SETTINGS.foundingYearHijri,
    foundingYearGregorian: data.foundingYearGregorian || INITIAL_SETTINGS.foundingYearGregorian,
    historyText: data.historyText || INITIAL_SETTINGS.historyText,
    vision: data.vision || INITIAL_SETTINGS.vision,
    mission: data.mission || INITIAL_SETTINGS.mission,
    goals: data.goals && data.goals.length > 0 ? data.goals : OFFICIAL_GOALS,
    facilitiesIntro: data.facilitiesIntro || INITIAL_SETTINGS.facilitiesIntro,
    facilities: data.facilities && data.facilities.length > 0 ? data.facilities : OFFICIAL_FACILITIES,
    tahfeezDescription: data.tahfeezDescription || INITIAL_SETTINGS.tahfeezDescription,
    tahfeezRooms: data.tahfeezRooms && data.tahfeezRooms.length > 0 ? data.tahfeezRooms : OFFICIAL_TAHFEEZ_ROOMS,
    classroomsCount: data.classroomsCount ?? INITIAL_SETTINGS.classroomsCount,
    tahfeezClassesCount: data.tahfeezClassesCount ?? INITIAL_SETTINGS.tahfeezClassesCount,
    address: isLegacyAddress || !data.address ? INITIAL_SETTINGS.address : data.address,
    phone: isLegacyPhone ? '' : data.phone ?? '',
    email: isLegacyEmail ? '' : data.email ?? '',
    whatsapp: data.whatsapp ?? '',
    locationUrl: data.locationUrl ?? '',
  };
}

export async function seedInitialDataIfNeeded(): Promise<void> {
  try {
    // Ensure official admin UID (5BSXFscriahrJ4npUvT4GOWJQbo1) is registered as admin in Firestore
    const primaryAdminUid = '5BSXFscriahrJ4npUvT4GOWJQbo1';
    await setDoc(
      doc(db, 'admins', primaryAdminUid),
      {
        uid: primaryAdminUid,
        role: 'admin',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    const adminUserRef = doc(db, 'users', primaryAdminUid);
    const adminUserSnap = await getDoc(adminUserRef);
    if (adminUserSnap.exists()) {
      const existingData = adminUserSnap.data();
      if (existingData.role !== 'admin') {
        await setDoc(
          adminUserRef,
          {
            role: 'admin',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } else {
      await setDoc(
        adminUserRef,
        {
          uid: primaryAdminUid,
          fullName: 'إدارة مركز نور الإسلام',
          email: 'abdulhalimalghabry@gmail.com',
          phone: '',
          role: 'admin',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    const settingsDocRef = doc(db, 'settings', 'center');
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsDocRef, {
        ...INITIAL_SETTINGS,
        updatedAt: serverTimestamp(),
      });
    } else {
      const currentData = settingsSnap.data() as Partial<CenterSettings>;
      if (!currentData.centerNameEn || currentData.address?.includes('الرياض')) {
        const merged = mergeWithOfficialSettings(currentData);
        await setDoc(settingsDocRef, {
          ...merged,
          updatedAt: serverTimestamp(),
        });
      }
    }

    const stagesSnap = await getDocs(collection(db, 'stages'));
    if (stagesSnap.empty) {
      for (const stage of INITIAL_STAGES) {
        await setDoc(doc(db, 'stages', stage.id!), {
          name: stage.name,
          stageKey: stage.stageKey,
          description: stage.description,
          grades: stage.grades,
          isActive: stage.isActive,
          order: stage.order,
          createdAt: serverTimestamp(),
        });
      }
    }

    const classesSnap = await getDocs(collection(db, 'classes'));
    if (classesSnap.empty) {
      for (const cls of INITIAL_CLASSES) {
        await setDoc(doc(db, 'classes', cls.id!), {
          name: cls.name,
          grade: cls.grade,
          stageId: cls.stageId,
          stageName: cls.stageName,
          capacity: cls.capacity,
          currentStudents: cls.currentStudents,
          isActive: cls.isActive,
          order: cls.order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('Initial seeding note:', err);
  }
}
