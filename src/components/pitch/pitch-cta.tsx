import { Button } from '@/components/ui/base';
import { Mail } from 'lucide-react';

const CONTACT_EMAIL = 'codevertexitsolutions@gmail.com';

function mailtoHref(): string {
  const subject = encodeURIComponent('Codevertex Afya, discovery call');
  const body = encodeURIComponent(
    "Hi Codevertex team,\n\nI'd like to book a discovery call for Codevertex Afya. A bit about our facility:\n- Facility name:\n- Level / bed count:\n- Location:\n\nThanks!",
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export function PitchCta() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-brand-emphasis text-brand-contrast">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-5">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          Ready to move off paper registers before the next deadline lands?
        </h2>
        <p className="text-brand-contrast/75 max-w-xl leading-relaxed">
          Tell us a bit about your facility and we will confirm a tier, send a firm quote, and have
          you live, typically within a few weeks depending on data migration scope.
        </p>
        <a href={mailtoHref()}>
          <Button size="lg" className="bg-brand-contrast text-brand-emphasis hover:bg-brand-contrast/90 gap-2">
            <Mail className="h-4 w-4" />
            Book a discovery call
          </Button>
        </a>
      </div>
    </section>
  );
}
