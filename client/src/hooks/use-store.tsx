import { create } from "zustand";

type WebSocketStore = {
  socket: WebSocket | null;
  setSocket: (socket: WebSocket | null) => void; // <-- allow null here
  closeSocket: () => void;
};

export const useWebSocket = create<WebSocketStore>((set, get) => ({
  socket: null,
  setSocket: (socket: WebSocket | null) => set({ socket }),
  closeSocket: () => {
    const socket = get().socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    set({ socket: null });
  },
}));

type UserState = {
  userId: string;
  role: string;
  card_verified: boolean;
  setUser: (user: {
    userId: string;
    role: string;
    card_Verified: boolean;
  }) => void;
};

export const useUser = create<UserState>((set) => ({
  userId: "",
  role: "",
  card_verified: false,
  setUser: (newUser) =>
    set(() => ({
      userId: newUser.userId,
      role: newUser.role,
      card_verified: newUser.card_Verified,
    })),
}));

export const useNotification = create<{
  notifications: any[];
  unReadCount: number;
  totalNotifications: number;
  setUnReadCount: (count: number | ((prev: number) => number)) => void;
  setTotalNotifications: (count: number | ((prev: number) => number)) => void;
  setNotifications: (notifications: any[]) => void;
  addNotification: (notification: any) => void;
  removeNotification: (notification: any) => void;
  updateNotification: (id: number, updates: Partial<any>) => void; // <-- add this
}>((set) => ({
  notifications: [],
  unReadCount: 0,
  totalNotifications: 0,
  setTotalNotifications: (count) =>
    set((state) => ({
      totalNotifications: typeof count === "function" ? count(state.totalNotifications) : count,
    })),
  setUnReadCount: (count) =>
    set((state) => ({
      unReadCount: typeof count === "function" ? count(state.unReadCount) : count,
    })),
  setNotifications: (notifications) => set(() => ({ notifications })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),
  removeNotification: (notification) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n !== notification),
    })),
  updateNotification: (id, updates) =>
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === id ? { ...notif, ...updates } : notif
      ),
    })),
}));


type heroSectionSearchState = {
  brand: string;
  model: string;
  variant: string;
  vehicleType: string;
  transmissionType: string;
  fuelType: string;
  color: string;
  minBudget: number;
  maxBudget: number;
  setSearch: (search: {
    brand?: string;
    model?: string;
    variant?: string;
    transmissionType?: string;
    vehicleType?: string;
    fuelType?: string;
    maxBudget?: number;
    minBudget?: number;
    color?: string;
  }) => void;
};

export const useHeroSectionSearch = create<heroSectionSearchState>((set) => ({
  brand: "",
  model: "",
  variant: "",
  minBudget: 0,
  maxBudget: 0,
  vehicleType: "",
  transmissionType: "",
  fuelType: "",
  color: "",
  setSearch: (newSearch) =>
    set(() => ({
      ...newSearch,
    })),
}));

type Vehicle = {
  id: number;
  title: string;
  price: number;
  year: number;
  make: string;
  model: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  images: string[];
  category: "dealer" | "classified" | "auction";
  condition: "clean" | "catS" | "catN";
  openToPX: boolean;
  sellerId: number;
  sellerType: "private" | "trader" | "garage";
  contactPreference?: "phone" | "email" | "both";
  listingStatus: "active" | "sold" | "expired";
  negotiable: boolean;
  createdAt: Date;
  views: number;
  clicks: number;
  leads: number;
};

type VehicleState = {
  vehicles: Vehicle[];
  setVehicles: (vehicles: Vehicle[]) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: number, updates: Partial<Vehicle>) => void;
};

export const useVehicleLists = create<VehicleState>((set) => ({
  vehicles: [],
  setVehicles: (newVehicles) => set(() => ({ vehicles: newVehicles })),
  addVehicle: (vehicle) =>
    set((state) => ({ vehicles: [...state.vehicles, vehicle] })),
  updateVehicle: (id, updates) =>
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, ...updates } : vehicle
      ),
    })),
}));
