
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
        // Set the token cookie for middleware authentication (1 hour expiry)
        document.cookie = `token=${idToken}; path=/; max-age=3600;`;
        // Send the ID token to the backend for authentication
        const data: AuthResponse = (await authenticateStudent(idToken)) || {};
        console.log("Backend response from authenticateStudent:", data);
        if (data.registered) {
          // Student is registered, update profile image and redirect to homepage
          if (user.photoURL) {
            localStorage.setItem("profileImage", user.photoURL);
          }
          router.replace("/feedback");
        } else {
          // Student not registered, redirect to registration page with idToken
          router.replace(`/authentication/register?idToken=${encodeURIComponent(idToken)}`);
        }
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      Sign in with Google
    </button>
  );
}
