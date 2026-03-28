"use client"

import { useDashboardData } from "./hooks/useDashboardData";
import StatCard from "./components/StatCard";
import ChartBlock from "./components/ChartBlock";
import DataTable from "./components/DataTable";
import InsightPanel from "./components/InsightPanel";
import Loader from "./components/Loader";
import { useState } from "react";

export default function DashboardPage() {
  const dashboardQuery = useDashboardData();
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [course, setCourse] = useState("");
  const [phase, setPhase] = useState("both");

  if (dashboardQuery.isLoading) return <Loader />;
  if (dashboardQuery.isError) return <div className="text-red-500 p-4">Error loading dashboard: {dashboardQuery.error?.message}</div>;

  // Destructure unified contract from dashboardQuery.data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = dashboardQuery.data;
  console.log("Dashboard Data:", data); // <-- Added console log
  const overview = data?.overview || {};
  const faculty = Array.isArray(data?.faculty) ? data.faculty : [];
  const courses = Array.isArray(data?.courses) ? data.courses : [];
  const phases = Array.isArray(data?.phases) ? data.phases : [];
  const alerts = data?.alerts || {};
  const lowParticipation = Array.isArray(alerts.lowParticipation) ? alerts.lowParticipation : [];
  const totalStudents = overview.totalStudents ?? 0;
  const participatedStudents = overview.participatedStudents ?? 0;
  const participationRate = overview.participationRate !== undefined ? (overview.participationRate * 100).toFixed(1) : '0';
  const avgRating = overview.avgRating ?? '-';

  return (
    <div className="p-6 space-y-8 bg-linear-to-b from-(--brand) to-(--page)">
      {/* HEADER / FILTERS */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2 border-b border-(--brand-light)">
        <div>
          <h1 className="text-3xl font-bold text-(--brand-deep)">Feedback Analytics Dashboard</h1>
          <p className="text-sm text-(--muted)">Comprehensive feedback insights for admin</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="rounded-lg border px-3 py-2 text-sm" value={branch} onChange={e => setBranch(e.target.value)}>
            <option value="">Branch</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
          </select>
          <select className="rounded-lg border px-3 py-2 text-sm" value={semester} onChange={e => setSemester(e.target.value)}>
            <option value="">Semester</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="rounded-lg border px-3 py-2 text-sm" value={course} onChange={e => setCourse(e.target.value)}>
            <option value="">Course (optional)</option>
            {/* TODO: Populate with real course list */}
          </select>
          <select className="rounded-lg border px-3 py-2 text-sm" value={phase} onChange={e => setPhase(e.target.value)}>
            <option value="both">Both Phases</option>
            <option value="phase1">Phase 1</option>
            <option value="phase2">Phase 2</option>
          </select>
        </div>
      </div>

      {/* OVERVIEW CARDS (KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={totalStudents} />
        <StatCard title="Participation" value={`${participatedStudents} (${participationRate}%)`} />
        <StatCard title="Feedback Submitted" value={faculty.reduce((sum: number, f: { count?: number }) => sum + (f.count ?? 0), 0)} />
        <StatCard title="Avg Rating" value={avgRating} />
      </div>

      {/* GRID: Faculty Chart | Course Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2 text-(--brand)">Faculty Performance</h2>
          <ChartBlock type="bar" data={faculty} />
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2 text-(--brand)">Course Analysis</h2>
          <ChartBlock type="bar" data={courses} />
        </div>
      </div>

      {/* GRID: Student Analytics | Phase Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2 text-(--brand)">Student Analytics</h2>
          <div className="text-gray-700 text-center">
            Active: {data?.students?.active ?? 0} | Inactive: {data?.students?.inactive ?? 0}
          </div>
          {/* TODO: Add pie/bar charts for participation, submission distribution, branch-wise */}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2 text-(--brand)">Phase Comparison</h2>
          <ChartBlock type="line" data={phases} />
        </div>
      </div>

      {/* ALERTS / INSIGHTS PANEL */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-2 text-red-600">   & Insights</h2>
        {lowParticipation.length > 0 ? (
          <div className="text-orange-600">
            Low Participation: {lowParticipation.map((item: { participationRate: number }, idx: number) => (
              <span key={idx}>Rate: {(item.participationRate * 100).toFixed(1)}%</span>
            ))}
          </div>
        ) : (
          <div className="text-green-600">No low participation alerts</div>
        )}
        <InsightPanel data={alerts} />
      </div>

      {/* DEEP DIVE TABLE (Optional) */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-2 text-(--brand)">Deep Dive Table</h2>
        <DataTable title="Detailed Feedback" data={faculty} />
      </div>
    </div>
  );
}
