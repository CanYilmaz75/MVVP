import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">Seite nicht gefunden</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Die angeforderte CAREVO-Ressource wurde nicht gefunden oder Sie haben keinen Zugriff darauf.
      </p>
      <Button asChild>
        <Link href="/dashboard">Zurueck zum Dashboard</Link>
      </Button>
    </main>
  );
}
