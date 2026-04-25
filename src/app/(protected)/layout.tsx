import { headers } from "next/headers";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getAuthContext } from "@/server/auth/context";
import { listPausedConsultations } from "@/server/services/consultation-service";

function titleForPath(path: string) {
  if (path.startsWith("/consultations/") && !path.endsWith("/consultations")) {
    return {
      title: "Beratungsarbeitsplatz",
      subtitle: "Transkript, Entwurf, Hinweise, Freigabe und Export an einem Ort pruefen."
    };
  }

  if (path.startsWith("/consultations/new")) {
    return {
      title: "Beratung starten",
      subtitle: "Eine neue Beratung mit den wichtigsten Angaben anlegen."
    };
  }

  if (path.startsWith("/consultations")) {
    return {
      title: "Beratungen",
      subtitle: "Aktive Beratungen, Entwuerfe und freigegebene Notizen verfolgen."
    };
  }

  if (path.startsWith("/sis")) {
    return {
      title: "SIS",
      subtitle: "Strukturierte Informationssammlung mit Risikoeinschaetzung und Massnahmenfokus."
    };
  }

  if (path.startsWith("/settings/templates")) {
    return { title: "Vorlagen", subtitle: "Notizvorlagen fuer Ihre Organisation verwalten." };
  }

  if (path.startsWith("/templates")) {
    return { title: "Vorlagen", subtitle: "Notizvorlagen fuer Ihre Organisation verwalten." };
  }

  if (path.startsWith("/exports")) {
    return { title: "Exporte", subtitle: "Erstellte PDF- und Zwischenablage-Exporte aufrufen." };
  }

  if (path.startsWith("/settings")) {
    return { title: "Einstellungen", subtitle: "Profil, Organisation und Sicherheitseinstellungen verwalten." };
  }

  return {
    title: "Dashboard",
    subtitle: "Dokumentationsfortschritt und offene klinische Entwuerfe verfolgen."
  };
}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  const pausedConsultations = await listPausedConsultations();
  const pathname = (await headers()).get("x-pathname") ?? "/dashboard";
  const pageMeta = titleForPath(pathname);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <AppSidebar
        currentPath={pathname}
        organisationName={auth.organisationName}
        pausedConsultations={pausedConsultations}
        userName={auth.profile.full_name || "Behandelnde Person"}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppHeader title={pageMeta.title} subtitle={pageMeta.subtitle} />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
