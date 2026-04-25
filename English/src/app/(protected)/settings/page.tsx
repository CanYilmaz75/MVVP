import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/server/auth/context";

export default async function SettingsPage() {
  const auth = await getAuthContext();

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Name:</span> {auth.profile.full_name || "Not provided"}
          </p>
          <p>
            <span className="font-medium">Role:</span> {auth.profile.role}
          </p>
          <p>
            <span className="font-medium">Specialty:</span> {auth.profile.specialty || "Not provided"}
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
        </CardContent>
      </Card>
    </div>
  );
}
