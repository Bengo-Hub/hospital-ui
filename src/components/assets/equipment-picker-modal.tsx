'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Stethoscope, X } from 'lucide-react';
import { Button, Input, Badge } from '@/components/ui/base';
import { Skeleton } from '@/components/ui/page';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useAssets } from '@/hooks/useAssets';

/** Shared "Linked Equipment" picker — reused wherever a Bed/TheatreBooking/ICUEpisode links
 * inventory-api Asset IDs (Sprint 6/7 gap-fill, 2026-09-02, brought forward from Sprint 9's
 * original plan). Multi-select checklist over the live Biomedical Equipment list, since a bed
 * (especially in ICU) or a theatre booking commonly has more than one piece of fixed equipment. */
export function EquipmentPickerModal({
  title,
  currentAssetIds,
  onSave,
  onClose,
}: {
  title: string;
  currentAssetIds: string[];
  onSave: (assetIds: string[]) => Promise<unknown>;
  onClose: () => void;
}) {
  const { data: assets, isLoading } = useAssets();
  const [selected, setSelected] = useState<Set<string>>(new Set(currentAssetIds));
  const [search, setSearch] = useState('');
  const [isPending, setIsPending] = useState(false);

  const filtered = useMemo(() => {
    const rows = assets ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((a) => a.name.toLowerCase().includes(q) || a.asset_tag.toLowerCase().includes(q));
  }, [assets, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setIsPending(true);
    try {
      await onSave(Array.from(selected));
      toast.success('Linked equipment updated');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to update linked equipment'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">Linked Equipment</h3>
              <p className="text-xs text-muted-foreground">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto">
          <Input placeholder="Search equipment by name or tag…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No biomedical equipment found. Register assets in Inventory first.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-xl border border-border divide-y divide-border">
              {filtered.map((a) => (
                <label key={a.id} className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-accent/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.has(a.id)}
                    onChange={() => toggle(a.id)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs font-mono">{a.asset_tag}</span>
                  </span>
                  {a.status !== 'active' && (
                    <Badge variant={a.status === 'maintenance' ? 'warning' : 'outline'} className="shrink-0">
                      {a.status}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          )}
          {selected.size > 0 && <p className="text-xs text-muted-foreground">{selected.size} item(s) linked</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-border shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
