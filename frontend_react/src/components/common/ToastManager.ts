// src/components/common/ToastManager.ts
import { toast } from "react-hot-toast";

// ✅ 成功訊息後綴詞庫（無 emoji、工程師冷幽默風）
const successPhrases = [
  "工程師幹的不錯",
  "看起來今天沒人要加班了 ",
  "機房的乖乖是有用的"
];

const failurePhrases = [
  "可以 F5 再來一次",
  "也許只是路由器淋到雨",
  "難道乖乖過期了?"
];

const loginRequiredPhrases = [
  "系統還沒認出你是誰",
  "我們沒法確定你的身份"
];

const permissionDeniedPhrases = [
  "你發現了一條隱藏小路，但路被擋住了",
  "找到了隱藏關卡，但暫時沒有解法",
];

export function showSuccessToast(baseMessage: string) {
  const extra = successPhrases[Math.floor(Math.random() * successPhrases.length)];
  toast.success(`${baseMessage}，${extra}`);
}

export function showFailureToast(baseMessage: string) {
  const extra = failurePhrases[Math.floor(Math.random() * failurePhrases.length)];
  toast.error(`${baseMessage}。${extra}`);
}

export function showLoginRequiredToast(baseMessage: string) {
  const extra = loginRequiredPhrases[Math.floor(Math.random() * loginRequiredPhrases.length)];
  toast.error(`${baseMessage}。${extra}`);
}

export function showPermissionDeniedToast(baseMessage: string) {
  const extra = permissionDeniedPhrases[Math.floor(Math.random() * permissionDeniedPhrases.length)];
  toast.error(`${baseMessage}。${extra}`);
}