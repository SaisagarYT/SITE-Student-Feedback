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
    <div className="flex flex-wrap gap-2 mb-4 rounded-2xl border border-[rgba(10,152,146,0.14)] bg-[rgba(255,255,255,0.78)] p-2">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold tracking-[0.02em] transition ${
            tab === t.key
              ? "bg-[linear-gradient(135deg,var(--brand),var(--brand-deep))] text-white"
              : "bg-white/70 text-(--ink) border border-[rgba(10,152,146,0.12)] hover:bg-[rgba(10,152,146,0.06)]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
