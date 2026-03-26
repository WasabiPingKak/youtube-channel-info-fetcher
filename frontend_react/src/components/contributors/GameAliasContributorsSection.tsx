import React, { useEffect, useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";

const GameAliasContributorsSection = ({ defaultOpen = false, className = "" }) => {
  const [contributors, setContributors] = useState([]);
  const [contribError, setContribError] = useState(null);
  const [expanded, setExpanded] = useState(defaultOpen);

  useEffect(() => {
    fetch("https://script.google.com/macros/s/AKfycbwBtrIDR8n1VitpZ00j4Yd5XPLtrSrlfeY2Kc3j5Veoblc71_FefGopJ_zA6kDlZG5bpQ/exec?action=contributors")
      .then((res) => res.json())
      .then((data) => setContributors(data))
      .catch((err) => {
        console.error("❌ 感謝名單載入失敗:", err);
        setContribError("感謝名單載入失敗");
      });
  }, []);

  return (
    <div className={`bg-yellow-50 dark:bg-yellow-100/10 border border-yellow-200 dark:border-yellow-300/30 rounded-xl p-4 mb-8 ${className}`}>
      <div className="flex items-center mb-3">
        <h2 className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mr-4">
          🎮 貢獻遊戲名稱協力者
        </h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
        >
          {expanded ? "隱藏" : "顯示"}
        </button>
      </div>

      {expanded && (
        <>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">依名稱字典順序排列：</p>

          {contribError && (
            <p className="text-red-600 dark:text-red-400">{contribError}</p>
          )}

          <ul className="flex flex-wrap gap-3 text-sm">
            {contributors
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((person, idx) => (
                <li
                  key={idx}
                  className="bg-zinc-200 dark:bg-zinc-700 px-4 py-2 rounded-full shadow-sm"
                >
                  {person.url ? (
                    <a
                      href={person.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                    >
                      {person.name}
                      <FaExternalLinkAlt className="w-3 h-3 ml-1 opacity-70" />
                    </a>
                  ) : (
                    <span className="text-pink-700 dark:text-pink-200">{person.name}</span>
                  )}
                </li>
              ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default GameAliasContributorsSection;
