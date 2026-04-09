import React from "react";
import StatCard from "../components/StatCard";

export default function DashboardStats({ stats }: { stats: { label: string; count: number }[] }) {
  return (
    <div className="flex gap-6 mb-8">
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} count={stat.count} />
      ))}
    </div>
  );
} 
