import React from "react";

export default function FilterPanel({
  showUpcoming,
  setShowUpcoming,
  showEnded,
  setShowEnded,
}) {
  const renderToggleButton = (label, checked, onToggle) => {
    return (
      <button
        type="button"
        className={`px-3 py-1 rounded border flex items-center gap-1 transition ${checked
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-100 border-gray-300"
          }`}
        onClick={() => onToggle(!checked)}
      >
        <input type="checkbox" readOnly checked={checked} />
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-wrap gap-3 items-center mb-6">
      {renderToggleButton("顯示已收播", showEnded, setShowEnded)}
    </div>
  );
}
