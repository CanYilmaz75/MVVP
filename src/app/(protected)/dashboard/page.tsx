import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getAuthContext } from "@/server/auth/context";
import { listConsultations } from "@/server/services/consultation-service";

export default async function DashboardPage() {
  await getAuthContext();
  const consultations = await listConsultations();
  const today = new Date().toDateString();
  const metrics = [
    {
      label: "Beratungen heute",
      value: consultations
        .filter((item: Awaited<ReturnType<typeof listConsultations>>[number]) => new Date(item.created_at).toDateString() === today)
        .length.toString()
    },
    {
      label: "Offene Entwuerfe",
      value: consultations
        .filter((item: Awaited<ReturnType<typeof listConsultations>>[number]) => item.status === "draft_ready")
        .length.toString()
    },
    {
      label: "Freigegebene Notizen",
      value: consultations
        .filter((item: Awaited<ReturnType<typeof listConsultations>>[number]) => item.status === "approved" || item.status === "exported")
        .length.toString()
    },
    {
      label: "Durchschn. Bearbeitungszeit",
      value: consultations.length ? "Ziel <60s" : "0m"
    }
  ];

  return (
    <div className="w-full space-y-10">
      <PageHeader
        title="Dashboard"
        description="Dokumentationsfortschritt ueberblicken und eine neue Beratung starten."
        actions={
          <>
            <Button asChild variant="ghost" className="border border-border px-5 hover:bg-stone-100">
              <Link href="/demo-buchen">Demo buchen</Link>
            </Button>
            <Button asChild className="px-5">
              <Link href="/consultations/new">Beratung starten</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-6 border-b border-border/70 pb-10 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{metric.label}</p>
            <p
              className="text-5xl font-semibold tracking-[-0.06em]"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-10 xl:grid-cols-[1.25fr_0.75fr]">
        <div>
          <div className="flex items-end justify-between border-b border-border/70 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Aktivitaet</p>
              <h2
                className="mt-2 text-3xl font-semibold tracking-[-0.04em]"
                style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
              >
                Aktuelle Beratungen
              </h2>
            </div>
            <Link href="/consultations" className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground">
              Alle ansehen
            </Link>
          </div>

          {consultations.length ? (
            <div className="divide-y divide-border/70">
              {consultations.slice(0, 5).map((consultation: Awaited<ReturnType<typeof listConsultations>>[number]) => (
                <Link
                  key={consultation.id}
                  href={`/consultations/${consultation.id}` as Route}
                  className="flex flex-col gap-4 py-5 transition-colors hover:text-stone-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{consultation.patient_reference}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{consultation.specialty}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{new Date(consultation.updated_at).toLocaleString()}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-sm leading-7 text-muted-foreground">
              Ihre Aktivitaeten erscheinen hier, sobald eine Beratung angelegt wurde und Transkript sowie Notiz erstellt werden.
            </div>
          )}
        </div>

        <div className="space-y-6 border-l-0 xl:border-l xl:border-border/70 xl:pl-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Fokus heute</p>
            <h2
              className="mt-2 text-3xl font-semibold tracking-[-0.04em]"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' }}
            >
              Weniger Masken. Mehr Klarheit.
            </h2>
          </div>

          <div className="space-y-5 text-sm leading-7 text-muted-foreground">
            <p>Nutzen Sie das Dashboard als ruhigen Einstieg in offene Entwuerfe, laufende Beratungen und Freigaben.</p>
            <p>Die Arbeitsflaeche soll nicht nach KI-Tool aussehen, sondern nach einem klaren operativen Produkt fuer reale Versorgung.</p>
          </div>

          <div className="space-y-3 border-t border-border/70 pt-5">
            <Button asChild variant="ghost" className="w-full justify-between rounded-none border-b border-border/70 px-0 py-0 pb-3 hover:bg-transparent">
              <Link href="/consultations">
                Zu allen Beratungen
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-between rounded-none border-b border-border/70 px-0 py-0 pb-3 hover:bg-transparent">
              <Link href="/consultations/new">
                Neue Beratung starten
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-between rounded-none border-b border-border/70 px-0 py-0 pb-3 hover:bg-transparent">
              <Link href="/demo-buchen">
                Demo buchen
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
