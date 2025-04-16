import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const CHANNEL_ID = import.meta.env.VITE_DEFAULT_CHANNEL_ID || "UCLxa0YOtqi8IR5r2dSLXPng";

export const saveChannelSettings = async (data: any) => {
  const ref = doc(db, "channel_data", CHANNEL_ID, "settings", "config");
  await setDoc(ref, data); // full overwrite
};

export const loadChannelSettings = async () => {
  const ref = doc(db, "channel_data", CHANNEL_ID, "settings", "config");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};