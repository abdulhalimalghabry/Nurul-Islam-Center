import { auth } from './config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const current = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: current?.uid,
      email: current?.email,
      emailVerified: current?.emailVerified,
      isAnonymous: current?.isAnonymous,
      tenantId: current?.tenantId,
      providerInfo:
        current?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User-friendly Arabic error message translator so users don't see raw JSON
export function formatArabicErrorMessage(err: unknown): string {
  if (!err) return 'حدث خطأ غير متوقع، يرجى المحاولة لاحقًا.';
  const str = err instanceof Error ? err.message : String(err);
  console.error('Captured Firebase Error:', err);

  if (str.includes('auth/email-already-in-use')) {
    return 'هذا البريد الإلكتروني مسجل مسبقًا. يمكنك الانتقال لصفحة تسجيل الدخول واستعادة كلمة المرور إذا لزم الأمر.';
  }
  if (str.includes('auth/invalid-email')) {
    return 'صيغة البريد الإلكتروني غير صالحة. يرجى التأكد من كتابته بشكل صحيح (مثال: name@example.com).';
  }
  if (str.includes('auth/weak-password')) {
    return 'كلمة المرور ضعيفة جدًا. يرجى إدخال 6 خانات على الأقل.';
  }
  if (str.includes('auth/operation-not-allowed')) {
    return 'خدمة إنشاء الحساب بالبريد تتطلب التفعيل في المشروع، أو يرجى استخدام تسجيل الدخول بحساب Google.';
  }
  if (str.includes('auth/user-not-found') || str.includes('auth/wrong-password') || str.includes('auth/invalid-credential')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (str.includes('auth/network-request-failed')) {
    return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
  }
  if (str.includes('auth/too-many-requests')) {
    return 'تم حظر الطلبات مؤقتًا بسبب تكرار المحاولات غير الناجحة. يرجى الانتظار بضع دقائق ثم المحاولة.';
  }
  if (str.includes('auth/popup-closed-by-user')) {
    return 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.';
  }
  if (str.includes('permission-denied') || str.includes('Missing or insufficient permissions')) {
    return 'عذرًا، لا تملك الصلاحيات الكافية لتنفيذ هذا الإجراء.';
  }
  if (str.includes('quota-exceeded')) {
    return 'تم تجاوز الحد اليومي للعمليات، يرجى المحاولة لاحقًا.';
  }

  // If error has a message property, extract it cleanly
  if (err instanceof Error && err.message && !err.message.includes('{')) {
    return err.message;
  }

  return 'حدث خطأ أثناء إنشاء الحساب، يرجى التأكد من صحة البيانات والمحاولة مرة أخرى.';
}
