import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const CHANNEL_ID = import.meta.env.VITE_DEFAULT_CHANNEL_ID || "UCLxa0YOtqi8IR5r2dSLXPng";

export const saveChannelSettings = async (data: any) => {
  const ref = doc(db, "channel_settings", CHANNEL_ID);
  await setDoc(ref, data, { merge: true });
};

export const loadChannelSettings = async () => {
  const ref = doc(db, "channel_settings", CHANNEL_ID);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};