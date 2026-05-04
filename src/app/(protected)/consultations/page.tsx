import Link from "next/link";
import type { Route } from "next";

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
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Beratungsliste</CardTitle>
          <Button asChild>
            <Link href="/consultations/new">Beratung starten</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {consultations.length ? (
            <>
            <div className="space-y-3 md:hidden">
              {consultations.map((consultation: Awaited<ReturnType<typeof listConsultations>>[number]) => (
                <Link
                  key={consultation.id}
                  href={`/consultations/${consultation.id}` as Route}
                  className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{consultation.patient_reference}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{consultation.specialty}</p>
                    </div>
                    <StatusBadge status={consultation.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <span>{languageLabel(consultation.spoken_language)}</span>
                    <span className="text-right">{new Date(consultation.updated_at).toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="hidden overflow-hidden rounded-lg border md:block">
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
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Beratungsdatensaetze erscheinen hier, sobald Ihr Team Besuche dokumentiert.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
