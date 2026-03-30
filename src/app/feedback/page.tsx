
"use client";

// Helper to extract ratings from phase object
function extractRatings(phaseObj: unknown): Record<string, number> {
  if (!phaseObj) return {};
  const ratings: Record<string, number> = {};
  Object.entries(phaseObj as object).forEach(([k, v]) => {
    if (/^q\d+$/.test(k) && typeof v === 'number') ratings[k] = v;
  });
  return ratings;
}
// DEBUG: Confirm component is mounting
// Fetch feedback status from backend on mount
// ...removed debug log...
// Move these hooks inside the HomePage component

import { useEffect, useLayoutEffect, useRef, useState } from "react";



import { getAuth } from "firebase/auth";
import { submitStudentFeedback, getStudentFeedbackByCourse, getStudentCourses, getPhase2Active } from "@/api";
import gsap from "gsap";
import { Icon } from "@iconify/react";
import FeedbackHeader from "@/components/feedback/FeedbackHeader";
import PhaseSection from "@/components/feedback/PhaseSection";
import { feedbackPhases } from "@/data/questions";

// Define a Course type for type safety
type Faculty = { facultyId: string; facultyName: string; email?: string; designation?: string };
type Course = {
  section: string;
  semester: string;
  branchId: string;
  courseId: string;
  courseName: string;
  credits?: string;
  faculties: Faculty[];
};


type PhaseProgressState = {
  ratings: Record<string, number>;
  remark: string;
};

