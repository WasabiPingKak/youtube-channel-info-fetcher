// hooks/useCurrentUser.ts
import { useQuery } from "@tanstack/react-query"

type UserInfo = {
  channelId: string
}

const BASE_URL = import.meta.env.VITE_API_BASE || "";

export function useCurrentUser() {
  return useQuery<UserInfo>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/me`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Not logged in");

      return res.json();
    },
    gcTime: 1000 * 60 * 5,
    retry: false,
  });
}
