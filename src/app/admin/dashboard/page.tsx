"use client"

import { useState, useEffect } from "react";
import { getFacultyPerformance, getFacultyDetail } from "@/api";
import { getAdminDashboardOverview } from "@/api";
import { getAuth, signOut } from "firebase/auth";
import { app } from "@/firebase";
// Logout logic reused from AdminNavbar
async function handleAdminLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    try {
      const auth = getAuth(app);
      const idToken = (await auth.currentUser?.getIdToken?.()) || null;
      if (idToken) {
        await import("@/api").then(({ logoutAdmin }) => logoutAdmin(idToken));
      }
      await signOut(auth);
    } catch {}
    window.location.href = "/admin/login";
  }
}
import AdminDashboardProtected from "./AdminDashboardProtected";
import { Icon } from "@iconify/react";

const TABS = [
  { key: "overview", label: "Dashboard Overview", icon: "mdi:view-dashboard-outline" },
  { key: "faculty", label: "Faculty Performance", icon: "mdi:account-tie-outline" },
  { key: "course", label: "Course Feedback", icon: "mdi:book-open-variant" },
  { key: "students", label: "Student Participation", icon: "mdi:account-group-outline" },
  { key: "branch", label: "Branch Analytics", icon: "mdi:domain" },
  { key: "reports", label: "Reports", icon: "mdi:file-chart-outline" },
];



type BranchParticipation = {
  branch: string;
  participation: number;
  total: number;
  participated: number;
};

type FeedbackByCourse = {
  courseId: string;
  courseName: string;
  feedbackCount: number;
};

type RatingDistribution = {
  rating: number;
  count: number;
  percent: number;
};

type DashboardOverview = {
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  totalFeedback: number;
  completionRate: number;
  avgRating: number;
  branchParticipation: BranchParticipation[];
  feedbackByCourse: FeedbackByCourse[];
  ratingDistribution?: RatingDistribution[];
};

