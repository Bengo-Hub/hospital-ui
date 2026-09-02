'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { assetsApi } from '@/lib/api/assets';

function useOrgSlug(): string {
  const params = useParams();
  return (params?.orgSlug as string) ?? '';
}

export function useAssets(search?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'assets', orgSlug, search],
    queryFn: () => assetsApi.list(orgSlug, search),
    enabled: !!orgSlug,
    staleTime: 60_000,
  });
}

export function useAsset(assetId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'asset', orgSlug, assetId],
    queryFn: () => assetsApi.get(orgSlug, assetId as string),
    enabled: !!orgSlug && !!assetId,
  });
}

export function useAssetMaintenance(assetId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'asset-maintenance', orgSlug, assetId],
    queryFn: () => assetsApi.listMaintenance(orgSlug, assetId as string),
    enabled: !!orgSlug && !!assetId,
  });
}

export function useSetBedEquipment() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bedId, assetIds }: { bedId: string; assetIds: string[] }) => assetsApi.setBedEquipment(orgSlug, bedId, assetIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'ward-occupancy', orgSlug] }),
  });
}

export function useSetBookingEquipment() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, assetIds }: { bookingId: string; assetIds: string[] }) => assetsApi.setBookingEquipment(orgSlug, bookingId, assetIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospital', 'theatre-schedule', orgSlug] });
      qc.invalidateQueries({ queryKey: ['hospital', 'theatre-booking', orgSlug] });
    },
  });
}

export function useSetEpisodeEquipment() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ episodeId, assetIds }: { episodeId: string; assetIds: string[] }) => assetsApi.setEpisodeEquipment(orgSlug, episodeId, assetIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'icu-episodes', orgSlug] }),
  });
}
