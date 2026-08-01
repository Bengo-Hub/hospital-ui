import { Badge, Button, Card, CardContent, CardHeader } from '@/components/ui/base';
import { Check } from 'lucide-react';

const CONTACT_EMAIL = 'codevertexitsolutions@gmail.com';

interface Tier {
  name: string;
  price: string;
  cadence: string;
  bestFor: string;
  features: string[];
  highlight?: boolean;
}

const TIERS: Tier[] = [
  {
    name: 'Afya Clinic',
    price: 'KES 7,500',
    cadence: '/month',
    bestFor: 'Dispensaries & health centres, single outlet',
    features: [
      'Reception, consultation & pharmacy',
      'Billing & cashier with M-Pesa & card',
      'SHA/SHIF, NHIF-ready · eTIMS opt-in',
    ],
  },
  {
    name: 'Afya Facility',
    price: 'KES 18,000',
    cadence: '/month',
    bestFor: 'Sub-county hospitals, outpatient + inpatient',
    features: [
      'Everything in Afya Clinic',
      'In-house laboratory & inpatient management',
      'SHA/SHIF + NHIF claims & eligibility checks',
    ],
    highlight: true,
  },
  {
    name: 'Afya Hospital',
    price: 'From KES 40,000',
    cadence: '/month per branch',
    bestFor: 'County referral & large private hospitals',
    features: [
      'Everything in Afya Facility',
      'Theatre, Maternity & Morgue management',
      'Multi-branch reporting & API access',
    ],
  },
];

function mailtoHref(tier: string): string {
  const subject = encodeURIComponent(`Codevertex Afya — ${tier} enquiry`);
  const body = encodeURIComponent(
    `Hi Codevertex team,\n\nI'd like a quote for ${tier}. A bit about our facility:\n- Facility name:\n- Level / bed count:\n- Location:\n\nThanks!`,
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export function PricingTeaser() {
  return (
    <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
            One system, priced by facility size.
          </h2>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed">
            Every tier shares the same patient record — move up whenever you&apos;re ready and
            nothing is re-entered. Outright licences and multi-month prepay discounts are available;
            talk to us for a firm quote.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={tier.highlight ? 'border-brand-primary/40 shadow-lg ring-1 ring-brand-primary/20' : ''}
            >
              <CardHeader className="flex flex-col items-start gap-3">
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-black text-foreground">{tier.name}</h3>
                  {tier.highlight && <Badge>Most popular</Badge>}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tier.bestFor}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div>
                  <span className="text-3xl font-black text-foreground tracking-tight tabular-nums">{tier.price}</span>
                  <span className="text-sm text-muted-foreground font-semibold ml-1">{tier.cadence}</span>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <Check className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href={mailtoHref(tier.name)} className="mt-auto">
                  <Button
                    className={
                      tier.highlight
                        ? 'w-full bg-brand-primary text-brand-contrast hover:bg-brand-emphasis'
                        : 'w-full'
                    }
                    variant={tier.highlight ? 'primary' : 'outline'}
                  >
                    Talk to sales
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices are in Kenyan Shillings and are a guide — your written quotation is final. Doesn&apos;t sit neatly in a
          tier? <a href={mailtoHref('Custom facility')} className="text-brand-primary font-semibold hover:underline">Talk to us</a>, we price the facility, not the brochure.
        </p>
      </div>
    </section>
  );
}
