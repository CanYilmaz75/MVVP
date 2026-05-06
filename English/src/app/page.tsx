import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileAudio,
  FileText,
  LockKeyhole,
  Menu,
  Mic,
  ShieldCheck,
  Sparkles,
  Workflow
} from "lucide-react";

import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "CAREVO | AI documentation for care workflows",
  description:
    "CAREVO creates reviewable documentation drafts from audio, context and SIS-style information for care teams."
};

const navigation: Array<{ label: string; href: `#${string}` | Route }> = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "/preise" as Route }
];

const proofPoints = [
  { value: "Audio", label: "to structured draft" },
  { value: "SIS", label: "voice and text assisted" },
  { value: "Review", label: "before every approval" },
  { value: "Export", label: "after completion" }
];

const workflowSteps = [
  {
    title: "Capture or upload",
    description: "Record in the browser, upload a file or add supporting context.",
    icon: FileAudio
  },
  {
    title: "Generate a draft",
    description: "Transcript, note and SIS fields are prepared as an editable draft.",
    icon: Sparkles
  },
  {
    title: "Review and approve",
    description: "Check open items, edit the text and approve the final state.",
    icon: ClipboardCheck
  },
  {
    title: "Export",
    description: "Copy approved content or create a PDF for handoff.",
    icon: FileText
  }
];

const productFeatures = [
  {
    title: "Consultation documentation",
    description:
      "Audio, transcript and supporting text live in one workspace. The draft stays editable.",
    points: ["browser recording or upload", "structured draft note", "text and voice edits"],
    icon: Mic
  },
  {
    title: "SIS support",
    description:
      "Care conversations are sorted into topics, resources, risks and measures for review.",
    points: ["six SIS topic areas", "risk and review hints", "copyable summary"],
    icon: Workflow
  },
  {
    title: "Team and export flow",
    description:
      "Dashboard, templates and exports show what is open, approved and ready to hand off.",
    points: ["open drafts visible", "approval before export", "export history for traceability"],
    icon: BadgeCheck
  }
];

