import Link from "next/link";
import type { Route } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getAuthContext } from "@/server/auth/context";
import { listConsultations } from "@/server/services/consultation-service";

export default async function ConsultationsPage() {
  await getAuthContext();
  const consultations = await listConsultations();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Consultations"
        description="Create a new consultation or open an existing workspace."
        actions={
          <Button asChild>
            <Link href="/consultations/new">Start Consultation</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Consultation List</CardTitle>
        </CardHeader>
        <CardContent>
          {consultations.length ? (
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/70">
                  <tr>
                    <th className="px-4 py-3 font-medium">Patient Reference</th>
                    <th className="px-4 py-3 font-medium">Specialty</th>
                    <th className="px-4 py-3 font-medium">Language</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 font-medium">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((consultation: Awaited<ReturnType<typeof listConsultations>>[number]) => (
                    <tr key={consultation.id} className="border-t">
                      <td className="px-4 py-3">{consultation.patient_reference}</td>
                      <td className="px-4 py-3">{consultation.specialty}</td>
                      <td className="px-4 py-3">{consultation.spoken_language}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={consultation.status} />
                      </td>
                      <td className="px-4 py-3">{new Date(consultation.updated_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/consultations/${consultation.id}` as Route}>Open</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Consultation records will appear here once your team starts documenting visits.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
