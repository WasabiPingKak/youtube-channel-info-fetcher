interface CategoryToggleButtonProps {
  name: string;
  count: number;
  selected: boolean;
  onToggle: () => void;
}

export default function CategoryToggleButton({
  name,
  count,
  selected,
  onToggle,
}: CategoryToggleButtonProps) {
  return (
    <button
      className={`rounded-full px-4 py-1 text-sm font-medium flex items-center gap-2 transition-colors
        ${selected ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
      onClick={onToggle}
    >
      <span>{selected ? '☑' : '☐'}</span>
      {name} ({count})
    </button>
  );
}
