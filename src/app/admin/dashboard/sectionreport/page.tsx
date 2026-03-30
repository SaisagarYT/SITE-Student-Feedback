"use client";
import SectionReport from "../../../../components/admin/SectionReport";

export default function SectionReportPage() {
  // Example data, replace with real data as needed
  const rows = [
    { sNo: 1, facultyName: "Dr. A. Kumar", course: "CS101", overallPercent: 85, category: "A", },
    { sNo: 2, facultyName: "Ms. B. Singh", course: "CS102", overallPercent: 78, category: "B", },
    // ...more rows
  ];
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <SectionReport
        academicYear="25-26"
        program="B.Tech"
        department="CSE"
        phase="I"
        year="III"
        semester="ODD"
        section="A"
        rows={rows}
      />
    </div>
  );
}
