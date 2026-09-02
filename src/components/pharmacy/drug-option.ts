import type { ComboboxOption } from '@bengo-hub/shared-ui-lib/combobox';
import type { DrugSearchItem } from '@/lib/api/pharmacy';

/** Shared SearchableCombobox option mapper for a drug-search result — used by both
 * NewPrescriptionModal and NewSaleModal so the picker looks identical everywhere it appears. */
export function drugToOption(item: DrugSearchItem): ComboboxOption {
  const hintParts = [item.sku, item.strength].filter(Boolean);
  return { value: item.sku, label: item.name, hint: hintParts.join(' · ') };
}
