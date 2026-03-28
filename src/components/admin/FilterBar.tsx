import React from "react";

type FilterBarProps = {
  filters: {
    branchId: string;
    section: string;
    semester: string;
    phase: string;
    fromDate: string;
    toDate: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    branchId: string;
    section: string;
    semester: string;
    phase: string;
    fromDate: string;
    toDate: string;
  }>>;
};

export default function FilterBar({ filters, setFilters }: FilterBarProps) {
  return (
    <div className="bg-white p-3 rounded shadow flex flex-wrap gap-3 mb-3">
      <select
        className="border p-2 rounded min-w-[120px]"
        value={filters.branchId}
        onChange={e => setFilters(f => ({ ...f, branchId: e.target.value }))}
      >
        <option value="">Department</option>
        <option value="IT">IT</option>
        <option value="ECE">ECE</option>
      </select>
      <select
        className="border p-2 rounded min-w-[100px]"
        value={filters.section}
        onChange={e => setFilters(f => ({ ...f, section: e.target.value }))}
      >
        <option value="">Section</option>
        <option value="A">A</option>
        <option value="B">B</option>
      </select>
      <select
        className="border p-2 rounded min-w-[100px]"
        value={filters.semester}
        onChange={e => setFilters(f => ({ ...f, semester: e.target.value }))}
      >
        <option value="">Semester</option>
        <option value="6">6</option>
        <option value="5">5</option>
      </select>
      <select
        className="border p-2 rounded min-w-[100px]"
        value={filters.phase}
        onChange={e => setFilters(f => ({ ...f, phase: e.target.value }))}
      >
        <option value="1">Phase 1</option>
        <option value="2">Phase 2</option>
      </select>
      <input
        type="date"
        className="border p-2 rounded"
        value={filters.fromDate}
        onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))}
      />
      <input
        type="date"
        className="border p-2 rounded"
        value={filters.toDate}
        onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))}
      />
    </div>
  );
}
