import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ChatOpenContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openChat: () => void;
};

const ChatOpenContext = createContext<ChatOpenContextValue | null>(null);

export function ChatOpenProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openChat = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ open, setOpen, openChat }), [open, openChat]);
  return createElement(ChatOpenContext.Provider, { value }, children);
}

export function useChatOpen() {
  const ctx = useContext(ChatOpenContext);
  if (!ctx) {
    throw new Error('useChatOpen must be used within ChatOpenProvider');
  }
  return ctx;
}
