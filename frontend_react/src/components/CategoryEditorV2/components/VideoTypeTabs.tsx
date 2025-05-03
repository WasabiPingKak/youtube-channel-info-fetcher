import { useEditorStore } from '../hooks/useEditorStore';

const typeTabs: { key: 'live' | 'videos' | 'shorts'; label: string }[] = [
  { key: 'live', label: '直播' },
  { key: 'videos', label: '影片' },
  { key: 'shorts', label: 'Shorts' },
];

export default function VideoTypeTabs() {
  const activeType = useEditorStore((s) => s.activeType);
  const setActiveType = useEditorStore((s) => s.setActiveType);

  return (
    <div className="flex space-x-2 mb-4">
      {typeTabs.map((tab) => (
        <button
          key={tab.key}
          className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
            activeType === tab.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100'
          }`}
          onClick={() => setActiveType(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
