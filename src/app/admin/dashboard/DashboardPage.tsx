"use client";
import Head from "next/head";
// ...existing code up to the first closing return ...
// Remove everything after the first closing return (including duplicate imports and function)
import { useState, useEffect } from "react";
import { getAdminReport } from "../../../api";
import FilterBar from "../../../components/admin/FilterBar";
import Tabs from "../../../components/admin/Tabs";
import ReportHeader from "../../../components/admin/ReportHeader";
import ReportTable, { ReportRow } from "../../../components/admin/ReportTable";
import PrintButton from "../../../components/admin/PrintButton";
import AdminNavbar from "../../../components/admin/AdminNavbar";

export default function AdminDashboard() {
  const [filters, setFilters] = useState({
    branchId: "ECE",
    section: "A",
    semester: "",
    phase: "1",
    fromDate: "",
    toDate: ""
  });
  const [tab, setTab] = useState("department");
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await getAdminReport({ ...filters, view: tab });
      console.log("Backend report data:", res);
      setData(res.results || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (filters.branchId) {
        fetchReport();
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, tab]);

  // No polling: data reloads only on filter/tab change or manual refresh

  // Sort: theory subjects first, then lab subjects
  const sortedData = Array.isArray(data)
    ? [...data].sort((a, b) => {
        if (a.type === b.type) return 0;
        if (a.type === "theory") return -1;
        if (b.type === "theory") return 1;
        return 0;
      })
    : data;

  return (
    <>
      <Head>
        <style>{`
          @media print {
            @page { margin: 0; }
            body { margin: 0; }
            header, footer { display: none !important; }
          }
        `}</style>
      </Head>
      <div className="h-screen flex flex-col bg-gray-100 print:bg-white">
        <AdminNavbar />
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          <div className="print:hidden">
            <FilterBar filters={filters} setFilters={setFilters} />
            <Tabs tab={tab} setTab={setTab} />
          </div>
          <ReportHeader filters={filters} />
          <div className="flex-1 overflow-hidden flex flex-col">
            <ReportTable data={sortedData} loading={loading} showPerQuestion={tab === "faculty"} />
          </div>
          <div className="print:hidden">
            <PrintButton />
          </div>
        </div>
      </div>
    </>
  );
}