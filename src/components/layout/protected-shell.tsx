"use client";

import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppMobileNav, AppSidebar } from "@/components/layout/app-sidebar";
import type { CareSetting } from "@/lib/care-setting";
import type { PausedConsultationSummary } from "@/server/services/consultation-service";

function titleForPath(path: string) {
  if (path.startsWith("/consultations/new")) {
    return {
      title: "Beratung starten",
      subtitle: "Eine neue Beratung mit den wichtigsten Angaben anlegen."
    };
  }

  if (path.startsWith("/consultations/")) {
    return {
      title: "Beratungsarbeitsplatz",
      subtitle: "Transkript, Entwurf, Hinweise, Freigabe und Export an einem Ort pruefen."
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
    subtitle: "Dokumentationsfortschritt und offene Entwuerfe verfolgen."
  };
}

export function ProtectedShell({
  careSetting,
  children,
  organisationName,
  pausedConsultations,
  userName
}: {
  careSetting: CareSetting;
  children: React.ReactNode;
  organisationName: string;
  pausedConsultations: PausedConsultationSummary[];
  userName: string;
}) {
  const pathname = usePathname() || "/dashboard";
  const pageMeta = titleForPath(pathname);

  return (
    <div className="min-h-screen bg-[#f4f4f6] pb-36 md:flex md:pb-0">
      <AppSidebar
        careSetting={careSetting}
        currentPath={pathname}
        organisationName={organisationName}
        pausedConsultations={pausedConsultations}
        userName={userName}
      />
      <div className="flex min-h-screen flex-1 flex-col bg-[#f4f4f6]">
        <AppHeader title={pageMeta.title} subtitle={pageMeta.subtitle} />
        <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 pb-6 pt-2 sm:px-8 lg:px-10 xl:px-20">{children}</main>
      </div>
      <AppMobileNav careSetting={careSetting} currentPath={pathname} />
    </div>
  );
}
