import {create} from "zustand";

type UserState = {
    userId: string;
    role: string;
    setUser: (user: { userId: string; role: string }) => void;
};

export const useUser = create<UserState>((set) => ({
    userId: "",
    role: "",
    setUser: (newUser) => set(() => ({ 
        userId: newUser.userId, 
        role: newUser.role 
    }))
}))