import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsultationList } from "@/features/consultations/consultation-list";
import { isCareFacility } from "@/lib/care-setting";
import { getAuthContext } from "@/server/auth/context";
import { listConsultations } from "@/server/services/consultation-service";

export default async function ConsultationsPage() {
  const auth = await getAuthContext();
  const consultationLabel = isCareFacility(auth.organisation.care_setting) ? "Pflegeberatung" : "Praxisberatung";
  const consultations = await listConsultations();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{consultationLabel}</CardTitle>
          <Button asChild>
            <Link href="/consultations/new">{consultationLabel} starten</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {consultations.length ? (
            <ConsultationList consultations={consultations} />
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
