import { create } from 'zustand';

export type AuthPayload = {
  username: string;
  password: string;
};

export type AuthType = {
  username: string;
  password: string;
  setField: <K extends keyof Omit<AuthType, 'setField'>>(
    field: K,
    value: string,
  ) => void;
};

const useAuthStore = create<AuthType>((set) => ({
  username: '',
  password: '',
  setField: (field, value) => set((state) => ({ ...state, [field]: value })),
}));

export default useAuthStore;
