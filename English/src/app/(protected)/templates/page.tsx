import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthContext } from "@/server/auth/context";
import { listTemplates } from "@/server/services/template-service";

export default async function TemplatesPage() {
  await getAuthContext();
  const templates = await listTemplates();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates</CardTitle>
      </CardHeader>
      <CardContent>
        {templates.length ? (
          <div className="space-y-3">
            {templates.map((template: Awaited<ReturnType<typeof listTemplates>>[number]) => (
              <div key={template.id} className="rounded-2xl border px-4 py-3">
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-muted-foreground">
                  {template.specialty} · schema {template.schema_version}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No templates have been configured yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