function OverviewSection() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  function isDashboardOverview(obj: unknown): obj is DashboardOverview {
    if (typeof obj !== 'object' || obj === null) return false;
    const o = obj as Record<string, unknown>;
    return (
      typeof o.totalStudents === 'number' &&
      typeof o.totalFaculty === 'number' &&
      typeof o.totalCourses === 'number' &&
      typeof o.totalFeedback === 'number' &&
      typeof o.completionRate === 'number' &&
      typeof o.avgRating === 'number'
    );
  }

  useEffect(() => {
    getAdminDashboardOverview()
      .then((res) => {
        console.log("Dashboard Overview Data:", res);
        if (isDashboardOverview(res)) {
          setData(res);
        } else {
          setError("Invalid dashboard data format");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard data");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-60">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-(--brand)"></div>
      </div>
    );
  }
  if (error || !data) {
    return <div className="text-center text-red-500 py-8">{error || "No data available"}</div>;
  }

  // Destructure backend fields
  const {
    totalStudents = 0,
    totalFaculty = 0,
    totalCourses = 0,
    totalFeedback = 0,
    completionRate = 0,
    avgRating = 0,
    branchParticipation = [],
    feedbackByCourse = [],
    ratingDistribution = []
  } = data || {};

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-8 w-full">
      {/* Metric Cards - Responsive Full Width */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full">
        <div className="rounded-2xl bg-white/90 border border-(--line) p-5 flex flex-col items-center shadow w-full">
          <Icon icon="mdi:account-group-outline" className="text-3xl text-(--brand) mb-1" />
          <div className="text-xs text-(--muted) mb-1">Students</div>
          <div className="text-2xl font-bold">{totalStudents}</div>
        </div>
        <div className="rounded-2xl bg-white/90 border border-(--line) p-5 flex flex-col items-center shadow w-full">
          <Icon icon="mdi:account-tie-outline" className="text-3xl text-(--brand) mb-1" />
          <div className="text-xs text-(--muted) mb-1">Faculty</div>
          <div className="text-2xl font-bold">{totalFaculty}</div>
        </div>
        <div className="rounded-2xl bg-white/90 border border-(--line) p-5 flex flex-col items-center shadow w-full">
          <Icon icon="mdi:book-open-variant" className="text-3xl text-(--brand) mb-1" />
          <div className="text-xs text-(--muted) mb-1">Courses</div>
          <div className="text-2xl font-bold">{totalCourses}</div>
        </div>
        <div className="rounded-2xl bg-white/90 border border-(--line) p-5 flex flex-col items-center shadow w-full">
          <Icon icon="mdi:clipboard-check-outline" className="text-3xl text-(--brand) mb-1" />
          <div className="text-xs text-(--muted) mb-1">Feedback Submitted</div>
          <div className="text-2xl font-bold">{totalFeedback}</div>
        </div>
        <div className="rounded-2xl bg-white/90 border border-(--line) p-5 flex flex-col items-center shadow w-full">
          <Icon icon="mdi:progress-check" className="text-3xl text-(--brand) mb-1" />
          <div className="text-xs text-(--muted) mb-1">Completion Rate</div>
          <div className="text-2xl font-bold">{completionRate}%</div>
        </div>
      </div>
      {/* Charts Section - Branch Feedback Participation full width, others below */}
      <div className="flex flex-col gap-6 mt-8 w-full">
        {/* Branch Feedback Participation (Bar Chart) - full width, dynamic from backend */}
        <div className="rounded-2xl bg-white p-4 shadow flex flex-col w-full">
          <div className="font-semibold mb-2 flex items-center gap-2"><Icon icon="mdi:chart-bar" className="text-lg text-(--brand)" />Branch Feedback Participation</div>
          <div className="flex-1 flex flex-col gap-2 justify-end h-44">
            {branchParticipation.length === 0 ? (
              <div className="text-center text-(--muted)">No branch data available</div>
            ) : (
              branchParticipation.map((b) => (
                <div key={b.branch} className="flex items-center gap-2">
                  <div className="h-4 rounded bg-(--brand)" style={{width:`${b.participation*2}px`, minWidth:'16px'}}></div>
                  <span className="text-sm text-(--ink) font-medium w-16">{b.branch}</span>
                  <span className="text-xs text-(--muted)">{b.participation}%</span>
                  <span className="text-xs text-(--muted)">( {b.participated} / {b.total} )</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Feedback Submissions by Course (Bar Chart) - improved layout and accessibility */}
          <div className="rounded-2xl bg-white gap-5 p-4 shadow flex flex-col w-full">
            <div className="font-semibold mb-2 flex items-center gap-2">
              <Icon icon="mdi:chart-bar" className="text-lg text-(--brand)" />Feedback Submissions by Course
            </div>
            <div className="flex flex-col gap-4">
              {feedbackByCourse.length === 0 ? (
                <div className="text-center text-(--muted)">No course feedback data available</div>
              ) : (
                feedbackByCourse.map((c) => (
                  <div key={c.courseId} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-(--muted) w-14">{c.courseId}</span>
                    <div className="flex-1 flex items-center">
                      <div
                        className="h-6 rounded bg-(--brand) flex items-center justify-end pr-2 text-white font-semibold transition-all duration-300"
                        style={{width: `${Math.max(c.feedbackCount * 28, 24)}px`, minWidth: '24px'}}
                        aria-label={`Feedbacks: ${c.feedbackCount}`}
                      >
                        {c.feedbackCount > 0 && <span className="text-xs">{c.feedbackCount}</span>}
                      </div>
                    </div>
                    <span className="text-sm text-(--ink) font-medium w-40 truncate" title={c.courseName}>{c.courseName}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Rating Distribution (Pie Chart) - dynamic */}
          <div className="rounded-2xl bg-white p-4 shadow flex flex-col items-center w-full">
            <div className="font-semibold mb-2 flex items-center gap-2"><Icon icon="mdi:chart-pie" className="text-lg text-(--brand)" />Rating Distribution</div>
            <div className="relative w-32 h-32 my-2">
              {/* Dynamic conic-gradient for pie chart */}
              {(() => {
                // Pie chart colors for 5-1
                const colors = ["#0a9892", "#f7b731", "#4fc3f7", "#ef2a71", "#bdbdbd"];
                // Compute stops without mutating 'last' after render
                const stopsArr: string[] = [];
                let acc = 0;
                (ratingDistribution as RatingDistribution[]).forEach((r: RatingDistribution, i: number) => {
                  const start = acc;
                  const end = acc + r.percent;
                  stopsArr.push(`${colors[i]} ${start}% ${end}%`);
                  acc = end;
                });
                const stops = stopsArr.join(", ");
                return (
                  <div className="w-full h-full rounded-full" style={{background: `conic-gradient(${stops})`}}></div>
                );
              })()}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl font-bold">{avgRating}</div>
                <div className="text-xs text-(--muted)">Avg. Rating</div>
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-2 text-xs w-full">
              {(ratingDistribution as RatingDistribution[]).slice().reverse().map((r: RatingDistribution) => {
                // 5 to 1, match color order
                const colors = ["#0a9892", "#f7b731", "#4fc3f7", "#ef2a71", "#bdbdbd"];
                return (
                  <span key={r.rating} className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{background: colors[5 - r.rating]}}></span>
                    Rating {r.rating} <span className="ml-auto font-semibold">{r.percent}%</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 text-sm text-(--muted)">All data and charts are static for demo purposes.</div>
    </div>
  );
}


function FacultyPerformanceSection() {
  // Dynamic data
  type FacultyPerf = { facultyId: string; facultyName: string; courseName: string; responses: number; avgRating: number };
  type FacultyDetail = {
    totalResponses: number;
    overallRating: number;
    phase1Average: number;
    phase2Average: number;
    questionAverages: Record<string, number>;
  };
  const [facultyData, setFacultyData] = useState<FacultyPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<FacultyPerf | null>(null);
  const [facultyDetail, setFacultyDetail] = useState<FacultyDetail | null>(null);

  useEffect(() => {
    getFacultyPerformance()
      .then((data) => {
        console.log("Faculty Performance Data Response:", data);
        setFacultyData(data);
      })
      .catch(() => setError("Failed to load faculty performance"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let ignore = false;
    if (selected) {
      getFacultyDetail(selected.facultyId)
        .then((res) => { if (!ignore) setFacultyDetail(res as FacultyDetail); })
        .catch(() => { if (!ignore) setFacultyDetail(null); });
    } else {
      // Avoid direct setState in effect body
      setTimeout(() => setFacultyDetail(null), 0);
    }
    return () => { ignore = true; };
  }, [selected]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-2"><Icon icon="mdi:account-tie-outline" className="text-2xl text-(--brand)" />Faculty Performance</h2>
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-(--line) bg-white/90 shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-(--surface-soft) text-(--muted)">
              <th className="p-3 font-semibold text-left">Faculty ID</th>
              <th className="p-3 font-semibold text-left">Faculty Name</th>
              <th className="p-3 font-semibold text-left">Course</th>
              <th className="p-3 font-semibold text-left">Responses</th>
              <th className="p-3 font-semibold text-left">Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            {facultyData.map((f) => (
              <tr key={f.facultyId} className="hover:bg-(--brand)/10 cursor-pointer transition" onClick={() => setSelected(f)}>
                <td className="p-3 font-mono">{f.facultyId}</td>
                <td className="p-3">{f.facultyName}</td>
                <td className="p-3">{f.courseName}</td>
                <td className="p-3">{f.responses}</td>
                <td className="p-3 font-semibold flex items-center gap-1"><Icon icon="mdi:star" className="text-yellow-500" />{f.avgRating.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-(--muted)">Click a faculty row for details.</div>

      {/* Faculty Detail Modal */}
      {facultyDetail && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative">
            <button className="absolute top-3 right-3 text-(--muted) hover:text-red-500 text-xl" onClick={() => setSelected(null)}><Icon icon="mdi:close" /></button>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Icon icon="mdi:account-tie-outline" className="text-xl text-(--brand)" />Faculty Detail</h3>
            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-(--muted)">Name:</span> <span className="font-semibold">{selected.facultyName}</span></div>
              <div><span className="text-(--muted)">Course:</span> <span className="font-semibold">{selected.courseName}</span></div>
              <div><span className="text-(--muted)">Responses:</span> <span className="font-semibold">{facultyDetail.totalResponses}</span></div>
              <div><span className="text-(--muted)">Avg. Rating:</span> <span className="font-semibold flex items-center gap-1"><Icon icon="mdi:star" className="text-yellow-500" />{facultyDetail.overallRating}</span></div>
            </div>
            {/* Phase Comparison Chart (Bar, dynamic) */}
            <div>
              <div className="font-semibold mb-1 flex items-center gap-2"><Icon icon="mdi:chart-bar" className="text-lg text-(--brand)" />Phase Comparison</div>
              <div className="flex gap-4 items-end h-24">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-16 bg-(--brand) rounded-t-lg flex items-end justify-center" style={{height:`${facultyDetail.phase1Average*20}px`}}></div>
                  <span className="text-xs mt-1">Phase 1</span>
                  <span className="text-xs text-(--muted)">{facultyDetail.phase1Average}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-16 bg-green-400 rounded-t-lg flex items-end justify-center" style={{height:`${facultyDetail.phase2Average*20}px`}}></div>
                  <span className="text-xs mt-1">Phase 2</span>
                  <span className="text-xs text-(--muted)">{facultyDetail.phase2Average}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple SVG Radar Chart for static demo
type RadarDatum = { label: string; val: number };
function RadarChart({ data }: { data: RadarDatum[] }) {
  // 5 points, static radius
  const cx = 80, cy = 80, r = 60;
  const angles = data.map((_, i) => (2 * Math.PI * i) / data.length);
  const points = data.map((d, i) => [
    cx + r * (d.val / 5) * Math.sin(angles[i]),
    cy - r * (d.val / 5) * Math.cos(angles[i])
  ]);
  const polygon = points.map((p) => p.join(",")).join(" ");
  return (
    <svg width="160" height="160" className="mb-2">
      <circle cx={cx} cy={cy} r={r} fill="#f3f4f6" />
      <polygon points={polygon} fill="#0a9892bb" stroke="#0a9892" strokeWidth="2" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#0a9892" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={cx + (r + 18) * Math.sin(angles[i])} y={cy - (r + 18) * Math.cos(angles[i])} textAnchor="middle" fontSize="10" fill="#333">{d.label}</text>
      ))}
    </svg>
  );
}

function CourseFeedbackSection() {
  // Static data
  type Course = { id: string; name: string; faculty: string; facultyId: string; feedbackCount: number; avg: number };
  const courseData: Course[] = [
    { id: "IT601", name: "ML", faculty: "Dr Ramesh", facultyId: "FAC101", feedbackCount: 120, avg: 4.21 },
    { id: "IT602", name: "CN", faculty: "Dr Anitha", facultyId: "FAC102", feedbackCount: 118, avg: 4.03 },
    { id: "IT603", name: "Cloud", faculty: "Mr Prakash", facultyId: "FAC103", feedbackCount: 115, avg: 3.98 },
  ];
  const branches = ["All", "CSE", "IT", "ECE"];
  const semesters = ["All", "Semester 1", "Semester 2", "Semester 3", "Semester 4"];
  const faculties = ["All", "Dr Ramesh", "Dr Anitha", "Mr Prakash"];
  const [branch, setBranch] = useState<string>("All");
  const [semester, setSemester] = useState<string>("All");
  const [faculty, setFaculty] = useState<string>("All");
  const [selected, setSelected] = useState<Course | null>(null);

  // Course detail static data
  const courseDetail = selected
    ? {
        name: selected.name,
        faculty: selected.faculty,
        branch: branch === "All" ? "CSE" : branch,
        semester: semester === "All" ? "Semester 2" : semester,
        responses: selected.feedbackCount,
        avg: selected.avg,
        questions: [4.1, 4.3, 3.9, 4.0, 4.2],
        phase: [4.05, 4.18],
        ratingDist: [42, 38, 15, 3, 2],
      }
    : null;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-2"><Icon icon="mdi:book-open-variant" className="text-2xl text-(--brand)" />Course Feedback</h2>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:domain" className="text-lg text-(--brand)" />
          <select value={branch} onChange={e => setBranch(e.target.value)} className="rounded-lg border border-(--line) px-2 py-1 text-sm bg-white">
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Icon icon="mdi:calendar-range" className="text-lg text-(--brand)" />
          <select value={semester} onChange={e => setSemester(e.target.value)} className="rounded-lg border border-(--line) px-2 py-1 text-sm bg-white">
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Icon icon="mdi:account-tie-outline" className="text-lg text-(--brand)" />
          <select value={faculty} onChange={e => setFaculty(e.target.value)} className="rounded-lg border border-(--line) px-2 py-1 text-sm bg-white">
            {faculties.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-(--line) bg-white/90 shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-(--surface-soft) text-(--muted)">
              <th className="p-3 font-semibold text-left">Course ID</th>
              <th className="p-3 font-semibold text-left">Course Name</th>
              <th className="p-3 font-semibold text-left">Faculty</th>
              <th className="p-3 font-semibold text-left">Feedback Count</th>
              <th className="p-3 font-semibold text-left">Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            {courseData.map(c => (
              <tr key={c.id} className="hover:bg-(--brand)/10 cursor-pointer transition" onClick={() => setSelected(c)}>
                <td className="p-3 font-mono">{c.id}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3 flex items-center gap-2"><Icon icon="mdi:account-tie-outline" className="text-lg text-(--brand)" />{c.faculty}</td>
                <td className="p-3">{c.feedbackCount}</td>
                <td className="p-3 font-semibold flex items-center gap-1"><Icon icon="mdi:star" className="text-yellow-500" />{c.avg.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-(--muted)">All data is static for demo purposes. Click a course row for details.</div>

      {/* Course Detail Modal */}
      {courseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative">
            <button className="absolute top-3 right-3 text-(--muted) hover:text-red-500 text-xl" onClick={() => setSelected(null)}><Icon icon="mdi:close" /></button>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Icon icon="mdi:book-open-variant" className="text-xl text-(--brand)" />Course Detail</h3>
            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-(--muted)">Course Name:</span> <span className="font-semibold">{courseDetail.name}</span></div>
              <div><span className="text-(--muted)">Faculty:</span> <span className="font-semibold">{courseDetail.faculty}</span></div>
              <div><span className="text-(--muted)">Branch:</span> <span className="font-semibold">{courseDetail.branch}</span></div>
              <div><span className="text-(--muted)">Semester:</span> <span className="font-semibold">{courseDetail.semester}</span></div>
              <div><span className="text-(--muted)">Total Responses:</span> <span className="font-semibold">{courseDetail.responses}</span></div>
              <div><span className="text-(--muted)">Avg. Rating:</span> <span className="font-semibold flex items-center gap-1"><Icon icon="mdi:star" className="text-yellow-500" />{courseDetail.avg}</span></div>
            </div>
            {/* Question Averages */}
            <div className="mb-4">
              <div className="font-semibold mb-1 flex items-center gap-2"><Icon icon="mdi:chart-bar" className="text-lg text-(--brand)" />Question Averages</div>
              <div className="flex gap-2">
                {courseDetail.questions.map((q, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-xs text-(--muted)">Q{i+1}</span>
                    <span className="font-semibold text-lg">{q}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Question-wise Ratings Chart (Bar) */}
            <div className="mb-4">
              <div className="font-semibold mb-1 flex items-center gap-2"><Icon icon="mdi:chart-bar" className="text-lg text-(--brand)" />Question-wise Ratings</div>
              <div className="flex gap-2 items-end h-24">
                {courseDetail.questions.map((q, i) => (
                  <div key={i} className="w-8 bg-(--brand) rounded-t-lg flex items-end justify-center" style={{height:`${q*20}px`}}>
                    <span className="text-xs text-white pb-1">{q}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Phase Comparison Chart (Bar) */}
            <div className="mb-4">
              <div className="font-semibold mb-1 flex items-center gap-2"><Icon icon="mdi:chart-bar" className="text-lg text-(--brand)" />Phase Comparison</div>
              <div className="flex gap-4 items-end h-24">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-16 bg-(--brand) rounded-t-lg flex items-end justify-center" style={{height:`${courseDetail.phase[0]*20}px`}}></div>
                  <span className="text-xs mt-1">Phase 1</span>
                  <span className="text-xs text-(--muted)">{courseDetail.phase[0]}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-16 bg-green-400 rounded-t-lg flex items-end justify-center" style={{height:`${courseDetail.phase[1]*20}px`}}></div>
                  <span className="text-xs mt-1">Phase 2</span>
                  <span className="text-xs text-(--muted)">{courseDetail.phase[1]}</span>
                </div>
              </div>
            </div>
            {/* Rating Distribution (Pie Chart) */}
            <div className="mb-2">
              <div className="font-semibold mb-1 flex items-center gap-2"><Icon icon="mdi:chart-pie" className="text-lg text-(--brand)" />Rating Distribution</div>
              <div className="relative w-32 h-32 my-2 mx-auto">
                <div className="w-full h-full rounded-full" style={{background:"conic-gradient(#0a9892 0% 42%, #f7b731 42% 80%, #4fc3f7 80% 95%, #ef2a71 95% 98%, #bdbdbd 98% 100%)"}}></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xl font-bold">{courseDetail.avg}</div>
                  <div className="text-xs text-(--muted)">Avg. Rating</div>
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-2 text-xs w-full">
                <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-(--brand)"></span>Rating 5 <span className="ml-auto font-semibold">{courseDetail.ratingDist[0]}%</span></span>
                <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f7b731]"></span>Rating 4 <span className="ml-auto font-semibold">{courseDetail.ratingDist[1]}%</span></span>
                <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#4fc3f7]"></span>Rating 3 <span className="ml-auto font-semibold">{courseDetail.ratingDist[2]}%</span></span>
                <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ef2a71]"></span>Rating 2 <span className="ml-auto font-semibold">{courseDetail.ratingDist[3]}%</span></span>
                <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#bdbdbd]"></span>Rating 1 <span className="ml-auto font-semibold">{courseDetail.ratingDist[4]}%</span></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentParticipationSection() {
  // Static data
  type Student = { id: string; name: string; branch: string; semester: string; submitted: number; total: number; status: "Completed" | "Partial" | "Pending" };
  const students: Student[] = [
    { id: "21ITR045", name: "Sai", branch: "IT", semester: "6", submitted: 5, total: 5, status: "Completed" },
    { id: "21ITR046", name: "Rahul", branch: "IT", semester: "6", submitted: 3, total: 5, status: "Partial" },
    { id: "21CSE021", name: "Priya", branch: "CSE", semester: "6", submitted: 0, total: 5, status: "Pending" },
  ];
  const branches = ["All", "CSE", "IT", "ECE"];
  const semesters = ["All", "6", "7", "8"];
  const sections = ["All", "A", "B", "C"];
  const statuses = ["All", "Completed", "Partial", "Pending"];
  const [branch, setBranch] = useState<string>("All");
  const [semester, setSemester] = useState<string>("All");
  const [section, setSection] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  // Metrics
  const completed = 240;
  const pending = 110;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-2"><Icon icon="mdi:account-group-outline" className="text-2xl text-(--brand)" />Student Participation</h2>
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="rounded-2xl bg-white/90 border border-(--line) p-5 flex flex-col items-center shadow">
          <Icon icon="mdi:check-circle-outline" className="text-3xl text-green-600 mb-1" />
          <div className="text-xs text-(--muted) mb-1">Students Completed</div>
          <div className="text-2xl font-bold">{completed}</div>
        </div>
        <div className="rounded-2xl bg-white/90 border border-(--line) p-5 flex flex-col items-center shadow">
          <Icon icon="mdi:alert-circle-outline" className="text-3xl text-red-500 mb-1" />
          <div className="text-xs text-(--muted) mb-1">Students Pending</div>
          <div className="text-2xl font-bold">{pending}</div>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:domain" className="text-lg text-(--brand)" />
          <select value={branch} onChange={e => setBranch(e.target.value)} className="rounded-lg border border-(--line) px-2 py-1 text-sm bg-white">
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Icon icon="mdi:calendar-range" className="text-lg text-(--brand)" />
          <select value={semester} onChange={e => setSemester(e.target.value)} className="rounded-lg border border-(--line) px-2 py-1 text-sm bg-white">
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Icon icon="mdi:alpha-s-circle-outline" className="text-lg text-(--brand)" />
          <select value={section} onChange={e => setSection(e.target.value)} className="rounded-lg border border-(--line) px-2 py-1 text-sm bg-white">
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Icon icon="mdi:filter-outline" className="text-lg text-(--brand)" />
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-(--line) px-2 py-1 text-sm bg-white">
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-(--line) bg-white/90 shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-(--surface-soft) text-(--muted)">
              <th className="p-3 font-semibold text-left">Student ID</th>
              <th className="p-3 font-semibold text-left">Name</th>
              <th className="p-3 font-semibold text-left">Branch</th>
              <th className="p-3 font-semibold text-left">Semester</th>
              <th className="p-3 font-semibold text-left">Submitted Courses</th>
              <th className="p-3 font-semibold text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map(stu => (
              <tr key={stu.id} className="hover:bg-(--brand)/10 cursor-pointer transition">
                <td className="p-3 font-mono">{stu.id}</td>
                <td className="p-3">{stu.name}</td>
                <td className="p-3">{stu.branch}</td>
                <td className="p-3">{stu.semester}</td>
                <td className="p-3">{stu.submitted} / {stu.total}</td>
                <td className="p-3">
                  {stu.status === "Completed" && <span className="inline-flex items-center gap-1 text-green-600 font-semibold"><Icon icon="mdi:check-circle-outline" />Completed</span>}
                  {stu.status === "Partial" && <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold"><Icon icon="mdi:alert-outline" />Partial</span>}
                  {stu.status === "Pending" && <span className="inline-flex items-center gap-1 text-red-500 font-semibold"><Icon icon="mdi:close-circle-outline" />Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-(--muted)">All data is static for demo purposes.</div>
    </div>
  );
}

function BranchAnalyticsSection() {
  // Static data
  type Branch = { name: string; courses: number; faculty: number; avg: number; participation: number };
  const branches: Branch[] = [
    { name: "IT", courses: 12, faculty: 18, avg: 4.12, participation: 82 },
    { name: "CSE", courses: 10, faculty: 15, avg: 4.08, participation: 79 },
    { name: "ECE", courses: 9, faculty: 12, avg: 3.96, participation: 74 },
  ];

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-2"><Icon icon="mdi:domain" className="text-2xl text-(--brand)" />Branch Analytics</h2>
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-(--line) bg-white/90 shadow mb-6">
        <table className="min-w-150 w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-(--surface-soft) text-(--muted)">
              <th className="p-3 font-semibold text-left">Branch</th>
              <th className="p-3 font-semibold text-left">Courses</th>
              <th className="p-3 font-semibold text-left">Faculty</th>
              <th className="p-3 font-semibold text-left">Avg Rating</th>
              <th className="p-3 font-semibold text-left">Participation</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(b => (
              <tr key={b.name} className="hover:bg-(--brand)/10 cursor-pointer transition">
                <td className="p-3 min-w-25 flex items-center gap-2"><Icon icon="mdi:domain" className="text-lg text-(--brand)" />{b.name}</td>
                <td className="p-3 min-w-20 text-center">{b.courses}</td>
                <td className="p-3 min-w-20 text-center">{b.faculty}</td>
                <td className="p-3 min-w-25 text-center font-semibold">{b.avg}</td>
                <td className="p-3 min-w-30 text-center">{b.participation}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Branch Average Rating Bar Chart */}
        <div className="bg-white rounded-2xl shadow p-4 flex flex-col">
          <div className="font-semibold mb-2 flex items-center gap-2"><Icon icon="mdi:star" className="text-lg text-yellow-500" />Branch Average Rating</div>
          <div className="flex flex-col gap-3 justify-end h-44">
            {branches.map(b => (
              <div key={b.name} className="flex items-center gap-2">
                <div className="h-6 rounded bg-yellow-400" style={{width:`${b.avg*60}px`, minWidth:'16px'}}></div>
                <span className="text-sm text-(--ink) font-medium w-16">{b.name}</span>
                <span className="text-xs text-(--muted)">{b.avg}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Feedback Participation Bar Chart */}
        <div className="bg-white rounded-2xl shadow p-4 flex flex-col">
          <div className="font-semibold mb-2 flex items-center gap-2"><Icon icon="mdi:chart-bar" className="text-lg text-(--brand)" />Feedback Participation</div>
          <div className="flex flex-col gap-3 justify-end h-44">
            {branches.map(b => (
              <div key={b.name} className="flex items-center gap-2">
                <div className="h-6 rounded bg-green-400" style={{width:`${b.participation*2}px`, minWidth:'16px'}}></div>
                <span className="text-sm text-(--ink) font-medium w-16">{b.name}</span>
                <span className="text-xs text-(--muted)">{b.participation}%</span>
              </div>
            ))}
          </div>
        </div>
        {/* Faculty Count Bar Chart */}
        <div className="bg-white rounded-2xl shadow p-4 flex flex-col">
          <div className="font-semibold mb-2 flex items-center gap-2"><Icon icon="mdi:account-tie-outline" className="text-lg text-(--brand)" />Faculty Count</div>
          <div className="flex flex-col gap-3 justify-end h-44">
            {branches.map(b => (
              <div key={b.name} className="flex items-center gap-2">
                <div className="h-6 rounded bg-blue-400" style={{width:`${b.faculty*10}px`, minWidth:'16px'}}></div>
                <span className="text-sm text-(--ink) font-medium w-16">{b.name}</span>
                <span className="text-xs text-(--muted)">{b.faculty}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 text-sm text-(--muted)">All data and charts are static for demo purposes.</div>
    </div>
  );
}

function ReportsSection() {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
        <Icon icon="mdi:file-chart" className="text-(--brand) text-2xl" /> Reports
      </h2>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="font-semibold mb-2 flex items-center gap-2">
              <Icon icon="mdi:clipboard-list-outline" className="text-(--brand)" /> Available Reports:
            </div>
            <ul className="list-disc ml-6 text-(--text-secondary)">
              <li className="flex items-center gap-2"><Icon icon="mdi:account-tie-outline" className="text-lg text-(--brand)" /> Faculty Performance Report</li>
              <li className="flex items-center gap-2"><Icon icon="mdi:book-open-page-variant-outline" className="text-lg text-(--brand)" /> Course Feedback Report</li>
              <li className="flex items-center gap-2"><Icon icon="mdi:domain" className="text-lg text-(--brand)" /> Branch Summary</li>
              <li className="flex items-center gap-2"><Icon icon="mdi:account-group-outline" className="text-lg text-(--brand)" /> Student Participation Report</li>
            </ul>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Export as:</span>
            <button className="bg-green-100 text-green-700 px-3 py-1 rounded flex items-center gap-1 hover:bg-green-200 transition">
              <Icon icon="mdi:file-excel" className="text-lg" /> Excel
            </button>
            <button className="bg-red-100 text-red-700 px-3 py-1 rounded flex items-center gap-1 hover:bg-red-200 transition">
              <Icon icon="mdi:file-pdf-box" className="text-lg" /> PDF
            </button>
            <button className="bg-blue-100 text-blue-700 px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-200 transition">
              <Icon icon="mdi:file-delimited" className="text-lg" /> CSV
            </button>
          </div>
        </div>
        {/* Example Report */}
        <div className="mt-6">
          <div className="font-semibold text-lg mb-2 flex items-center gap-2">
            <Icon icon="mdi:clipboard-text-outline" className="text-(--brand)" /> Example Report
          </div>
          <div className="mb-2 text-(--text-secondary)">
            Department: <span className="font-semibold text-(--brand)">IT</span> &nbsp; | &nbsp; Semester: <span className="font-semibold text-(--brand)">6</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-semibold mb-2 flex items-center gap-2">
              <Icon icon="mdi:trophy" className="text-yellow-500" /> Faculty Ranking
            </div>
            <ol className="list-decimal ml-6 space-y-1">
              <li className="flex items-center gap-2">
                <Icon icon="mdi:account-tie" className="text-lg text-(--brand)" /> Dr Ramesh Kumar
                <span className="ml-auto font-bold text-yellow-600 flex items-center gap-1">
                  <Icon icon="mdi:star" className="text-yellow-500" /> 4.23
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="mdi:account-tie" className="text-lg text-(--brand)" /> Dr Anitha Devi
                <span className="ml-auto font-bold text-yellow-600 flex items-center gap-1">
                  <Icon icon="mdi:star" className="text-yellow-500" /> 4.10
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="mdi:account-tie" className="text-lg text-(--brand)" /> Mr Prakash Rao
                <span className="ml-auto font-bold text-yellow-600 flex items-center gap-1">
                  <Icon icon="mdi:star" className="text-yellow-500" /> 3.95
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

const SECTION_COMPONENTS: Record<string, React.FC> = {
  overview: OverviewSection,
  faculty: FacultyPerformanceSection,
  course: CourseFeedbackSection,
  students: StudentParticipationSection,
  branch: BranchAnalyticsSection,
  reports: ReportsSection,
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const Section = SECTION_COMPONENTS[activeTab] || OverviewSection;
  // Demo admin info
  const adminName = "Dr. S. Admin";
  return (
    <AdminDashboardProtected>
      <div className="min-h-screen bg-(--page) text-(--ink)">
        {/* Top nav */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-b border-(--line) bg-white/90">
          <div className="flex items-center gap-3">
            <Icon icon="mdi:account-circle" className="text-3xl text-(--brand)" />
            <span className="font-semibold text-lg">{adminName}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="ml-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white flex items-center gap-2 hover:bg-red-600 transition"
              onClick={handleAdminLogout}
            >
              <Icon icon="mdi:logout" className="text-lg" />Logout
            </button>
          </div>
        </header>
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-72px)]">{/* 72px = header height */}
          {/* Sidebar navigation */}
          <nav className="w-full md:w-64 bg-white/90 border-r border-(--line) p-4 flex md:flex-col gap-2 md:gap-0 shadow-sm min-h-full md:min-h-0 md:h-auto" style={{minHeight: '100%'}}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition mb-1 md:mb-0 ${activeTab === tab.key ? "bg-(--brand)/10 text-(--brand-deep)" : "hover:bg-(--surface-soft) text-(--ink)"}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon icon={tab.icon} className="text-lg" />
                {tab.label}
              </button>
            ))}
          </nav>
          {/* Main section */}
          <main className="flex-1 p-6">
            <Section />
          </main>
        </div>
      </div>
    </AdminDashboardProtected>
  );
}
