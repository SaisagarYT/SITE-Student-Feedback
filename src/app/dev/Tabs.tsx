"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Student", href: "/dev/student" },
  { label: "Faculty", href: "/dev/faculty" },
  { label: "Course", href: "/dev/course" },
];

export default function Tabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-4">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2 rounded-md font-medium transition-colors duration-150 ${
            pathname === tab.href ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800 hover:bg-blue-100"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
