import React from "react";

type TabsProps = {
  tab: string;
  setTab: React.Dispatch<React.SetStateAction<string>>;
};

export default function Tabs({ tab, setTab }: TabsProps) {
  const tabs = [
    { key: "section", label: "SECTION" },
    { key: "faculty", label: "FACULTY" },
    { key: "dates", label: "FEEDBACK DATES" }
  ];
  return (
    <div className="flex gap-2 mb-3">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`px-4 py-2 rounded transition ${
            tab === t.key
              ? "bg-blue-600 text-white shadow"
              : "bg-white border hover:bg-blue-50"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
