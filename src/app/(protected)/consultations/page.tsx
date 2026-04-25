import Link from "next/link";
import type { Route } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { languageLabel } from "@/lib/language-settings";
import { getAuthContext } from "@/server/auth/context";
import { listConsultations } from "@/server/services/consultation-service";

export default async function ConsultationsPage() {
  await getAuthContext();
  const consultations = await listConsultations();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Beratungen"
        description="Neue Beratung anlegen oder einen bestehenden Arbeitsbereich oeffnen."
        actions={
          <Button asChild>
            <Link href="/consultations/new">Beratung starten</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Beratungsliste</CardTitle>
        </CardHeader>
        <CardContent>
          {consultations.length ? (
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/70">
                  <tr>
                    <th className="px-4 py-3 font-medium">Patientenreferenz</th>
                    <th className="px-4 py-3 font-medium">Fachbereich</th>
                    <th className="px-4 py-3 font-medium">Sprache</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Aktualisiert</th>
                    <th className="px-4 py-3 font-medium">Oeffnen</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((consultation: Awaited<ReturnType<typeof listConsultations>>[number]) => (
                    <tr key={consultation.id} className="border-t">
                      <td className="px-4 py-3">{consultation.patient_reference}</td>
                      <td className="px-4 py-3">{consultation.specialty}</td>
                      <td className="px-4 py-3">{languageLabel(consultation.spoken_language)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={consultation.status} />
                      </td>
                      <td className="px-4 py-3">{new Date(consultation.updated_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/consultations/${consultation.id}` as Route}>Oeffnen</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Beratungsdatensaetze erscheinen hier, sobald Ihr Team Besuche dokumentiert.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
