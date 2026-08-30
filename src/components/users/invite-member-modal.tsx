'use client';

import { useState } from 'react';
import { Copy, Loader2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/base';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useHospitalRoles, useHospitalOutlets, useInviteMember } from '@/hooks/useUsers';
import type { InviteMemberResult } from '@/lib/api/users';

const inputCls = 'w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelCls = 'text-xs font-semibold text-muted-foreground mb-1 block';

interface InviteMemberModalProps {
  onClose: () => void;
}

/** Invites a new (or attaches an existing) staff member by email — relays to auth-api's own
 *  S2S member endpoint (identity.Service.InviteMember), the same real mechanism every other
 *  Codevertex frontend's own staff-invite flow uses. A brand-new account's one-time temp
 *  password is shown once, exactly like auth-ui's own TempPasswordRevealDialog. */
export function InviteMemberModal({ onClose }: InviteMemberModalProps) {
  const { data: roles = [] } = useHospitalRoles();
  const { data: outlets = [] } = useHospitalOutlets();
  const invite = useInviteMember();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [outletId, setOutletId] = useState('');
  const [result, setResult] = useState<InviteMemberResult | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !roleCode) {
      toast.error('Email and role are required');
      return;
    }
    try {
      const res = await invite.mutateAsync({
        email: email.trim(),
        name: name.trim() || undefined,
        role_code: roleCode,
        outlet_id: outletId || undefined,
      });
      setResult(res);
      if (!res.temp_password) {
        toast.success('Staff member invited — role attached.');
      }
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to invite staff member'));
    }
  };

  const copyPassword = () => {
    if (!result?.temp_password) return;
    navigator.clipboard?.writeText(result.temp_password);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-4.5 w-4.5 text-primary" />
            </div>
            <h3 className="font-bold text-base">Invite Staff</h3>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          <div className="p-6 space-y-4">
            <p className="text-sm">
              <span className="font-semibold">{email}</span> {result.temp_password ? 'was created and invited.' : 'already had an account — role attached.'}
            </p>
            {result.temp_password && (
              <div className="space-y-2">
                <label className={labelCls}>One-time temporary password</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-accent/20 border border-border rounded-lg px-3 py-2 text-sm font-mono">
                    {result.temp_password}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyPassword} title="Copy">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this with them now — it will not be shown again. They must sign in and change it.
                </p>
              </div>
            )}
            <Button className="w-full" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane.doe@example.com" autoFocus />
            </div>
            <div>
              <label className={labelCls}>Full name</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <label className={labelCls}>Role *</label>
              <select className={inputCls} value={roleCode} onChange={(e) => setRoleCode(e.target.value)}>
                <option value="">Select a role…</option>
                {roles.map((r) => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
            </div>
            {outlets.length > 1 && (
              <div>
                <label className={labelCls}>Outlet</label>
                <select className={inputCls} value={outletId} onChange={(e) => setOutletId(e.target.value)}>
                  <option value="">Default (tenant HQ)</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              If this email already has an account, they&apos;ll simply be attached to this tenant with the chosen role — no duplicate account is created.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" disabled={invite.isPending || !email.trim() || !roleCode} onClick={handleSubmit}>
                {invite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invite'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
