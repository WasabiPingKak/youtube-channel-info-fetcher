// components/donations/DonationCard.jsx
import React from "react";

const bucketStyles = {
  "30": { bg: "bg-teal-500", text: "text-white", noteBg: "bg-white/20" },
  "75": { bg: "bg-yellow-400", text: "text-black", noteBg: "bg-black/20" },
  "150": { bg: "bg-orange-500", text: "text-white", noteBg: "bg-white/20" },
  "300": { bg: "bg-pink-400", text: "text-white", noteBg: "bg-white/20" },
  "750": { bg: "bg-pink-600", text: "text-white", noteBg: "bg-white/20" },
  "1500": { bg: "bg-red-600", text: "text-white", noteBg: "bg-white/20" },
};

export default function DonationCard({ donation, bucket }) {
  const { bg, text, noteBg } = bucketStyles[bucket] || {
    bg: "bg-gray-400",
    text: "text-white",
    noteBg: "bg-white/20",
  };

  return (
    <div
      className={`w-full rounded-lg shadow-md p-4 flex flex-col justify-between ${bg} ${text}`}
    >
      <div className="font-bold text-base mb-2">
        {donation.patronName} ${Math.round(donation.tradeAmt)}
      </div>

      <div className={`rounded-md p-2 text-sm whitespace-pre-line ${noteBg}`}>
        {donation.patronNote.replace(/\+/g, "\n")}
      </div>
    </div>
  );
}
