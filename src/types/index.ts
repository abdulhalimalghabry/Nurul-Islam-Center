export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  guardianRelation?: string;
  gender?: 'male' | 'female';
  address?: string;
  authProvider?: 'google' | 'password';
  profileCompleted?: boolean;
  passwordHash?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'needs_correction';

export interface ApplicationDocuments {
  photoUrl?: string;
  idDocumentUrl?: string;
  certificateUrl?: string;
  otherDocumentUrl?: string;
  photoName?: string;
  idDocumentName?: string;
  certificateName?: string;
  otherDocumentName?: string;
}

export interface Application {
  id?: string;
  applicationNumber: string;
  userId: string;
  studentName: string;
  studentNameEn?: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  nationality: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  parentName: string;
  parentPhone: string;
  parentRelationship?: string;
  stageId: string;
  stageName?: string;
  targetGrade: string;
  classId?: string;
  className?: string;
  previousSchool?: string;
  previousGrade?: string;
  lastAcademicResult?: string;
  hasPreviousStudyInCenter?: boolean;
  notes?: string;
  documents: ApplicationDocuments;
  status: ApplicationStatus;
  adminNotes?: string;
  rejectionReason?: string;
  assignedClassId?: string;
  assignedClassName?: string;
  assignedGrade?: string;
  assignedStageName?: string;
  studentIdGenerated?: string;
  submittedAt?: any;
  reviewedAt?: any;
  reviewedBy?: string;
  reviewedByName?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface StudentItem {
  id?: string;
  studentNumber: string;
  userId: string;
  applicationId: string;
  studentName: string;
  studentNameEn?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  nationality?: string;
  nationalId: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  stageId: string;
  stageName: string;
  grade: string;
  classId: string;
  className: string;
  status: 'active' | 'suspended' | 'graduated';
  photoUrl?: string;
  enrolledAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export type Student = StudentItem;

export interface AdminLog {
  id?: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetApplicationId?: string;
  targetApplicationNumber?: string;
  targetId?: string;
  targetType?: string;
  details: string;
  description?: string;
  createdAt?: any;
}

export type AdminLogItem = AdminLog;

export interface ClassItem {
  id?: string;
  name: string;
  grade: string;
  stageId: string;
  stageName: string;
  capacity: number;
  currentStudents: number;
  isActive: boolean;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface StageItem {
  id?: string;
  name: string;
  stageKey: 'primary' | 'middle' | 'secondary';
  description: string;
  grades: string[];
  isActive: boolean;
  order: number;
  createdAt?: any;
}

export interface NotificationItem {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link?: string;
  createdAt?: any;
}

export interface GoalItem {
  id: string;
  title: string;
  description: string;
  iconName?: string;
}

export interface FacilityItem {
  id: string;
  numberLabel: string;
  title: string;
  badge?: string;
  description: string;
  iconName?: string;
}

export interface TahfeezRoomItem {
  id: string;
  name: string;
  focus: string;
  description: string;
  capacity?: number;
}

export interface CenterSettings {
  centerName: string;
  centerNameEn?: string;
  tagline?: string;
  description: string;
  foundingYearHijri?: string;
  foundingYearGregorian?: string;
  historyText?: string;
  vision?: string;
  mission?: string;
  goals?: GoalItem[];
  facilitiesIntro?: string;
  facilities?: FacilityItem[];
  tahfeezDescription?: string;
  tahfeezRooms?: TahfeezRoomItem[];
  classroomsCount?: number;
  tahfeezClassesCount?: number;
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  locationUrl?: string;
  registrationOpen: boolean;
  maxApplications?: number;
  academicYear: string;
  announcement?: string;
  updatedAt?: any;
}

export interface BannerItem {
  id?: string;
  title?: string;
  description?: string;
  badgeText?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  displayType: 'image_with_text' | 'image_only';
  objectPosition?: 'center' | 'top' | 'bottom' | 'right' | 'left';
  buttonText?: string;
  buttonLink?: string;
  linkType?: 'internal' | 'external';
  order: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type HeroSlideContentType =
  | 'صورة طلاب'
  | 'نشاط'
  | 'فعالية'
  | 'تحفيظ'
  | 'تخرج'
  | 'تسجيل'
  | 'إعلان'
  | 'خبر'
  | 'مرافق'
  | 'أخرى';

export interface HeroSlideItem {
  id?: string;
  title?: string;
  description?: string;
  desktopImageUrl: string;
  mobileImageUrl?: string;
  buttonText?: string;
  link?: string;
  linkType?: 'internal' | 'external';
  contentType: HeroSlideContentType;
  objectPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  order: number;
  isPublished: boolean;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}


