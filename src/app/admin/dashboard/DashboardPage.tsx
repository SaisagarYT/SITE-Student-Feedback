"use client"
import { useDashboardData } from "./hooks/useDashboardData";
import StatCard from "./components/StatCard";
import ChartBlock from "./components/ChartBlock";
import DataTable from "./components/DataTable";
import InsightPanel from "./components/InsightPanel";
import Loader from "./components/Loader";

export default function DashboardPage() {
  const { stats, rating, trends, faculty, courses, insights } = useDashboardData();

  if (stats.isLoading) return <Loader />;

  return (
    <div className="p-6 space-y-8">
      {/* STATS */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Students" value={stats.data?.data.totalStudents} />
        <StatCard title="Feedback" value={stats.data?.data.totalFeedback} />
        <StatCard title="Completion %" value={stats.data?.data.completionRate} />
        <StatCard title="Avg Rating" value={stats.data?.data.avgRating} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-2 gap-6">
        <ChartBlock type="line" data={trends.data?.data} />
        <ChartBlock type="bar" data={rating.data?.data} />
      </div>

      {/* TABLES */}
      <div className="grid grid-cols-2 gap-6">
        <DataTable title="Faculty Performance" data={faculty.data?.data} />
        <DataTable title="Course Analytics" data={courses.data?.data} />
      </div>

      {/* INSIGHTS */}
      <InsightPanel data={insights.data?.data} />
    </div>
  );
}
