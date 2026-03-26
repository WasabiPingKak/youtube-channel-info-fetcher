import React from "react";

const CountryFlags = ({ countryCode }) => {
  if (!Array.isArray(countryCode) || countryCode.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {countryCode.map((code) => (
        <span
          key={code}
          className={`fi fi-${code.toLowerCase()} w-5 h-3 rounded-sm border`}
          title={code}
        />
      ))}
    </div>
  );
};

export default CountryFlags;
