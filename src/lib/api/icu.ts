/** hospital-api Sprint 7 domain: ICU/critical-care monitoring. Field names match hospital-api's
 * Ent-generated JSON tags — see internal/ent/schema/icu_episode.go. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';

export type SeverityFlag = 'stable' | 'guarded' | 'critical';

export interface ICUEpisode {
  id: string;
  tenant_id: string;
  admission_id: string;
  bed_id: string;
  severity_flag: SeverityFlag;
  monitoring_notes?: string;
  started_by?: string;
  started_at: string;
  ended_at?: string;
}

export interface StartEpisodeInput {
  admission_id: string;
  severity_flag?: SeverityFlag;
  monitoring_notes?: string;
}

export interface UpdateEpisodeInput {
  severity_flag?: SeverityFlag;
  monitoring_notes?: string;
}

export const icuApi = {
  startEpisode: (orgSlug: string, data: StartEpisodeInput) =>
    apiClient.post<ICUEpisode>(`${hospitalBase(orgSlug)}/icu-episodes`, data),
  listEpisodes: (orgSlug: string, status: 'active' | 'all' = 'active') =>
    apiClient.get<{ data: ICUEpisode[] }>(`${hospitalBase(orgSlug)}/icu-episodes`, { status }).then(unwrapList),
  getEpisode: (orgSlug: string, episodeId: string) =>
    apiClient.get<ICUEpisode>(`${hospitalBase(orgSlug)}/icu-episodes/${episodeId}`),
  updateEpisode: (orgSlug: string, episodeId: string, data: UpdateEpisodeInput) =>
    apiClient.patch<ICUEpisode>(`${hospitalBase(orgSlug)}/icu-episodes/${episodeId}`, data),
  endEpisode: (orgSlug: string, episodeId: string) =>
    apiClient.post<ICUEpisode>(`${hospitalBase(orgSlug)}/icu-episodes/${episodeId}/end`),
};
