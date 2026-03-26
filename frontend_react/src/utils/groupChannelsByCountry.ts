// utils/groupChannelsByCountry.ts

type Channel = {
  channel_id: string;
  countryCode?: string[];
  [key: string]: unknown;
};

type GroupedChannel<T extends Channel = Channel> = {
  code: string; // 國碼或 __unclassified
  channels: T[];
};

export function groupChannelsByCountry<T extends Channel>(
  channels: T[],
  sortFn: (a: T, b: T) => number
): GroupedChannel<T>[] {
  const groupMap: Map<string, T[]> = new Map();

  for (const channel of channels) {
    const codes = channel.countryCode;
    if (Array.isArray(codes) && codes.length > 0) {
      for (const code of codes) {
        if (!groupMap.has(code)) groupMap.set(code, []);
        groupMap.get(code)!.push(channel);
      }
    } else {
      if (!groupMap.has("__unclassified")) groupMap.set("__unclassified", []);
      groupMap.get("__unclassified")!.push(channel);
    }
  }

  const grouped: GroupedChannel<T>[] = Array.from(groupMap.entries()).map(
    ([code, chs]) => ({
      code,
      channels: chs.sort(sortFn),
    })
  );

  return grouped.sort((a, b) => {
    if (a.code === "__unclassified") return 1;
    if (b.code === "__unclassified") return -1;

    const diff = b.channels.length - a.channels.length;
    return diff !== 0 ? diff : a.code.localeCompare(b.code);
  });
}
