import { ActivateInvitationView } from '@/features/auth';

export const metadata = {
  title: 'Activate Account - WorkNest',
  description: 'Complete your account setup and activation',
};

type ActivateInvitationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ActivateInvitationPage({
  searchParams,
}: ActivateInvitationPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const tokenParam = resolvedSearchParams?.token;
  const initialToken = Array.isArray(tokenParam) ? tokenParam[0] ?? '' : tokenParam ?? '';

  return <ActivateInvitationView initialToken={initialToken} />;
}
