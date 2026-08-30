'use client';

import { useState } from 'react';
import { Banknote, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge, Input } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { apiErrorMessage } from '@/lib/api/error-message';
import {
  useBillableItemCatalog,
  useCreateCatalogItem,
  useUpdateCatalogItem,
  useDeactivateCatalogItem,
} from '@/hooks/useBilling';
import type {
  BillableItemCatalogRow,
  BillableItemDepartment,
  BillableItemAppliesTo,
  BillableItemCollectionMode,
} from '@/lib/api/billing';

const DEPARTMENTS: BillableItemDepartment[] = [
  'records', 'triage', 'consultation', 'lab', 'pharmacy', 'theatre', 'inpatient', 'mortuary',
];
const APPLIES_TO: BillableItemAppliesTo[] = ['all', 'first_visit', 'return_visit'];
const COLLECTION_MODES: BillableItemCollectionMode[] = ['billing_queue', 'direct', 'either'];

function ItemModal({ item, onClose }: { item: BillableItemCatalogRow | null; onClose: () => void }) {
  const isEdit = !!item;
  const create = useCreateCatalogItem();
  const update = useUpdateCatalogItem();
  const [department, setDepartment] = useState<BillableItemDepartment>(item?.department ?? 'records');
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : '');
  const [appliesTo, setAppliesTo] = useState<BillableItemAppliesTo>(item?.applies_to ?? 'all');
  const [requiresPrepayment, setRequiresPrepayment] = useState(item?.requires_prepayment ?? false);
  const [collectionMode, setCollectionMode] = useState<BillableItemCollectionMode>(item?.collection_mode ?? 'billing_queue');
  const saving = create.isPending || update.isPending;

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error('Code and name are required');
      return;
    }
    const priceValue = price.trim() === '' ? undefined : Number(price);
    try {
      if (isEdit) {
        await update.mutateAsync({
          itemId: item.id,
          data: {
            name: name.trim(),
            price: priceValue,
            clear_price: price.trim() === '',
            applies_to: appliesTo,
            requires_prepayment: requiresPrepayment,
            collection_mode: collectionMode,
          },
        });
        toast.success('Item updated');
      } else {
        await create.mutateAsync({
          department, code: code.trim(), name: name.trim(), price: priceValue,
          applies_to: appliesTo, requires_prepayment: requiresPrepayment, collection_mode: collectionMode,
        });
        toast.success('Item added');
      }
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to save catalog item'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">{isEdit ? 'Edit Billing Item' : 'New Billing Item'}</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Department</label>
              <select
                value={department}
                disabled={isEdit}
                onChange={(e) => setDepartment(e.target.value as BillableItemDepartment)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm capitalize disabled:opacity-60"
              >
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Code</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} disabled={isEdit} placeholder="e.g. REGISTRATION_FEE" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Registration Fee" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Price <span className="font-normal">(leave blank if priced elsewhere, e.g. drugs/lab tests)</span>
            </label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Applies To</label>
              <select
                value={appliesTo}
                onChange={(e) => setAppliesTo(e.target.value as BillableItemAppliesTo)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm capitalize"
              >
                {APPLIES_TO.map((a) => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Collection Mode</label>
              <select
                value={collectionMode}
                onChange={(e) => setCollectionMode(e.target.value as BillableItemCollectionMode)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm capitalize"
              >
                {COLLECTION_MODES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={requiresPrepayment} onChange={(e) => setRequiresPrepayment(e.target.checked)} />
            Requires prepayment before the clinical step proceeds
          </label>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BillingSettingsPage() {
  const { data: items, isLoading } = useBillableItemCatalog(true);
  const deactivate = useDeactivateCatalogItem();
  const [modalItem, setModalItem] = useState<BillableItemCatalogRow | null | undefined>(undefined);

  const rows = items ?? [];

  const handleDeactivate = async (item: BillableItemCatalogRow) => {
    try {
      await deactivate.mutateAsync(item.id);
      toast.success('Item deactivated');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to deactivate item'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Billing Item Catalog"
        subtitle="Your facility's configured price list — drives billing_queue vs. direct collection and prepayment gating per item"
        icon={<Banknote className="h-5 w-5" />}
        actions={
          <Can permission="hospital.billing.manage_catalog">
            <Button className="gap-2" onClick={() => setModalItem(null)}>
              <Plus className="h-4 w-4" />
              New Item
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
          <EmptyState icon={<Banknote className="h-10 w-10" />} title="No billing items configured" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Collection</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 capitalize text-muted-foreground text-xs">{item.department}</td>
                    <td className="px-4 py-3.5 font-mono text-xs">{item.code}</td>
                    <td className="px-4 py-3.5 font-medium">{item.name}</td>
                    <td className="px-4 py-3.5 text-right font-mono">{item.price != null ? item.price.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs capitalize">{item.collection_mode.replace('_', ' ')}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={item.is_active ? 'success' : 'outline'}>{item.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Can permission="hospital.billing.manage_catalog">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setModalItem(item)}>Edit</Button>
                          {item.is_active && (
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDeactivate(item)}>
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

      {modalItem !== undefined && <ItemModal item={modalItem} onClose={() => setModalItem(undefined)} />}
    </div>
  );
}
