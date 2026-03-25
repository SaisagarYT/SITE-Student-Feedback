# Admin Dashboard: Architecture & Workflow Documentation

## Overview
The Admin Dashboard is a full-stack feature for academic feedback analytics and management. It provides real-time statistics, faculty/course analytics, and participation metrics for administrators.

---

## 1. Frontend (Next.js, React)

### Main Files
- `src/app/admin/dashboard/page.tsx` — Main dashboard UI and logic
- `src/app/admin/dashboard/AdminDashboardProtected.tsx` — Route protection
- `src/components/admin/AdminNavbar.tsx` — Admin navigation bar
- `src/api.js` — API utilities for backend communication

### Authentication Flow
- Admin logs in via Google (see `AdminLogin.tsx`).
- On success, admin info and token are stored in `localStorage` and as a cookie.
- Route protection (`AdminDashboardProtected`) checks for admin email in `localStorage`.
- Logout clears tokens and calls backend `/api/admin/logout`.

### Dashboard Tabs
- **Overview**: Shows total students, faculty, courses, feedback, completion rate, average rating, and charts.
- **Faculty Performance**: Lists faculty analytics (responses, avg rating, etc.).
- **Course Feedback**: Course-wise feedback analytics.
- **Student Participation**: Participation stats by student.
- **Branch Analytics**: Participation and feedback by branch.
- **Reports**: Downloadable/exportable analytics (if implemented).

### Data Fetching Example (Overview Tab)
```tsx
useEffect(() => {
  getAdminDashboardOverview()
    .then((res) => setData(res))
    .catch(() => setError("Failed to load dashboard data"));
}, []);
```

### API Calls (from `src/api.js`)
- `getAdminDashboardOverview()` → `/api/admin/dashboard`
- `getFacultyPerformance()` → `/api/admin/faculty-performance`
- `getFacultyDetail(facultyId)` → `/api/admin/faculty-detail/:facultyId`
- `getCourseAnalytics(filters)` → `/api/admin/course-analytics`
- `getPhase2Active()` → `/api/admin/phase-activation`

---

## 2. Backend (Node.js, Express, Firestore)

### Main Files
- `functions/src/controllers/adminController.js` — Main admin endpoints
- `functions/src/routes/adminRoutes.js` — Route definitions
- `functions/src/app.js` — Express app entry

### Key Endpoints & Logic

#### `/api/admin/dashboard` (GET)
- Returns: `{ totalStudents, totalFaculty, totalCourses, totalFeedback, completionRate, avgRating, ... }`
- **Logic:**
  - Counts students, faculty, courses from Firestore collections.
  - Aggregates feedback docs for total feedback, unique students, and ratings.
  - Calculates average rating and completion rate.
  - Returns rating distribution and other analytics.

#### `/api/admin/faculty-performance` (GET)
- Returns: Array of faculty analytics (responses, avg rating, etc.)
- **Logic:**
  - Aggregates feedback by facultyId.
  - Computes average ratings and response counts.

#### `/api/admin/faculty-detail/:facultyId` (GET)
- Returns: Detailed analytics for a specific faculty.
- **Logic:**
  - Aggregates all feedback for the given facultyId.
  - Computes averages for each question and phase.

#### `/api/admin/course-analytics` (GET)
- Returns: Array of course analytics (responses, avg rating, etc.)
- **Logic:**
  - Aggregates feedback by courseId.
  - Computes average ratings and response counts.

#### `/api/admin/phase-activation` (GET/POST)
- Gets or sets the global Phase 2 activation flag.

#### `/api/admin/login` (POST)
- Verifies Firebase ID token, checks admin existence, returns admin data.

#### `/api/admin/logout` (POST)
- Stateless endpoint for client-side cleanup.

### Example: Dashboard Overview Backend Code
```js
// GET /api/admin/dashboard
async function getDashboardOverview(req, res) {
  const studentsSnap = await db.collection("students").get();
  const totalStudents = studentsSnap.size;
  const facultiesSnap = await db.collection("faculties").get();
  const totalFaculty = facultiesSnap.size;
  const coursesSnap = await db.collection("courses").get();
  const totalCourses = coursesSnap.size;
  const feedbackSnap = await db.collection("feedback").get();
  const totalFeedback = feedbackSnap.size;
  // ...aggregate ratings, unique students, etc...
  return res.json({ totalStudents, totalFaculty, totalCourses, totalFeedback, ... });
}
```

---

## 3. Data Flow Diagram

```
[Admin Login] → [Token Storage] → [Dashboard Route]
      ↓                ↓
[API Calls] ←→ [Backend Endpoints] ←→ [Firestore]
```

---

## 4. Security
- Only authenticated admins (checked by email in Firestore) can access dashboard endpoints.
- All sensitive actions require a valid Firebase ID token.

---

## 5. Extending the Dashboard
- Add new analytics by creating new endpoints in `adminController.js` and calling them from the frontend.
- Add new tabs by updating the TABS array and SECTION_COMPONENTS in `page.tsx`.

---

## 6. References
- `src/app/admin/dashboard/page.tsx` (UI logic)
- `functions/src/controllers/adminController.js` (backend logic)
- `src/api.js` (API utilities)
- Firestore collections: `students`, `faculties`, `courses`, `feedback`, `admins`

---

*Generated by GitHub Copilot (GPT-4.1) — March 2026*
