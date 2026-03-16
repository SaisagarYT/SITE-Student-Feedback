
"use client";


import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";

import { app } from "@/firebase";
import { authenticateStudent } from "@/api";
type AuthResponse = {
  registered?: boolean;
  student?: { name?: string };
  message?: string;
};

const provider = new GoogleAuthProvider();

export default function GoogleLogin() {
  const router = useRouter();
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        // User is signed in, you can handle user info here
        console.log("User signed in:", user);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const auth = getAuth(app);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user) {
        const idToken = await user.getIdToken();
        console.log("JWT idToken:", idToken); // Logs the JWT token
        document.cookie = `token=${idToken}; path=/; max-age=3600;`;
        let data: AuthResponse = (await authenticateStudent(idToken)) || {};
        console.log("Backend response from authenticateStudent:", data);
        if (!data.registered) {
          data = (await authenticateStudent(idToken, {
            name: user.displayName || "",
            profileImage: user.photoURL || ""
          })) || {};
        }
        if (user.photoURL) {
          localStorage.setItem("profileImage", user.photoURL);
        }
        if (user.displayName) {
          localStorage.setItem("studentName", user.displayName);
        }
        router.replace("/feedback");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[--page] flex flex-col relative overflow-hidden">
      {/* Themed background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute inset-x-0 top-0 h-112 bg-[linear-gradient(180deg,rgba(10,152,146,0.16),rgba(10,152,146,0))]" />
        <div className="absolute -left-20 top-48 h-72 w-72 rounded-full bg-[rgba(239,42,113,0.14)] blur-[120px]" />
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-[rgba(10,152,146,0.16)] blur-[130px]" />
      </div>
      {/* Navbar */}
      <nav className="w-full flex bg-(--brand) items-center justify-between px-8 py-5 bg-[--page] shadow-md z-10" style={{ boxShadow: '0 2px 12px rgba(10,152,146,0.08)' }}>
        <img src="/sasi_complete.png" alt="SASI Logo" className="h-14 w-auto mr-4" style={{ maxHeight: 56 }} />
        <span className="text-2xl font-bold tracking-tight text-(--accent-deep) bg-white px-4 py-2 rounded-lg shadow-sm" style={{ background: '#fff', padding: '0.5rem 1.25rem' }}>
          SASI Student Feedback Portal
        </span>
      </nav>
      {/* Centered Google button */}
      <div className="flex-1 flex flex-col items-center justify-center z-10">
        <button
          onClick={handleGoogleLogin}
          className="flex items-center gap-2 px-4 py-2 bg-(--brand) text-white text-base rounded-full shadow font-semibold min-w-[170px] border-2 border-[--line] hover:border-[--brand] transition-colors duration-300 cursor-pointer hover:bg-black hover:bg-opacity-80"
          style={{ boxShadow: '0 4px 16px rgba(10,152,146,0.10)' }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.91 2.36 30.3 0 24 0 14.82 0 6.71 5.13 2.69 12.56l7.98 6.2C13.01 13.13 18.13 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.03l7.19 5.59C43.93 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M9.13 28.76c-1.09-3.22-1.09-6.7 0-9.92l-7.98-6.2C-1.06 17.09-1.06 30.91 1.15 37.36l7.98-6.2z"/><path fill="#EA4335" d="M24 46c6.3 0 11.59-2.09 15.46-5.7l-7.19-5.59c-2.01 1.35-4.59 2.15-8.27 2.15-5.87 0-10.99-3.63-13.33-8.86l-7.98 6.2C6.71 42.87 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}
