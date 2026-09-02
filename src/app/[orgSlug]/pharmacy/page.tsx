'use client';

import { useParams } from 'next/navigation';
import { useFacilityType } from '@/lib/facility-nomenclature';
import { ChemistPharmacyView } from '@/components/pharmacy/views/chemist-pharmacy-view';
import { ClinicalPharmacyView } from '@/components/pharmacy/views/clinical-pharmacy-view';

/** Thin shell: resolves the facility type and renders the matching per-use-case view — mirrors
 * pos-terminal's own shell/provider/views split (see pos-terminal-modular-architecture.md):
 * never branch UI inline by facility type in one monolith component. Shared data/mutations stay
 * exactly where they already are (usePharmacy.ts hooks) — nothing is duplicated between views,
 * each just presents it differently for its tier. */
export default function PharmacyPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const facilityType = useFacilityType();

  if (facilityType === 'chemist') {
    return <ChemistPharmacyView orgSlug={orgSlug} />;
  }
  return <ClinicalPharmacyView orgSlug={orgSlug} />;
}
