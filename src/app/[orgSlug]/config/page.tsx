'use client';

import { useEffect, useState } from 'react';
import { Building2, CalendarClock, Loader2, LogOut, Save, Settings } from 'lucide-react';
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

const DAYS: { key: keyof OperatingHours; label: string; short: string }[] = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
  { key: 'sat', label: 'Saturday', short: 'Sat' },
  { key: 'sun', label: 'Sunday', short: 'Sun' },
];

const DEFAULT_DAY: OperatingHoursDay = { open: '08:00', close: '18:00' };

const LANDING_VIEWS = [
  { value: '', label: 'Dashboard (default)' },
  { value: 'consultation_queue', label: 'Consultation Queue' },
  { value: 'triage', label: 'Triage' },
  { value: 'billing_queue', label: 'Billing Queue' },
];

/** True if every day currently has the exact same open/close and none are individually closed —
 *  the common case, and the state the "same every day" toggle collapses back down to. */
function isUniform(hours: OperatingHours): OperatingHoursDay | null {
  const values = DAYS.map(({ key }) => hours[key] ?? DEFAULT_DAY);
  const first = values[0];
  if (values.some((d) => d.closed)) return null;
  if (values.every((d) => d.open === first.open && d.close === first.close)) return first;
  return null;
}

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-accent/5 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
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
  const [uniformHours, setUniformHours] = useState(true);

  useEffect(() => {
    if (!config) return;
    setAutoLogout(config.settings?.auto_logout_minutes != null ? String(config.settings.auto_logout_minutes) : '');
    setLandingView(config.settings?.default_landing_view ?? '');
    const initial = config.settings?.operating_hours ?? {};
    setHours(initial);
    setUniformHours(Object.keys(initial).length === 0 || !!isUniform(initial));
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

  const applyToAllDays = (day: OperatingHoursDay) => {
    const next: OperatingHours = {};
    for (const { key } of DAYS) next[key] = { ...day };
    setHours(next);
  };

  const toggleDay = (day: keyof OperatingHours, closed: boolean) => {
    setHours((prev) => ({ ...prev, [day]: { ...(prev[day] ?? DEFAULT_DAY), closed } }));
  };

  const setDayTime = (day: keyof OperatingHours, field: 'open' | 'close', value: string) => {
    setHours((prev) => ({ ...prev, [day]: { ...(prev[day] ?? DEFAULT_DAY), [field]: value } }));
  };

  const uniform = isUniform(hours) ?? DEFAULT_DAY;

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
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Config"
        subtitle="Facility plan and operating settings for this tenant"
        icon={<Settings className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <Card>
          <CardHeader className="flex-row items-center gap-2.5">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">Plan & Facility</span>
          </CardHeader>
          {isLoading || !config ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <CardContent className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <InfoTile label="Tenant" value={config.tenant_name} />
              <InfoTile label="Slug" value={<span className="font-mono text-xs">{config.tenant_slug}</span>} />
              <InfoTile label="Status" value={<Badge variant={config.status === 'active' ? 'success' : 'outline'}>{config.status}</Badge>} />
              <InfoTile label="Facility Type" value={<span className="capitalize">{config.facility_type || '—'}</span>} />
              <div className="col-span-2 lg:col-span-1">
                <InfoTile
                  label="Enabled Modules"
                  value={
                    (config.enabled_modules ?? []).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {(config.enabled_modules ?? []).map((m) => (
                          <Badge key={m} variant="outline">{m}</Badge>
                        ))}
                      </div>
                    ) : (
                      '—'
                    )
                  }
                />
              </div>
              <div className="col-span-2 lg:col-span-1 flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                Last synced {config.synced_at ? new Date(config.synced_at).toLocaleString() : '—'}
              </div>
            </CardContent>
          )}
        </Card>

        {!isLoading && config && (
          <Can
            permission={P.CONFIG_MANAGE}
            fallback={
              <Card>
                <CardContent className="py-10 flex flex-col items-center text-center gap-2">
                  <LogOut className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-semibold">Facility settings are admin-managed</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Viewing or changing operating settings requires the <code className="font-mono">hospital.config.manage</code> permission.
                  </p>
                </CardContent>
              </Card>
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
                <div className="grid gap-4 sm:grid-cols-2">
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
                      <p className={helpCls}>Minutes idle before a shared terminal signs out. Blank = platform default.</p>
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
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`${labelCls} mb-0`}>Operating hours</label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={uniformHours}
                        onChange={(e) => {
                          setUniformHours(e.target.checked);
                          if (e.target.checked) applyToAllDays(uniform);
                        }}
                      />
                      Same every day
                    </label>
                  </div>

                  {uniformHours ? (
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-accent/5 p-3">
                      <input
                        type="time"
                        className={`${inputCls} w-auto tabular-nums`}
                        value={uniform.open}
                        onChange={(e) => applyToAllDays({ ...uniform, open: e.target.value })}
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input
                        type="time"
                        className={`${inputCls} w-auto tabular-nums`}
                        value={uniform.close}
                        onChange={(e) => applyToAllDays({ ...uniform, close: e.target.value })}
                      />
                      <span className="text-xs text-muted-foreground ml-1">every day</span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                      {DAYS.map(({ key, label }) => {
                        const day = hours[key];
                        const closed = day?.closed ?? false;
                        return (
                          <div key={key} className="flex items-center gap-3 px-3 py-2 bg-card">
                            <span className="text-sm w-24 shrink-0">{label}</span>
                            {closed ? (
                              <span className="text-xs text-muted-foreground flex-1">Closed</span>
                            ) : (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="time"
                                  className={`${inputCls} w-auto tabular-nums py-1.5`}
                                  value={day?.open ?? DEFAULT_DAY.open}
                                  onChange={(e) => setDayTime(key, 'open', e.target.value)}
                                />
                                <span className="text-xs text-muted-foreground">to</span>
                                <input
                                  type="time"
                                  className={`${inputCls} w-auto tabular-nums py-1.5`}
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
                  )}
                </div>

                <Button className="w-full" disabled={updateConfig.isPending || !!autoLogoutError} onClick={handleSave}>
                  {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-1.5" /> Save Settings</>}
                </Button>
              </CardContent>
            </Card>
          </Can>
        )}
      </div>
    </div>
  );
}
