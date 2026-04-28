import { QrTerminalDisplayView } from '@/features/locations/components/QrTerminalDisplayView';

interface TerminalDisplayPageProps {
  params: Promise<{ terminalId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function readText(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function TerminalDisplayPage({
  params,
  searchParams,
}: TerminalDisplayPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <QrTerminalDisplayView
      terminalId={resolvedParams.terminalId}
      terminalName={readText(resolvedSearchParams?.terminalName)}
      siteName={readText(resolvedSearchParams?.siteName)}
    />
  );
}
