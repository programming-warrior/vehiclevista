import { recentViews } from "@shared/schema";
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
      totalNotifications:
        typeof count === "function" ? count(state.totalNotifications) : count,
    })),
  setUnReadCount: (count) =>
    set((state) => ({
      unReadCount:
        typeof count === "function" ? count(state.unReadCount) : count,
    })),
  setNotifications: (notifications) => set(() => ({ notifications })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    })),
  removeNotification: (notification) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n !== notification),
    })),
  updateNotification: (id, updates) =>
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id == id ? { ...notif, ...updates } : notif
      ),
    })),
}));

export const useGlobalLoading = create<{
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}>((set) => ({
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));

export type AuctionData = {
  draftId: string;
  title: string;
  description: string;
  durationDays: string;
  itemType: string;
  item: Record<string, any>;
};

export type AuctionDraftCacheStore = {
  auctionCache: AuctionData;
  setAuctionCache: (newData: Partial<AuctionData>) => void;
  clearAuctionItemCache: () => void;
  clearAuctionCache: () => void;
};

export const useAuctionDraftCache = create<AuctionDraftCacheStore>((set) => ({
  auctionCache: {
    draftId: "",
    title: "",
    description: "",
    durationDays: "",
    itemType: "",
    item: {},
  },
  setAuctionCache: (newData) => {
    set((state) => ({
      auctionCache: {
        ...state.auctionCache,
        ...newData,
        draftId: state.auctionCache.draftId || crypto.randomUUID(),
      },
    }));
  },
  clearAuctionItemCache: () => {
    set((state) => ({
      auctionCache: {
        ...state.auctionCache,
        item: {},
      },
    }));
  },
  clearAuctionCache: () => {
    set(() => ({
      auctionCache: {
        draftId: "",
        title: "",
        description: "",
        durationDays: "",
        itemType: "",
        item: {},
      },
    }));
  },
}));

export type vehicleDraftCacheStore = {
  vehicleCache: any;
  setVehicleCache: (newData: Partial<AuctionData>) => void;
  clearVehicleCache: () => void;
};

export const useVehicleDraftCache = create<vehicleDraftCacheStore>((set) => ({
  vehicleCache: {},
  setVehicleCache: (newData) => {
    set((state) => ({
      vehicleCache: {
        ...state.vehicleCache,
        ...newData,
        draftId: state.vehicleCache.draftId || crypto.randomUUID(),
      },
    }));
  },
  clearVehicleCache: () => {
    set(() => ({
      vehicleCache: {},
    }));
  },
}));

type RedirectStore = {
  redirectUrl: string | null;
  setRedirectUrl: (url: string) => void;
  clearRedirectUrl: () => void;
};

export const useRedirectStore = create<RedirectStore>((set) => ({
  redirectUrl: null,
  setRedirectUrl: (url) => set({ redirectUrl: url }),
  clearRedirectUrl: () => set({ redirectUrl: null }),
}));

type HeroSectionSearchState = {
  brand: string;
  model: string;
  variant: string;
  vehicleType: string;
  transmissionType: string;
  fuelType: string;
  color: string;
  minBudget: number;
  maxBudget: number;
  postalCode: string;
  latitude: string;
  longitude: string;
  distance: string;
  fromYear: string;
  toYear: string;
  maxMileage: number;
  minMileage: number;
  vehicleCondition: string;
  setSearch: (
    search: Partial<Omit<HeroSectionSearchState, "setSearch">>
  ) => void;
};

export const useHeroSectionSearch = create<HeroSectionSearchState>((set) => ({
  brand: "",
  model: "",
  variant: "",
  vehicleType: "",
  transmissionType: "",
  fuelType: "",
  color: "",
  minBudget: 0,
  maxBudget: 0,
  postalCode: "",
  latitude: "",
  longitude: "",
  distance: "National",
  fromYear: "",
  toYear: "",
  maxMileage: 0,
  minMileage: 0,
  vehicleCondition: "",
  setSearch: (newSearch) =>
    set((state) => ({
      ...state,
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

export const useFavouriteListings = create<any>((set) => ({
  vehicles: [],
  auctions: [],
  addVehicleToFavourite: (newVehicle: any) =>
    set((state: any) => ({
      ...state,
      vehicles: state.vehicles.some((v: any) => v.id === newVehicle.id)
        ? state.vehicles
        : [...state.vehicles, newVehicle],
    })),

  addAuctionToFavourite: (newAuction: any) =>
    set((state: any) => ({
      ...state,
      auctions: state.auctions.some((a: any) => a.id === newAuction.id)
        ? state.auctions
        : [...state.auctions, newAuction],
    })),
  removeAuctionFromFavourite: (auctionId: any) =>
    set((state: any) => ({
      ...state,
      auctions: state.auctions.filter((a: any) => a.id != auctionId),
    })),
  removeVehicleFromFavourite: (vehicleId: any) =>
    set((state: any) => ({
      ...state,
      vehicles: state.vehicles.filter((v: any) => v.id != vehicleId),
    })),
}));

export type RecentViewType= {
  id: number,
  userId: number,
  auctionId: null | number,
  classifiedId: null | number,
  viewed_at: string,
}

type RecentViewStoreType = {
  recent_views: RecentViewType[];
  setRecentView: (data: RecentViewType[]) => void;
  addToRecentView: (data: RecentViewType[]) =>void;
  removeFromRecentView: (id:number)=> void;
};
export const useRecentViews = create<RecentViewStoreType>((set) => ({
  recent_views: [],
  setRecentView: (newState: any) =>
    set((state: any) => ({
      ...state,
      recent_views: [...state.recent_views, ...newState],
    })),
  addToRecentView: (newRecord: any) =>
    set((state: any) => ({
      ...state,
      recent_views: [...state.recent_views, newRecord],
    })),
  removeFromRecentView: (id: number) =>
    set((state: any) => ({
      ...state,
      recent_views: state.recent_views.filter((v: any) => v.id != id),
    })),
}));
