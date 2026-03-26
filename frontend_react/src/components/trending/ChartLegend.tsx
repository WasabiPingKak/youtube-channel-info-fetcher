import React from "react";
import { COLOR_LIST } from "./chartColors";

/**
 * @param {Object} props
 * @param {string[]} props.topGames
 * @param {string[]} props.hiddenGames
 * @param {function} props.setHiddenGames
 * @param {function} props.toggleLine
 */
const ChartLegend = ({ topGames, hiddenGames, setHiddenGames, toggleLine }) => {
  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <div className="flex gap-4 text-sm">
        <button
          onClick={() => setHiddenGames([])}
          className="px-2 py-1 rounded border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
        >
          ✅ 全選
        </button>
        <button
          onClick={() => setHiddenGames(topGames)}
          className="px-2 py-1 rounded border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
        >
          ❌ 清除所有
        </button>
      </div>

      <ul className="flex flex-wrap justify-center gap-4 text-sm mt-2">
        {topGames.map((game, i) => {
          const color = COLOR_LIST[i % COLOR_LIST.length];
          const isHidden = hiddenGames.includes(game);
          return (
            <li
              key={game}
              onClick={() => toggleLine(game)}
              className={`cursor-pointer flex items-center gap-2 ${isHidden
                  ? "opacity-40 text-gray-700 dark:text-gray-400"
                  : "font-semibold text-gray-800 dark:text-white"
                }`}
            >
              <span
                className="w-3 h-3 inline-block rounded"
                style={{
                  backgroundColor: color,
                  border: "1px solid var(--chart-border, #ccc)",
                }}
              />
              {game}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ChartLegend;
