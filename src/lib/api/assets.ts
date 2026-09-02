/** Read-only "Biomedical Equipment" surface over inventory-api's existing fixed-asset register,
 * proxied by hospital-api (Sprint 6/7 gap-fill, 2026-09-02, brought forward from Sprint 9's
 * original plan). Field names match inventory-api's Asset/AssetMaintenance ent-generated JSON
 * tags. hospital-api never owns this data — see docs/architecture.md's "Biomedical Equipment /
 * Asset Integration" section. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';

export interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  category_id?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  location?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'disposed' | 'lost' | 'damaged' | 'retired';
  condition?: string;
  warranty_expiry?: string;
  last_maintenance?: string;
  next_maintenance?: string;
}

export interface AssetMaintenanceRecord {
  id: string;
  asset_id: string;
  scheduled_date: string;
  completed_date?: string;
  description?: string;
  cost?: number;
  status?: string;
}

export const assetsApi = {
  list: (orgSlug: string, search?: string) =>
    apiClient.get<{ data: Asset[] }>(`${hospitalBase(orgSlug)}/assets`, search ? { search } : undefined).then(unwrapList),
  get: (orgSlug: string, assetId: string) => apiClient.get<Asset>(`${hospitalBase(orgSlug)}/assets/${assetId}`),
  listMaintenance: (orgSlug: string, assetId: string) =>
    apiClient.get<{ data: AssetMaintenanceRecord[] }>(`${hospitalBase(orgSlug)}/assets/${assetId}/maintenance`).then(unwrapList),

  // Equipment linkage — reference only, see the schema doc comments on Bed/TheatreBooking/ICUEpisode.
  setBedEquipment: (orgSlug: string, bedId: string, assetIds: string[]) =>
    apiClient.put(`${hospitalBase(orgSlug)}/beds/${bedId}/equipment`, { asset_ids: assetIds }),
  setBookingEquipment: (orgSlug: string, bookingId: string, assetIds: string[]) =>
    apiClient.put(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/equipment`, { asset_ids: assetIds }),
  setEpisodeEquipment: (orgSlug: string, episodeId: string, assetIds: string[]) =>
    apiClient.patch(`${hospitalBase(orgSlug)}/icu-episodes/${episodeId}`, { equipment_asset_ids: assetIds }),
};
