'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { icuApi, type StartEpisodeInput, type UpdateEpisodeInput } from '@/lib/api/icu';

function useOrgSlug(): string {
  const params = useParams();
  return (params?.orgSlug as string) ?? '';
}

function invalidateICU(qc: ReturnType<typeof useQueryClient>, orgSlug: string) {
  qc.invalidateQueries({ queryKey: ['hospital', 'icu-episodes', orgSlug] });
}

export function useICUEpisodes(status: 'active' | 'all' = 'active') {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'icu-episodes', orgSlug, status],
    queryFn: () => icuApi.listEpisodes(orgSlug, status),
    enabled: !!orgSlug,
    refetchInterval: 15000,
  });
}

export function useStartICUEpisode() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StartEpisodeInput) => icuApi.startEpisode(orgSlug, data),
    onSuccess: () => invalidateICU(qc, orgSlug),
  });
}

export function useUpdateICUEpisode() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ episodeId, data }: { episodeId: string; data: UpdateEpisodeInput }) =>
      icuApi.updateEpisode(orgSlug, episodeId, data),
    onSuccess: () => invalidateICU(qc, orgSlug),
  });
}

export function useEndICUEpisode() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (episodeId: string) => icuApi.endEpisode(orgSlug, episodeId),
    onSuccess: () => invalidateICU(qc, orgSlug),
  });
}
