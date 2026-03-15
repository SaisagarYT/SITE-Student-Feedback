"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardProtected({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for admin email
    const adminEmail = typeof window !== "undefined" ? localStorage.getItem("adminEmail") : null;
    if (!adminEmail) {
      router.replace("/admin/login");
    }
  }, [router]);

  return <>{children}</>;
}
