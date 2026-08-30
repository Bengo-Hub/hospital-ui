import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';
import type { HospitalOutlet } from '@/lib/api/users';

const STORAGE_KEY_PREFIX = 'hospital-selected-outlet:';

interface OutletState {
  /** Every outlet GET /outlets returned for this tenant. Empty until useHospitalOutlets loads. */
  outlets: HospitalOutlet[];
  /** null = no outlet selected yet, or a single-outlet tenant (no switcher needed at all). */
  selectedOutlet: HospitalOutlet | null;

  /** Called once outlets load: restores the persisted pick, or auto-selects a lone/HQ outlet. */
  setOutlets: (tenantSlug: string, outlets: HospitalOutlet[]) => void;
  selectOutlet: (tenantSlug: string, outlet: HospitalOutlet) => void;
  clear: () => void;
}

function loadPersisted(tenantSlug: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY_PREFIX + tenantSlug);
  } catch {
    return null;
  }
}

function persist(tenantSlug: string, outletId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug, outletId);
  } catch {
    /* no-op — worst case the pick doesn't survive a refresh */
  }
}

export const useOutletStore = create<OutletState>((set) => ({
  outlets: [],
  selectedOutlet: null,

  setOutlets: (tenantSlug, outlets) => {
    if (outlets.length === 0) {
      set({ outlets, selectedOutlet: null });
      apiClient.setOutletID(null);
      return;
    }
    const persistedId = loadPersisted(tenantSlug);
    const restored = outlets.find((o) => o.id === persistedId);
    // Single-outlet tenants (the overwhelming majority) never need a switcher — auto-select
    // the only row so every request already carries the right X-Outlet-ID.
    const fallback = outlets.length === 1 ? outlets[0] : (outlets.find((o) => o.is_hq) ?? null);
    const selected = restored ?? fallback;
    set({ outlets, selectedOutlet: selected });
    apiClient.setOutletID(selected?.id ?? null);
  },

  selectOutlet: (tenantSlug, outlet) => {
    set({ selectedOutlet: outlet });
    apiClient.setOutletID(outlet.id);
    persist(tenantSlug, outlet.id);
  },

  clear: () => {
    set({ outlets: [], selectedOutlet: null });
    apiClient.setOutletID(null);
  },
}));
