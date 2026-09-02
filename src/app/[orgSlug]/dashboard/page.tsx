'use client';

import { useParams } from 'next/navigation';
import { useFacilityType } from '@/lib/facility-nomenclature';
import { ChemistDashboardView } from '@/components/dashboard/views/chemist-dashboard-view';
import { ClinicalDashboardView } from '@/components/dashboard/views/clinical-dashboard-view';

/** Thin shell — resolves facility type and renders the matching view, mirroring Pharmacy's own
 * shell+views split (components/pharmacy/page.tsx). A chemist landing on the same generic
 * patients/beds/lab-results stat cards every other tier sees was real, live-reported confusion
 * (2026-09-02) — those stats don't exist at chemist tier at all. */
export default function DashboardPage() {
  const orgSlug = useParams()?.orgSlug as string;
  const facilityType = useFacilityType();

  if (facilityType === 'chemist') {
    return <ChemistDashboardView orgSlug={orgSlug} />;
  }
  return <ClinicalDashboardView />;
}
