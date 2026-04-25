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
      label: "Consultations Today",
      value: consultations
        .filter((item: Awaited<ReturnType<typeof listConsultations>>[number]) => new Date(item.created_at).toDateString() === today)
        .length.toString()
    },
    {
      label: "Drafts Pending",
      value: consultations
        .filter((item: Awaited<ReturnType<typeof listConsultations>>[number]) => item.status === "draft_ready")
        .length.toString()
    },
    {
      label: "Approved Notes",
      value: consultations
        .filter((item: Awaited<ReturnType<typeof listConsultations>>[number]) => item.status === "approved" || item.status === "exported")
        .length.toString()
    },
    {
      label: "Avg Processing Time",
      value: consultations.length ? "<60s target" : "0m"
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Monitor documentation throughput and start a new consultation."
        actions={
          <Button asChild>
            <Link href="/consultations/new">Start Consultation</Link>
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
          <CardTitle>Recent Consultations</CardTitle>
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
              Your activity will appear here once a consultation is created and moves through transcript and note generation.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
