"use client";
import React, { useState, useMemo } from "react";
import DataTable from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import SearchBar from "../components/SearchBar";

export default function DashboardTable({ columns, data, filterKeys }: {
  columns: string[];
  data: any[];
  filterKeys: string[];
}) {
  const [filters, setFilters] = useState(() => Object.fromEntries(filterKeys.map(k => [k, ""])));
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    return data.filter(row =>
      filterKeys.every(key => !filters[key] || String(row[key] ?? "").toLowerCase().includes(filters[key].toLowerCase())) &&
      (search === "" || columns.some(col => String(row[col] ?? "").toLowerCase().includes(search.toLowerCase())))
    );
  }, [data, filters, search, columns, filterKeys]);

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} />
      <FilterBar filters={filters} onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} />
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
