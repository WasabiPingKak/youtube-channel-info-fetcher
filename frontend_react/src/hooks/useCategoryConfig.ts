import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase'; // 請依你的實際路徑調整

const DEFAULT_CATEGORY_STRUCTURE = {
  雜談: {},
  遊戲: {},
  音樂: {},
  節目: {},
};

const CHANNEL_ID = 'UCLxa0YOtqi8IR5r2dSLXPng'; // 目前固定，未來可改成參數傳入

const getCategoryConfig = async () => {
  const configRef = doc(db, 'channel_data', CHANNEL_ID, 'settings', 'config');
  const snapshot = await getDoc(configRef);

  if (snapshot.exists()) {
    return snapshot.data();
  } else {
    await setDoc(configRef, DEFAULT_CATEGORY_STRUCTURE);
    return DEFAULT_CATEGORY_STRUCTURE;
  }
};

export const useCategoryConfig = () => {
  const queryResult = useQuery({
    queryKey: ['category-config', CHANNEL_ID],
    queryFn: getCategoryConfig,
    // staleTime: Infinity,
    // gcTime: Infinity, // TanStack Query v5 寫法
  });

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    refetch: queryResult.refetch,
  };
};
