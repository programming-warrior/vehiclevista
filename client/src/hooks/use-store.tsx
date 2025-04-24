import {create} from "zustand";


type WebSocketStore = {
  socket: WebSocket | null;
  setSocket: (socket: WebSocket | null) => void; // <-- allow null here
  closeSocket: () => void;
};

export const useWebSocket = create<WebSocketStore>((set, get) => ({
  socket: null,
  setSocket: (socket: WebSocket | null ) => set({ socket }),
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


type heroSectionSearchState = {
    brand: string;
    model: string;
    variant: string;
    minBudget: number;
    maxBudget:  number;
    setSearch: (search: { brand: string; model: string; variant: string; maxBudget:number, minBudget:number }) => void;
}


export const useHeroSectionSearch = create<heroSectionSearchState>((set) => ({
    brand: "",
    model: "",
    variant:"",
    minBudget:0,
    maxBudget:0,
    setSearch: (newSearch) => set(() => ({ 
        ...newSearch
    }))
}))


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
    category: 'dealer' | 'classified' | 'auction';
    condition: 'clean' | 'catS' | 'catN';
    openToPX: boolean;
    sellerId: number;
    sellerType: 'private' | 'trader' | 'garage';
    contactPreference?: 'phone' | 'email' | 'both';
    listingStatus: 'active' | 'sold' | 'expired';
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
    addVehicle: (vehicle) => set((state) => ({ vehicles: [...state.vehicles, vehicle] })),
    updateVehicle: (id, updates) => set((state) => ({
      vehicles: state.vehicles.map(vehicle => 
        vehicle.id === id ? { ...vehicle, ...updates } : vehicle
      )
    }))
  }));