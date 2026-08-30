'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { auditLogApi } from '@/lib/api/audit-log';

export function useAuditLog(page: number, limit = 20, enabled = true) {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) ?? '';
  return useQuery({
    queryKey: ['hospital', 'audit-log', orgSlug, page, limit],
    queryFn: () => auditLogApi.list(orgSlug, page, limit),
    enabled: !!orgSlug && enabled,
    placeholderData: (prev) => prev,
  });
}
