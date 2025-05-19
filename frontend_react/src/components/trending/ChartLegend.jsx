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
          className="px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          ✅ 全選
        </button>
        <button
          onClick={() => setHiddenGames(topGames)}
          className="px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          ❌ 清除所有
        </button>
      </div>

      <ul className="flex flex-wrap justify-center gap-4 text-sm">
        {topGames.map((game, i) => {
          const color = COLOR_LIST[i % COLOR_LIST.length];
          const isHidden = hiddenGames.includes(game);
          return (
            <li
              key={game}
              onClick={() => toggleLine(game)}
              className={`cursor-pointer flex items-center gap-2 ${
                isHidden ? "opacity-40" : "font-semibold"
              }`}
            >
              <span
                className="w-3 h-3 inline-block rounded"
                style={{ backgroundColor: color, border: "1px solid #ccc" }}
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
