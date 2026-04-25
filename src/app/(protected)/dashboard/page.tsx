import Link from "next/link";
import type { Route } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Dokumentationsfortschritt ueberblicken und eine neue Beratung starten."
        actions={
          <Button asChild>
            <Link href="/consultations/new">Beratung starten</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Aktuelle Beratungen</CardTitle>
        </CardHeader>
        <CardContent>
          {consultations.length ? (
            <div className="space-y-3">
              {consultations.slice(0, 5).map((consultation: Awaited<ReturnType<typeof listConsultations>>[number]) => (
                <Link
                  key={consultation.id}
                  href={`/consultations/${consultation.id}` as Route}
                  className="flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors hover:bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">{consultation.patient_reference}</p>
                    <p className="text-sm text-muted-foreground">{consultation.specialty}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{new Date(consultation.updated_at).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Ihre Aktivitaeten erscheinen hier, sobald eine Beratung angelegt wurde und Transkript sowie Notiz erstellt werden.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
