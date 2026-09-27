import React from 'react';
import { motion } from 'motion/react';
import { CenterSettings, StageItem } from '../../types';
import { CenterLogo } from '../../components/common/CenterLogo';
import { BrochureRibbonTitle, DiamondDivider } from '../../components/common/IslamicOrnaments';
import {
  BookOpen,
  ShieldCheck,
  Compass,
  HeartHandshake,
  Sparkles,
  GraduationCap,
  Shield,
  School,
  BookMarked,
  Library,
  Award,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { OFFICIAL_GOALS, OFFICIAL_FACILITIES, OFFICIAL_TAHFEEZ_ROOMS } from '../../firebase/seedData';

interface AboutPageProps {
  settings: CenterSettings | null;
  stages: StageItem[];
  onNavigate: (view: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  settings,
  stages,
  onNavigate,
}) => {
  const goals = settings?.goals && settings.goals.length > 0 ? settings.goals : OFFICIAL_GOALS;
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
        return [ShieldCheck, BookOpen, Compass, HeartHandshake, Sparkles, GraduationCap, Shield][
          (idx || 0) % 7
        ];
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
    <div className="space-y-16 sm:space-y-24 pb-16 text-right" dir="rtl">
      {/* 1. Official Brochure-Inspired Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#144519] via-[#1b5e20] to-[#143d17] text-white py-14 sm:py-20 border-b-4 border-[#facc15]">
        <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <CenterLogo size="hero" variant="light" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {settings?.centerName || 'مركز نور الإسلام'}
            </h1>
            <p
              className="text-sm sm:text-lg font-extrabold tracking-wider text-[#facc15] font-sans"
              dir="ltr"
            >
              {settings?.centerNameEn || 'NURUL ISLAM CENTER MOYALE - ETHIOPIA'}
            </p>
          </div>

          <DiamondDivider variant="yellow" />

          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-medium">
            الملف التعريفي الرسمي للمركز — نشأته، رؤيته، رسالته، أهدافه، ومرافقه التعليمية والخدمية
          </p>
        </div>
      </section>

      {/* 2. About & Founding History (نبذة تعريفية + تاريخ التأسيس) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* نبذة تعريفية عن مركز نور الإسلام */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-700/20 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="space-y-5">
              <div>
                <BrochureRibbonTitle variant="lightGreen" size="md">
                  نبذة تعريفية عن مركز نور الإسلام
                </BrochureRibbonTitle>
              </div>
              <p className="text-stone-800 text-base sm:text-lg leading-loose font-medium">
                {settings?.description ||
                  'يُعد مركز نور الإسلام من المراكز التعليمية الشرعية المتميزة، تأسس ليكون منارة للعلم والتربية الإسلامية، ويهدف إلى إعداد جيل حافظ للقرآن، متمكن من اللغة العربية، وقادر على خدمة مجتمعه وفق منهج أهل السنة والجماعة.'}
              </p>
            </div>
            <DiamondDivider variant="green" />
          </motion.div>

          {/* تاريخ التأسيس */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 bg-gradient-to-br from-[#1b5e20] to-[#113a14] text-white rounded-3xl p-8 sm:p-10 border-2 border-[#facc15]/50 shadow-md flex flex-col justify-between space-y-6"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <BrochureRibbonTitle variant="yellow" size="md">
                  تاريخ التأسيس
                </BrochureRibbonTitle>
                <Calendar className="w-7 h-7 text-[#facc15]" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white/10 backdrop-blur-xs border border-[#facc15]/40 rounded-2xl p-4 text-center">
                  <span className="text-xs text-emerald-200 block mb-1">التاريخ الهجري</span>
                  <strong className="text-2xl sm:text-3xl font-black text-[#facc15]">
                    {settings?.foundingYearHijri || '1422هـ'}
                  </strong>
                </div>
                <div className="bg-white/10 backdrop-blur-xs border border-[#facc15]/40 rounded-2xl p-4 text-center">
                  <span className="text-xs text-emerald-200 block mb-1">التاريخ الميلادي</span>
                  <strong className="text-2xl sm:text-3xl font-black text-white">
                    {settings?.foundingYearGregorian || '2001م'}
                  </strong>
                </div>
              </div>

              <p className="text-sm sm:text-base text-emerald-50 leading-relaxed font-medium">
                {settings?.historyText ||
                  'تأسس مركز نور الإسلام في عام (1422هـ / 1993 إث / 2001م)، ومنذ انطلاقته وهو يسعى لغرس القيم الإسلامية، وتعليم العلوم الشرعية، مع الجمع بين حفظ القرآن الكريم والدراسة.'}
              </p>
            </div>
            <DiamondDivider variant="yellow" />
          </motion.div>
        </div>
      </section>

      {/* 3. Vision & Mission (رؤية المركز ورسالة المركز) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* رؤية المركز */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-b from-[#f0fdf4] to-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-600/30 shadow-sm space-y-5 text-center"
          >
            <BrochureRibbonTitle variant="yellow" size="md">
              رؤية المركز
            </BrochureRibbonTitle>
            <p className="text-stone-900 text-base sm:text-lg font-bold leading-loose">
              {settings?.vision ||
                'أن يكون المركز مرجعًا موثوقًا في التعليم الشرعي والتأصيل العلمي، ويسهم في إعداد دعاة وعلماء ربانيين يخدمون دينهم وأمتهم.'}
            </p>
            <DiamondDivider variant="green" />
          </motion.div>

          {/* رسالة المركز */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-b from-[#f0fdf4] to-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-600/30 shadow-sm space-y-5 text-center"
          >
            <BrochureRibbonTitle variant="lightGreen" size="md">
              رسالة المركز
            </BrochureRibbonTitle>
            <p className="text-stone-900 text-base sm:text-lg font-bold leading-loose">
              {settings?.mission ||
                'تقديم تعليم شرعي متميز، يعزز القيم الإسلامية وينمي شخصية الطالب علميًا وفكريًا وسلوكيًا، من خلال بيئة تعليمية، وكادر تربوي مؤهل، لإعداد جيل واعٍ، يسهم في بناء مجتمعه وفق منهج إسلامي قويم.'}
            </p>
            <DiamondDivider variant="green" />
          </motion.div>
        </div>
      </section>

      {/* 4. Official 7 Goals (أهداف المركز السبعة) */}
      <section className="bg-gradient-to-b from-[#174f1c] via-[#1b5e20] to-[#123c16] py-16 sm:py-20 text-white border-y-4 border-[#facc15]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <BrochureRibbonTitle variant="yellow" size="lg">
              أهداف المركز
            </BrochureRibbonTitle>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mx-auto pt-2">
              الأهداف التربوية والعلمية والشرعية المعتمدة في مركز نور الإسلام — مويالي
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => {
              const Icon = getGoalIcon(goal.iconName, index);
              return (
                <motion.div
                  key={goal.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.07 }}
                  className={`bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:border-[#facc15] transition-all space-y-3 ${
                    index === 6 ? 'sm:col-span-2 lg:col-span-3 max-w-2xl mx-auto w-full' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#facc15] text-stone-950 flex items-center justify-center font-black shadow-md shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#facc15] bg-black/25 px-2.5 py-0.5 rounded-full">
                        الهدف {index + 1}
                      </span>
                      <h3 className="font-bold text-base text-[#fde047]">{goal.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-white leading-relaxed pr-1">{goal.description}</p>
                </motion.div>
              );
            })}
          </div>

          <DiamondDivider variant="white" />
        </div>
      </section>

      {/* 5. Center Components & Facilities (مكونات ومرافق مركز نور الإسلام) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <BrochureRibbonTitle variant="lightGreen" size="lg">
            مكونات ومرافق مركز نور الإسلام
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white rounded-3xl p-7 border-2 border-emerald-800/15 hover:border-emerald-600/50 shadow-xs hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    {fac.badge && (
                      <span className="text-xs font-extrabold bg-[#fef9c3] text-stone-900 px-3 py-1 rounded-xl border border-[#facc15]">
                        {fac.badge}
                      </span>
                    )}
                  </div>

                  {/* Blue secondary heading inspired by brochure */}
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

      {/* 6. Quran Tahfeez Department (قسم تحفيظ القرآن الكريم - 3 فصول) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#f0fdf4] via-white to-[#fefce8] rounded-3xl p-8 sm:p-12 border-2 border-emerald-700/25 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-200/70 pb-6">
            <div className="space-y-2">
              <BrochureRibbonTitle variant="yellow" size="md">
                قسم تحفيظ القرآن الكريم (3 فصول دراسية)
              </BrochureRibbonTitle>
              <p className="text-sm text-stone-700 leading-relaxed max-w-3xl pt-2 font-medium">
                {settings?.tahfeezDescription ||
                  'خصص المركز ثلاثة (3) فصول دراسية لقسم تحفيظ القرآن الكريم، تُعنى بتحفيظ كتاب الله ومراجعته، مع توفير الأجواء الهادئة التي تساعد الطلاب على الحفظ والإتقان.'}
              </p>
            </div>
            <div className="shrink-0 bg-[#1b5e20] text-[#facc15] px-6 py-4 rounded-2xl text-center shadow-md border border-emerald-700">
              <span className="text-3xl font-black block font-mono">
                {settings?.tahfeezClassesCount ?? 3}
              </span>
              <span className="text-xs text-white font-bold">فصول مخصصة للتحفيظ</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tahfeezRooms.map((room, i) => (
              <div
                key={room.id || i}
                className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-2xs space-y-2.5"
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
        </div>
      </section>

      {/* 7. Academic Stages (المراحل التعليمية) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <BrochureRibbonTitle variant="lightGreen" size="md">
            المراحل التعليمية في المركز
          </BrochureRibbonTitle>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto">
            إلى جانب الـ 11 فصلاً دراسياً و 3 فصول التحفيظ الفعليّة في مبنى المركز، يدير النظام الإلكتروني قبول وتوزيع الطلاب عبر المراحل الثلاث المعتمدة:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stages.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-[#1b5e20] text-[#facc15] flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-900 px-3 py-1 rounded-lg border border-emerald-200">
                    المرحلة {st.order}
                  </span>
                </div>
                <h3 className="text-lg font-black text-stone-900">{st.name}</h3>
                <p className="text-xs text-stone-600 leading-relaxed">{st.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {st.grades.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-[11px] font-bold text-stone-700"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onNavigate('register')}
                className="w-full py-2.5 rounded-xl bg-[#1b5e20] hover:bg-[#144519] text-[#facc15] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>التسجيل في {st.name}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Location CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#144519] to-[#1b5e20] text-white rounded-3xl p-8 border-2 border-[#facc15] text-center space-y-4 shadow-md">
          <MapPin className="w-10 h-10 text-[#facc15] mx-auto" />
          <h3 className="text-xl font-black">موقعنا | Our Location</h3>
          <p className="text-xs sm:text-sm text-emerald-100">
            {settings?.address || 'مويالي - إثيوبيا | Moyale - Ethiopia'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {settings?.locationUrl ? (
              <a
                href={settings.locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#facc15] hover:bg-[#fde047] text-stone-950 font-black text-xs shadow-md transition"
              >
                <MapPin className="w-4 h-4" />
                <span>موقعنا على خرائط Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#facc15] hover:bg-[#fde047] text-stone-950 font-black text-xs shadow-md transition cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>صفحة تواصل معنا وموقع المركز</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
