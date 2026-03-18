import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from "@/firebase";
// import { logoutStudent } from "@/api";

type FeedbackHeaderProps = {
  activePhase: "phase1" | "phase2";
};



function ProfileCard({ user, profileImage }: { user: User | null; profileImage: string | null }) {
  if (!user) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-1 ml-2 rounded-2xl bg-(--surface-soft) border border-(--line) text-xs text-(--ink) shadow-sm min-w-[160px]">
      <Image
        src={profileImage || "/profile-avatar.svg"}
        alt="Profile"
        width={36}
        height={36}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-(--line)"
        priority
      />
      <div className="flex flex-col items-start min-w-0">
        <span className="font-semibold truncate max-w-[110px] text-(--ink)">{user.displayName || "No Name"}</span>
        <span className="truncate max-w-[110px] text-(--muted)">{user.email || "No Email"}</span>
      </div>
    </div>
  );
}

const FeedbackHeader = ({ activePhase }: FeedbackHeaderProps) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileImage(localStorage.getItem("profileImage"));
      const auth = getAuth(app);
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        // If user just logged in and has a photoURL, update localStorage
        if (firebaseUser && firebaseUser.photoURL) {
          localStorage.setItem("profileImage", firebaseUser.photoURL);
          setProfileImage(firebaseUser.photoURL);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  return (
    <header data-reveal>
      <div className="border-b border-(--line) bg-(--surface) text-(--ink)">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/sasi_logo.png"
              alt="SASI Logo"
              width={280}
              height={110}
              quality={100}
              className="h-15 w-auto object-contain sm:h-18 md:h-18 lg:h-22"
              priority
            />

            <div className="hidden items-center gap-2 rounded-full border border-(--line) bg-(--surface-soft) px-3 py-2 text-sm text-(--muted) sm:inline-flex">
              <Icon icon="material-symbols:rocket-launch-outline" className="text-lg text-(--brand)" />
              {activePhase === "phase1" ? "Phase 1 active" : "Phase 2 active"}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">

            <ProfileCard user={user} profileImage={profileImage} />
            <button
              onClick={async () => {
                if (typeof window !== "undefined") {
                  // Remove all user-related data from localStorage
                  localStorage.removeItem("profileImage");
                  localStorage.removeItem("studentName");
                  // Remove the token cookie
                  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                  try {
                    const auth = getAuth(app);
                    await signOut(auth);
                  } catch (e) {
                    // ignore errors
                  }
                }
                window.location.href = "/";
              }}
              className="ml-2 rounded-full border border-red-500 bg-red-500 px-4 py-2 text-xs font-semibold text-white uppercase transition hover:bg-red-600 hover:border-red-600 sm:text-sm cursor-pointer"
              style={{ marginLeft: '8px' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default FeedbackHeader;
