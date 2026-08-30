'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useHospitalOutlets } from '@/hooks/useUsers';
import { useOutletStore } from '@/store/outlet';

/** Renders nothing for the (overwhelming majority) single-outlet tenants — the switcher only
 *  earns its place in the header once there's an actual choice to make. */
export function OutletSwitcher() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || '';
  const { data: outlets } = useHospitalOutlets();
  const storeOutlets = useOutletStore((s) => s.outlets);
  const selected = useOutletStore((s) => s.selectedOutlet);
  const setOutlets = useOutletStore((s) => s.setOutlets);
  const selectOutlet = useOutletStore((s) => s.selectOutlet);

  useEffect(() => {
    if (outlets && orgSlug) {
      setOutlets(orgSlug, outlets);
    }
  }, [outlets, orgSlug, setOutlets]);

  if (storeOutlets.length <= 1) return null;

  return (
    <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5">
      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <select
        value={selected?.id ?? ''}
        onChange={(e) => {
          const outlet = storeOutlets.find((o) => o.id === e.target.value);
          if (outlet) selectOutlet(orgSlug, outlet);
        }}
        className="bg-transparent text-xs font-bold focus:outline-none max-w-[140px] truncate"
        aria-label="Select outlet"
      >
        {storeOutlets.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}{o.is_hq ? ' (HQ)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
