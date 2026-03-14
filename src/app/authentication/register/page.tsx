
"use client";
console.log("RegisterPage component loaded");

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authenticateStudent } from "@/api";

type AuthResponse = {
  registered?: boolean;
  student?: { name?: string };
  message?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idToken = searchParams.get("idToken");

  const [form, setForm] = useState({
    studentName: "",
    department: "",
    year: "",
    section: "",
    studentId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    console.log("Field changed:", e.target.name, e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    console.log("Submitting registration with form:", form);
    try {
      if (!idToken) throw new Error("Missing ID token");
      const data: AuthResponse = (await authenticateStudent(idToken, form)) || {};
      console.log("Backend response:", data);
      if (data.registered) {
        // Instead of alert, show a message on the page
        setSuccess(true);
        // Optionally redirect after a delay
        setTimeout(() => router.replace("/authentication"), 2000);
      } else {
        setError(data.message || "Registration failed.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Unknown error");
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  const [success, setSuccess] = useState(false);
  {console.log("Rendering registration form")}

  return (
    <div>
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold mb-4">Complete Registration</h2>
        <input name="studentName" placeholder="Name" value={form.studentName} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="department" placeholder="Department" value={form.department} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="year" placeholder="Year" value={form.year} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="section" placeholder="Section" value={form.section} onChange={handleChange} required className="w-full border p-2 rounded" />
        <input name="studentId" placeholder="Student ID" value={form.studentId} onChange={handleChange} required className="w-full border p-2 rounded" />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">Registration successful! Redirecting...</div>}
        <button type="submit" disabled={loading || success} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      </div>
    </div>
  );
}
