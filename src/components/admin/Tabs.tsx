import React from "react";

type TabsProps = {
  tab: string;
  setTab: React.Dispatch<React.SetStateAction<string>>;
};

export default function Tabs({ tab, setTab }: TabsProps) {
  const tabs = ["section", "faculty"];
  return (
    <div className="flex gap-2 mb-3">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`px-4 py-2 rounded transition ${
            tab === t
              ? "bg-blue-600 text-white shadow"
              : "bg-white border hover:bg-blue-50"
          }`}
        >
          {t.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
