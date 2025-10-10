// src/pages/ReviewPage.tsx

import React from "react";
import { useParams } from "react-router-dom";
import AnnualReviewLayout from "@/components/annual-review/AnnualReviewLayout";
import MainLayout from "@/components/layout/MainLayout";

export default function ReviewPage() {
  const { channelId, year } = useParams();

  const yearInt = parseInt(year, 10);
  const isValid = channelId && !isNaN(yearInt);

  return (
    <MainLayout>
      {!isValid ? (
        <div className="p-4 text-red-500 text-sm">
          無效的路由參數：請確認網址格式為 /review/:channelId/:year
        </div>
      ) : (
        <AnnualReviewLayout channelId={channelId} year={yearInt} />
      )}
    </MainLayout>
  );
}
