import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect(`/${process.env.NEXT_PUBLIC_TENANT_SLUG || 'codevertex'}`);
}
