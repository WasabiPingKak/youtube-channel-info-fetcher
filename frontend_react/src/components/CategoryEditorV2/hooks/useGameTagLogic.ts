import { useState, useMemo, useCallback } from "react";
import { useEditorStore } from "../hooks/useEditorStore";
import type { GameEntry, CategorySettings, VideoType } from "../types/editor";

interface UseGameTagLogicResult {
  games: GameEntry[];
  selected: Set<string>;
  existingNames: Set<string>;
  /* UI State */
  modalMode: "add" | "edit" | null;
  editingGame: GameEntry | null;
  deleteTarget: GameEntry | null;
  /* Toggle Checkbox */
  toggle: (game: string) => void;
  /* Modal helpers */
  openAddModal: () => void;
  openEditModal: (entry: GameEntry) => void;
  closeModal: () => void;
  handleSave: (entry: GameEntry) => void;
  /* Delete helpers */
  openDeleteModal: (entry: GameEntry) => void;
  closeDeleteModal: () => void;
  handleConfirmDelete: () => void;
}

export default function useGameTagLogic(): UseGameTagLogicResult {
  /* ---------- Store 選單與設定 ---------- */
  const activeType = useEditorStore((s) => s.activeType);
  const config = useEditorStore((s) => s.config);
  const updateConfigOfType = useEditorStore((s) => s.updateConfigOfType);
  const markUnsaved = useEditorStore((s) => s.markUnsaved);

  const selected = useEditorStore((s) => s.selectedBySource.game);
  const toggleSuggestionChecked = useEditorStore((s) => s.toggleSuggestionChecked);

  /* ---------- Local UI State ---------- */
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingGame, setEditingGame] = useState<GameEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GameEntry | null>(null);

  /* ---------- Derived Data ---------- */
  const games: GameEntry[] = useMemo(() => {
    return config?.[activeType]?.遊戲 ?? [];
  }, [config, activeType]);

  const existingNames = useMemo(() => new Set<string>(games.map((g) => g.game)), [games]);

  /* ---------- CRUD helpers ---------- */
  const saveGameEntry = useCallback(
    (entry: GameEntry, replaceOld?: string) => {
      const oldSettings: CategorySettings = config[activeType] ?? {};
      const newGameList: GameEntry[] = replaceOld
        ? games.map((g) => (g.game === replaceOld ? entry : g))
        : [...games, entry];

      updateConfigOfType(activeType as VideoType, {
        ...oldSettings,
        遊戲: newGameList,
      });
      markUnsaved();
    },
    [config, games, updateConfigOfType, markUnsaved, activeType]
  );

  const deleteGameEntry = useCallback(
    (name: string) => {
      const oldSettings: CategorySettings = config[activeType] ?? {};
      updateConfigOfType(activeType as VideoType, {
        ...oldSettings,
        遊戲: games.filter((g) => g.game !== name),
      });
      markUnsaved();
    },
    [config, games, updateConfigOfType, markUnsaved, activeType]
  );

  /* ---------- Public helpers ---------- */
  const toggle = useCallback(
    (game: string) => toggleSuggestionChecked("game", game),
    [toggleSuggestionChecked]
  );

  const openAddModal = useCallback(() => {
    setModalMode("add");
    setEditingGame(null);
  }, []);

  const openEditModal = useCallback((entry: GameEntry) => {
    setModalMode("edit");
    setEditingGame(entry);
  }, []);

  const closeModal = useCallback(() => {
    setModalMode(null);
  }, []);

  const handleSave = useCallback(
    (entry: GameEntry) => {
      if (modalMode === "edit" && editingGame) {
        saveGameEntry(entry, editingGame.game);
      } else {
        saveGameEntry(entry);
      }
      closeModal();
    },
    [modalMode, editingGame, saveGameEntry, closeModal]
  );

  const openDeleteModal = useCallback((entry: GameEntry) => {
    setDeleteTarget(entry);
  }, []);

  const closeDeleteModal = useCallback(() => setDeleteTarget(null), []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteGameEntry(deleteTarget.game);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteGameEntry]);

  return {
    games,
    selected,
    existingNames,
    modalMode,
    editingGame,
    deleteTarget,
    toggle,
    openAddModal,
    openEditModal,
    closeModal,
    handleSave,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  };
}
