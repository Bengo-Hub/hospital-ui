'use client';

// Completeness-audit gap-fill (2026-09-03): the diagnosis catalogue previously had no admin page
// at all — the only way to see or add an entry was the bolt-on "+ Catalog" button buried inside
// Consultation's examination form (consultation/queue/page.tsx). This page gives it a real home,
// nested under consultation/ alongside queue/ the same way Laboratory nests its worklist +
// catalog (laboratory/, laboratory/catalog/) and Billing nests its queue + settings
// (billing/queue/, billing/settings/). Mirrors laboratory/catalog/page.tsx's list/search/create
// shape, but hospital-api's diagnosis-catalog route only exposes GET (list) and POST (create) —
// no PUT/DELETE — so unlike the lab-catalog page there are no edit/deactivate row actions here.

import { useMemo, useState } from 'react';
import { ListChecks, Loader2, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge, Input } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useDiagnosisCatalog, useCreateDiagnosisEntry } from '@/hooks/useClinical';

function CreateDiagnosisModal({ onClose }: { onClose: () => void }) {
  const create = useCreateDiagnosisEntry();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error('Code and name are required');
      return;
    }
    try {
      await create.mutateAsync({ code: code.trim(), name: name.trim(), category: category.trim() || undefined });
      toast.success('Diagnosis added to catalogue');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to add diagnosis'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">New Diagnosis</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Code</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. J06.9" />
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
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Diagnosis
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DiagnosisCatalogPage() {
  const { data: catalog, isLoading } = useDiagnosisCatalog();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {createOpen && <CreateDiagnosisModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
