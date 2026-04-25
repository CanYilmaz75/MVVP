# 03_UI_UX_SPEC.md

## Objective

Build a polished, production-grade desktop-first MedTech SaaS interface for CAREVO.
The UI must feel:
- trustworthy
- calm
- efficient
- precise
- enterprise-ready

The clinician must always understand:
- where they are
- what state the consultation is in
- what the next action is
- whether the note is draft or approved

---

## Design Principles

1. clarity over density
2. trust over novelty
3. speed over flourish
4. reviewability over blind automation
5. consistency across all states
6. no dead ends in workflow

---

## Design System

### Visual tone
- premium B2B MedTech
- minimal
- restrained use of color
- no playful gradient-heavy consumer style

### Core colors
- page background: soft neutral gray
- cards: white
- borders: light gray
- primary action: muted blue
- success: muted green
- warning: amber
- destructive: muted red
- text: dark slate

### Radius
- cards: rounded-2xl
- inputs/buttons: rounded-xl

### Shadows
- subtle only

### Typography
- page title: large semibold
- section heading: medium semibold
- body: regular
- helper text: small muted

### Spacing
- strict 8px rhythm
- generous whitespace
- no cramped forms or tables

---

## App Shell

### Sidebar
Items:
- Dashboard
- Consultations
- Templates
- Exports
- Settings

Bottom:
- organisation name
- user menu
- sign out

Behavior:
- desktop persistent
- tablet collapsible
- active route state visible
- icons plus labels

### Top Bar
Contains:
- page title
- optional breadcrumb
- quick search placeholder
- user menu trigger

---

## Routes and Screens

### /login
Requirements:
- centered auth card
- logo placeholder
- sign in headline
- email input
- password input
- sign in button
- forgot password link
- invalid credential state
- loading state

### /dashboard
Top row:
- page title
- welcome line
- primary CTA: Start Consultation

Body:
- KPI cards:
  - consultations today
  - drafts pending
  - approved notes
  - avg processing time
- recent consultations list
- drafts awaiting review list
- quick actions

Empty state:
- no consultations illustration/icon
- clear CTA

### /consultations
Requirements:
- title
- search input
- filters:
  - status
  - specialty
  - date range
- table with:
  - patient reference
  - date
  - specialty
  - duration
  - transcript status
  - note status
  - updated at
  - actions
- row click opens workspace

### /consultations/new
Short start form:
- patient reference
- specialty
- spoken language
- note template
- consultation type optional
Buttons:
- cancel
- start consultation

### /consultations/[id]
This is the core workspace.

#### Desktop layout
- top workspace header
- 3-column body:
  - left: controls and consultation metadata
  - center: transcript
  - right: note panel

Acceptable fallback:
- 2-column with compact left status rail if space needs simplification

#### Workspace header
Show:
- patient reference
- specialty badge
- consultation status badge
- started time
- primary action
- secondary actions

Action progression:
- Start Recording
- Stop Recording
- Generate Note
- Approve
- Export

Buttons must enable/disable correctly based on state.

#### Left rail / control panel
Contains:
- recording card
- status/timer
- language
- note template
- quick metadata summary
- warning summary if present

#### Transcript panel
Features:
- scrollable
- searchable
- grouped by speaker if segments available
- timestamps optional
- copy transcript
- loading state
- empty state
- retry state

Speaker display:
- doctor and patient visually distinct but subtle

#### Note panel
Header:
- “AI Draft” badge until approved
- note status badge
- warning badge count
- actions:
  - Voice Edit
  - Regenerate
  - Approve
  - Export

Body:
- section cards or structured editable blocks:
  - Subjective
  - Objective
  - Assessment
  - Plan
- inline editing
- stable save behavior
- visible empty helper state

#### Validation card
Show warnings such as:
- plan section empty
- medication in note missing from transcript
- unclear diagnosis wording
- missing follow-up
Actions:
- jump to section
- dismiss locally
- review details

### /templates
Display:
- template list
- specialty
- schema version
- last updated
- actions: create, duplicate, edit, archive

### /exports
Display:
- consultation reference
- export type
- created date
- created by
- status
- download action

### /settings
Tabs:
- profile
- organisation
- note preferences
- security
- integrations

---

## Critical Modals and Drawers

### Voice Edit Drawer
Flow:
1. user opens drawer
2. records instruction
3. system transcribes instruction
4. show interpreted instruction preview
5. user confirms apply
6. system updates note
7. show toast and subtle diff confirmation

### Approve Dialog
- explain that approval marks the note as clinician-reviewed
- confirm or cancel
- if warnings exist, show them but do not block unless configured

### Export Dialog
- show export options
- copy text
- download PDF
- success state
- failure state

---

## Component Inventory

### Shared
- AppSidebar
- AppHeader
- StatusBadge
- PageHeader
- EmptyState
- ErrorAlert
- LoadingCard
- SectionHeader
- MetricCard
- ConfirmDialog

### Consultation-specific
- ConsultationWorkspaceHeader
- RecordingPanel
- TranscriptPanel
- TranscriptSegmentList
- TranscriptSearch
- NotePanel
- NoteSectionEditor
- ValidationWarningsCard
- VoiceEditDrawer
- ApproveNoteDialog
- ExportDialog

### Data display
- ConsultationTable
- RecentConsultationList
- DraftQueueList
- TemplateList
- ExportHistoryTable

---

## Interaction Rules

1. primary action must always be obvious
2. do not show export prominence before note exists
3. do not show approval state until approval occurs
4. voice edit must preview interpreted command before applying
5. note edits should autosave or clearly save without ambiguity
6. use toasts for success confirmation, not for critical warnings alone
7. show skeletons for initial load
8. show retry path for failed transcript or note generation

---

## Important UX Copy

Use clear product language:
- Start Consultation
- Recording in Progress
- Processing Transcript
- Generate Draft Note
- Draft Ready for Review
- Validation Warning
- Approve Note
- Export PDF
- Voice Edit

Avoid:
- hype wording
- chatbot-style language
- ambiguous labels

---

## Responsive Behavior

### Desktop
Primary target.

### Tablet
- sidebar collapses
- transcript and note may remain side-by-side if space permits
- otherwise use tabs for transcript vs note

### Mobile
Optional support:
- reduced feature layout
- workspace uses tabs
- sticky action bar
Do not let mobile complexity degrade desktop quality.

---

## Frontend Engineering Requirements

- use ShadCN UI consistently
- use React Hook Form + Zod for forms
- keep components modular
- separate presentational and data-aware components
- create realistic mock data for story-like preview if backend unavailable
- no hardcoded demo data in final protected routes
- route-level loading and error boundaries where appropriate
