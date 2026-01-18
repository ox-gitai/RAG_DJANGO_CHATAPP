import { create } from 'zustand';
// import { configureStore } from ''

export const useStore = create((set) => ({
  isLogin: false,
  setIsLogin: (isLogin) => set({ isLogin }),
}))
