import Link from "next/link";

import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">{consultationLabel}</h2>
        <Button asChild>
          <Link href="/consultations/new">{consultationLabel} starten</Link>
        </Button>
      </div>
      {consultations.length ? (
        <ConsultationList consultations={consultations} />
      ) : (
        <div className="rounded-lg border border-dashed bg-white/60 p-8 text-center text-sm text-muted-foreground">
          Beratungsdatensaetze erscheinen hier, sobald Ihr Team Besuche dokumentiert.
        </div>
      )}
    </div>
  );
}
