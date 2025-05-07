import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { GameEntry } from "../types/editor";

export interface GameTagTableRowProps {
  entry: GameEntry;
  isSelected: boolean;
  onToggle: (game: string) => void;
  onEdit: (entry: GameEntry) => void;
  onDelete: (entry: GameEntry) => void;
}

export default function GameTagTableRow({
  entry,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
}: GameTagTableRowProps) {
  return (
    <tr className="border-b">
      <td className="px-2 py-1 align-top border-t border-gray-200">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(entry.game)}
        />
      </td>
      <td className="px-2 py-1 align-top border-t border-gray-200">
        {entry.game}
      </td>
      <td className="px-2 py-1 align-top border-t border-gray-200">
        {entry.keywords.join(", ")}
      </td>
      <td className="px-2 py-1 align-top border-t border-gray-200 flex gap-2">
        <button onClick={() => onEdit(entry)}>
          <Pencil size={16} />
        </button>
        <button onClick={() => onDelete(entry)}>
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}
