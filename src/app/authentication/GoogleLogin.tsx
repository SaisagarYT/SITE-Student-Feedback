"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";

import { app } from "@/firebase";
import { loginStudent } from "@/api";
import { ToastContainer } from "@/components/Toast";
import type { ToastType } from "@/components/Toast";

type AuthResponse = {
  error?: string;
  loggedIn?: boolean;
  user?: { name?: string };
  message?: string;
};

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

const provider = new GoogleAuthProvider();

export default function GoogleLogin() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
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
        console.log("JWT idToken:", idToken);
        document.cookie = `token=${idToken}; path=/; max-age=3600;`;
        const data: AuthResponse = (await loginStudent(idToken)) || {};
        console.log("Backend response from loginStudent:", data);
        if (data.error && data.error.includes("sasi.ac.in")) {
          showToast("Only SASI College emails are allowed. Please use your sasi.ac.in email.", "error");
          return;
        }
        if (user.photoURL) {
          localStorage.setItem("profileImage", user.photoURL);
        }
        if (user.displayName) {
          localStorage.setItem("studentName", user.displayName);
        }
        showToast("Login successful! Redirecting...", "success");
        setTimeout(() => router.replace("/feedback"), 1500);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      showToast("Sign-in failed. Please try again.", "error");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden" style={{ backgroundColor: "#edf4f2" }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-8 py-6 z-20" style={{
        background: "#0a9892",
        borderBottom: "2px solid rgba(10, 152, 146, 0.3)"
      }}>
        <div className="flex items-center gap-4">
          <img src="/sasi_complete.png" alt="SASI Logo" className="h-16 w-auto" style={{ maxHeight: 64 }} />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-1 h-8" style={{ background: "rgba(255, 255, 255, 0.3)" }}></div>
          <span className="text-2xl font-bold tracking-tight text-white">
            SASI Student Feedback Portal
          </span>
        </div>
      </nav>

      {/* Animated background gradient decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-[rgba(10,152,146,0.1)] to-transparent" />
        <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-[rgba(10,152,146,0.08)] blur-3xl" />
        <div className="absolute -right-40 bottom-1/4 h-80 w-80 rounded-full bg-[rgba(239,42,113,0.06)] blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Header Text */}
          <div className="text-center mb-12">
            <p className="text-2xl font-bold" style={{ color: "#13243d" }}>
              Sign in to submit your feedback
            </p>
          </div>

          {/* Login Card */}
          <div
            className="rounded-2xl shadow-lg p-8 backdrop-blur-sm"
            style={{
              background: "#0a9892",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 20px 50px rgba(10, 152, 146, 0.2)",
            }}
          >
            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300"
              style={{
                background: "#ffffff",
                color: "#13243d",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#000000";
                (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.3)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
                (e.currentTarget as HTMLButtonElement).style.color = "#13243d";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              <svg width="24" height="24" viewBox="0 0 48 48">
                <g>
                  <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.91 2.36 30.3 0 24 0 14.82 0 6.71 5.13 2.69 12.56l7.98 6.2C13.01 13.13 18.13 9.5 24 9.5z" />
                  <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.03l7.19 5.59C43.93 37.13 46.1 31.3 46.1 24.55z" />
                  <path fill="#FBBC05" d="M9.13 28.76c-1.09-3.22-1.09-6.7 0-9.92l-7.98-6.2C-1.06 17.09-1.06 30.91 1.15 37.36l7.98-6.2z" />
                  <path fill="#EA4335" d="M24 46c6.3 0 11.59-2.09 15.46-5.7l-7.19-5.59c-2.01 1.35-4.59 2.15-8.27 2.15-5.87 0-10.99-3.63-13.33-8.86l-7.98 6.2C6.71 42.87 14.82 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </g>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Info Text */}
            <p className="text-center text-sm mt-6" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Use your SASI College email account to sign in securely
            </p>
          </div>

          {/* Footer Text */}
          <p className="text-center text-xs mt-8" style={{ color: "#a8cbc5" }}>
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}
