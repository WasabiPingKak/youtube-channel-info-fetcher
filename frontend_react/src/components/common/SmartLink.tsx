import React from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  to: string;
  className?: string;
  children: React.ReactNode;
  replace?: boolean;
  onClick?: () => void; // ✅ 支援外部 onClick
};

/**
 * 📎 SmartLink
 *
 * 提供與 SNS 一致的連結行為：
 * - 左鍵點擊 → 使用 React Router navigate() 跳轉（不重整頁面）
 * - 中鍵 / Ctrl+點 / Shift+點 → 保留瀏覽器原生開新分頁行為
 * - 可選外部 onClick（如 sidebar 點擊時自動收合）
 */
export default function SmartLink({
  to,
  className,
  children,
  replace = false,
  onClick,
}: Props) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const isLeftClick = e.button === 0;
    const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

    if (isLeftClick && !isModified) {
      e.preventDefault();
      if (onClick) onClick(); // ✅ 外部副作用（例如 sidebar 自動收合）
      navigate(to, { replace });
    }
    // 否則（中鍵、Ctrl+點）保留原生行為
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
