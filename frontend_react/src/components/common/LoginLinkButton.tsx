import React from "react";

const BASE_URL = import.meta.env.VITE_SITE_BASE || "";

const LoginLinkButton = () => {
  return (
    <a
      href={`${BASE_URL}/authorize-channel`}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
    >
      <span role="img" aria-label="link">🔗</span>
      <span>連結我的頻道</span>
    </a>
  );
};

export default LoginLinkButton;