export default function HomePage() {
  // All state hooks at the top
  // Faculty is now selected from course.faculties
  const [facultyLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [phase1AlreadySubmitted, setPhase1AlreadySubmitted] = useState(false);
  const [phase2AlreadySubmitted, setPhase2AlreadySubmitted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [phaseState, setPhaseState] = useState<Record<"phase1" | "phase2", PhaseProgressState>>({
    phase1: { ratings: {}, remark: "" },
    phase2: { ratings: {}, remark: "" },
  });
  const [phase2Active, setPhase2Active] = useState<boolean>(false);
  const [phase2ActiveLoading, setPhase2ActiveLoading] = useState<boolean>(true);

  // When selectedCourse changes, reset selectedFaculty to first faculty
  useEffect(() => {
      if (selectedCourse?.faculties?.length && selectedCourse.faculties[0]) {
        setSelectedFaculty(selectedCourse.faculties[0]);
      } else {
        setSelectedFaculty(null);
      }
    }, [selectedCourse]);
      // Re-fetch feedback status when selectedFaculty changes
      useEffect(() => {
        if (!authChecked || !isAuthed || !selectedCourse || !selectedFaculty) return;
        // Fetch feedback for the selected course and faculty
        (async () => {
          try {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; token=`);
            const token = parts.length === 2 ? parts.pop()?.split(';').shift() ?? "" : "";
            // Fetch phase 1 feedback
            const feedback1 = await getStudentFeedbackByCourse(
              selectedCourse.courseId,
              selectedFaculty?.facultyId,
              token
            );
            console.log('Phase 1 feedback response:', feedback1);
            // Fetch phase 2 feedback
            const feedback2 = await getStudentFeedbackByCourse(
              selectedCourse.courseId,
              selectedFaculty?.facultyId,
              token
            );
            // If backend returns {submitted: true, phase1: {...}, phase2: null}, treat as phase1 submitted
            // Define a type for backend feedback response
            type BackendFeedback = {
              submitted?: boolean;
              phase1?: { ratings?: Record<string, number>; remark?: string } | null;
              phase2?: { ratings?: Record<string, number>; remark?: string } | null;
            };

            function isBackendFeedback(obj: unknown): obj is BackendFeedback {
              return (
                typeof obj === 'object' && obj !== null &&
                ('submitted' in obj || 'phase1' in obj || 'phase2' in obj)
              );
            }

            const fb1: BackendFeedback = isBackendFeedback(feedback1) ? feedback1 : {};
            const fb2: BackendFeedback = isBackendFeedback(feedback2) ? feedback2 : {};

            setPhaseState({
              phase1: fb1.phase1 && typeof fb1.phase1.ratings === 'object'
                ? { ratings: extractRatings(fb1.phase1.ratings), remark: fb1.phase1.remark || "" }
                : { ratings: {}, remark: "" },
              phase2: fb2.phase2 && typeof fb2.phase2.ratings === 'object'
                ? { ratings: extractRatings(fb2.phase2.ratings), remark: fb2.phase2.remark || "" }
                : { ratings: {}, remark: "" },
            });
            setPhase1AlreadySubmitted(!!(fb1.submitted && fb1.phase1));
            setPhase2AlreadySubmitted(!!(fb2.submitted && fb2.phase2));
          } catch {
            setPhase1AlreadySubmitted(false);
            setPhase2AlreadySubmitted(false);
            setPhaseState({
              phase1: { ratings: {}, remark: "" },
              phase2: { ratings: {}, remark: "" },
            });
          }
        })();
      }, [authChecked, isAuthed, selectedCourse, selectedFaculty]);
    // Fetch phase2Active flag on mount
    useEffect(() => {
      async function fetchPhase2Active() {
        setPhase2ActiveLoading(true);
        try {
          const active = await getPhase2Active();
          setPhase2Active(active);
        } catch {
          setPhase2Active(false);
        } finally {
          setPhase2ActiveLoading(false);
        }
      }
      fetchPhase2Active();
    }, []);
  const pageRef = useRef<HTMLDivElement>(null);
  const phaseContainerRef = useRef<HTMLDivElement>(null);

  // Defensive: If backend says complete, always disable, even if local state is out of sync
  const phase1Locked = phase1AlreadySubmitted;
  const phase2Locked = phase2AlreadySubmitted;

  // Protect route: check for token cookie and localStorage user data
  useEffect(() => {
    function getCookie(name: string) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    }
    const token = getCookie("token");
    const studentName = typeof window !== "undefined" ? localStorage.getItem("studentName") : null;
    const profileImage = typeof window !== "undefined" ? localStorage.getItem("profileImage") : null;
    if (!token || !studentName || !profileImage) {
      window.location.href = "/";
      // Do not call setIsAuthed(false) after navigation
    } else {
      setTimeout(() => setIsAuthed(true), 0);
    }
    setTimeout(() => setAuthChecked(true), 0);
  }, []);

  // Fetch feedback status after authentication is checked and user is authed
  useEffect(() => {
    async function fetchCourses() {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; token=`);
        const token = parts.length === 2 ? parts.pop()?.split(';').shift() ?? "" : "";
        if (!token) return;
        const auth = getAuth();
        const user = auth.currentUser;
        let idToken = token;
        if (user) {
          idToken = await user.getIdToken();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await getStudentCourses(idToken);
        let courseList: unknown[] = [];
        if (Array.isArray(response)) {
          courseList = response;
        } else if (
          response &&
          typeof response === 'object' &&
          'courses' in response &&
          Array.isArray((response as Record<string, unknown>).courses)
        ) {
          courseList = (response as Record<string, unknown>).courses as unknown[];
        }
        // Normalize all courses to include section, semester, branchId, and ensure type safety
        const normalizedCourses: Course[] = courseList.map((c) => {
          const facultiesRaw = (c as { faculties?: unknown }).faculties;
          const faculties: Faculty[] = Array.isArray(facultiesRaw)
            ? facultiesRaw.map((f) => {
                const obj = f as Record<string, unknown>;
                return {
                  facultyId: typeof obj.facultyId === 'string' ? obj.facultyId : '',
                  facultyName: typeof obj.facultyName === 'string' ? obj.facultyName : '',
                  email: typeof obj.email === 'string' ? obj.email : undefined,
                  designation: typeof obj.designation === 'string' ? obj.designation : undefined,
                };
              })
            : [];
          const obj = c as Record<string, unknown>;
          return {
            section: typeof obj.section === 'string' ? obj.section : '',
            semester: typeof obj.semester === 'string' ? obj.semester : '',
            branchId: typeof obj.branchId === 'string' ? obj.branchId : '',
            courseId: typeof obj.courseId === 'string' ? obj.courseId : '',
            courseName: typeof obj.courseName === 'string' ? obj.courseName : '',
            credits: typeof obj.credits === 'string' ? obj.credits : undefined,
            faculties,
          };
        });
        // Log faculty details for each course
        normalizedCourses.forEach(course => {
          console.log(`Course: ${course.courseName} (${course.courseId}) faculties:`, course.faculties);
        });
        setCourses(normalizedCourses);
        setSelectedCourse(normalizedCourses.length > 0 ? normalizedCourses[0] : null);
        setSelectedFaculty(normalizedCourses.length > 0 && normalizedCourses[0].faculties.length > 0 ? normalizedCourses[0].faculties[0] : null);
      } catch (err) {
        console.error('getStudentCourses error:', err);
        setCourses([]);
        setSelectedCourse(null);
      }
    }
    if (authChecked && isAuthed) {
      fetchCourses();
    }
  }, [authChecked, isAuthed]);

  // Update feedback fetching to depend on selectedCourseId
  // Removed duplicate feedback fetching useEffect with onAuthStateChanged
// Reset state when faculty changes
useEffect(() => {
  setPhase1AlreadySubmitted(false);
  setPhase2AlreadySubmitted(false);
  setPhaseState({
    phase1: { ratings: {}, remark: "" },
    phase2: { ratings: {}, remark: "" },
  });
}, [selectedFaculty]);


  const [activePhase, setActivePhase] = useState<"phase1" | "phase2">("phase1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Move all variable and hook declarations above the return statement ---
  const phase1 = feedbackPhases.find((phase) => phase.id === "phase1") ?? feedbackPhases[0];
  const phase2 = feedbackPhases.find((phase) => phase.id === "phase2") ?? feedbackPhases[1] ?? feedbackPhases[0];
  const phase1QuestionCount = phase1.questions.length;
  const phase2QuestionCount = phase2.questions.length;
  const phase1Complete =
    Object.keys(phaseState.phase1.ratings).length === phase1QuestionCount &&
    phaseState.phase1.remark.trim().length > 0;
  const phase2Complete =
    Object.keys(phaseState.phase2.ratings).length === phase2QuestionCount &&
    phaseState.phase2.remark.trim().length > 0;
  // const allPhasesComplete = phase1Complete && phase2Complete; // No longer used
  const activePhaseConfig = activePhase === "phase1" ? phase1 : phase2;
  const activePhaseState = phaseState[activePhase];
  // Removed unused activeQuestionCount
  // Removed unused activePhaseTotalTasks and activePhaseCompletedTasks
  // Remove unused progressPercent if not used in JSX
  const switchPhase = (nextPhase: "phase1" | "phase2") => {
    if (nextPhase === "phase2" && !phase2Active) return;
    if (!phaseContainerRef.current || nextPhase === activePhase) {
      setActivePhase(nextPhase);
      return;
    }
    const current = phaseContainerRef.current;
    gsap.to(current, {
      autoAlpha: 0,
      y: -18,
      duration: 0.24,
      ease: "power2.in",
      onComplete: () => {
        setActivePhase(nextPhase);
        requestAnimationFrame(() => {
          if (!phaseContainerRef.current) return;
          gsap.fromTo(
            phaseContainerRef.current,
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 0.42, ease: "power3.out" }
          );
        });
      },
    });
  };
  // Submit Phase 1 only
  const handleSubmitPhase1 = async () => {
        // Log payload for debugging

        if (!selectedCourse || !selectedFaculty) return;

    if (!phase1Complete || !selectedCourse || !selectedFaculty) return;
    setIsSubmitting(true);
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setIsSubmitting(false);
      window.alert("You must be signed in to submit feedback.");
      return;
    }
    const idToken = await user.getIdToken();
    try {
      const phase1Ratings = remapPhaseKeys(phaseState.phase1.ratings, "phase1");
      const payload = {
        courseId: selectedCourse.courseId,
        facultyId: selectedFaculty?.facultyId,
        branchId: selectedCourse.branchId || "",
        section: selectedCourse.section || "",
        semester: selectedCourse.semester || "",
        phase1: {
          ...phase1Ratings,
        },
        phase1Remark: phaseState.phase1.remark,
      };
      await submitStudentFeedback(payload, idToken);
      setIsSubmitting(false);
      await new Promise((resolve) => setTimeout(resolve, 600));
      // Re-fetch feedback status using the same logic as the main useEffect
      const token = idToken;
      const feedbackStatus = await getStudentFeedbackByCourse(selectedCourse.courseId, selectedFaculty?.facultyId || "", token);
      // Use the same type guard and state update as in useEffect
      type BackendFeedback = {
        submitted?: boolean;
        phase1?: { ratings?: Record<string, number>; remark?: string } | null;
        phase2?: { ratings?: Record<string, number>; remark?: string } | null;
      };
      function isBackendFeedback(obj: unknown): obj is BackendFeedback {
        return (
          typeof obj === 'object' && obj !== null &&
          ('submitted' in obj || 'phase1' in obj || 'phase2' in obj)
        );
      }
      const fb: BackendFeedback = isBackendFeedback(feedbackStatus) ? feedbackStatus : {};
      setPhaseState(prev => ({
        ...prev,
        phase1: fb.phase1 && typeof fb.phase1.ratings === 'object'
          ? { ratings: extractRatings(fb.phase1.ratings), remark: fb.phase1.remark || "" }
          : { ratings: {}, remark: "" },
      }));
      // Always check backend status after submission and force lock if true
      if (fb.submitted && fb.phase1) {
        setPhase1AlreadySubmitted(true);
        window.alert("Phase 1 feedback submitted.");
      } else {
        setPhase1AlreadySubmitted(false);
      }
    } catch {
      setIsSubmitting(false);
      window.alert("Failed to submit Phase 1 feedback. Please try again.");
    }
  };

  // Submit Phase 2 only
  const handleSubmitPhase2 = async () => {
        // Log payload for debugging

        if (!selectedCourse || !selectedFaculty) return;

    if (!phase2Complete || !selectedCourse || !selectedFaculty) return;
    setIsSubmitting(true);
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setIsSubmitting(false);
      window.alert("You must be signed in to submit feedback.");
      return;
    }
    const idToken = await user.getIdToken();
    try {
      const phase2Ratings = remapPhaseKeys(phaseState.phase2.ratings, "phase2");
      const payload = {
        courseId: selectedCourse.courseId,
        facultyId: selectedFaculty?.facultyId,
        branchId: selectedCourse.branchId || "",
        section: selectedCourse.section || "",
        semester: selectedCourse.semester || "",
        phase2: {
          ...phase2Ratings,
        },
        phase2Remark: phaseState.phase2.remark,
      };
      await submitStudentFeedback(payload, idToken);
      setIsSubmitting(false);
      await new Promise((resolve) => setTimeout(resolve, 600));
      // Re-fetch feedback status using the same logic as the main useEffect
      const token = idToken;
      const feedbackStatus = await getStudentFeedbackByCourse(selectedCourse.courseId, selectedFaculty?.facultyId || "", token);
      // Use the same type guard and state update as in useEffect
      type BackendFeedback = {
        submitted?: boolean;
        phase1?: { ratings?: Record<string, number>; remark?: string } | null;
        phase2?: { ratings?: Record<string, number>; remark?: string } | null;
      };
      function isBackendFeedback(obj: unknown): obj is BackendFeedback {
        return (
          typeof obj === 'object' && obj !== null &&
          ('submitted' in obj || 'phase1' in obj || 'phase2' in obj)
        );
      }
      const fb: BackendFeedback = isBackendFeedback(feedbackStatus) ? feedbackStatus : {};
      setPhaseState(prev => ({
        ...prev,
        phase2: fb.phase2 && typeof fb.phase2.ratings === 'object'
          ? { ratings: extractRatings(fb.phase2.ratings), remark: fb.phase2.remark || "" }
          : { ratings: {}, remark: "" },
      }));
      // Always check backend status after submission and force lock if true
      if (fb.submitted && fb.phase2) {
        setPhase2AlreadySubmitted(true);
        window.alert("Phase 2 feedback submitted.");
      } else {
        setPhase2AlreadySubmitted(false);
      }
    } catch {
      setIsSubmitting(false);
      window.alert("Failed to submit Phase 2 feedback. Please try again.");
    }
  };
  // Helper to remap keys for backend (with reverse scoring)
  function remapPhaseKeys(phaseRatings: Record<string, number>, phaseId?: "phase1" | "phase2"): Record<string, number> {
    const mapped: Record<string, number> = {};
    const phaseConfig = feedbackPhases.find(p => p.id === phaseId);
    Object.entries(phaseRatings).forEach(([key, value]) => {
      // Convert keys like p1_q1 or p2_q1 to q1, q2, ...
      let qKey = key;
      const match = key.match(/^p\d+_(q\d+)$/);
      if (match) {
        qKey = match[1];
      }
      const question = phaseConfig?.questions.find(q => q.id === key);
      let finalValue = value;
      if (question?.reverseScored) {
        finalValue = 6 - value;
      }
      mapped[qKey] = finalValue;
    });
    return mapped;
  }
  useLayoutEffect(() => {
    if (!pageRef.current) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-reveal]",
        { autoAlpha: 0, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.14,
          ease: "power3.out",
        }
      );
    }, pageRef);
    return () => context.revert();
  }, []);
  // --- End move ---
  if (!authChecked || phase2ActiveLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--page)"><span className="text-lg text-(--muted)">Loading...</span></div>
    );
  }
  if (!isAuthed) {
    return null;
  }
  // Add a notice for phase completion (move inside HomePage before return)
  // Always show notice and disable if backend says submitted, regardless of local state
  const showPhase1Notice = phase1AlreadySubmitted;
  const showPhase2Notice = phase2AlreadySubmitted;
  const showPhase2InactiveNotice = !phase2Active && activePhase === "phase2";
  return (
    <main className="relative min-h-screen overflow-x-clip bg-(--page) text-(--ink)">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-112 bg-[linear-gradient(180deg,rgba(10,152,146,0.16),rgba(10,152,146,0))]" />
        <div className="absolute -left-20 top-48 h-72 w-72 rounded-full bg-[rgba(239,42,113,0.14)] blur-[120px]" />
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-[rgba(10,152,146,0.16)] blur-[130px]" />
      </div>
      <div ref={pageRef} className="relative pb-14">
        <FeedbackHeader activePhase={activePhase} />
        {showPhase1Notice && (
          <div className="mx-auto my-4 max-w-2xl rounded-xl border border-(--brand) bg-[rgba(10,152,146,0.08)] px-4 py-3 text-(--brand-deep) text-center text-sm font-medium shadow">
            Phase 1 feedback has already been submitted. You cannot edit your responses.
          </div>
        )}
        {showPhase2Notice && (
          <div className="mx-auto my-4 max-w-2xl rounded-xl border border-(--brand) bg-[rgba(10,152,146,0.08)] px-4 py-3 text-(--brand-deep) text-center text-sm font-medium shadow">
            Phase 2 feedback has already been submitted. You cannot edit your responses.
          </div>
        )}
        {showPhase2InactiveNotice && (
          <div className="mx-auto my-4 max-w-2xl rounded-xl border border-yellow-400 bg-yellow-50 px-4 py-3 text-yellow-900 text-center text-sm font-medium shadow">
            Phase 2 is currently disabled by the administrator. You may only submit Phase 1 feedback at this time.
          </div>
        )}
        <section className="bg-[linear-gradient(180deg,var(--brand)_0%,var(--brand-deep)_100%)] py-10 sm:py-14">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
            <aside data-reveal className="sticky top-4 self-start lg:top-5">
              <div className="overflow-hidden rounded-4xl border border-white/22 bg-white/12 shadow-[0_22px_65px_rgba(8,80,77,0.32)] backdrop-blur-md">
                <div className="border-b border-white/14 px-5 py-5 text-white sm:px-6">
                  <label htmlFor="course-select" className="block text-xs font-semibold tracking-[0.2em] uppercase text-white/72 mb-2">
                    Select course
                  </label>
                  <div className="relative mb-4">
                    <select
                      id="course-select"
                      value={selectedCourse?.courseId || ""}
                      onChange={e => {
                        const course = courses.find(c => c.courseId === e.target.value) || null;
                        setSelectedCourse(course ? course : null);
                      }}
                      className="w-full appearance-none rounded-2xl border border-white/20 bg-white/14 px-4 py-3 pr-11 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] outline-none transition focus:border-white/50 focus:bg-white/18 focus:ring-2 focus:ring-white/18"
                    >
                      <option value="">Select course</option>
                      {courses.map(course => (
                        <option key={course.courseId} value={course.courseId} className="text-(--ink)">
                          {course.courseName}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-white/78">
                      <Icon icon="material-symbols:keyboard-arrow-down-rounded" className="text-2xl" />
                    </span>
                  </div>
                  {/* Faculty info display */}
                  <div className="mb-2">
                    {facultyLoading && <span className="text-base text-white/80">Loading faculty...</span>}
                    {!facultyLoading && !!selectedCourse?.faculties && selectedCourse.faculties.length > 0 && (
                      <>
                        <label htmlFor="faculty-select" className="block text-xs font-semibold tracking-[0.2em] uppercase text-white/72 mb-2">
                          Select faculty
                        </label>
                        <select
                          id="faculty-select"
                          value={selectedFaculty?.facultyId || ""}
                          onChange={e => {
                            const faculty = selectedCourse?.faculties?.find(f => f.facultyId === e.target.value) || null;
                            setSelectedFaculty(faculty);
                          }}
                          className="w-full appearance-none rounded-2xl border border-white/20 bg-white/14 px-4 py-3 pr-11 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] outline-none transition focus:border-white/50 focus:bg-white/18 focus:ring-2 focus:ring-white/18"
                        >
                          {selectedCourse?.faculties?.map(faculty => (
                            <option key={faculty.facultyId} value={faculty.facultyId} className="text-(--ink)">
                              {faculty.facultyName} {faculty.designation ? `(${faculty.designation})` : ""}
                            </option>
                          ))}
                        </select>
                        {selectedFaculty && selectedFaculty.email && (
                          <div className="text-sm text-white/80 mt-1">Email: <span className="font-medium">{selectedFaculty.email}</span></div>
                        )}
                      </>
                    )}
                    {!facultyLoading && selectedCourse?.faculties?.length === 0 && (
                      <span className="block text-base text-white/80">No faculty assigned.</span>
                    )}
                  </div>
                  <label htmlFor="phase-select" className="block text-xs font-semibold tracking-[0.2em] uppercase text-white/72">
                    Select phase
                  </label>
                  <div className="relative">
                    <select
                      id="phase-select"
                      value={activePhase}
                      onChange={(event) => switchPhase(event.target.value as "phase1" | "phase2")}
                      className="w-full appearance-none rounded-2xl border border-white/20 bg-white/14 px-4 py-3 pr-11 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] outline-none transition focus:border-white/50 focus:bg-white/18 focus:ring-2 focus:ring-white/18"
                    >
                      <option value="phase1" className="text-(--ink)">Phase 1 - Pre Mid-I review</option>
                      <option value="phase2" className="text-(--ink)" disabled={!phase2Active}>Phase 2 - Post Mid-I review</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-white/78">
                      <Icon icon="material-symbols:keyboard-arrow-down-rounded" className="text-2xl" />
                    </span>
                  </div>
                </div>
                <div className="space-y-3 px-5 py-5 sm:px-6">
                  <div className="grid grid-cols-2 border-t border-white/14 bg-[rgba(6,92,89,0.28)]">
                    <div className="px-5 py-4 text-white sm:px-6">
                      <p className="text-3xl font-semibold">
                        {Object.keys(activePhaseState.ratings).length}
                        /
                        {activePhaseConfig.questions.length}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/72">Rated now</p>
                    </div>
                    <div className="border-l border-white/12 px-5 py-4 text-white sm:px-6">
                      <p className="text-3xl font-semibold">
                        {activePhaseState.remark.trim() ? 1 : 0}/1
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/72">Remarks added</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
            <div className="space-y-5">
              <div ref={phaseContainerRef}>
                <PhaseSection
                  phase={activePhaseConfig}
                  ratings={activePhaseState.ratings}
                  remark={activePhaseState.remark}
                  onRatingChange={(questionId, value) => {
                    setPhaseState((prev) => ({
                      ...prev,
                      [activePhase]: {
                        ...prev[activePhase],
                        ratings: { ...prev[activePhase].ratings, [questionId]: value },
                      },
                    }));
                  }}
                  onRemarkChange={(value) => {
                    setPhaseState((prev) => ({
                      ...prev,
                      [activePhase]: {
                        ...prev[activePhase],
                        remark: value,
                      },
                    }));
                  }}
                  disabled={
                    (activePhase === "phase1" && phase1Locked) ||
                    (activePhase === "phase2" && phase2Locked)
                  }
                />
              </div>
              <div data-reveal className="flex flex-col gap-3 rounded-[1.75rem] bg-white px-5 py-5 shadow-[0_18px_50px_rgba(9,58,70,0.16)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-xs font-semibold tracking-[0.22em] text-(--muted) uppercase">Navigation</p>
                  <p className="mt-2 text-sm text-(--muted)">
                    Please answer all questions in each phase and provide remarks. Submit each phase separately when complete.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                  {/* Removed stepper/checklist UI as requested */}
                  {/* Only show one submit button for the active phase */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    {activePhase === "phase1" && (
                      <button
                        type="button"
                        onClick={handleSubmitPhase1}
                        disabled={!phase1Complete || isSubmitting || phase1Locked}
                        className={
                          !phase1Complete || isSubmitting || phase1Locked
                            ? "cursor-not-allowed rounded-full bg-(--accent-soft) px-6 py-3 text-sm font-semibold text-white/70"
                            : "rounded-full bg-(--accent) px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(239,42,113,0.32)] transition hover:bg-(--accent-deep)"
                        }
                      >
                        {phase1Locked ? "Submitted" : (isSubmitting ? "Submitting..." : "Submit")}
                      </button>
                    )}
                    {activePhase === "phase2" && (
                      <button
                        type="button"
                        onClick={handleSubmitPhase2}
                        disabled={!phase2Active || !phase2Complete || isSubmitting || phase2Locked}
                        className={
                          !phase2Active || !phase2Complete || isSubmitting || phase2Locked
                            ? "cursor-not-allowed rounded-full bg-yellow-200 px-6 py-3 text-sm font-semibold text-yellow-900/70"
                            : "rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold text-yellow-900 shadow-[0_18px_36px_rgba(239,42,113,0.12)] transition hover:bg-yellow-500"
                        }
                      >
                        {phase2Locked ? "Submitted" : (isSubmitting ? "Submitting..." : "Submit")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer data-reveal className="bg-(--ink) py-6 text-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <span className="inline-flex items-center gap-2 text-white/78">
              <Icon icon="material-symbols:shield-lock-outline" className="text-lg text-(--highlight)" />
              Confidential responses are used only for academic quality improvement.
            </span>
            <span className="inline-flex items-center gap-2 font-medium tracking-[0.16em] uppercase text-white/78">
              {phase2Complete ? "Feedback Completed" : "Student feedback portal"}
              <Icon icon="material-symbols:keyboard-double-arrow-right" className="text-lg text-(--highlight)" />
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}

