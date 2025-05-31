// utils/filterAndSortAliases.ts

type SortOption = "name-asc" | "name-desc" | "alias-more" | "alias-less";

interface FlatInput {
  [name: string]: string[];
}

interface NestedInput {
  [mainCategory: string]: {
    [subCategory: string]: string[];
  } | null;
}

type Mode = "flat" | "nested";

interface FilterAndSortOptions {
  data: FlatInput | NestedInput | null | undefined;
  mode: Mode;
  searchText: string;
  sortOption: SortOption;
  skipTopLevelKey?: string; // e.g. "遊戲"
}

export function filterAndSortAliases({
  data,
  mode,
  searchText,
  sortOption,
  skipTopLevelKey,
}: FilterAndSortOptions) {
  if (!data || typeof data !== "object") {
    return mode === "flat" ? [] : {};
  }

  const lowerSearch = searchText.toLowerCase();

  if (mode === "flat") {
    const flatData = data as FlatInput;
    const entries = Object.entries(flatData).map(([name, aliases]) => ({
      name,
      aliases,
    }));

    const filtered = entries.filter(({ name, aliases }) => {
      return (
        name.toLowerCase().includes(lowerSearch) ||
        aliases.some((alias) => alias.toLowerCase().includes(lowerSearch))
      );
    });

    const sorted = filtered.sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "alias-more":
          return b.aliases.length - a.aliases.length;
        case "alias-less":
          return a.aliases.length - b.aliases.length;
        default:
          return 0;
      }
    });

    return sorted;
  }

  if (mode === "nested") {
    const nestedData = data as NestedInput;
    const result: Record<string, [string, string[]][]> = {};

    Object.entries(nestedData).forEach(([mainCategory, subMap]) => {
      if (
        mainCategory === skipTopLevelKey ||
        !subMap ||
        typeof subMap !== "object"
      )
        return;

      const filteredSubs = Object.entries(subMap)
        .filter(([subName, aliases]) => {
          return (
            subName.toLowerCase().includes(lowerSearch) ||
            aliases.some((alias) => alias.toLowerCase().includes(lowerSearch))
          );
        })
        .sort((a, b) => {
          const [nameA, aliasesA] = a;
          const [nameB, aliasesB] = b;
          switch (sortOption) {
            case "name-asc":
              return nameA.localeCompare(nameB);
            case "name-desc":
              return nameB.localeCompare(nameA);
            case "alias-more":
              return aliasesB.length - aliasesA.length;
            case "alias-less":
              return aliasesA.length - aliasesB.length;
            default:
              return 0;
          }
        });

      result[mainCategory] = filteredSubs;
    });

    return result;
  }

  return mode === "flat" ? [] : {};
}
