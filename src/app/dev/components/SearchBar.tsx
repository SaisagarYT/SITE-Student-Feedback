import React from "react";

export default function SearchBar({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      className="border rounded px-3 py-1 w-full mb-4"
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Search..."
    />
  );
}
