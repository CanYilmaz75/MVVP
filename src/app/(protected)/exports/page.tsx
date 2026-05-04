import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/server/auth/context";
import { listExports } from "@/server/services/export-service";

export default async function ExportsPage() {
  await getAuthContext();
  const exportsList = await listExports();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportverlauf</CardTitle>
      </CardHeader>
      <CardContent>
        {exportsList.length ? (
          <div className="space-y-3">
            {exportsList.map((item: Awaited<ReturnType<typeof listExports>>[number]) => (
              <div key={item.id} className="rounded-lg border px-4 py-3">
                <p className="font-medium">
                  {item.export_type.toUpperCase()}-Export · Notizversion {item.note_version_number}
                </p>
                <p className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Exporte freigegebener Notizen erscheinen hier, sobald der Beratungsworkflow abgeschlossen ist.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
