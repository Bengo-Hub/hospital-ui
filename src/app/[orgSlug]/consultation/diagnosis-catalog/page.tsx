'use client';

// Completeness-audit gap-fill (2026-09-03): the diagnosis catalogue previously had no admin page
// at all — the only way to see or add an entry was the bolt-on "+ Catalog" button buried inside
// Consultation's examination form (consultation/queue/page.tsx). This page gives it a real home,
// nested under consultation/ alongside queue/ the same way Laboratory nests its worklist +
// catalog (laboratory/, laboratory/catalog/) and Billing nests its queue + settings
// (billing/queue/, billing/settings/). Mirrors laboratory/catalog/page.tsx's list/search/create
// shape. hospital-api's diagnosis-catalog route now also exposes PUT/deactivate (2026-09-03,
// commit 1d0045b) — but only for TENANT-owned entries (is_global: false); a global entry's id
// 404s on either endpoint since global rows live in a table neither one touches, so those rows
// get no Edit/Deactivate actions at all.
//
// CreateDiagnosisModal now lives in components/clinical/create-diagnosis-modal.tsx, shared with
// Consultation's exam-form diagnosis picker's "+ Add to catalog" footer action.

import { useMemo, useState } from 'react';
import { Ban, ListChecks, Loader2, Pencil, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge, Input } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiErrorMessage } from '@/lib/api/error-message';
import { CreateDiagnosisModal } from '@/components/clinical/create-diagnosis-modal';
import { useDiagnosisCatalog, useUpdateDiagnosisEntry, useDeactivateDiagnosisEntry } from '@/hooks/useClinical';
import type { DiagnosisEntry } from '@/lib/api/clinical';

function EditDiagnosisModal({ entry, onClose }: { entry: DiagnosisEntry; onClose: () => void }) {
  const update = useUpdateDiagnosisEntry();
  const [name, setName] = useState(entry.name);
  const [category, setCategory] = useState(entry.category ?? '');

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await update.mutateAsync({ entryId: entry.id, data: { name: name.trim(), category: category.trim() || undefined } });
      toast.success('Diagnosis updated');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to update diagnosis'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">Edit Diagnosis</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Code</label>
            <Input value={entry.code} disabled readOnly className="opacity-60" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acute upper respiratory infection" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category (optional)</label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Respiratory" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={update.isPending}>Cancel</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DiagnosisCatalogPage() {
  const { data: catalog, isLoading } = useDiagnosisCatalog();
  const deactivateEntry = useDeactivateDiagnosisEntry();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DiagnosisEntry | null>(null);
  const [deactivating, setDeactivating] = useState<DiagnosisEntry | null>(null);

  // No server-side search on GET /diagnosis-catalog — the whole catalogue is fetched once
  // (5-minute staleTime, same as the picker in Consultation) and filtered client-side here.
  const rows = useMemo(() => {
    const all = catalog ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        (d.category ?? '').toLowerCase().includes(q),
    );
  }, [catalog, search]);

  const handleConfirmDeactivate = async () => {
    if (!deactivating) return;
    try {
      await deactivateEntry.mutateAsync(deactivating.id);
      toast.success('Diagnosis deactivated');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to deactivate diagnosis'));
    } finally {
      setDeactivating(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Diagnosis Catalog"
        subtitle="Global diagnoses plus your facility's own additions, used by Consultation's diagnosis picker"
        icon={<ListChecks className="h-5 w-5" />}
        actions={
          <Can permission="hospital.consultation.manage">
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Diagnosis
            </Button>
          </Can>
        }
      />

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code, name, or category…"
          className="pl-10"
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="h-10 w-10" />}
            title={search ? 'No diagnosis matches that search' : 'No diagnoses in the catalogue yet'}
            description="Diagnoses added here appear in Consultation's diagnosis picker alongside the global catalogue."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Scope</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((entry) => (
                  <tr key={entry.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs">{entry.code}</td>
                    <td className="px-4 py-3.5 font-medium">{entry.name}</td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs">{entry.category || '—'}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={entry.is_global ? 'outline' : 'success'}>{entry.is_global ? 'Global' : 'Facility'}</Badge>
                      {entry.is_active === false && <Badge variant="outline" className="ml-1.5">Inactive</Badge>}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {/* Global rows have nothing to edit here — they live in a table this
                       * endpoint never touches, so calling PUT/deactivate on one just 404s. */}
                      {!entry.is_global && (
                        <Can permission="hospital.consultation.manage">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(entry)}>
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            {entry.is_active !== false && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => setDeactivating(entry)}
                              >
                                <Ban className="h-3.5 w-3.5" />
                                Deactivate
                              </Button>
                            )}
                          </div>
                        </Can>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {createOpen && <CreateDiagnosisModal onClose={() => setCreateOpen(false)} onCreated={() => setCreateOpen(false)} />}
      {editing && <EditDiagnosisModal entry={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={deactivating !== null}
        variant="danger"
        title="Deactivate this diagnosis?"
        description={
          deactivating
            ? `"${deactivating.name}" will no longer appear in Consultation's diagnosis picker. This can't be undone from here.`
            : ''
        }
        confirmLabel="Deactivate"
        onCancel={() => setDeactivating(null)}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}
