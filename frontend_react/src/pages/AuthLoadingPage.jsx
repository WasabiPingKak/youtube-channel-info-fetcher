import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";

const AuthLoadingPage = () => {
  const [params] = useSearchParams();
  const channelId = params.get("channel");
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initSuccess, setInitSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const initChannel = async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    setInitSuccess(false);

    try {
      const res = await fetch(`/api/init-channel?channel=${channelId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorCode(data.code || null);
        throw new Error(data.error || `初始化失敗：${res.status}`);
      }

      setInitSuccess(true);
      setLoading(false);
      let seconds = 5;
      setCountdown(seconds);

      const interval = setInterval(() => {
        seconds -= 1;
        setCountdown(seconds);
        if (seconds <= 0) {
          clearInterval(interval);
          navigate(`/videos?channel=${channelId}`);
        }
      }, 1000);
    } catch (err) {
      setError(err.message);
      setErrorCode(err?.code || null);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (channelId) initChannel();
  }, [channelId]);

  const getReadableError = (code) => {
    switch (code) {
      case "MISSING_CHANNEL_ID":
        return "未提供頻道 ID，請重新授權。";
      case "UNAUTHORIZED":
        return "頻道尚未授權或授權過期，請重新連結。";
      case "FIRESTORE_ERROR":
        return "後端儲存失敗，請稍後再試。";
      case "INTERNAL_ERROR":
        return "後端發生未知錯誤，請聯絡開發者。";
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-xl mx-auto mt-20 text-center px-4 space-y-6">
        <h1 className="text-2xl font-bold">🎉 授權成功</h1>
        <p>正在初始化你的頻道資料，請稍候...</p>

        {loading && <p className="text-sm text-gray-500">載入中...</p>}

        {initSuccess && (
          <p className="text-green-600">
            ✅ 初始化完成，{countdown} 秒後將自動跳轉到影片頁...
          </p>
        )}

        {error && (
          <div className="mt-6 text-red-600 space-y-4">
            <p>⚠️ 初始化失敗：{error}</p>
            {errorCode && (
              <p className="text-sm text-red-500">{getReadableError(errorCode)}</p>
            )}
            <button
              onClick={initChannel}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              重新嘗試初始化
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AuthLoadingPage;
