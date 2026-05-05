import { headers } from "next/headers";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getAuthContext } from "@/server/auth/context";

function titleForPath(path: string) {
  if (path.startsWith("/consultations/") && !path.endsWith("/consultations")) {
    return {
      title: "Consultation Workspace",
      subtitle: "Review transcript, draft note, warnings, approval, and export in one place."
    };
  }

  if (path.startsWith("/consultations/new")) {
    return {
      title: "Start Consultation",
      subtitle: "Create a new consultation with minimal metadata."
    };
  }

  if (path.startsWith("/consultations")) {
    return {
      title: "Consultations",
      subtitle: "Track active consultations, drafts, and approved notes."
    };
  }

  if (path.startsWith("/sis")) {
    return {
      title: "SIS",
      subtitle: "Strukturierte Informationssammlung mit Risikoeinschaetzung und Massnahmenfokus."
    };
  }

  if (path.startsWith("/templates")) {
    return { title: "Templates", subtitle: "Manage note templates for your organisation." };
  }

  if (path.startsWith("/exports")) {
    return { title: "Exports", subtitle: "Access generated PDF and clipboard exports." };
  }

  if (path.startsWith("/settings")) {
    return { title: "Settings", subtitle: "Manage profile, organisation, and security preferences." };
  }

  return {
    title: "Dashboard",
    subtitle: "Track documentation throughput and pending clinical drafts."
  };
}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  const pathname = (await headers()).get("x-pathname") ?? "/dashboard";
  const pageMeta = titleForPath(pathname);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <AppSidebar
        careSetting={auth.organisation.care_setting}
        currentPath={pathname}
        organisationName={auth.organisationName}
        userName={auth.profile.full_name || "Clinician"}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppHeader title={pageMeta.title} subtitle={pageMeta.subtitle} />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
