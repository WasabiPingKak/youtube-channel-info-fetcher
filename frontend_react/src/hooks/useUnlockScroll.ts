import { useEffect } from "react";

// 嘗試移除 <body data-scroll-locked>，避免殘留導致無法滾動
export function useUnlockScroll() {
  useEffect(() => {
    const unlock = () => {
      if (document.body.hasAttribute("data-scroll-locked")) {
        document.body.removeAttribute("data-scroll-locked");
        document.body.style.overflow = "auto";
      }
    };

    // 嘗試在初始化或點擊時清理
    unlock();

    // 補上事件防止未來意外觸發
    document.addEventListener("pointerdown", unlock);
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);
}
