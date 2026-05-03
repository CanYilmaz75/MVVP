import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthContext } from "@/server/auth/context";
import { getTeamOverview } from "@/server/services/team-service";
import { TeamBillingManager } from "./team-billing-manager";

export default async function SettingsPage() {
  const auth = await getAuthContext();
  const teamData = auth.profile.role === "admin" ? await getTeamOverview() : null;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Name:</span> {auth.profile.full_name || "Nicht angegeben"}
          </p>
          <p>
            <span className="font-medium">Rolle:</span> {auth.profile.role}
          </p>
          <p>
            <span className="font-medium">Fachbereich:</span> {auth.profile.specialty || "Nicht angegeben"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Organisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            {auth.organisationName}
          </p>
          <p>
            <span className="font-medium">Kundentyp:</span> {auth.organisation.customer_type}
          </p>
          <p>
            <span className="font-medium">Abrechnung:</span> {auth.organisation.billing_mode}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Vorlagen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Erstellen, bearbeiten und aktivieren Sie die Notizvorlagen Ihrer Klinik.
          </p>
          <Button asChild>
            <Link href="/settings/templates">Vorlagen verwalten</Link>
          </Button>
        </CardContent>
      </Card>
      {teamData ? (
        <TeamBillingManager initialData={teamData} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Team und Abo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Team- und Abo-Verwaltung ist fuer Admins verfuegbar.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
