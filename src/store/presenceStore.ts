import { create } from 'zustand'

interface PresenceState {
  onlineUsers: Record<string, boolean>
  setOnlineUsers: (users: Record<string, boolean>) => void
  addUser: (userId: string) => void
  removeUser: (userId: string) => void
  isUserOnline: (userId: string) => boolean
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: {},
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addUser: (userId) => set((state) => ({ onlineUsers: { ...state.onlineUsers, [userId]: true } })),
  removeUser: (userId) => set((state) => {
    const newUsers = { ...state.onlineUsers }
    delete newUsers[userId]
    return { onlineUsers: newUsers }
  }),
  isUserOnline: (userId) => !!get().onlineUsers[userId],
}))
