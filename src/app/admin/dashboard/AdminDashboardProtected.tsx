"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardProtected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("https://feedback-mlxcleit7q-as.a.run.app/api/admin/report?minimal=1", {
          credentials: "include"
        });
        if (res.status === 401 || res.status === 403) {
          setError("Unauthorized");
          router.replace("/admin/login");
        } else {
          setLoading(false);
        }
      } catch (e) {
        setError("Network error");
        router.replace("/admin/login");
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-(--brand)"></div>
      </div>
    );
  }
  if (error) {
    return null;
  }
  return <>{children}</>;
}
