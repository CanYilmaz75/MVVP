"use client";

import { useState, useTransition } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/server/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoMark } from "@/components/shared/logo";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError("E-Mail oder Passwort ist ungueltig.");
        return;
      }

      const destination: Route = nextPath && nextPath.startsWith("/") ? (nextPath as Route) : "/dashboard";
      router.push(destination);
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <LogoMark className="bg-primary text-[hsl(var(--primary-foreground))] shadow-none" />
          <div>
            <p className="text-sm text-muted-foreground">Dokumentation fuer Pflege und Versorgung</p>
            <h1
              className="mt-1 text-[2rem] tracking-normal"
            >
              Bei CAREVO anmelden
            </h1>
          </div>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Melden Sie sich mit Ihrem bereitgestellten Konto an, um den Arbeitsbereich Ihrer Organisation zu nutzen.
        </p>
      </div>
      <div className="mt-8 border-t border-border/70 pt-8">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              E-Mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Passwort
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Anmeldung laeuft..." : "Anmelden"}
          </Button>
          <p className="text-sm leading-6 text-muted-foreground">
            Die Passwort-zuruecksetzen-Funktion wird ueber die Supabase-Auth-Konfiguration gesteuert.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Neue kleine Praxis oder Einrichtung?{" "}
            <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
              Self-Service registrieren
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
