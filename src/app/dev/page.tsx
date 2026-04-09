// "use client";
// import React, { useState } from "react";
// import DashboardStats from "./dashboard/DashboardStats";
// import DashboardTable from "./dashboard/DashboardTable";

// // Dummy data for demonstration; replace with Firestore fetch in production
// const stats = [
//   { label: "Students", count: 1200 },
//   { label: "Faculties", count: 80 },
//   { label: "Courses", count: 200 },
// ];

// const students = [
//   { studentId: "S001", name: "Alice", branchId: "ECE", semester: "II-II", section: "A" },
//   { studentId: "S002", name: "Bob", branchId: "CSE", semester: "III-I", section: "B" },
// ];
// const faculties = [
//   { facultyId: "F001", facultyName: "Dr. Smith", branchId: "ECE", subjectId: "SUB01", section: "A" },
//   { facultyId: "F002", facultyName: "Dr. Jones", branchId: "CSE", subjectId: "SUB02", section: "B" },
// ];
// const courses = [
//   { courseId: "C001", courseName: "Maths", branchId: "ECE", facultyId: "F001", semester: "II-II", section: "A" },
//   { courseId: "C002", courseName: "Physics", branchId: "CSE", facultyId: "F002", semester: "III-I", section: "B" },
// ];

// const tableConfig = [
//   {
//     label: "Students",
//     columns: ["studentId", "name", "branchId", "semester", "section"],
//     data: students,
//     filterKeys: ["branchId", "semester", "section"],
//   },
//   {
//     label: "Faculties",
//     columns: ["facultyId", "facultyName", "branchId", "subjectId", "section"],
//     data: faculties,
//     filterKeys: ["branchId", "subjectId", "section"],
//   },
//   {
//     label: "Courses",
//     columns: ["courseId", "courseName", "branchId", "facultyId", "semester", "section"],
//     data: courses,
//     filterKeys: ["branchId", "facultyId", "semester", "section"],
//   },
// ];

// export default function DevHome() {
//   const [tab, setTab] = useState(0);
//   return (
//     <div className="p-6">
//       <DashboardStats stats={stats} />
//       <div className="flex gap-4 mb-4">
//         {tableConfig.map((t, i) => (
//           <button
//             key={t.label}
//             className={`px-4 py-2 rounded font-medium ${tab === i ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
//             onClick={() => setTab(i)}
//           >
//             {t.label}
//           </button>
//         ))}
//       </div>
//       <DashboardTable
//         columns={tableConfig[tab].columns}
//         data={tableConfig[tab].data}
//         filterKeys={tableConfig[tab].filterKeys}
//       />
//     </div>
//   );
// }

import React from 'react'

const page = () => {
  return (
    <div style={{width:"100vw",height:"100vh", justifyContent:"center",alignItems:"center"}} className='w-screen h-screen justify-center align-center'>
      404
    </div>
  )
}

export default page

