"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Member = {
  id: string;
  full_name: string | null;
  role: "clinician" | "admin";
  specialty: string | null;
  status: "active" | "inactive" | "invited";
};

type Invite = {
  id: string;
  email: string;
  full_name: string | null;
  role: "clinician" | "admin";
  expires_at: string;
};

type Billing = {
  activeSeats: number;
  billableSeats: number;
  selfServiceSeatLimit: number | null;
  monthlyTotalCents: number;
  plan: {
    name: string;
    base_price_cents: number;
    included_seats: number;
    seat_price_cents: number;
  };
  subscription: {
    status: string;
  };
  organisation: {
    customer_type: "self_service" | "enterprise";
    billing_mode: "automatic" | "manual_contract";
    enterprise_status: "none" | "requested" | "active";
  };
};

type TeamData = {
  members: Member[];
  invites: Invite[];
  billing: Billing;
};

export function TeamBillingManager({ initialData }: { initialData: TeamData }) {
  const [data, setData] = useState(initialData);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refreshTeam() {
    const response = await fetch("/api/team");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message ?? "Aktualisierung fehlgeschlagen.");
    }
    setData(payload.data);
  }

  async function postJson(url: string, body?: unknown) {
    setError(null);
    setMessage(null);
    const response = await fetch(url, {
      method: "POST",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message ?? "Aktion fehlgeschlagen.");
    }
    return payload.data;
  }

  function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      email: String(form.get("email") ?? ""),
      fullName: String(form.get("fullName") ?? "") || undefined,
      role: String(form.get("role") ?? "clinician")
    };

    startTransition(async () => {
      try {
        const result = await postJson("/api/team/invites", body);
        setInviteUrl(result.inviteUrl);
        setMessage("Einladung erstellt.");
        await refreshTeam();
        event.currentTarget.reset();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Einladung fehlgeschlagen.");
      }
    });
  }

  function activateMember(memberId: string) {
    startTransition(async () => {
      try {
        await postJson(`/api/team/members/${memberId}/activate`);
        setMessage("Nutzer aktiviert.");
        await refreshTeam();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Aktivierung fehlgeschlagen.");
      }
    });
  }

  function deactivateMember(memberId: string) {
    startTransition(async () => {
      try {
        await postJson(`/api/team/members/${memberId}/deactivate`);
        setMessage("Nutzer deaktiviert.");
        await refreshTeam();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Deaktivierung fehlgeschlagen.");
      }
    });
  }

  function requestEnterprise(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      desiredSeats: Number(form.get("desiredSeats") ?? 21),
      contactName: String(form.get("contactName") ?? ""),
      contactEmail: String(form.get("contactEmail") ?? ""),
      message: String(form.get("message") ?? "") || undefined
    };

    startTransition(async () => {
      try {
        await postJson("/api/billing/enterprise-request", body);
        setMessage("Enterprise-Anfrage gespeichert.");
        await refreshTeam();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Enterprise-Anfrage fehlgeschlagen.");
      }
    });
  }

  const activeSeats = data.billing.activeSeats;
  const limit = data.billing.selfServiceSeatLimit;
  const nextSeatBlocked = limit !== null && activeSeats >= limit;

  return (
    <div className="space-y-6 xl:col-span-2">
      {error ? <p className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Abo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{data.billing.plan.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="default">{data.billing.subscription.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Aktive Seats</span>
              <span className="font-medium">
                {activeSeats}
                {limit ? ` / ${limit}` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monatlicher Beitrag</span>
              <span className="font-medium">{formatMoney(data.billing.monthlyTotalCents)}</span>
            </div>
            {nextSeatBlocked ? (
              <p className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">
                Das Self-Service-Limit ist erreicht. Weitere aktive Nutzer benoetigen eine Enterprise-Anfrage.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enterprise anfragen</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={requestEnterprise}>
              <Input name="desiredSeats" type="number" min={21} defaultValue={Math.max(21, activeSeats + 1)} required />
              <Input name="contactName" placeholder="Kontaktperson" required />
              <Input name="contactEmail" type="email" placeholder="rechnung@beispiel.de" required />
              <Input name="message" placeholder="Nachricht optional" />
              <Button type="submit" disabled={isPending}>
                Anfrage speichern
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_10rem_auto]" onSubmit={createInvite}>
            <Input name="email" type="email" placeholder="E-Mail" required />
            <Input name="fullName" placeholder="Name optional" />
            <select name="role" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="clinician">Clinician</option>
              <option value="admin">Admin</option>
            </select>
            <Button type="submit" disabled={isPending}>
              Einladen
            </Button>
          </form>
          {inviteUrl ? (
            <div className="rounded border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Einladungslink</p>
              <p className="mt-1 break-all text-muted-foreground">{inviteUrl}</p>
            </div>
          ) : null}
          <div className="divide-y divide-border rounded border border-border">
            {data.members.map((member) => (
              <div key={member.id} className="grid gap-3 p-4 md:grid-cols-[1fr_8rem_8rem_auto] md:items-center">
                <div>
                  <p className="font-medium">{member.full_name || "Ohne Namen"}</p>
                  <p className="text-sm text-muted-foreground">{member.specialty || "Kein Fachbereich"}</p>
                </div>
                <Badge variant={member.role === "admin" ? "primary" : "default"}>{member.role}</Badge>
                <Badge variant={member.status === "active" ? "success" : "default"}>{member.status}</Badge>
                <div className="flex gap-2">
                  {member.status === "active" ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => deactivateMember(member.id)} disabled={isPending}>
                      Deaktivieren
                    </Button>
                  ) : (
                    <Button type="button" size="sm" onClick={() => activateMember(member.id)} disabled={isPending}>
                      Aktivieren
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {data.invites.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Offene Einladungen</p>
              {data.invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between rounded border border-border p-3 text-sm">
                  <span>{invite.email}</span>
                  <Badge variant="default">{invite.role}</Badge>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(cents / 100);
}
