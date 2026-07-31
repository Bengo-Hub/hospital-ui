import { ReactNode } from 'react';
import { OrgShell } from './org-shell';

export default function OrgLayout({ children }: { children: ReactNode }) {
    return <OrgShell>{children}</OrgShell>;
}
