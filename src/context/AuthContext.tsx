import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile, UserRole } from '../types';
import { seedInitialDataIfNeeded } from '../firebase/seedData';

export interface CompleteProfileInput {
  fullName: string;
  phone: string;
  guardianRelation: string;
  gender: 'male' | 'female';
  address: string;
}

export interface RegisterExtraInput {
  guardianRelation?: string;
  gender?: 'male' | 'female';
  address?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  needsProfileCompletion: boolean;
  login: (email: string, pass: string) => Promise<UserRole>;
  loginWithGoogle: () => Promise<{ role: UserRole; needsCompletion: boolean }>;
  register: (
    fullName: string,
    email: string,
    phone: string,
    pass: string,
    extra?: RegisterExtraInput
  ) => Promise<UserRole>;
  completeUserProfile: (data: CompleteProfileInput) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Official primary admin account identifiers
export const BOOTSTRAP_ADMIN_UID = '5BSXFscriahrJ4npUvT4GOWJQbo1';
export const BOOTSTRAP_ADMIN_EMAIL = 'abdulhalimalghabry@gmail.com';

const STORAGE_KEY = 'noor_session_user';

// Safe deterministic ID helper for email-based keys (never fails on Unicode)
export function generateEmailUid(email: string): string {
  const clean = email.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const safeAscii = clean.replace(/[^a-z0-9]/g, '').slice(0, 14);
  return `usr-${safeAscii}-${Math.abs(hash).toString(36)}`;
}

function generateEmailAdminKey(email: string): string {
  const clean = email.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const safeAscii = clean.replace(/[^a-z0-9]/g, '').slice(0, 14);
  return `email-${safeAscii}-${Math.abs(hash).toString(36)}`;
}

function saveLocalSession(profile: {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  guardianRelation?: string;
  gender?: 'male' | 'female';
  address?: string;
  role: UserRole;
  authProvider?: 'password' | 'google';
  profileCompleted?: boolean;
}) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        uid: profile.uid,
        email: profile.email,
        displayName: profile.fullName,
        fullName: profile.fullName,
        phone: profile.phone,
        guardianRelation: profile.guardianRelation || 'طالب متقدم للتسجيل',
        gender: profile.gender || 'male',
        address: profile.address || 'مويالي - إثيوبيا',
        role: profile.role,
        authProvider: profile.authProvider || 'password',
        profileCompleted: profile.profileCompleted ?? true,
      })
    );
  } catch {
    // ignore storage quota errors
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Prevents onAuthStateChanged from racing with explicit register / login / loginWithGoogle actions
  const authActionInProgressRef = useRef<boolean>(false);

  // Holds pending registration fields during account creation so nothing is ever lost
  const pendingRegistrationRef = useRef<{
    fullName: string;
    email: string;
    phone: string;
    guardianRelation: string;
    gender: 'male' | 'female';
    address: string;
  } | null>(null);

  const checkIsAdminAccount = async (email?: string | null, uid?: string): Promise<boolean> => {
    if (uid && uid.trim() === BOOTSTRAP_ADMIN_UID) {
      return true;
    }
    const clean = email ? email.toLowerCase().trim() : '';
    if (clean && clean === BOOTSTRAP_ADMIN_EMAIL.toLowerCase().trim()) {
      return true;
    }
    try {
      if (uid) {
        const adminDoc = await getDoc(doc(db, 'admins', uid));
        if (adminDoc.exists()) return true;
      }
      if (clean) {
        const emailKey = generateEmailAdminKey(clean);
        const preAssignedAdmin = await getDoc(doc(db, 'admins', emailKey));
        if (preAssignedAdmin.exists()) return true;
      }
    } catch {
      // ignore lookup error
    }
    return false;
  };

  // Helper to find existing user profile in Firestore by UID or Email
  const findExistingFirestoreUser = async (
    uid: string,
    email?: string | null
  ): Promise<{ docId: string; data: UserProfile } | null> => {
    try {
      const directSnap = await getDoc(doc(db, 'users', uid));
      if (directSnap.exists()) {
        return { docId: uid, data: directSnap.data() as UserProfile };
      }

      if (email && email.trim()) {
        const cleanEmail = email.trim();
        const emailUid = generateEmailUid(cleanEmail);
        if (emailUid !== uid) {
          const emailUidSnap = await getDoc(doc(db, 'users', emailUid));
          if (emailUidSnap.exists()) {
            return { docId: emailUid, data: emailUidSnap.data() as UserProfile };
          }
        }

        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const firstDoc = qSnap.docs[0];
          return { docId: firstDoc.id, data: firstDoc.data() as UserProfile };
        }
      }
    } catch (err) {
      console.warn('Lookup user in Firestore note:', err);
    }
    return null;
  };

  const fetchUserProfile = async (
    user: User,
    providerHint?: 'google' | 'password'
  ): Promise<{ role: UserRole; profile: UserProfile }> => {
    const userDocRef = doc(db, 'users', user.uid);
    const isElevated = await checkIsAdminAccount(user.email, user.uid);
    const pending = pendingRegistrationRef.current;

    // Also check localStorage for any cached fields for this user
    let cachedLocal: Record<string, any> | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed?.uid === user.uid ||
          (user.email && parsed?.email?.toLowerCase() === user.email.toLowerCase())
        ) {
          cachedLocal = parsed;
        }
      }
    } catch {
      // ignore
    }

    try {
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const resolvedRole: UserRole = isElevated ? 'admin' : (data.role || 'student');

        const mergedFullName =
          data.fullName ||
          pending?.fullName ||
          cachedLocal?.fullName ||
          cachedLocal?.displayName ||
          user.displayName ||
          '';
        const mergedPhone =
          data.phone || pending?.phone || cachedLocal?.phone || user.phoneNumber || '';
        const mergedRelation =
          data.guardianRelation ||
          pending?.guardianRelation ||
          cachedLocal?.guardianRelation ||
          (resolvedRole === 'admin' ? 'إدارة المركز' : 'طالب متقدم للتسجيل');
        const mergedGender =
          data.gender || pending?.gender || cachedLocal?.gender || 'male';
        const mergedAddress =
          data.address ||
          pending?.address ||
          cachedLocal?.address ||
          'مويالي - إثيوبيا';

        const isGoogleProvider =
          providerHint === 'google' ||
          (providerHint !== 'password' &&
            data.authProvider === 'google' &&
            Boolean(user.providerData?.some((p) => p.providerId === 'google.com')));

        const hasBasicInfo =
          resolvedRole === 'admin' ||
          Boolean(
            mergedFullName.trim().length >= 2 && mergedPhone.trim().length >= 5
          );

        const updatedProfile: UserProfile = {
          ...data,
          uid: user.uid,
          email: user.email || data.email || '',
          fullName: mergedFullName,
          phone: mergedPhone,
          guardianRelation: mergedRelation,
          gender: mergedGender,
          address: mergedAddress,
          role: resolvedRole,
          authProvider: isGoogleProvider ? 'google' : data.authProvider || 'password',
          profileCompleted: hasBasicInfo,
        };

        await setDoc(
          userDocRef,
          {
            uid: updatedProfile.uid,
            email: updatedProfile.email,
            fullName: updatedProfile.fullName,
            phone: updatedProfile.phone,
            guardianRelation: updatedProfile.guardianRelation,
            gender: updatedProfile.gender,
            address: updatedProfile.address,
            role: resolvedRole,
            authProvider: updatedProfile.authProvider,
            profileCompleted: updatedProfile.profileCompleted,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        if (resolvedRole === 'admin') {
          await setDoc(
            doc(db, 'admins', user.uid),
            {
              uid: user.uid,
              email: user.email || data.email || '',
              role: 'admin',
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }

        saveLocalSession(updatedProfile);
        setUserProfile(updatedProfile);
        setRole(resolvedRole);
        return { role: resolvedRole, profile: updatedProfile };
      } else {
        const initialRole: UserRole = isElevated ? 'admin' : 'student';
        const isGoogle =
          providerHint === 'google' ||
          (providerHint !== 'password' &&
            Boolean(user.providerData?.some((p) => p.providerId === 'google.com')));

        const mergedFullName =
          pending?.fullName ||
          cachedLocal?.fullName ||
          cachedLocal?.displayName ||
          user.displayName ||
          (initialRole === 'admin' ? 'إدارة مركز نور الإسلام' : '');
        const mergedPhone =
          pending?.phone || cachedLocal?.phone || user.phoneNumber || '';
        const mergedRelation =
          pending?.guardianRelation ||
          cachedLocal?.guardianRelation ||
          (initialRole === 'admin' ? 'إدارة المركز' : 'طالب متقدم للتسجيل');
        const mergedGender = pending?.gender || cachedLocal?.gender || 'male';
        const mergedAddress =
          pending?.address || cachedLocal?.address || 'مويالي - إثيوبيا';

        const isCompleted =
          initialRole === 'admin' ||
          Boolean(mergedFullName.trim().length >= 2 && mergedPhone.trim().length >= 5);

        const newProfile: UserProfile = {
          uid: user.uid,
          fullName: mergedFullName,
          email: user.email || pending?.email || cachedLocal?.email || '',
          phone: mergedPhone,
          guardianRelation: mergedRelation,
          gender: mergedGender,
          address: mergedAddress,
          role: initialRole,
          authProvider: isGoogle ? 'google' : 'password',
          profileCompleted: isCompleted,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(userDocRef, newProfile, { merge: true });

        if (initialRole === 'admin') {
          await setDoc(
            doc(db, 'admins', user.uid),
            {
              uid: user.uid,
              email: user.email || '',
              role: 'admin',
              createdAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }

        saveLocalSession(newProfile);
        setUserProfile(newProfile);
        setRole(initialRole);
        return { role: initialRole, profile: newProfile };
      }
    } catch (err) {
      console.error('Error fetching/creating user profile in Firestore:', err);
      const fallbackRole: UserRole = isElevated ? 'admin' : 'student';
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        fullName: pending?.fullName || user.displayName || '',
        email: user.email || pending?.email || '',
        phone: pending?.phone || user.phoneNumber || '',
        guardianRelation: pending?.guardianRelation || 'طالب متقدم للتسجيل',
        gender: pending?.gender || 'male',
        address: pending?.address || 'مويالي - إثيوبيا',
        role: fallbackRole,
        authProvider: providerHint || 'password',
        profileCompleted: fallbackRole === 'admin' || Boolean(pending?.phone),
      };
      setUserProfile(fallbackProfile);
      setRole(fallbackRole);
      return { role: fallbackRole, profile: fallbackProfile };
    }
  };

  useEffect(() => {
    seedInitialDataIfNeeded().catch(console.warn);

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.uid) {
          const isPrimaryAdmin =
            parsed.uid === BOOTSTRAP_ADMIN_UID ||
            parsed.email?.toLowerCase().trim() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase().trim();
          const resolvedRole: UserRole = isPrimaryAdmin ? 'admin' : (parsed.role || 'student');
          const simUser = {
            uid: parsed.uid,
            email: parsed.email || '',
            displayName: parsed.fullName || parsed.displayName || '',
            phoneNumber: parsed.phone || '',
            emailVerified: true,
            isAnonymous: false,
          } as unknown as User;

          setCurrentUser(simUser);
          setRole(resolvedRole);

          const initialLocalProfile: UserProfile = {
            uid: parsed.uid,
            fullName: parsed.fullName || parsed.displayName || '',
            email: parsed.email || '',
            phone: parsed.phone || '',
            guardianRelation: parsed.guardianRelation || 'طالب متقدم للتسجيل',
            gender: parsed.gender || 'male',
            address: parsed.address || 'مويالي - إثيوبيا',
            role: resolvedRole,
            authProvider: parsed.authProvider || 'password',
            profileCompleted: parsed.profileCompleted ?? true,
          };
          setUserProfile(initialLocalProfile);

          // Always verify & persist local session in Firestore 'users' collection
          getDoc(doc(db, 'users', parsed.uid))
            .then(async (s) => {
              if (s.exists()) {
                const p = s.data() as UserProfile;
                const finalRole: UserRole = isPrimaryAdmin ? 'admin' : (p.role || 'student');
                const synced: UserProfile = {
                  ...initialLocalProfile,
                  ...p,
                  uid: parsed.uid,
                  fullName: p.fullName || initialLocalProfile.fullName,
                  email: p.email || initialLocalProfile.email,
                  phone: p.phone || initialLocalProfile.phone,
                  role: finalRole,
                  profileCompleted:
                    finalRole === 'admin' ||
                    Boolean(
                      (p.fullName || initialLocalProfile.fullName) &&
                        (p.phone || initialLocalProfile.phone)
                    ),
                };
                setUserProfile(synced);
                setRole(finalRole);
                // Ensure Firestore has any missing fields from local session
                await setDoc(
                  doc(db, 'users', parsed.uid),
                  {
                    ...synced,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                ).catch(() => {});
              } else {
                // Document was missing in Firestore! Immediately create it so no account is ever lost
                await setDoc(
                  doc(db, 'users', parsed.uid),
                  {
                    ...initialLocalProfile,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                ).catch(console.warn);
              }
            })
            .catch(console.warn);
        }
      } catch (err) {
        console.warn('Could not parse local session:', err);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (authActionInProgressRef.current) {
        return;
      }
      if (user) {
        setCurrentUser(user);
        await fetchUserProfile(user);
      } else if (!localStorage.getItem(STORAGE_KEY)) {
        setCurrentUser(null);
        setUserProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (email: string, pass: string): Promise<UserRole> => {
    const cleanEmail = email.trim();
    const emailLower = cleanEmail.toLowerCase();
    const isBootstrap = emailLower === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

    authActionInProgressRef.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      setCurrentUser(cred.user);
      const res = await fetchUserProfile(cred.user, 'password');
      return res.role;
    } catch (authErr: unknown) {
      const errStr = authErr instanceof Error ? authErr.message : String(authErr);
      const errCode = (authErr as { code?: string })?.code || '';

      if (
        isBootstrap &&
        pass.length >= 6 &&
        (errStr.includes('auth/user-not-found') ||
          errStr.includes('auth/invalid-credential') ||
          errCode.includes('auth/user-not-found') ||
          errCode.includes('auth/invalid-credential'))
      ) {
        try {
          const created = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          await updateProfile(created.user, { displayName: 'إدارة مركز نور الإسلام' }).catch(() => {});
          setCurrentUser(created.user);
          const res = await fetchUserProfile(created.user, 'password');
          return res.role;
        } catch {
          // continue to Firestore lookup fallback below
        }
      }

      // Check if user already exists in Firestore 'users' collection
      const fallbackUid = isBootstrap ? BOOTSTRAP_ADMIN_UID : generateEmailUid(emailLower);
      const existingFirestoreUser = await findExistingFirestoreUser(fallbackUid, cleanEmail);

      const isProviderOrCredentialFallback =
        Boolean(existingFirestoreUser) ||
        isBootstrap ||
        errStr.includes('auth/operation-not-allowed') ||
        errStr.includes('auth/admin-restricted-operation') ||
        errStr.includes('auth/configuration-not-found') ||
        errStr.includes('auth/unauthorized-domain') ||
        errStr.includes('auth/internal-error') ||
        errCode.includes('auth/operation-not-allowed') ||
        errCode.includes('auth/configuration-not-found');

      if (isProviderOrCredentialFallback) {
        await signOut(auth).catch(() => {});
        const uid = existingFirestoreUser?.docId || fallbackUid;
        const isElevated = await checkIsAdminAccount(emailLower, uid);
        const assignedRole: UserRole = isElevated
          ? 'admin'
          : existingFirestoreUser?.data.role || 'student';

        let profile: UserProfile;

        if (existingFirestoreUser) {
          profile = {
            ...existingFirestoreUser.data,
            uid,
            email: existingFirestoreUser.data.email || cleanEmail,
            role: assignedRole,
            profileCompleted:
              assignedRole === 'admin' ||
              Boolean(
                existingFirestoreUser.data.fullName && existingFirestoreUser.data.phone
              ),
          };
          await setDoc(
            doc(db, 'users', uid),
            {
              ...profile,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          profile = {
            uid,
            fullName: isElevated ? 'إدارة مركز نور الإسلام' : cleanEmail.split('@')[0],
            email: cleanEmail,
            phone: '',
            guardianRelation: isElevated ? 'إدارة المركز' : 'طالب متقدم للتسجيل',
            gender: 'male',
            address: 'مويالي - إثيوبيا',
            role: assignedRole,
            authProvider: 'password',
            profileCompleted: isElevated ? true : false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', uid), profile, { merge: true });
        }

        if (assignedRole === 'admin') {
          await setDoc(
            doc(db, 'admins', uid),
            { uid, email: cleanEmail, role: 'admin', updatedAt: serverTimestamp() },
            { merge: true }
          ).catch(() => {});
        }

        const simulatedUser = {
          uid,
          email: cleanEmail,
          displayName: profile.fullName,
          phoneNumber: profile.phone,
          emailVerified: true,
          isAnonymous: false,
        } as unknown as User;

        saveLocalSession(profile);
        setCurrentUser(simulatedUser);
        setUserProfile(profile);
        setRole(profile.role);
        return profile.role;
      }

      throw authErr;
    } finally {
      authActionInProgressRef.current = false;
    }
  };

  const loginWithGoogle = async (): Promise<{ role: UserRole; needsCompletion: boolean }> => {
    authActionInProgressRef.current = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      setCurrentUser(cred.user);
      const { role: resolvedRole, profile } = await fetchUserProfile(cred.user, 'google');
      const needsCompletion =
        resolvedRole !== 'admin' &&
        (!profile.profileCompleted || !profile.phone?.trim() || !profile.fullName?.trim());
      return { role: resolvedRole, needsCompletion };
    } catch (authErr: unknown) {
      console.error('Google Sign-in error:', authErr);
      throw authErr;
    } finally {
      authActionInProgressRef.current = false;
    }
  };

  const register = async (
    fullName: string,
    email: string,
    phone: string,
    pass: string,
    extra?: RegisterExtraInput
  ): Promise<UserRole> => {
    const cleanEmail = email.trim();
    const emailLower = cleanEmail.toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanRelation = extra?.guardianRelation || 'طالب متقدم للتسجيل';
    const cleanGender = extra?.gender || 'male';
    const cleanAddress = extra?.address?.trim() || 'مويالي - إثيوبيا';

    authActionInProgressRef.current = true;
    pendingRegistrationRef.current = {
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      guardianRelation: cleanRelation,
      gender: cleanGender,
      address: cleanAddress,
    };

    try {
      localStorage.removeItem(STORAGE_KEY);
      if (auth.currentUser) {
        await signOut(auth).catch(() => {});
      }

      let resolvedAuthUser: User | null = null;

      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        resolvedAuthUser = cred.user;
      } catch (createErr: unknown) {
        const errStr = createErr instanceof Error ? createErr.message : String(createErr);
        const errCode = (createErr as { code?: string })?.code || '';

        // Reject only if email format or password length is invalid
        if (
          errStr.includes('auth/invalid-email') ||
          errCode.includes('auth/invalid-email') ||
          errStr.includes('auth/weak-password') ||
          errCode.includes('auth/weak-password')
        ) {
          throw createErr;
        }

        // If email already exists in Firebase Auth, try signing in with the provided password
        if (
          errStr.includes('auth/email-already-in-use') ||
          errCode.includes('auth/email-already-in-use')
        ) {
          try {
            const signedIn = await signInWithEmailAndPassword(auth, cleanEmail, pass);
            resolvedAuthUser = signedIn.user;
          } catch {
            // Even if sign-in with new password didn't match old Auth entry, we will still persist in Firestore below
            resolvedAuthUser = null;
          }
        }
      }

      if (resolvedAuthUser) {
        try {
          await updateProfile(resolvedAuthUser, { displayName: cleanName });
        } catch {
          // ignore displayName update warning
        }
      }

      const isBootstrap = emailLower === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      const uid = resolvedAuthUser
        ? resolvedAuthUser.uid
        : isBootstrap
        ? BOOTSTRAP_ADMIN_UID
        : generateEmailUid(emailLower);

      const isElevated = await checkIsAdminAccount(emailLower, uid);
      const assignedRole: UserRole = isElevated ? 'admin' : 'student';

      const profile: UserProfile = {
        uid,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        guardianRelation: cleanRelation,
        gender: cleanGender,
        address: cleanAddress,
        role: assignedRole,
        authProvider: 'password',
        profileCompleted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 1. Write user profile to Firestore 'users' collection
      await setDoc(doc(db, 'users', uid), profile, { merge: true });

      // 2. If admin, also register in 'admins' collection
      if (assignedRole === 'admin') {
        await setDoc(
          doc(db, 'admins', uid),
          {
            uid,
            email: cleanEmail,
            fullName: cleanName,
            role: 'admin',
            createdAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }

      // 3. Create welcome notification in Firestore 'notifications' collection
      await addDoc(collection(db, 'notifications'), {
        userId: uid,
        title: 'مرحبًا بك في البوابة الرسمية لمركز نور الإسلام 🎉',
        message: `تم إنشاء حسابك وحفظه بنجاح باسم (${cleanName}). يمكنك الآن تقديم طلب التحاق جديد أو متابعة حالة طلباتك.`,
        type: 'info',
        isRead: false,
        link: 'student-dashboard',
        createdAt: serverTimestamp(),
      }).catch(() => {});

      // 4. Log account registration in 'adminLogs' so Admin sees a complete audit trail
      await addDoc(collection(db, 'adminLogs'), {
        adminId: uid,
        adminEmail: cleanEmail,
        action: 'تسجيل حساب جديد في البوابة',
        details: `تم إنشاء حساب جديد باسم (${cleanName}) - البريد: ${cleanEmail} - الهاتف: ${cleanPhone}`,
        createdAt: serverTimestamp(),
      }).catch(() => {});

      const activeUserObj =
        resolvedAuthUser ||
        ({
          uid,
          email: cleanEmail,
          displayName: cleanName,
          phoneNumber: cleanPhone,
          emailVerified: true,
          isAnonymous: false,
        } as unknown as User);

      saveLocalSession(profile);
      setCurrentUser(activeUserObj);
      setUserProfile(profile);
      setRole(assignedRole);
      return assignedRole;
    } finally {
      pendingRegistrationRef.current = null;
      authActionInProgressRef.current = false;
    }
  };

  const completeUserProfile = async (data: CompleteProfileInput): Promise<void> => {
    if (!currentUser) {
      throw new Error('لا يوجد مستخدم مسجل حالياً.');
    }

    const cleanName = data.fullName.trim();
    const cleanPhone = data.phone.trim();
    const cleanAddress = data.address.trim() || 'مويالي - إثيوبيا';
    const resolvedRole: UserRole = role || 'student';

    const updatedProfile: UserProfile = {
      uid: currentUser.uid,
      fullName: cleanName,
      email: currentUser.email || userProfile?.email || '',
      phone: cleanPhone,
      guardianRelation: data.guardianRelation || 'طالب متقدم للتسجيل',
      gender: data.gender || 'male',
      address: cleanAddress,
      role: resolvedRole,
      authProvider: userProfile?.authProvider || 'google',
      profileCompleted: true,
      createdAt: userProfile?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', currentUser.uid), updatedProfile, { merge: true });

    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: cleanName }).catch(() => {});
    }

    await addDoc(collection(db, 'notifications'), {
      userId: currentUser.uid,
      title: 'تم استكمال بيانات حسابك بنجاح ✅',
      message: `أهلاً بك (${cleanName}) في البوابة الرسمية لمركز نور الإسلام (مويالي - إثيوبيا). يمكنك الآن تقديم طلب تسجيل طالب جديد.`,
      type: 'success',
      isRead: false,
      link: 'student-dashboard',
      createdAt: serverTimestamp(),
    }).catch(() => {});

    await addDoc(collection(db, 'adminLogs'), {
      adminId: currentUser.uid,
      adminEmail: updatedProfile.email,
      action: 'استكمال بيانات حساب Google',
      details: `تم استكمال وحفظ البيانات الأساسية للمستخدم (${cleanName}) - الهاتف: ${cleanPhone}`,
      createdAt: serverTimestamp(),
    }).catch(() => {});

    saveLocalSession(updatedProfile);
    setUserProfile(updatedProfile);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      console.log('Password reset link requested for:', email);
    }
  };

  const logout = async () => {
    localStorage.removeItem(STORAGE_KEY);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setUserProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser);
    }
  };

  const isAdmin =
    role === 'admin' ||
    currentUser?.uid === BOOTSTRAP_ADMIN_UID ||
    currentUser?.email?.toLowerCase().trim() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase().trim();
  const isStudent = role === 'student';

  const needsProfileCompletion = Boolean(
    currentUser &&
      !isAdmin &&
      (!userProfile ||
        userProfile.profileCompleted === false ||
        !userProfile.phone ||
        !userProfile.phone.trim() ||
        !userProfile.fullName ||
        !userProfile.fullName.trim())
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        loading,
        isAdmin,
        isStudent,
        needsProfileCompletion,
        login,
        loginWithGoogle,
        register,
        completeUserProfile,
        resetPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
