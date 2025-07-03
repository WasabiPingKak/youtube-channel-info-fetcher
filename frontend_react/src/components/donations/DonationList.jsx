import React from "react";
import DonationCard from "./DonationCard";
import { mockDonations } from "./mockDonations";

// 切換是否顯示 mock 測試資料（手動補用）
const SHOW_MOCK_DONATIONS = false;

const getAmountBucket = (amt) => {
  const amount = parseInt(amt);
  if (amount < 75) return "30";
  if (amount < 150) return "75";
  if (amount < 300) return "150";
  if (amount < 750) return "300";
  if (amount < 1500) return "750";
  return "1500";
};

export default function DonationList({ donations }) {
  const allDonations = SHOW_MOCK_DONATIONS
    ? [...mockDonations, ...donations]
    : donations;

  const grouped = {};
  allDonations.forEach((donation) => {
    const bucket = getAmountBucket(donation.tradeAmt);
    if (!grouped[bucket]) grouped[bucket] = [];
    grouped[bucket].push(donation);
  });

  const sortedBuckets = ["1500", "750", "300", "150", "75", "30"];

  return (
    <div className="space-y-8">
      {sortedBuckets.map((bucket) => {
        const group = grouped[bucket];
        if (!group || group.length === 0) return null;

        const sortedGroup = group.sort((a, b) =>
          a.paymentDate.localeCompare(b.paymentDate)
        );

        return (
          <div key={bucket}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedGroup.map((donation, idx) => (
                <DonationCard
                  key={`${bucket}-${idx}`}
                  donation={donation}
                  bucket={bucket}
                />
              ))}
            </div>
            <div className="border-t mt-6 border-gray-300 dark:border-zinc-700" />
          </div>
        );
      })}
    </div>
  );
}
