"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminRootProtected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminEmail = typeof window !== "undefined" ? localStorage.getItem("adminEmail") : null;
    if (!adminEmail) {
      router.replace("/admin/login");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-[--page]">
        <span className="text-xl font-semibold text-(--muted)">Checking admin authentication...</span>
      </div>
    );
  }
  return <>{children}</>;
}
