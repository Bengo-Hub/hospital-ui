'use client';

import { Plus } from 'lucide-react';
import { SearchableCombobox } from '@bengo-hub/shared-ui-lib/combobox';

export interface SelectOption {
  id: string;
  name: string;
  /** Optional secondary text on the row (MRN, visit number, room, code…). */
  hint?: string;
}

interface Props {
  value: string;
  onChange: (id: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Opens the parent-owned create dialog. When omitted, the add action is hidden. */
  onAddClick?: () => void;
  addLabel?: string;
  /**
   * Debounced server-side fallback for lists whose backend paginates or isn't fully prefetched
   * by the caller. Fires automatically when the prefetched `options` yield fewer than
   * `remoteThreshold` local matches. Omit for small, fully-prefetched lists.
   */
  onRemoteSearch?: (query: string) => Promise<SelectOption[]>;
  remoteThreshold?: number;
  /** Fallback display name when `value` is pre-set (edit/amend) but its record isn't in
   * `options` (e.g. it lives past the prefetched page) — avoids showing `placeholder` for an
   * already-selected value. */
  valueLabel?: string;
}

// CreatableSelect is hospital-ui's entity picker: the shared SearchableCombobox (type-to-filter
// over the prefetched list, plus an optional onRemoteSearch fallback) plus an "+ Add new" footer
// action that opens the parent-owned create dialog — each entity keeps its own form, this
// component only standardises the pick + add affordance. Ported verbatim from inventory-ui's
// component of the same name/shape (2026-09-03) so every Codevertex frontend that adopts this
// picker looks and behaves identically — replaces plain native <select> dropdowns wherever the
// listed entity is one a user might need to create on the spot (patient, visit, ward/bed…).
export function CreatableSelect({ value, onChange, options, placeholder = 'Select...', required, disabled, onAddClick, addLabel = 'Add new', onRemoteSearch, remoteThreshold, valueLabel }: Props) {
  return (
    <div className="relative">
      <SearchableCombobox
        options={options.map((o) => ({ value: o.id, label: o.name, hint: o.hint }))}
        value={value}
        onChange={(v) => onChange(v)}
        placeholder={placeholder}
        disabled={disabled}
        clearable={!required}
        valueLabel={valueLabel}
        onRemoteSearch={onRemoteSearch ? async (q) => (await onRemoteSearch(q)).map((o) => ({ value: o.id, label: o.name, hint: o.hint })) : undefined}
        remoteThreshold={remoteThreshold}
        footer={
          onAddClick ? (
            <button
              type="button"
              onClick={onAddClick}
              disabled={disabled}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-muted/60 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> {addLabel}
            </button>
          ) : undefined
        }
      />
      {/* Participates in native form validation the way the old <select required> did. */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      )}
    </div>
  );
}
