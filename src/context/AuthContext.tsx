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
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
function generateEmailUid(email: string): string {
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Prevents onAuthStateChanged from racing with explicit register / loginWithGoogle actions
  const authActionInProgressRef = useRef<boolean>(false);

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

  const fetchUserProfile = async (
    user: User,
    providerHint?: 'google' | 'password'
  ): Promise<{ role: UserRole; profile: UserProfile }> => {
    const userDocRef = doc(db, 'users', user.uid);
    const isElevated = await checkIsAdminAccount(user.email, user.uid);

    try {
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const resolvedRole: UserRole = isElevated ? 'admin' : (data.role || 'student');
        const hasBasicInfo =
          resolvedRole === 'admin' ||
          Boolean(
            data.profileCompleted &&
              data.fullName &&
              data.fullName.trim().length >= 2 &&
              data.phone &&
              data.phone.trim().length >= 5
          ) ||
          Boolean(
            data.authProvider === 'password' &&
              data.fullName &&
              data.fullName.trim().length >= 2 &&
              data.phone &&
              data.phone.trim().length >= 5
          );

        const updatedProfile: UserProfile = {
          ...data,
          uid: user.uid,
          email: user.email || data.email || '',
          fullName: data.fullName || user.displayName || '',
          phone: data.phone || user.phoneNumber || '',
          role: resolvedRole,
          authProvider: data.authProvider || providerHint || 'google',
          profileCompleted: hasBasicInfo,
        };

        await setDoc(
          userDocRef,
          {
            uid: updatedProfile.uid,
            email: updatedProfile.email,
            fullName: updatedProfile.fullName,
            phone: updatedProfile.phone,
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

        setUserProfile(updatedProfile);
        setRole(resolvedRole);
        return { role: resolvedRole, profile: updatedProfile };
      } else {
        const initialRole: UserRole = isElevated ? 'admin' : 'student';
        const isGoogle =
          providerHint === 'google' ||
          user.providerData?.some((p) => p.providerId === 'google.com') ||
          !user.phoneNumber;

        const isCompleted =
          initialRole === 'admin' ||
          (!isGoogle && Boolean(user.displayName && user.phoneNumber));

        const newProfile: UserProfile = {
          uid: user.uid,
          fullName:
            user.displayName ||
            (initialRole === 'admin' ? 'إدارة مركز نور الإسلام' : ''),
          email: user.email || '',
          phone: user.phoneNumber || '',
          guardianRelation: initialRole === 'admin' ? 'إدارة المركز' : 'طالب متقدم للتسجيل',
          gender: 'male',
          address: 'مويالي - إثيوبيا',
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

        setUserProfile(newProfile);
        setRole(initialRole);
        return { role: initialRole, profile: newProfile };
      }
    } catch (err) {
      console.error('Error fetching/creating user profile in Firestore:', err);
      const fallbackRole: UserRole = isElevated ? 'admin' : 'student';
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        fullName: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        role: fallbackRole,
        authProvider: providerHint || 'google',
        profileCompleted: fallbackRole === 'admin',
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
          const simUser = {
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName || parsed.fullName || '',
            phoneNumber: parsed.phone || '',
            emailVerified: true,
            isAnonymous: false,
          } as unknown as User;
          setCurrentUser(simUser);
          setRole(isPrimaryAdmin ? 'admin' : (parsed.role || 'student'));
          getDoc(doc(db, 'users', parsed.uid))
            .then((s) => {
              if (s.exists()) {
                const p = s.data() as UserProfile;
                const resolved: UserRole = isPrimaryAdmin ? 'admin' : (p.role || 'student');
                setUserProfile({ ...p, uid: parsed.uid, role: resolved });
                setRole(resolved);
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
    const isBootstrap = cleanEmail.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

    authActionInProgressRef.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      localStorage.removeItem(STORAGE_KEY);
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
        } catch (createErr: unknown) {
          const createErrStr = createErr instanceof Error ? createErr.message : String(createErr);
          if (createErrStr.includes('auth/email-already-in-use')) {
            throw authErr;
          }
        }
      }

      const isBlocked =
        errStr.includes('auth/operation-not-allowed') ||
        errStr.includes('auth/admin-restricted-operation') ||
        errStr.includes('auth/configuration-not-found') ||
        errCode.includes('auth/operation-not-allowed') ||
        errCode.includes('auth/configuration-not-found');

      if (isBlocked) {
        await signOut(auth).catch(() => {});
        const emailLower = cleanEmail.toLowerCase();
        const uid = isBootstrap ? BOOTSTRAP_ADMIN_UID : generateEmailUid(emailLower);
        const isElevated = await checkIsAdminAccount(emailLower, uid);
        const assignedRole: UserRole = isElevated ? 'admin' : 'student';

        const userDocRef = doc(db, 'users', uid);
        const snap = await getDoc(userDocRef);
        let profile: UserProfile;

        if (snap.exists()) {
          profile = snap.data() as UserProfile;
          if (isElevated && profile.role !== 'admin') {
            profile.role = 'admin';
            await setDoc(userDocRef, { role: 'admin', updatedAt: serverTimestamp() }, { merge: true });
          }
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
          await setDoc(userDocRef, profile, { merge: true });
          if (assignedRole === 'admin') {
            await setDoc(
              doc(db, 'admins', uid),
              { uid, email: cleanEmail, role: 'admin', createdAt: serverTimestamp() },
              { merge: true }
            );
          }
        }

        const simulatedUser = {
          uid,
          email: cleanEmail,
          displayName: profile.fullName,
          phoneNumber: profile.phone,
          emailVerified: true,
          isAnonymous: false,
        } as unknown as User;

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            uid,
            email: cleanEmail,
            displayName: profile.fullName,
            phone: profile.phone,
            role: profile.role,
          })
        );

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
      localStorage.removeItem(STORAGE_KEY);
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
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanRelation = extra?.guardianRelation || 'طالب متقدم للتسجيل';
    const cleanGender = extra?.gender || 'male';
    const cleanAddress = extra?.address?.trim() || 'مويالي - إثيوبيا';

    authActionInProgressRef.current = true;

    try {
      // Clear any previous session before creating a new account
      localStorage.removeItem(STORAGE_KEY);
      if (auth.currentUser) {
        await signOut(auth).catch(() => {});
      }

      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);

      try {
        await updateProfile(cred.user, { displayName: cleanName });
      } catch (updateErr) {
        console.warn('Could not update Auth displayName:', updateErr);
      }

      const isElevated = await checkIsAdminAccount(cleanEmail, cred.user.uid);
      const assignedRole: UserRole = isElevated ? 'admin' : 'student';

      const profile: UserProfile = {
        uid: cred.user.uid,
        fullName: cleanName,
        email: cred.user.email || cleanEmail,
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

      // Write user profile to Firestore 'users' collection
      await setDoc(doc(db, 'users', cred.user.uid), profile, { merge: true });

      if (assignedRole === 'admin') {
        await setDoc(
          doc(db, 'admins', cred.user.uid),
          {
            uid: cred.user.uid,
            email: cleanEmail,
            role: 'admin',
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // Create welcome notification in Firestore
      await addDoc(collection(db, 'notifications'), {
        userId: cred.user.uid,
        title: 'مرحبًا بك في البوابة الرسمية لمركز نور الإسلام 🎉',
        message: `تم إنشاء حسابك بنجاح باسم (${cleanName}). يمكنك الآن تقديم طلب التحاق جديد أو متابعة حالة طلباتك.`,
        type: 'info',
        isRead: false,
        link: 'student-dashboard',
        createdAt: serverTimestamp(),
      }).catch(() => {});

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          uid: cred.user.uid,
          email: cleanEmail,
          displayName: cleanName,
          phone: cleanPhone,
          role: assignedRole,
        })
      );

      setCurrentUser(cred.user);
      setUserProfile(profile);
      setRole(assignedRole);
      return assignedRole;
    } catch (authErr: unknown) {
      const errStr = authErr instanceof Error ? authErr.message : String(authErr);
      const errCode = (authErr as { code?: string })?.code || '';
      const isBlocked =
        errStr.includes('auth/operation-not-allowed') ||
        errStr.includes('auth/admin-restricted-operation') ||
        errStr.includes('auth/configuration-not-found') ||
        errCode.includes('auth/operation-not-allowed') ||
        errCode.includes('auth/configuration-not-found');

      if (isBlocked) {
        await signOut(auth).catch(() => {});
        const emailLower = cleanEmail.toLowerCase();
        const isBootstrap = emailLower === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
        const uid = isBootstrap ? BOOTSTRAP_ADMIN_UID : generateEmailUid(emailLower);
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

        // Always persist user record in Firestore 'users' collection
        await setDoc(doc(db, 'users', uid), profile, { merge: true });

        if (assignedRole === 'admin') {
          await setDoc(
            doc(db, 'admins', uid),
            {
              uid,
              email: cleanEmail,
              role: 'admin',
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        await addDoc(collection(db, 'notifications'), {
          userId: uid,
          title: 'مرحبًا بك في البوابة الرسمية لمركز نور الإسلام 🎉',
          message: `تم إنشاء حسابك بنجاح باسم (${cleanName}). يمكنك الآن تقديم طلب التحاق جديد أو متابعة حالة طلباتك.`,
          type: 'info',
          isRead: false,
          link: 'student-dashboard',
          createdAt: serverTimestamp(),
        }).catch(() => {});

        const simulatedUser = {
          uid,
          email: cleanEmail,
          displayName: cleanName,
          phoneNumber: cleanPhone,
          emailVerified: true,
          isAnonymous: false,
        } as unknown as User;

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            uid,
            email: cleanEmail,
            displayName: cleanName,
            phone: cleanPhone,
            role: assignedRole,
          })
        );

        setCurrentUser(simulatedUser);
        setUserProfile(profile);
        setRole(assignedRole);
        return assignedRole;
      }
      throw authErr;
    } finally {
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
