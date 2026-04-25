"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">Etwas ist schiefgelaufen</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        In CAREVO ist ein unerwarteter Fehler aufgetreten. Sie koennen die aktuelle Ansicht erneut laden.
      </p>
      <Button onClick={reset}>Erneut versuchen</Button>
    </main>
  );
}
