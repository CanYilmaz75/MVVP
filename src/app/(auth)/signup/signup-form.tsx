"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoMark } from "@/components/shared/logo";
import { createClient } from "@/server/supabase/browser";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? "";
  const invitedEmail = searchParams.get("email") ?? "";
  const isInvite = inviteToken.length > 0;
  const [fullName, setFullName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const title = useMemo(
    () => (isInvite ? "Einladung annehmen" : "CAREVO Organisation erstellen"),
    [isInvite]
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: isInvite
            ? {
                full_name: fullName,
                invite_token: inviteToken,
                specialty
              }
            : {
                full_name: fullName,
                organisation_name: organisationName,
                specialty,
                role: "admin"
              }
        }
      });

      if (signUpError) {
        setError("Registrierung fehlgeschlagen. Bitte pruefen Sie die Angaben.");
        return;
      }

      setMessage("Registrierung erfolgreich. Falls E-Mail-Bestaetigung aktiv ist, bestaetigen Sie bitte Ihr Postfach.");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <LogoMark className="bg-stone-950 text-[hsl(var(--primary-foreground))] shadow-none" />
          <div>
            <p className="text-sm text-muted-foreground">B2B-SaaS fuer Pflege und Versorgung</p>
            <h1
              className="mt-1 text-[2rem] tracking-normal"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
            >
              {title}
            </h1>
          </div>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          {isInvite
            ? "Erstellen Sie Ihr Nutzerkonto fuer die bestehende Organisation."
            : "Legen Sie eine neue Self-Service-Organisation an. Das erste Konto wird automatisch Admin."}
        </p>
      </div>
      <div className="mt-8 border-t border-border/70 pt-8">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="fullName">
              Name
            </label>
            <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </div>
          {!isInvite ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="organisationName">
                Praxis / Einrichtung
              </label>
              <Input
                id="organisationName"
                value={organisationName}
                onChange={(event) => setOrganisationName(event.target.value)}
                required
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="specialty">
              Fachbereich
            </label>
            <Input id="specialty" value={specialty} onChange={(event) => setSpecialty(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              E-Mail
            </label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Passwort
            </label>
            <Input
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Registrierung laeuft..." : "Registrieren"}
          </Button>
        </form>
      </div>
    </div>
  );
}
