"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getFirebaseServices, isFirebaseConfigured } from "@/lib/firebase";
import { ensureProfile } from "@/lib/firestore";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toHandle(user: User): string {
  const source =
    user.displayName ||
    user.email?.split("@")[0] ||
    `poet-${user.uid.slice(0, 6)}`;
  return source
    .toLocaleLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

async function provisionUser(user: User): Promise<void> {
  await ensureProfile({
    uid: user.uid,
    handle: toHandle(user),
    displayName: user.displayName || "New poet",
    photoURL: user.photoURL,
    createdAt: new Date(),
    banned: false,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const { auth } = getFirebaseServices();
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { auth } = getFirebaseServices();
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    await provisionUser(credential.user);
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { auth } = getFirebaseServices();
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await provisionUser(credential.user);
    },
    [],
  );

  const createAccount = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { auth } = getFirebaseServices();
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(credential.user, { displayName: displayName.trim() });
      await provisionUser(credential.user);
      setUser(auth.currentUser);
    },
    [],
  );

  const signOutUser = useCallback(async () => {
    const { auth } = getFirebaseServices();
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      signInWithGoogle,
      signInWithEmail,
      createAccount,
      signOutUser,
    }),
    [
      createAccount,
      loading,
      signInWithEmail,
      signInWithGoogle,
      signOutUser,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}
