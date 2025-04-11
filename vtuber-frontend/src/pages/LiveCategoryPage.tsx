import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

// 🔧 型別定義
type Video = {
  影片ID: string;
  標題: string;
  發布日期: string;
  類別: string;
  影片時長: string;
  總分鐘數: number;
  影片類型: string;
};

type CategoryCount = {
  name: string;
  value: number;
};

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c"];

export default function LiveCategoryPage() {
  const [videoData, setVideoData] = useState<Video[]>([]);
  const [mainCategoryCounts, setMainCategoryCounts] = useState<CategoryCount[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      const docRef = doc(db, "videos", "latest");
      const docSnap = await getDoc(docRef);
      const allVideos: Video[] = docSnap.data()?.data || [];
      const liveVideos = allVideos.filter((v) => v["影片類型"] === "直播檔");
      setVideoData(liveVideos);

      const countMap: Record<string, number> = {};
      liveVideos.forEach((video) => {
        const category = video["類別"] || "其他";
        countMap[category] = (countMap[category] || 0) + 1;
      });
      const formattedCounts: CategoryCount[] = Object.entries(countMap).map(([name, value]) => ({ name, value }));
      setMainCategoryCounts(formattedCounts);
    };
    fetchVideos();
  }, []);

  const filteredVideos = selectedMainCategory
    ? videoData.filter((v) => v["類別"] === selectedMainCategory)
    : [];

  const handleMainCategoryClick = (entry: CategoryCount) => {
    setSelectedMainCategory(entry.name);
  };

  const handleBack = () => {
    setSelectedMainCategory(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📺 頻道直播影片主題統計</h1>

      {!selectedMainCategory && (
        <div className="flex flex-col items-center">
          <PieChart width={400} height={300}>
            <Pie
              data={mainCategoryCounts}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              dataKey="value"
              onClick={handleMainCategoryClick}
            >
              {mainCategoryCounts.map((entry, index) => (
                <Cell key={`main-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      )}

      {selectedMainCategory && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">🔍 當前分類：{selectedMainCategory}</h2>
            <button onClick={handleBack} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
              ⬅️ 返回
            </button>
          </div>

          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">標題</th>
                <th className="text-left p-2">發布日期</th>
                <th className="text-left p-2">影片時長</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.map((video, index) => (
                <tr key={video["影片ID"]} className="border-t">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{video["標題"]}</td>
                  <td className="p-2">{video["發布日期"]}</td>
                  <td className="p-2">{video["影片時長"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
