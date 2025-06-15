import { create } from 'zustand';

export interface MeType {
  user_id: string;
  username: string;
  admin: boolean;
}

interface UserState {
  user: MeType | null;
  setUser: (user: MeType | null) => void;
  clearUser: () => void;
}

const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

export default useUserStore;