const securityItems = [
  {
    title: "Protected areas",
    description: "Documentation data sits behind login, organisation scoping and protected app areas.",
    icon: ShieldCheck
  },
  {
    title: "Private file paths",
    description: "Audio uploads and exports are designed for controlled storage and limited access.",
    icon: LockKeyhole
  },
  {
    title: "Auditable steps",
    description: "Creation, editing, approval and export are laid out as traceable steps.",
    icon: BadgeCheck
  },
  {
    title: "Human approval",
    description: "CAREVO creates drafts. Final responsibility stays visible with the team.",
    icon: Check
  }
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-normal text-[#9B9BA8]">{children}</p>;
}

function PageContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 xl:px-20 ${className}`}>{children}</div>;
}

function ProductMockup() {
  const transcriptLines = [
    "Resident reports feeling unsafe during morning transfer.",
    "Daughter mentions a new trip hazard in the bathroom.",
    "Care professional adds: rollator is used in the room."
  ];

  return (
    <div className="rounded-lg border border-[#E8E8EC] bg-white p-3 shadow-sm">
      <div className="rounded-lg border border-[#E8E8EC] bg-[#F4F4F6]">
        <div className="flex items-center justify-between border-b border-[#E8E8EC] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A0A0F] text-white">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0A0A0F]">Care consultation / SIS</p>
              <p className="text-xs text-[#9B9BA8]">Audio ready for structuring</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-[#E8E8EC] bg-white px-3 py-2 text-xs font-medium text-[#4A4A4F] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#1E6B72]" />
            Review open
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b border-[#E8E8EC] bg-white p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-[#9B9BA8]">Transcript</p>
              <span className="rounded-lg bg-[#F4F4F6] px-2 py-1 text-xs text-[#4A4A4F]">03:42</span>
            </div>
            <div className="mt-5 space-y-4">
              {transcriptLines.map((line, index) => (
                <div key={line} className="flex gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#E8E8EC] text-xs text-[#9B9BA8]">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-[#4A4A4F]">{line}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-[#E8E8EC] pt-4">
              <p className="text-xs font-semibold uppercase text-[#9B9BA8]">Next step</p>
              <p className="mt-2 text-sm font-medium text-[#0A0A0F]">Generate draft and review open items</p>
            </div>
          </div>

          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#E8E8EC] bg-white p-4">
                <p className="text-xs font-semibold uppercase text-[#9B9BA8]">Draft note</p>
                <h3 className="mt-3 text-lg font-semibold text-[#0A0A0F]">Transfer and home setting</h3>
                <div className="mt-4 space-y-2">
                  <div className="h-2 rounded-full bg-[#D8E7E9]" />
                  <div className="h-2 w-10/12 rounded-full bg-[#E8E8EC]" />
                  <div className="h-2 w-8/12 rounded-full bg-[#E8E8EC]" />
                </div>
              </div>
              <div className="rounded-lg border border-[#E8E8EC] bg-white p-4">
                <p className="text-xs font-semibold uppercase text-[#9B9BA8]">SIS field</p>
                <h3 className="mt-3 text-lg font-semibold text-[#0A0A0F]">Mobility</h3>
                <p className="mt-3 text-sm leading-6 text-[#4A4A4F]">
                  Resources present, assistive device to review, bathroom situation to clarify.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#E8E8EC] bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#9B9BA8]">Review</p>
                  <p className="mt-2 text-sm text-[#4A4A4F]">2 open hints before approval</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#4A4A4F] sm:min-w-56">
                  <span className="rounded-lg border border-[#E8E8EC] px-3 py-2">Validate</span>
                  <span className="rounded-lg border border-[#E8E8EC] px-3 py-2">Approve</span>
                  <span className="rounded-lg border border-[#E8E8EC] px-3 py-2">Copy</span>
                  <span className="rounded-lg border border-[#E8E8EC] px-3 py-2">PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-[#0A0A0F]">
      <div className="bg-white">
        <PageContainer className="flex min-h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark className="bg-[#0A0A0F] text-white" />
            <div>
              <p className="text-sm font-semibold text-[#0A0A0F]">CAREVO</p>
              <p className="text-xs text-[#9B9BA8]">Care & clinical workflows</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navigation.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm text-[#4A4A4F] transition-colors hover:bg-white hover:text-[#0A0A0F]"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm text-[#4A4A4F] transition-colors hover:bg-white hover:text-[#0A0A0F]"
                >
                  {item.label}
                </a>
              )
            )}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Button asChild variant="ghost" className="text-[#4A4A4F] hover:bg-white hover:text-[#0A0A0F]">
              <Link href="/dashboard">Open app</Link>
            </Button>
            <Button asChild className="bg-[#1E6B72] text-white hover:bg-[#1E6B72]/90">
              <Link href="/demo-buchen">Book demo</Link>
            </Button>
          </div>

          <details className="group md:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-[#E8E8EC] bg-white [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5 text-[#4A4A4F]" />
            </summary>
            <div className="absolute left-4 right-4 z-20 mt-3 rounded-lg border border-[#E8E8EC] bg-white p-2 shadow-sm">
              {navigation.map((item) =>
                item.href.startsWith("/") ? (
                  <Link key={item.label} href={item.href} className="flex min-h-11 items-center rounded-lg px-3 text-sm">
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} className="flex min-h-11 items-center rounded-lg px-3 text-sm">
                    {item.label}
                  </a>
                )
              )}
              <div className="mt-2 grid gap-2 pt-2">
                <Button asChild variant="outline">
                  <Link href="/dashboard">Open app</Link>
                </Button>
                <Button asChild className="bg-[#1E6B72] text-white hover:bg-[#1E6B72]/90">
                  <Link href="/demo-buchen">Book demo</Link>
                </Button>
              </div>
            </div>
          </details>
        </PageContainer>
      </div>

      <section className="bg-white">
        <PageContainer className="py-20 sm:py-28 lg:py-32">
          <div className="max-w-4xl">
              <Eyebrow>AI documentation for care workflows</Eyebrow>
              <h1 className="mt-6 max-w-4xl text-[48px] font-semibold leading-none text-[#0A0A0F] sm:text-[72px] lg:text-[88px]">
                Your assistant for less documentation.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#4A4A4F] sm:text-[22px]">
                CAREVO turns care conversations, audio and context into reviewable drafts. More time stays with care,
                coordination and approval.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-[#1E6B72] px-7 text-white hover:bg-[#1E6B72]/90">
                  <Link href="/demo-buchen">
                    Book demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-[#E8E8EC] px-7">
                  <Link href="/dashboard">Open app</Link>
                </Button>
              </div>
          </div>
        </PageContainer>
      </section>

      <section className="bg-[#F4F4F6] py-10 sm:py-12">
        <PageContainer>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {proofPoints.map((item) => (
              <div key={item.value}>
                <p className="text-3xl font-semibold text-[#0A0A0F]">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-[#4A4A4F]">{item.label}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section id="workflow" className="bg-white">
        <PageContainer className="py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <Eyebrow>Workflow</Eyebrow>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight text-[#0A0A0F] sm:text-5xl">
                Four steps, no theatre.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#4A4A4F]">
                The page now shows the product core: capture, structure, review and hand off.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              {workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#F4F4F6]">
                      <Icon className="h-5 w-5 text-[#1E6B72]" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-[#0A0A0F]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#4A4A4F]">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </PageContainer>
      </section>

      <section id="product" className="bg-white">
        <PageContainer className="py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <ProductMockup />
            <div>
              <Eyebrow>Product in flow</Eyebrow>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight text-[#0A0A0F] sm:text-5xl">
                The important surfaces first.
              </h2>
              <div className="mt-8 space-y-8">
                {productFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title}>
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-[#1E6B72]" />
                        <h3 className="text-xl font-semibold text-[#0A0A0F]">{feature.title}</h3>
                      </div>
                      <p className="mt-3 text-base leading-7 text-[#4A4A4F]">{feature.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {feature.points.map((point) => (
                          <span key={point} className="rounded-lg bg-[#F4F4F6] px-3 py-2 text-xs font-medium text-[#4A4A4F]">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section id="security" className="bg-white">
        <PageContainer className="py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Eyebrow>Security & control</Eyebrow>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight text-[#0A0A0F] sm:text-5xl">
                Control stays visible in the workflow.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#4A4A4F]">
                CAREVO does not make certification promises on the landingpage. It shows the control points already
                present in the product.
              </p>
            </div>
            <div className="space-y-4">
              {securityItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="grid gap-4 py-2 sm:grid-cols-[auto_1fr]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#F4F4F6]">
                      <Icon className="h-5 w-5 text-[#1E6B72]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#0A0A0F]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#4A4A4F]">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="bg-white">
        <PageContainer className="py-16 sm:py-20">
          <div className="grid gap-8 rounded-lg border border-[#E8E8EC] bg-white p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <Eyebrow>References</Eyebrow>
              <h2 className="mt-5 text-3xl font-semibold leading-tight text-[#0A0A0F] sm:text-5xl">
                One real reference is enough.
              </h2>
            </div>
            <div className="lg:pl-8">
              <p className="text-xl leading-8 text-[#0A0A0F]">
                Until approved customer quotes are available, this stays short. No invented voices, no logo wall, no
                artificial proof.
              </p>
              <Link href="/demo-buchen" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0A0A0F]">
                Plan a demo conversation
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="bg-white">
        <PageContainer className="py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <Eyebrow>Start</Eyebrow>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight text-[#0A0A0F] sm:text-5xl">
                Test CAREVO in the real workflow.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#4A4A4F]">
                Book a demo, inspect the workflow and evaluate it with your own documentation cases.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild size="lg" className="bg-[#1E6B72] px-7 text-white hover:bg-[#1E6B72]/90">
                <Link href="/demo-buchen">Book demo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-[#E8E8EC] px-7">
                <Link href="/dashboard">Open app</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>

      <footer className="bg-white">
        <PageContainer className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <LogoMark className="bg-[#0A0A0F] text-white" />
              <div>
                <p className="text-sm font-semibold text-[#0A0A0F]">CAREVO</p>
                <p className="text-sm text-[#4A4A4F]">Care & clinical workflows</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#4A4A4F]">
              Calm AI documentation for sensitive care and clinical workflows.
            </p>
          </div>
          <div className="space-y-3 text-sm text-[#4A4A4F]">
            <Link href="/preise" className="block transition-colors hover:text-[#0A0A0F]">
              Pricing
            </Link>
            <Link href="/demo-buchen" className="block transition-colors hover:text-[#0A0A0F]">
              Book demo
            </Link>
            <Link href="/dashboard" className="block transition-colors hover:text-[#0A0A0F]">
              Open app
            </Link>
          </div>
          <div className="space-y-3 text-sm text-[#4A4A4F]">
            <Link href="/impressum" className="block transition-colors hover:text-[#0A0A0F]">
              Imprint
            </Link>
            <Link href="/datenschutz" className="block transition-colors hover:text-[#0A0A0F]">
              Privacy
            </Link>
            <p className="text-[#9B9BA8]">© 2026 CAREVO</p>
          </div>
        </PageContainer>
      </footer>
    </main>
  );
}
