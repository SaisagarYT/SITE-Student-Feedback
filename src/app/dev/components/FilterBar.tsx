import React from "react";

export default function FilterBar({ filters, onChange }: {
  filters: { [key: string]: string };
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="flex gap-4 mb-4">
      {Object.entries(filters).map(([key, value]) => (
        <div key={key} className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">{key}</label>
          <input
            className="border rounded px-2 py-1"
            value={value}
            onChange={e => onChange(key, e.target.value)}
            placeholder={`Filter by ${key}`}
          />
        </div>
      ))}
    </div>
  );
}
