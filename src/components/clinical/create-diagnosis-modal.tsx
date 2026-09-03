'use client';

// Extracted from `[orgSlug]/consultation/diagnosis-catalog/page.tsx` (2026-09-03) so it can be
// reused wherever a "create a new diagnosis catalogue entry" action is needed — the diagnosis-
// catalog admin page's own "New Diagnosis" button, and Consultation's exam-form diagnosis picker's
// "+ Add to catalog" footer action (consultation/queue/page.tsx, which used to have its own
// bolt-on "Or enter diagnosis manually" input + "+ Catalog" button instead of this dialog).
// Mirrors register-patient-modal.tsx's extraction pattern: same {onClose, onCreated} callback
// contract so each caller decides what to do with the freshly created entry (close only, vs.
// close + auto-select it).

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { Button, Input } from '@/components/ui/base';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useCreateDiagnosisEntry } from '@/hooks/useClinical';
import type { DiagnosisEntry } from '@/lib/api/clinical';

export function CreateDiagnosisModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (entry: DiagnosisEntry) => void;
}) {
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
      const entry = await create.mutateAsync({ code: code.trim(), name: name.trim(), category: category.trim() || undefined });
      toast.success('Diagnosis added to catalogue');
      onCreated(entry);
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
