// components/DeveloperBadge.jsx
import React from "react";

const DeveloperBadge = ({ isAuthor }) => {
  if (!isAuthor) return null;

  return (
    <div>
      <span
        className="inline-block text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse"
        title="本站開發者"
      >
        💻 本站開發者
      </span>
    </div>
  );
};

export default DeveloperBadge;
