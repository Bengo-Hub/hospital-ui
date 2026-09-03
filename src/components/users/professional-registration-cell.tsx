'use client';

// Professional license/registration number for internal clinical staff (KMPDC/Nursing Council/
// Pharmacy and Poisons Board etc.) — mvp-gap-backlog-2026-09-02.md's RBAC/user-management item.
// Distinct from facility-level KMPDC tracking (tenant config) and from a walk-in prescription's
// own free-text prescriber_license. Only settable AFTER a staff member's first real sign-in (the
// HospitalUser row is JIT-provisioned then, not at Invite Staff time) — see identity.Service.
// UpdateUserProfile's own doc comment on why InviteMemberModal has no matching fields.

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/base';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useUpdateProfessionalRegistration } from '@/hooks/useUsers';

const inputCls = 'w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelCls = 'text-xs font-semibold text-muted-foreground mb-1 block';

function EditModal({
  userId,
  currentNumber,
  currentBody,
  onClose,
}: {
  userId: string;
  currentNumber: string;
  currentBody: string;
  onClose: () => void;
}) {
  const update = useUpdateProfessionalRegistration();
  const [number, setNumber] = useState(currentNumber);
  const [body, setBody] = useState(currentBody);

  const handleSubmit = async () => {
    try {
      await update.mutateAsync({
        userId,
        data: { professional_registration_number: number.trim(), professional_registration_body: body.trim() },
      });
      toast.success('Professional registration updated');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to update professional registration'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">Professional Registration</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className={labelCls}>Registration Body</label>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={inputCls}
              placeholder="e.g. KMPDC, Nursing Council of Kenya, Pharmacy and Poisons Board"
              list="registration-bodies"
            />
            <datalist id="registration-bodies">
              <option value="KMPDC" />
              <option value="Nursing Council of Kenya" />
              <option value="Pharmacy and Poisons Board" />
              <option value="Clinical Officers Council" />
            </datalist>
          </div>
          <div>
            <label className={labelCls}>Registration Number</label>
            <input value={number} onChange={(e) => setNumber(e.target.value)} className={inputCls} placeholder="e.g. A12345" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProfessionalRegistrationCell({
  userId,
  number,
  body,
  canManage,
}: {
  userId: string;
  number?: string;
  body?: string;
  canManage: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {number || body ? (
        <span className="text-xs">
          <span className="font-medium">{number || '—'}</span>
          {body && <span className="text-muted-foreground ml-1">({body})</span>}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Not set</span>
      )}
      {canManage && (
        <button
          className="text-muted-foreground hover:text-primary"
          onClick={() => setEditing(true)}
          title="Edit professional registration"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
      {editing && (
        <EditModal
          userId={userId}
          currentNumber={number ?? ''}
          currentBody={body ?? ''}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
