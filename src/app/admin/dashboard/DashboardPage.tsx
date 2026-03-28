// ...existing code up to the first closing return ...
// Remove everything after the first closing return (including duplicate imports and function)
import { useState, useEffect } from "react";
import axios from "axios";
import FilterBar from "../../../components/admin/FilterBar";
import Tabs from "../../../components/admin/Tabs";
import ReportHeader from "../../../components/admin/ReportHeader";
import ReportTable from "../../../components/admin/ReportTable";
import PrintButton from "../../../components/admin/PrintButton";
import AdminNavbar from "../../../components/admin/AdminNavbar";

export default function AdminDashboard() {
  const [filters, setFilters] = useState({
    branchId: "",
    section: "",
    semester: "",
    phase: "1",
    fromDate: "",
    toDate: ""
  });
  const [tab, setTab] = useState("department");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/report", {
        params: { ...filters, view: tab }
      });
      setData(res.data.results || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (filters.branchId && filters.semester) {
        fetchReport();
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, tab]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 print:bg-white">
      <AdminNavbar />
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        <div className="print:hidden">
          <FilterBar filters={filters} setFilters={setFilters} />
          <Tabs tab={tab} setTab={setTab} />
        </div>
        <ReportHeader filters={filters} />
        <div className="flex-1 overflow-hidden flex flex-col">
          <ReportTable data={data} loading={loading} />
        </div>
        <div className="print:hidden">
          <PrintButton />
        </div>
      </div>
    </div>
  );
}