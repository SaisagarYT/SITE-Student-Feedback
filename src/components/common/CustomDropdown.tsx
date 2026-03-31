import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";

interface CustomDropdownProps {
  options: Array<{ label: string; value: string }>; // or value: number
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(opt => opt.value === value);

  return (
    <div ref={ref} className={clsx("relative w-full min-w-[120px]", className)}>
      <button
        type="button"
        className={clsx(
          "w-full text-left px-3 py-2 border rounded bg-white text-black border-gray-300 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--brand)]",
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        )}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        {selected ? selected.label : <span className="text-gray-500">{placeholder}</span>}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
          {options.length === 0 && (
            <div className="px-4 py-2 text-gray-400">No options</div>
          )}
          {options.map(opt => (
            <div
              key={opt.value}
              className={clsx(
                "px-4 py-2 cursor-pointer text-gray-800 hover:bg-gray-100",
                value === opt.value && "bg-gray-200 text-black font-semibold"
              )}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
