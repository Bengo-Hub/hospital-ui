'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, Badge, Button } from '@/components/ui/base';
import { PageHeader, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { useHospitalConfig, useUpdateConfig } from '@/hooks/useUsers';
import { apiErrorMessage } from '@/lib/api/error-message';
import { P } from '@/lib/rbac/permissions';
import type { OperatingHours, OperatingHoursDay } from '@/lib/api/users';

const inputCls = 'w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelCls = 'text-sm font-semibold mb-1.5 block';
const helpCls = 'text-xs text-muted-foreground mt-1';

const DAYS: { key: keyof OperatingHours; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const DEFAULT_DAY: OperatingHoursDay = { open: '08:00', close: '18:00' };

const LANDING_VIEWS = [
  { value: '', label: 'Dashboard (default)' },
  { value: 'consultation_queue', label: 'Consultation Queue' },
  { value: 'triage', label: 'Triage' },
  { value: 'billing_queue', label: 'Billing Queue' },
];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export default function ConfigPage() {
  const { data: config, isLoading } = useHospitalConfig();
  const updateConfig = useUpdateConfig();

  const [autoLogout, setAutoLogout] = useState('');
  const [autoLogoutError, setAutoLogoutError] = useState('');
  const [landingView, setLandingView] = useState('');
  const [hours, setHours] = useState<OperatingHours>({});

  // Hydrate the form once config finishes loading — never before, so we don't overwrite an
  // in-progress edit if the query happens to refetch.
  useEffect(() => {
    if (!config) return;
    setAutoLogout(config.settings?.auto_logout_minutes != null ? String(config.settings.auto_logout_minutes) : '');
    setLandingView(config.settings?.default_landing_view ?? '');
    setHours(config.settings?.operating_hours ?? {});
  }, [config]);

  const validateAutoLogout = () => {
    if (autoLogout.trim() === '') {
      setAutoLogoutError('');
      return;
    }
    const n = Number(autoLogout);
    if (!Number.isInteger(n) || n < 1 || n > 240) {
      setAutoLogoutError('Enter a whole number of minutes between 1 and 240.');
    } else {
      setAutoLogoutError('');
    }
  };

  const toggleDay = (day: keyof OperatingHours, closed: boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: closed ? { ...(prev[day] ?? DEFAULT_DAY), closed: true } : { ...(prev[day] ?? DEFAULT_DAY), closed: false },
    }));
  };

  const setDayTime = (day: keyof OperatingHours, field: 'open' | 'close', value: string) => {
    setHours((prev) => ({ ...prev, [day]: { ...(prev[day] ?? DEFAULT_DAY), [field]: value } }));
  };

  const handleSave = async () => {
    validateAutoLogout();
    if (autoLogoutError) {
      toast.error('Fix the auto-logout value before saving.');
      return;
    }
    try {
      await updateConfig.mutateAsync({
        auto_logout_minutes: autoLogout.trim() === '' ? undefined : Number(autoLogout),
        default_landing_view: landingView || undefined,
        operating_hours: hours,
      });
      toast.success('Facility settings saved.');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to save settings'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Config"
        subtitle="Facility plan (read-only) and operating settings for this tenant"
        icon={<Settings className="h-5 w-5" />}
      />

      <Card>
        <CardHeader><span className="font-bold text-sm">Plan & Facility</span></CardHeader>
        {isLoading || !config ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div>
            <Row label="Tenant" value={config.tenant_name} />
            <Row label="Slug" value={<span className="font-mono text-xs">{config.tenant_slug}</span>} />
            <Row label="Status" value={<Badge variant={config.status === 'active' ? 'success' : 'outline'}>{config.status}</Badge>} />
            <Row label="Facility Type" value={<span className="capitalize">{config.facility_type || '—'}</span>} />
            <Row
              label="Enabled Modules"
              value={
                (config.enabled_modules ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 justify-end max-w-xs">
                    {(config.enabled_modules ?? []).map((m) => (
                      <Badge key={m} variant="outline">{m}</Badge>
                    ))}
                  </div>
                ) : (
                  '—'
                )
              }
            />
            <Row
              label="Last Synced"
              value={config.synced_at ? new Date(config.synced_at).toLocaleString() : '—'}
            />
          </div>
        )}
      </Card>

      {!isLoading && config && (
        <Can
          permission={P.CONFIG_MANAGE}
          fallback={
            <p className="text-xs text-muted-foreground px-1">
              Managing facility settings requires the <code className="font-mono">hospital.config.manage</code> permission.
            </p>
          }
        >
          <Card>
            <CardHeader>
              <span className="font-bold text-sm">Facility Operating Settings</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hospital-api-owned preferences only — branding and contact details are managed from your account portal.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className={labelCls}>Auto-logout after inactivity</label>
                <input
                  className={inputCls}
                  inputMode="numeric"
                  placeholder="e.g. 15"
                  value={autoLogout}
                  onChange={(e) => setAutoLogout(e.target.value)}
                  onBlur={validateAutoLogout}
                />
                {autoLogoutError ? (
                  <p className="text-xs text-destructive mt-1">{autoLogoutError}</p>
                ) : (
                  <p className={helpCls}>Minutes of inactivity before a shared terminal signs out automatically. Leave blank to use the platform default.</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Default landing page</label>
                <select className={inputCls} value={landingView} onChange={(e) => setLandingView(e.target.value)}>
                  {LANDING_VIEWS.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
                <p className={helpCls}>Where staff land right after signing in.</p>
              </div>

              <div>
                <label className={labelCls}>Operating hours</label>
                <div className="space-y-2">
                  {DAYS.map(({ key, label }) => {
                    const day = hours[key];
                    const closed = day?.closed ?? false;
                    return (
                      <div key={key} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                        <span className="text-sm w-28 shrink-0">{label}</span>
                        {closed ? (
                          <span className="text-xs text-muted-foreground flex-1">Closed</span>
                        ) : (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              className={`${inputCls} w-auto tabular-nums`}
                              value={day?.open ?? DEFAULT_DAY.open}
                              onChange={(e) => setDayTime(key, 'open', e.target.value)}
                            />
                            <span className="text-xs text-muted-foreground">to</span>
                            <input
                              type="time"
                              className={`${inputCls} w-auto tabular-nums`}
                              value={day?.close ?? DEFAULT_DAY.close}
                              onChange={(e) => setDayTime(key, 'close', e.target.value)}
                            />
                          </div>
                        )}
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                          <input type="checkbox" checked={closed} onChange={(e) => toggleDay(key, e.target.checked)} />
                          Closed
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button className="w-full" disabled={updateConfig.isPending || !!autoLogoutError} onClick={handleSave}>
                {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-1.5" /> Save Settings</>}
              </Button>
            </CardContent>
          </Card>
        </Can>
      )}
    </div>
  );
}
