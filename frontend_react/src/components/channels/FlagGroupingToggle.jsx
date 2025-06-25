import React from "react";

/**
 * 依國旗分組開關（Switch 版，緊貼排版）
 *
 * @param {boolean} isEnabled
 * @param {Function} onToggle
 */
const FlagGroupingToggle = ({ isEnabled, onToggle }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          依國旗分組
        </span>

        {/* 自訂 Switch：緊貼文字右側 */}
        <button
          role="switch"
          aria-checked={isEnabled}
          onClick={() => onToggle(!isEnabled)}
          className={`ml-2 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-zinc-600"
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full transition-transform ${isEnabled
                ? "translate-x-6 bg-white dark:bg-gray-100"
                : "translate-x-1 bg-white dark:bg-gray-200"
              }`}
          />
        </button>
      </div>
    </div>
  );
};

export default FlagGroupingToggle;
