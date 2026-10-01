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

const STORAGE_KEY = 'noor_session_user';

/**
 * Cryptographic SHA-256 password hash using Web Crypto API.
 * Ensures plaintext passwords are NEVER stored in code or database.
 */
export async function hashPassword(password: string): Promise<string> {
  const input = 'noor-islam-salt-v1:' + password.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

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

export function generateEmailAdminKey(email: string): string {
  const clean = email.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const safeAscii = clean.replace(/[^a-z0-9]/g, '').slice(0, 14);
  return `email-${safeAscii}-${Math.abs(hash).toString(36)}`;
}

function saveLocalSession(
  profile: {
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
  },
  verifiedToken?: string
) {
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
        verifiedToken: verifiedToken || '',
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

  const authActionInProgressRef = useRef<boolean>(false);

  const pendingRegistrationRef = useRef<{
    fullName: string;
    email: string;
    phone: string;
    guardianRelation: string;
    gender: 'male' | 'female';
    address: string;
  } | null>(null);

  /**
   * Checks whether a user is an Admin strictly by querying the Firestore database
   * ('admins' and 'users' collections) — no hardcoded emails or UIDs in source code.
   */
  const checkIsAdminInDatabase = async (
    email?: string | null,
    uid?: string
  ): Promise<boolean> => {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    try {
      if (uid) {
        const adminDoc = await getDoc(doc(db, 'admins', uid));
        if (adminDoc.exists()) return true;

        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists() && userDoc.data()?.role === 'admin') return true;
      }
      if (cleanEmail) {
        const emailKey = generateEmailAdminKey(cleanEmail);
        const preAssignedAdmin = await getDoc(doc(db, 'admins', emailKey));
        if (preAssignedAdmin.exists()) return true;

        const adminQuery = query(
          collection(db, 'admins'),
          where('email', '==', cleanEmail)
        );
        const adminSnap = await getDocs(adminQuery);
        if (!adminSnap.empty) return true;
      }
    } catch {
      // ignore lookup error
    }
    return false;
  };

  /**
   * Finds an existing user or admin record in Firestore by UID or Email.
   */
  const findExistingFirestoreAccount = async (
    email: string,
    uidHint?: string
  ): Promise<{
    docId: string;
    data: UserProfile;
    passwordHash?: string;
  } | null> => {
    const cleanEmail = email.trim();
    const emailLower = cleanEmail.toLowerCase();

    try {
      // 1. Check direct UID if provided
      if (uidHint) {
        const directSnap = await getDoc(doc(db, 'users', uidHint));
        if (directSnap.exists()) {
          const data = directSnap.data() as UserProfile;
          return {
            docId: directSnap.id,
            data,
            passwordHash: data.passwordHash,
          };
        }
      }

      // 2. Query 'users' collection by exact email or lowercase email
      const qExact = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snapExact = await getDocs(qExact);
      if (!snapExact.empty) {
        // Prefer document with role === 'admin' or passwordHash if multiple exist
        const chosen =
          snapExact.docs.find((d) => d.data().role === 'admin' && d.data().passwordHash) ||
          snapExact.docs.find((d) => d.data().passwordHash) ||
          snapExact.docs[0];
        const data = chosen.data() as UserProfile;
        return {
          docId: chosen.id,
          data,
          passwordHash: data.passwordHash,
        };
      }

      if (emailLower !== cleanEmail) {
        const qLower = query(collection(db, 'users'), where('email', '==', emailLower));
        const snapLower = await getDocs(qLower);
        if (!snapLower.empty) {
          const chosen =
            snapLower.docs.find((d) => d.data().role === 'admin' && d.data().passwordHash) ||
            snapLower.docs.find((d) => d.data().passwordHash) ||
            snapLower.docs[0];
          const data = chosen.data() as UserProfile;
          return {
            docId: chosen.id,
            data,
            passwordHash: data.passwordHash,
          };
        }
      }

      // 3. Check deterministic email UID in 'users'
      const emailUid = generateEmailUid(emailLower);
      const emailUidSnap = await getDoc(doc(db, 'users', emailUid));
      if (emailUidSnap.exists()) {
        const data = emailUidSnap.data() as UserProfile;
        return {
          docId: emailUidSnap.id,
          data,
          passwordHash: data.passwordHash,
        };
      }

      // 4. Also check 'admins' collection by email
      const adminQuery = query(collection(db, 'admins'), where('email', '==', emailLower));
      const adminSnap = await getDocs(adminQuery);
      if (!adminSnap.empty) {
        const adminDoc = adminSnap.docs[0];
        const adminData = adminDoc.data();
        const uid = adminData.uid || adminDoc.id;
        const userDocSnap = await getDoc(doc(db, 'users', uid));
        const userData = userDocSnap.exists()
          ? (userDocSnap.data() as UserProfile)
          : ({
              uid,
              fullName: adminData.fullName || 'إدارة مركز نور الإسلام',
              email: emailLower,
              phone: '',
              role: 'admin',
              profileCompleted: true,
              passwordHash: adminData.passwordHash,
            } as UserProfile);

        return {
          docId: uid,
          data: { ...userData, role: 'admin' },
          passwordHash: userData.passwordHash || adminData.passwordHash,
        };
      }
    } catch (err) {
      console.warn('Firestore account lookup note:', err);
    }

    return null;
  };

  const fetchUserProfile = async (
    user: User,
    providerHint?: 'google' | 'password'
  ): Promise<{ role: UserRole; profile: UserProfile }> => {
    const existingByEmailOrUid = user.email
      ? await findExistingFirestoreAccount(user.email, user.uid)
      : null;

    const targetUid = existingByEmailOrUid?.docId || user.uid;
    const userDocRef = doc(db, 'users', targetUid);
    const isElevated = await checkIsAdminInDatabase(user.email, targetUid);
    const pending = pendingRegistrationRef.current;

    try {
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const resolvedRole: UserRole = isElevated ? 'admin' : data.role || 'student';

        const mergedFullName =
          data.fullName ||
          pending?.fullName ||
          user.displayName ||
          '';
        const mergedPhone =
          data.phone || pending?.phone || user.phoneNumber || '';
        const mergedRelation =
          data.guardianRelation ||
          pending?.guardianRelation ||
          (resolvedRole === 'admin' ? 'إدارة المركز' : 'طالب متقدم للتسجيل');
        const mergedGender = data.gender || pending?.gender || 'male';
        const mergedAddress =
          data.address || pending?.address || 'مويالي - إثيوبيا';

        const isGoogleProvider =
          providerHint === 'google' ||
          (providerHint !== 'password' &&
            data.authProvider === 'google' &&
            Boolean(user.providerData?.some((p) => p.providerId === 'google.com')));

        const hasBasicInfo =
          resolvedRole === 'admin' ||
          Boolean(mergedFullName.trim().length >= 2 && mergedPhone.trim().length >= 5);

        const updatedProfile: UserProfile = {
          ...data,
          uid: targetUid,
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

        saveLocalSession(updatedProfile, data.passwordHash);
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
          user.displayName ||
          (initialRole === 'admin' ? 'إدارة مركز نور الإسلام' : '');
        const mergedPhone = pending?.phone || user.phoneNumber || '';
        const mergedRelation =
          pending?.guardianRelation ||
          (initialRole === 'admin' ? 'إدارة المركز' : 'طالب متقدم للتسجيل');
        const mergedGender = pending?.gender || 'male';
        const mergedAddress = pending?.address || 'مويالي - إثيوبيا';

        const isCompleted =
          initialRole === 'admin' ||
          Boolean(mergedFullName.trim().length >= 2 && mergedPhone.trim().length >= 5);

        const newProfile: UserProfile = {
          uid: targetUid,
          fullName: mergedFullName,
          email: user.email || pending?.email || '',
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

        saveLocalSession(newProfile);
        setUserProfile(newProfile);
        setRole(initialRole);
        return { role: initialRole, profile: newProfile };
      }
    } catch (err) {
      console.error('Error fetching/creating user profile in Firestore:', err);
      const fallbackRole: UserRole = isElevated ? 'admin' : 'student';
      const fallbackProfile: UserProfile = {
        uid: targetUid,
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
          // Verify the saved session against Firestore database (never trust localStorage blindly)
          getDoc(doc(db, 'users', parsed.uid))
            .then(async (s) => {
              if (!s.exists()) {
                localStorage.removeItem(STORAGE_KEY);
                setCurrentUser(null);
                setUserProfile(null);
                setRole(null);
                setLoading(false);
                return;
              }

              const dbUser = s.data() as UserProfile;
              const isDbAdmin = await checkIsAdminInDatabase(dbUser.email, parsed.uid);
              const verifiedRole: UserRole = isDbAdmin ? 'admin' : dbUser.role || 'student';

              // If the user in Firestore has a passwordHash, ensure the saved session token matches
              if (
                dbUser.passwordHash &&
                parsed.authProvider !== 'google' &&
                parsed.verifiedToken !== dbUser.passwordHash
              ) {
                localStorage.removeItem(STORAGE_KEY);
                setCurrentUser(null);
                setUserProfile(null);
                setRole(null);
                setLoading(false);
                return;
              }

              const syncedProfile: UserProfile = {
                ...dbUser,
                uid: parsed.uid,
                role: verifiedRole,
                profileCompleted:
                  verifiedRole === 'admin' ||
                  Boolean(dbUser.fullName?.trim() && dbUser.phone?.trim()),
              };

              const simUser = {
                uid: parsed.uid,
                email: syncedProfile.email || '',
                displayName: syncedProfile.fullName || '',
                phoneNumber: syncedProfile.phone || '',
                emailVerified: true,
                isAnonymous: false,
              } as unknown as User;

              setCurrentUser(simUser);
              setUserProfile(syncedProfile);
              setRole(verifiedRole);
              setLoading(false);
            })
            .catch(() => {
              setLoading(false);
            });
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
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
    }, 1500);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  /**
   * Strict Login with Email & Password:
   * Verifies password hash directly against the Firestore database ('users' & 'admins').
   * Rejects ANY password that does not match the stored passwordHash.
   */
  const login = async (email: string, pass: string): Promise<UserRole> => {
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      const err = new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور.') as Error & {
        code?: string;
      };
      err.code = 'auth/invalid-credential';
      throw err;
    }

    authActionInProgressRef.current = true;
    try {
      const inputPasswordHash = await hashPassword(cleanPass);

      // 1. Look up the user/admin account in the Firestore database
      const existingAccount = await findExistingFirestoreAccount(cleanEmail);

      // 2. If the account exists in Firestore and has a stored passwordHash,
      //    strictly enforce that the entered password matches that exact hash!
      if (existingAccount && existingAccount.passwordHash) {
        if (inputPasswordHash !== existingAccount.passwordHash) {
          const invalidErr = new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.') as Error & {
            code?: string;
          };
          invalidErr.code = 'auth/invalid-credential';
          throw invalidErr;
        }

        // Password hash matched the database record!
        const uid = existingAccount.docId;
        const isDbAdmin = await checkIsAdminInDatabase(cleanEmail, uid);
        const resolvedRole: UserRole = isDbAdmin
          ? 'admin'
          : existingAccount.data.role || 'student';

        // Optionally sign in to Firebase Auth if Email/Password matches in Auth too
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        } catch {
          // Database passwordHash is already verified; continue with verified database session
        }

        const profile: UserProfile = {
          ...existingAccount.data,
          uid,
          email: existingAccount.data.email || cleanEmail,
          role: resolvedRole,
          authProvider: 'password',
          profileCompleted:
            resolvedRole === 'admin' ||
            Boolean(
              existingAccount.data.fullName?.trim() && existingAccount.data.phone?.trim()
            ),
          passwordHash: existingAccount.passwordHash,
        };

        await setDoc(
          doc(db, 'users', uid),
          {
            ...profile,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        const verifiedUser = {
          uid,
          email: profile.email,
          displayName: profile.fullName,
          phoneNumber: profile.phone,
          emailVerified: true,
          isAnonymous: false,
        } as unknown as User;

        saveLocalSession(profile, existingAccount.passwordHash);
        setCurrentUser(verifiedUser);
        setUserProfile(profile);
        setRole(resolvedRole);
        return resolvedRole;
      }

      // 3. If the account has no passwordHash in Firestore yet, verify via Firebase Auth
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        const uid = existingAccount?.docId || cred.user.uid;
        // Save the verified passwordHash in Firestore for future logins
        await setDoc(
          doc(db, 'users', uid),
          {
            uid,
            email: cleanEmail,
            passwordHash: inputPasswordHash,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        setCurrentUser(cred.user);
        const res = await fetchUserProfile(cred.user, 'password');
        saveLocalSession(res.profile, inputPasswordHash);
        return res.role;
      } catch {
        const invalidErr = new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.') as Error & {
          code?: string;
        };
        invalidErr.code = 'auth/invalid-credential';
        throw invalidErr;
      }
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
    const cleanPass = pass.trim();
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
      // 1. Prevent overwriting any existing account (Admin or Student) in Firestore!
      const existingAccount = await findExistingFirestoreAccount(cleanEmail);
      if (existingAccount) {
        const existsErr = new Error(
          'هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.'
        ) as Error & { code?: string };
        existsErr.code = 'auth/email-already-in-use';
        throw existsErr;
      }

      const passwordHash = await hashPassword(cleanPass);

      localStorage.removeItem(STORAGE_KEY);
      if (auth.currentUser) {
        await signOut(auth).catch(() => {});
      }

      let resolvedAuthUser: User | null = null;

      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
        resolvedAuthUser = cred.user;
      } catch (createErr: unknown) {
        const errStr = createErr instanceof Error ? createErr.message : String(createErr);
        const errCode = (createErr as { code?: string })?.code || '';

        if (
          errStr.includes('auth/invalid-email') ||
          errCode.includes('auth/invalid-email') ||
          errStr.includes('auth/weak-password') ||
          errCode.includes('auth/weak-password')
        ) {
          throw createErr;
        }
      }

      if (resolvedAuthUser) {
        try {
          await updateProfile(resolvedAuthUser, { displayName: cleanName });
        } catch {
          // ignore displayName update warning
        }
      }

      const uid = resolvedAuthUser ? resolvedAuthUser.uid : generateEmailUid(emailLower);
      const isPreAssignedAdmin = await checkIsAdminInDatabase(emailLower, uid);
      const assignedRole: UserRole = isPreAssignedAdmin ? 'admin' : 'student';

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
        passwordHash,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save new user account + passwordHash to Firestore 'users' collection
      await setDoc(doc(db, 'users', uid), profile, { merge: true });

      if (assignedRole === 'admin') {
        await setDoc(
          doc(db, 'admins', uid),
          {
            uid,
            email: emailLower,
            fullName: cleanName,
            role: 'admin',
            passwordHash,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }

      await addDoc(collection(db, 'notifications'), {
        userId: uid,
        title: 'مرحبًا بك في البوابة الرسمية لمركز نور الإسلام 🎉',
        message: `تم إنشاء حسابك وحفظه بنجاح باسم (${cleanName}). يمكنك الآن تقديم طلب التحاق جديد أو متابعة حالة طلباتك.`,
        type: 'info',
        isRead: false,
        link: 'student-dashboard',
        createdAt: serverTimestamp(),
      }).catch(() => {});

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

      saveLocalSession(profile, passwordHash);
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

    saveLocalSession(updatedProfile, userProfile?.passwordHash);
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

  const isAdmin = role === 'admin';
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
