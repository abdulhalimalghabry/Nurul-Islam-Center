import React from 'react';
import { motion } from 'motion/react';
import { HeroSlideItem, CenterSettings, StageItem } from '../../types';
import { BrochureRibbonTitle, DiamondDivider } from '../../components/common/IslamicOrnaments';
import { MainHeroSlider } from '../../components/public/MainHeroSlider';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  FileCheck2,
  MapPin,
  ChevronLeft,
  Award,
  Layers,
  Compass,
  ShieldCheck,
  HeartHandshake,
  Shield,
  School,
  BookMarked,
  Library,
  Building2,
  Calendar,
  QrCode,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import {
  OFFICIAL_GOALS,
  OFFICIAL_FACILITIES,
  OFFICIAL_TAHFEEZ_ROOMS,
} from '../../firebase/seedData';

interface HomePageProps {
  settings: CenterSettings | null;
  stages: StageItem[];
  heroSlides?: HeroSlideItem[];
  isAdmin?: boolean;
  onNavigate: (view: string) => void;
  onManageSlides?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  settings,
  stages,
  heroSlides = [],
  isAdmin = false,
  onNavigate,
  onManageSlides,
}) => {
  const goals =
    settings?.goals && settings.goals.length > 0 ? settings.goals : OFFICIAL_GOALS;
  const facilities =
    settings?.facilities && settings.facilities.length > 0
      ? settings.facilities
      : OFFICIAL_FACILITIES;
  const tahfeezRooms =
    settings?.tahfeezRooms && settings.tahfeezRooms.length > 0
      ? settings.tahfeezRooms
      : OFFICIAL_TAHFEEZ_ROOMS;

  const getGoalIcon = (iconName?: string, idx?: number) => {
    switch (iconName) {
      case 'ShieldCheck':
        return ShieldCheck;
      case 'BookOpen':
        return BookOpen;
      case 'Compass':
        return Compass;
      case 'HeartHandshake':
        return HeartHandshake;
      case 'Sparkles':
        return Sparkles;
      case 'GraduationCap':
        return GraduationCap;
      case 'Shield':
        return Shield;
      default:
        return [
          ShieldCheck,
          BookOpen,
          Compass,
          HeartHandshake,
          Sparkles,
          GraduationCap,
          Shield,
        ][(idx || 0) % 7];
    }
  };

  const getFacilityIcon = (iconName?: string, idx?: number) => {
    switch (iconName) {
      case 'School':
        return School;
      case 'BookMarked':
        return BookMarked;
      case 'Library':
        return Library;
      case 'Award':
        return Award;
      case 'Building2':
        return Building2;
      default:
        return [School, BookMarked, Library, Award, Building2][(idx || 0) % 5];
    }
  };

  return (
    <div className="space-y-20 sm:space-y-28 pb-16 text-right overflow-hidden" dir="rtl">
      {/* 1. MAIN HERO IMAGE SLIDER — Directly Below Navbar */}
      <MainHeroSlider
        slides={heroSlides}
        settings={settings}
        isAdmin={isAdmin}
        onNavigate={onNavigate}
        onManageSlides={onManageSlides}
      />

      {/* 2. نبذة عن مركز نور الإسلام + تاريخ المركز (1422هـ / 2001م) */}
      <section
        id="about-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* نبذة عن مركز نور الإسلام */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-800/15 shadow-sm flex flex-col justify-between space-y-6"
          >
            <div className="space-y-5">
              <div>
                <BrochureRibbonTitle variant="lightGreen" size="md">
                  نبذة عن مركز نور الإسلام
                </BrochureRibbonTitle>
              </div>
              <p className="text-stone-800 text-base sm:text-lg leading-loose font-medium">
                {settings?.description ||
                  'يُعد مركز نور الإسلام من المراكز التعليمية الشرعية المتميزة، تأسس ليكون منارة للعلم والتربية الإسلامية، ويهدف إلى إعداد جيل حافظ للقرآن، متمكن من اللغة العربية، وقادر على خدمة مجتمعه وفق منهج أهل السنة والجماعة.'}
              </p>
            </div>

            <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-bold text-[#1d4ed8]" dir="ltr">
                NURUL ISLAM CENTER MOYALE - ETHIOPIA
              </span>
              <button
                onClick={() => onNavigate('about')}
                className="inline-flex items-center gap-2 text-xs font-black text-[#1b5e20] hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl border border-emerald-200 transition cursor-pointer"
              >
                <span>قراءة التفاصيل الكاملة في صفحة عن المركز</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* تاريخ المركز (1422هـ / 2001م) */}
          <motion.div
            id="history-section"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 bg-gradient-to-br from-[#1b5e20] via-[#164e1b] to-[#0f3512] text-white rounded-3xl p-8 sm:p-10 border-2 border-[#facc15] shadow-md flex flex-col justify-between space-y-6"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <BrochureRibbonTitle variant="yellow" size="md">
                  تاريخ المركز
                </BrochureRibbonTitle>
                <Calendar className="w-7 h-7 text-[#facc15]" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/10 border border-[#facc15]/50 rounded-2xl p-4 text-center">
                  <span className="text-xs text-emerald-200 block mb-1">العام الهجري</span>
                  <strong className="text-2xl sm:text-3xl font-black text-[#facc15]">
                    {settings?.foundingYearHijri || '1422هـ'}
                  </strong>
                </div>
                <div className="bg-white/10 border border-[#facc15]/50 rounded-2xl p-4 text-center">
                  <span className="text-xs text-emerald-200 block mb-1">العام الميلادي</span>
                  <strong className="text-2xl sm:text-3xl font-black text-white">
                    {settings?.foundingYearGregorian || '2001م'}
                  </strong>
                </div>
              </div>

              <p className="text-sm sm:text-base text-emerald-50 leading-relaxed font-medium">
                {settings?.historyText ||
                  'منذ تأسيسه، يسعى مركز نور الإسلام إلى غرس القيم الإسلامية وتعليم العلوم الشرعية، مع الجمع بين حفظ القرآن الكريم والدراسة.'}
              </p>
            </div>

            <DiamondDivider variant="yellow" />
          </motion.div>
        </div>
      </section>

      {/* 3. أهداف المركز السبعة */}
      <section
        id="goals-section"
        className="bg-gradient-to-b from-[#164e1b] via-[#1b5e20] to-[#123d16] py-16 sm:py-22 text-white border-y-4 border-[#facc15] scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <BrochureRibbonTitle variant="yellow" size="lg">
              أهداف المركز
            </BrochureRibbonTitle>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mx-auto pt-1">
              يسعى مركز نور الإسلام لتحقيق سبعة أهداف تربوية وعلمية وشرعية أصيلة
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, idx) => {
              const Icon = getGoalIcon(goal.iconName, idx);
              return (
                <motion.div
                  key={goal.id || idx}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ y: -5 }}
                  className={`bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:border-[#facc15] transition-all space-y-3 ${
                    idx === 6 ? 'sm:col-span-2 lg:col-span-3 max-w-2xl mx-auto w-full' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#facc15] text-stone-950 flex items-center justify-center shadow-md shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-[#facc15] block">
                        الهدف {idx + 1}
                      </span>
                      <h3 className="font-bold text-base text-white">{goal.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
                    {goal.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <DiamondDivider variant="white" />
        </div>
      </section>

      {/* 4. الرؤية والرسالة */}
      <section
        id="vision-mission"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* رؤية المركز */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-700/20 shadow-sm space-y-5 text-center flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-2 bg-[#facc15]" />
            <div className="space-y-4">
              <BrochureRibbonTitle variant="yellow" size="md">
                رؤية المركز
              </BrochureRibbonTitle>
              <p className="text-stone-900 text-base sm:text-lg font-bold leading-loose pt-2">
                {settings?.vision ||
                  'أن يكون المركز مرجعًا موثوقًا في التعليم الشرعي والتأصيل العلمي، ويسهم في إعداد دعاة وعلماء ربانيين يخدمون دينهم وأمتهم.'}
              </p>
            </div>
            <DiamondDivider variant="green" />
          </motion.div>

          {/* رسالة المركز */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-700/20 shadow-sm space-y-5 text-center flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-2 bg-[#4ade80]" />
            <div className="space-y-4">
              <BrochureRibbonTitle variant="lightGreen" size="md">
                رسالة المركز
              </BrochureRibbonTitle>
              <p className="text-stone-900 text-base sm:text-lg font-bold leading-loose pt-2">
                {settings?.mission ||
                  'تقديم تعليم شرعي متميز، يعزز القيم الإسلامية وينمي شخصية الطالب علميًا وفكريًا وسلوكيًا، من خلال بيئة تعليمية، وكادر تربوي مؤهل، لإعداد جيل واعٍ، يسهم في بناء مجتمعه وفق منهج إسلامي قويم.'}
              </p>
            </div>
            <DiamondDivider variant="green" />
          </motion.div>
        </div>
      </section>

      {/* 5. المراحل الدراسية */}
      <section
        id="stages-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24"
      >
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <BrochureRibbonTitle variant="lightGreen" size="md">
            المراحل الدراسية
          </BrochureRibbonTitle>
          <p className="text-xs sm:text-sm text-stone-600 pt-1">
            يضم مركز نور الإسلام ثلاث مراحل دراسية متكاملة من الصف الأول الابتدائي وحتى الصف الثاني عشر الثانوي
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stages.map((stage, idx) => (
            <motion.div
              key={stage.id || idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-3xl p-7 border-2 border-emerald-800/15 hover:border-emerald-600/50 shadow-xs hover:shadow-lg flex flex-col justify-between transition-all space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center shadow-md">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-stone-950 font-mono">
                    المرحلة {stage.order}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-stone-900">{stage.name}</h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <span className="text-xs font-bold text-stone-700 block mb-2">
                    الصفوف الدراسية:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {stage.grades.map((grade: string) => (
                      <div
                        key={grade}
                        className="p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 text-center"
                      >
                        {grade}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('register')}
                className="w-full py-3 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>التسجيل في {stage.name}</span>
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. قسم تحفيظ القرآن الكريم (3 فصول دراسية) */}
      <section
        id="tahfeez-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24"
      >
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#f0fdf4] via-white to-[#fefce8] rounded-3xl p-8 sm:p-12 border-2 border-emerald-700/25 shadow-sm space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-emerald-200/70 pb-6">
            <div className="space-y-3">
              <BrochureRibbonTitle variant="yellow" size="md">
                قسم تحفيظ القرآن الكريم
              </BrochureRibbonTitle>
              <p className="text-sm sm:text-base text-stone-800 leading-relaxed max-w-3xl font-medium">
                {settings?.tahfeezDescription ||
                  'خصص المركز ثلاثة (3) فصول دراسية لقسم تحفيظ القرآن الكريم، تُعنى بتحفيظ كتاب الله ومراجعته، مع توفير الأجواء الهادئة التي تساعد الطلاب على الحفظ والإتقان.'}
              </p>
            </div>
            <div className="shrink-0 bg-[#1b5e20] text-[#facc15] px-7 py-5 rounded-3xl text-center shadow-md border-2 border-[#facc15]">
              <span className="text-4xl font-black block font-mono">
                {settings?.tahfeezClassesCount ?? 3}
              </span>
              <span className="text-xs text-white font-bold mt-1 block">
                فصول دراسية للتحفيظ
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tahfeezRooms.map((room, i) => (
              <div
                key={room.id || i}
                className="bg-white rounded-2xl p-6 border border-emerald-200/90 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white bg-[#1b5e20] px-3 py-1 rounded-lg">
                    الفصل {i + 1}
                  </span>
                  <BookMarked className="w-5 h-5 text-[#1d4ed8]" />
                </div>
                <h4 className="font-black text-base text-stone-900">{room.name}</h4>
                <p className="text-xs font-bold text-emerald-800">{room.focus}</p>
                <p className="text-xs text-stone-600 leading-relaxed">{room.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 7. مرافق ومكونات مركز نور الإسلام (5 Cards) */}
      <section
        id="facilities-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 scroll-mt-24"
      >
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <BrochureRibbonTitle variant="lightGreen" size="lg">
            مرافق ومكونات مركز نور الإسلام
          </BrochureRibbonTitle>
          <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-medium">
            {settings?.facilitiesIntro ||
              'يضم مركز نور الإسلام مجموعة من المرافق التعليمية والإدارية والخدمية التي تهيئ بيئة مناسبة للتعليم والتحفيظ والأنشطة الطلابية المختلفة، ومن أبرز هذه المكونات:'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((fac, idx) => {
            const Icon = getFacilityIcon(fac.iconName, idx);
            return (
              <motion.div
                key={fac.id || idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-3xl p-7 border-2 border-emerald-800/15 hover:border-emerald-600/50 shadow-xs hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    {fac.badge && (
                      <span className="text-xs font-extrabold text-[#1b5e20]">
                        {fac.badge}
                      </span>
                    )}
                  </div>

                  {/* Secondary title in official brochure blue */}
                  <h3 className="text-lg font-black text-[#1d4ed8]">
                    {fac.numberLabel || `${idx + 1}. ${fac.title}:`}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                    {fac.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 8. قسم التسجيل والقبول الإلكتروني */}
      <section
        id="registration-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24"
      >
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-emerald-800/20 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center lg:text-right">
            <BrochureRibbonTitle variant="yellow" size="md">
              التسجيل والقبول الإلكتروني
            </BrochureRibbonTitle>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 pt-1">
              بوابة القبول والتسجيل للطلاب الجدد — {settings?.academicYear || '1447-1448هـ'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              يتيح مركز نور الإسلام للطلاب وأولياء الأمور تقديم طلب الالتحاق إلكترونياً، رفع المستندات المطلوبة، ومتابعة حالة القبول وتحديد الفصل الدراسي مباشرة عبر المنصة.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            {settings?.registrationOpen !== false ? (
              <button
                onClick={() => onNavigate('register')}
                className="px-7 py-4 rounded-2xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-black text-xs sm:text-sm transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>بدء التسجيل الجديد</span>
              </button>
            ) : (
              <span className="px-6 py-3.5 rounded-2xl bg-stone-100 text-stone-600 text-xs font-bold">
                التسجيل الإلكتروني مغلق حالياً
              </span>
            )}

            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <span>متابعة طلب سابق</span>
              <ChevronLeft className="w-4 h-4 text-[#1b5e20]" />
            </button>
          </div>
        </div>
      </section>

      {/* 9. تواصل معنا | موقعنا Our Location */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#144519] via-[#1b5e20] to-[#113a14] text-white rounded-3xl p-8 sm:p-12 border-2 border-[#facc15] shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right">
              <div className="w-20 h-20 rounded-2xl bg-white text-stone-900 flex items-center justify-center shrink-0 shadow-md border-2 border-[#facc15]">
                <QrCode className="w-11 h-11 text-[#1b5e20]" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-black text-[#facc15] block">
                  موقعنا وتواصل معنا | Our Location
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {settings?.centerName || 'مركز نور الإسلام'} — مويالي
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                  {settings?.address || 'مويالي - إثيوبيا | Moyale - Ethiopia'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {settings?.locationUrl ? (
                <a
                  href={settings.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-2xl bg-[#facc15] hover:bg-[#fde047] text-stone-950 font-black text-xs sm:text-sm transition shadow-md flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>موقعنا على Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={() => onNavigate('contact')}
                  className="px-6 py-3.5 rounded-2xl bg-[#facc15] hover:bg-[#fde047] text-stone-950 font-black text-xs sm:text-sm transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>موقعنا</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('contact')}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition border border-white/30 cursor-pointer"
              >
                تواصل معنا
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
