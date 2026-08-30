'use client';

import { useState } from 'react';
import { FlaskConical, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge, Input } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { apiErrorMessage } from '@/lib/api/error-message';
import {
  useLabTestCatalogEntries,
  useCreateLabTestEntry,
  useUpdateLabTestEntry,
  useDeactivateLabTestEntry,
} from '@/hooks/useLab';
import type { LabTestCatalogEntry } from '@/lib/api/lab';

function EntryModal({ entry, onClose }: { entry: LabTestCatalogEntry | null; onClose: () => void }) {
  const isEdit = !!entry;
  const create = useCreateLabTestEntry();
  const update = useUpdateLabTestEntry();
  const [code, setCode] = useState(entry?.code ?? '');
  const [name, setName] = useState(entry?.name ?? '');
  const [specimenType, setSpecimenType] = useState(entry?.specimen_type ?? '');
  const [unit, setUnit] = useState(entry?.unit ?? '');
  const [referenceRange, setReferenceRange] = useState(entry?.reference_range ?? '');
  const [turnaroundHours, setTurnaroundHours] = useState(entry?.turnaround_hours != null ? String(entry.turnaround_hours) : '');
  const [price, setPrice] = useState(entry ? String(entry.price) : '');
  const saving = create.isPending || update.isPending;

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error('Code and name are required');
      return;
    }
    try {
      if (isEdit) {
        await update.mutateAsync({
          entryId: entry.id,
          data: {
            name: name.trim(), specimen_type: specimenType.trim() || undefined,
            unit: unit.trim() || undefined, reference_range: referenceRange.trim() || undefined,
            turnaround_hours: turnaroundHours.trim() ? Number(turnaroundHours) : undefined,
            price: price.trim() ? Number(price) : undefined,
          },
        });
        toast.success('Test updated');
      } else {
        await create.mutateAsync({
          code: code.trim(), name: name.trim(), specimen_type: specimenType.trim() || undefined,
          unit: unit.trim() || undefined, reference_range: referenceRange.trim() || undefined,
          turnaround_hours: turnaroundHours.trim() ? Number(turnaroundHours) : undefined,
          price: price.trim() ? Number(price) : undefined,
        });
        toast.success('Test added to catalogue');
      }
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to save lab test'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">{isEdit ? 'Edit Lab Test' : 'New Lab Test'}</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Code</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} disabled={isEdit} placeholder="e.g. FBC" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Price</label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 800" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Full Blood Count" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Specimen Type</label>
              <Input value={specimenType} onChange={(e) => setSpecimenType(e.target.value)} placeholder="e.g. Blood" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Unit</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. cells/µL" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Reference Range</label>
              <Input value={referenceRange} onChange={(e) => setReferenceRange(e.target.value)} placeholder="e.g. 4.5-11.0" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Turnaround (hours)</label>
              <Input type="number" value={turnaroundHours} onChange={(e) => setTurnaroundHours(e.target.value)} placeholder="e.g. 4" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Test'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LabTestCatalogPage() {
  const { data: entries, isLoading } = useLabTestCatalogEntries(true);
  const deactivate = useDeactivateLabTestEntry();
  const [modalEntry, setModalEntry] = useState<LabTestCatalogEntry | null | undefined>(undefined);

  const rows = entries ?? [];

  const handleDeactivate = async (entry: LabTestCatalogEntry) => {
    try {
      await deactivate.mutateAsync(entry.id);
      toast.success('Test deactivated');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to deactivate test'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Lab Test Catalog"
        subtitle="Your facility's own tests, additive to the global starter catalogue"
        icon={<FlaskConical className="h-5 w-5" />}
        actions={
          <Can permission="hospital.lab.manage">
            <Button className="gap-2" onClick={() => setModalEntry(null)}>
              <Plus className="h-4 w-4" />
              New Test
            </Button>
          </Can>
        }
      />

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="h-10 w-10" />}
            title="No tenant-specific tests yet"
            description="Tests you add here appear alongside the global starter catalogue when ordering."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Specimen</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((entry) => (
                  <tr key={entry.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs">{entry.code}</td>
                    <td className="px-4 py-3.5 font-medium">{entry.name}</td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs">{entry.specimen_type || '—'}</td>
                    <td className="px-4 py-3.5 text-right font-mono">{entry.price.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={entry.is_active ? 'success' : 'outline'}>{entry.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Can permission="hospital.lab.manage">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setModalEntry(entry)}>Edit</Button>
                          {entry.is_active && (
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDeactivate(entry)}>
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalEntry !== undefined && <EntryModal entry={modalEntry} onClose={() => setModalEntry(undefined)} />}
    </div>
  );
}
