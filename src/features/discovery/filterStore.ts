import { create } from 'zustand';

export interface DiscoveryFilters {
  sortOrder: number;
  statusOrder: number;
  isMale: boolean;
  isFemale: boolean;
  startPrice: number;
  endPrice: number;
  gameIds: string[];
  applied: boolean;
}

export const DEFAULT_FILTERS: DiscoveryFilters = {
  sortOrder: 0,
  statusOrder: 0,
  isMale: true,
  isFemale: true,
  startPrice: 10000,
  endPrice: 5000000,
  gameIds: [],
  applied: false,
};

export const STATUS_BY_ORDER: Record<number, string> = {
  0: '',
  1: 'Online',
  2: 'Processing',
  3: 'Hiring',
  4: 'Offline',
};

interface DiscoveryFilterState {
  filters: DiscoveryFilters;
  apply: (filters: DiscoveryFilters) => void;
  reset: () => void;
}

export const useDiscoveryFilter = create<DiscoveryFilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  apply: (filters) => set({ filters: { ...filters, applied: true } }),
  reset: () => set({ filters: DEFAULT_FILTERS }),
}));
