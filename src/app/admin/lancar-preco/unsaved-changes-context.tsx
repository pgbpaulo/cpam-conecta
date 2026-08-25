"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type UnsavedChangesContextValue = {
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export const UNSAVED_CHANGES_MESSAGE =
  "Você tem preços digitados que ainda não foram salvos. Sair sem salvar agora?";

// Shared between StrawberryPriceForm (the only writer) and RecentDaysList
// (a reader that confirms before navigating away mid-edit) — both are
// siblings under LancarPrecoPage, which is a Server Component and can't
// hold this state itself.
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  return (
    <UnsavedChangesContext.Provider value={{ isDirty, setIsDirty }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges(): UnsavedChangesContextValue {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error("useUnsavedChanges must be used within an UnsavedChangesProvider");
  }
  return context;
}
