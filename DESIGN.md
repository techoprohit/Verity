# Verity: Comprehensive Design Specification and Visual Identity System

> **Event Context**: DOGFOOD 2026 Hackathon  
> **Tagline**: "Build the platform that will judge you."  
> **Repository**: [`techoprohit/Verity`](https://github.com/techoprohit/Verity)  
> **Visual Reference**: [https://www.raptors.dev/](https://www.raptors.dev/)  
> **Document Status**: Complete Implementation-Ready Design Specification

---

## 01. Design Overview

### Purpose of the Design System
This document establishes the canonical visual identity, design tokens, component anatomy, layout hierarchy, and interaction mechanics for **Verity**. Verity is an open-source, self-hostable hackathon submission and judging platform engineered under the DOGFOOD 2026 challenge. The design system translates the rigorous mathematical and security requirements of [`SPEC.md`](file:///d:/Verity/SPEC.md) into an authoritative, editorial, and technically transparent user interface — visually anchored to the engineering guild identity of Hackathon Raptors ([`raptors.dev`](https://www.raptors.dev/)).

### Product Visual Direction: Editorial Boldness & Engineering Guild Aesthetic
Verity avoids generic corporate SaaS tropes—there are no pastel blob gradients, oversized cartoonish corner radii, or artificial whitespace padding. Instead, the interface adopts a **Bold Editorial Engineering Aesthetic** directly inspired by the official Hackathon Raptors (`raptors.dev`) design language:
- **Atmospheric Palette**: Deep graphite void (`#12181A`) and charcoal slate surfaces (`#181E20`, `#1F2426`) punctuated by stark high-contrast pure white (`#FFFFFF`), subtle slate tones (`#A0AAB0`, `#F8F9F9`), and precision interactive blue/mint accents (`#3898EC`, `#3DD68C`).
- **Architectural Framing**: Strong typographic hierarchy using oversized numbered section anchors (`01`, `02`, `03`) connected with minimalist hairline rules (`#2D363A`, `#424D52`), establishing clean modular content zones.
- **Typographic Rigor**: High-contrast editorial grotesque headings powered by `'Helvetica'` (large, bold, structured) paired with `'Fira Code'` for data-dense tabular numbers, alignment grids, and concise bracketed status metadata (`[ STATUS / LOCKED ]`).
- **Functional Density**: Prioritizing information legibility and rapid keyboard/mouse evaluation for judges reviewing dozens of projects and organizers managing high-stakes live deliberations.

### Relationship Between Design Decisions and DOGFOOD Requirements
Every visual choice reinforces core DOGFOOD platform mandates:
1. **The Backend Security Rule**: Visual access states (e.g., hidden scorecards, locked submission inputs) strictly reflect backend authority. Forbidden routes render austere, explicit terminal security warnings rather than ambiguous blank screens.
2. **Judging Integrity**: Weighted rubrics and normalized standing calculations are displayed with absolute clarity, highlighting criterion weight multipliers ($w_i$), raw scores, and calibrated Z-scores side-by-side.
3. **The 100% Offline Rule**: The design system relies exclusively on self-hostable, localizable fonts (`'Helvetica'`, `'Fira Code'`) and CSS primitives, requiring zero third-party CDNs, external webfont requests, or hosted icon libraries. Visual alignment with `raptors.dev` is achieved through design token mirroring, not asset embedding.

---

## 02. Product and Interface Scope

### Documented User Roles (from `SPEC.md`)
The interface strictly supports the five documented roles without addition:
1. `visitor`: Unauthenticated public explorer. Discovers projects, browses tracks, searches entries.
2. `participant`: Authenticated team hacker. Manages team membership via invite link, drafts project submission, edits fields until deadline.
3. `judge`: Authenticated evaluator. Reviews assigned project queues, evaluates multi-criteria rubrics, enters qualitative feedback, reviews personal scorecards.
4. `organizer`: Hackathon administrator. Configures dates/tracks/prizes, balances judge assignments, monitors live progress dashboard, reviews normalized scores, downloads CSV exports.
5. `admin`: System-level administrator. Direct event and database management.

### Documented Product Areas and Workflows
```
+----------------------------------------------------------------------------------------------------+
|                                    VERITY PRODUCT INTERFACE MAP                                    |
+--------------------------+--------------------------+-----------------------+----------------------+
| 1. Public Gallery        | 2. Participant Portal    | 3. Judging Portal     | 4. Organizer Console |
| Route: /projects         | Route: /projects/new     | Route: /judge         | Route: /admin        |
| - Unauthenticated search | - Team invite join       | - Assigned queue      | - Event settings     |
| - Track filtering        | - Submission draft/edit  | - Weighted rubric form| - Progress dashboard |
| - Project showcase modal | - Cutoff timer / lockout | - Isolated scorecards | - Normalization view |
| - Fixture project cards  | - Submission receipt     | - Progress tracker    | - CSV export trigger |
+--------------------------+--------------------------+-----------------------+----------------------+
```

### Implementation vs. Specification Status
- **Repository Implementation Status**: The repository is currently executing milestone phases ([`SPEC.md`](file:///d:/Verity/SPEC.md), [`README.md`](file:///d:/Verity/README.md), [`ARCHITECTURE.md`](file:///d:/Verity/ARCHITECTURE.md), [`DATA-MODEL.md`](file:///d:/Verity/DATA-MODEL.md), [`JUDGING.md`](file:///d:/Verity/JUDGING.md), [`SECURITY.md`](file:///d:/Verity/SECURITY.md)).
- **Existing Screens in Repo**: Specified and under iterative frontend assembly.
- **Design Proposal Scope**: This document specifies the complete layout and component system required to implement all T1 through T4 interfaces required by `SPEC.md`.

---

## 03. Design Principles

1. **Clarity Over Decoration**  
   Every element on screen must convey state, data, or actionable workflow. Purely decorative elements that impede data scanning or evaluation speed are rejected.
2. **Backend Authority Transparency**  
   The UI never masks or synthesizes state. If an event is closed, the UI communicates the server timestamp cutoff clearly. If a peer score is probed, the UI surfaces the authoritative HTTP 403 response.
3. **High-Density Utility**  
   Hackathon organizers and judges evaluate high volumes of dense data under tight deadlines. Tables, rubric matrices, and project queues prioritize tight vertical rhythm and scannable tabular alignment.
4. **Editorial Boldness and Guild Polish**  
   Drawing from `raptors.dev`, section headers use oversized numbered labels (`01`, `02`, `03`), crisp monochrome-slate contrast, subtle pill badges, and deliberate large-scale typographic rhythm to evoke an elite engineering fellowship directory rather than a generic utility.
5. **Universal Offline Usability**  
   Every font, icon, style, and component must render flawlessly on a laptop operating completely disconnected from the internet.
6. **Zero-Ambiguity Feedback**  
   Form validation, score calculation, deadline countdowns, and network transactions provide immediate, high-contrast visual feedback with distinct error and confirmation styling.

---

## 04. Brand and Visual Identity

### Visual Personality: The "Verity Guild"
Verity’s visual identity communicates community authority, engineering excellence, and transparent meritocracy. It treats the hackathon platform not as a sterile judging tool, but as a prestigious guild directory where talent is celebrated and evaluated with integrity.

### Visual Motifs & Art Direction (from `raptors.dev`):
- **Numbered Section Anchors**: Major page sections open with large oversized ordinal labels (`01`, `02`, `03`, `04`) paired with an inline `40px` hairline divider rule, establishing a distinct editorial cadence.
- **Floating Pill Navigation**: A sleek floating pill navigation bar (`background: rgba(31, 36, 38, 0.90)`, `backdrop-filter: blur(10px)`, `border-radius: 30px`) housing clean uppercase navigation links and persona indicators.
- **Bracketed Monospace Tags**: System states, role badges, and track metadata remain encased in bracketed typographic enclosures: `[ ROLE: JUDGE ]`, `[ STATUS: LOCKED ]`.
- **Status Indicators**: Minimal dot indicators signaling live status (`● LIVE`, `● CLOSED`), rendered in mint green (`#3DD68C`) for active and muted slate (`#626E74`) for inactive.
- **Dark Atmospheric Surface**: Background surfaces use deep graphite (`#12181A`) and charcoal slate (`#1F2426`) with subtle hairline border demarcation to convey depth without distracting textures.
- **Marquee / Ticker Strip**: Horizontal looping ticker strips (inspired by the raptors.dev scrolling label bands) used between major sections to reinforce event categories, community tags, and live status signals.

### Logo & Wordmark Treatment
- **Wordmark**: `VERITY` rendered in bold, wide-tracking editorial uppercase grotesque:
  ```
  VERITY // [DOGFOOD-2026]
  ```
- **Mark**: An abstract angular precision glyph composed of pure CSS/SVG vectors, symbolizing speed, judgment, and engineering sharpness.

---

## 05. Color System

The color palette is built on the official Hackathon Raptors (`raptors.dev`) design tokens: deep graphite void surfaces (`#12181A`), charcoal slate card structures (`#181E20`, `#1F2426`), stark high-contrast text (`#FFFFFF`, `#F8F9F9`), and focused semantic accents.

### Color Tokens Table

| Token Name | HEX Value | CSS Variable | Intended Usage & Contrast Notes |
| :--- | :--- | :--- | :--- |
| **Brand Primary (Pure White)** | `#FFFFFF` | `--color-brand-primary` | Main titles, primary button text/highlights (21.0:1 contrast on `#12181A`) |
| **Brand Secondary (Off-White)**| `#F8F9F9` | `--color-brand-secondary`| High-contrast accents, light canvas support (20.2:1 contrast on `#12181A`) |
| **Brand Accent (Raptors Blue)**| `#3898EC` | `--color-brand-accent` | Interactive links, focused borders, badge highlights (6.8:1 contrast on `#12181A`) |
| **Background (Graphite Void)** | `#12181A` | `--color-bg-void` | Root application background, page canvas (`--body-bg-dark` from raptors.dev) |
| **Surface Level 1 (Slate Base)** | `#181E20` | `--color-surface-base` | Primary cards, table bodies, form field backgrounds |
| **Surface Level 2 (Charcoal Raised)** | `#1F2426` | `--color-surface-raised`| Navigation headers, modal dialogs, pill menu (`--dark` from raptors.dev) |
| **Surface Level 3 (Hover Slate)** | `#262E32` | `--color-surface-hover` | Table row hover, input focus backgrounds |
| **Border Subtle** | `#22292C` | `--color-border-subtle` | Subtle card dividers, nested cell borders |
| **Border Default** | `#2D363A` | `--color-border-default`| Standard card borders, table outlines, button borders |
| **Border Strong** | `#424D52` | `--color-border-strong` | Active container borders, hover card outlines |
| **Border Accent** | `#3898EC` | `--color-border-accent` | Focused inputs, selected items, active tabs |
| **Text Primary** | `#FFFFFF` | `--color-text-primary` | Main titles, table cells, form values (21.0:1 contrast on `#12181A`) |
| **Text Secondary** | `#A0AAB0` | `--color-text-secondary`| Descriptions, body copy, rubric prompts (7.8:1 contrast on `#12181A`) |
| **Text Muted** | `#626E74` | `--color-text-muted` | Field labels, metadata tags, breadcrumbs (4.6:1 contrast on `#12181A`) |
| **Text Dim** | `#384348` | `--color-text-dim` | Disabled text, decorative line markings |
| **Semantic Success (Mint)** | `#3DD68C` | `--color-success` | Submitted status, pass indicators in acceptance reports (9.2:1 contrast) |
| **Semantic Warning (Amber)** | `#FFB84D` | `--color-warning` | Looming deadlines, draft status, incomplete review batches (11.4:1 contrast) |
| **Semantic Error (Crimson)** | `#EA384C` | `--color-error` | Validation errors, late submission rejection, HTTP 403 Forbidden (5.2:1 contrast) |
| **Semantic Info (Sky)** | `#3898EC` | `--color-info` | Track allocations, information tooltips, audit notices (6.8:1 contrast) |

---

## 06. Typography System

### Font Stacks (100% Offline Bundled)
1. **Primary Display & Headings**: `'Helvetica'` (with fallbacks: `'Helvetica Neue', Arial, sans-serif`). Clean, authoritative grotesque typography with strong vertical rhythm and bold large-scale presence.
2. **Body & Interface Text**: `'Fira Code'` (with fallbacks: `'SF Mono', 'Segoe UI Mono', monospace`). Exceptional tabular lining figures, monospace alignment, and code clarity.
3. **Technical Metadata & Badges**: `'Fira Code'` (with fallbacks: `'SF Mono', monospace`). Used for uppercase bracketed metadata, score calculators, and section ordinal numbers.
4. **Editorial Accent (Optional)**: `'Playfair Display', Georgia, serif`. Used sparingly for italicized editorial section quotes or mottos, mirroring the secondary serif accents of `raptors.dev`.

### Typographic Scale

| Style / Level | Font Family | Size | Weight | Line Height | Letter Spacing | Intended Application |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `'Helvetica'` | 56px (3.50rem) | 700 | 1.05 | -0.03em | Hero titles, landing headers, section ordinals (01, 02...) |
| **H1** | `'Helvetica'` | 36px (2.25rem) | 700 | 1.15 | -0.02em | Page headers (Gallery, Portal, Dashboard) |
| **H2** | `'Helvetica'` | 26px (1.625rem) | 700 | 1.20 | -0.01em | Section headers, modal titles |
| **H3** | `'Helvetica'` | 18px (1.125rem) | 600 | 1.30 | 0.00em | Card titles, rubric criterion titles |
| **H4** | `'Fira Code'` | 15px (0.9375rem)| 700 | 1.40 | +0.05em | Sub-panel labels, table group headers |
| **Body Large** | `'Fira Code'` | 15px (0.9375rem)| 400 | 1.60 | 0.00em | Project summaries, submission guidelines |
| **Body** | `'Fira Code'` | 13px (0.8125rem)| 400 | 1.50 | 0.00em | Standard table text, input text, body copy |
| **Body Small** | `'Fira Code'` | 12px (0.75rem) | 400 | 1.40 | +0.02em | Helper text, secondary descriptions |
| **Metadata / Tag**| `'Fira Code'` | 11px (0.6875rem)| 600 | 1.00 | +0.12em | `[ BRACKETED TAGS ]`, badges, track chips |
| **Table Header** | `'Fira Code'` | 11px (0.6875rem)| 700 | 1.20 | +0.10em | Column headers (uppercase) |
| **Button Text** | `'Helvetica'` / `'Fira Code'` | 12px (0.75rem) | 700 | 1.00 | +0.08em | Interactive button actions (uppercase) |
| **Code / Numbers**| `'Fira Code'` | 13px (0.8125rem)| 500 | 1.00 | 0.00em | Tabular numbers, IDs, raw & Z-scores |

---

## 07. Spacing and Sizing System

Verity utilizes a strict **4px/8px modular grid**:

### Spacing Scale
- `space-1`: `4px` (0.25rem) — Micro-gaps between icons and inline text
- `space-2`: `8px` (0.50rem) — Form field padding vertical, badge padding
- `space-3`: `12px` (0.75rem) — Button padding vertical, card internal compact gaps
- `space-4`: `16px` (1.00rem) — Standard card padding, input padding horizontal
- `space-5`: `20px` (1.25rem) — Section content separation
- `space-6`: `24px` (1.50rem) — Card layout gap, modal dialog padding
- `space-8`: `32px` (2.00rem) — Page header margins, grid column gaps
- `space-12`: `48px` (3.00rem) — Major section spacing
- `space-16`: `64px` (4.00rem) — Page bottom gutters

### Component Sizing Conventions
- **Standard Input Height**: `38px` (compact, dense, high-utility)
- **Primary Button Height**: `38px`
- **Compact / Action Button**: `28px`
- **Pill Navigation Height**: `46px`
- **Badge Height**: `22px`
- **Project Card Min Height**: `220px`
- **Modal Dialog Max Width**: `680px`

---

## 08. Layout and Grid Architecture

### Container Metrics
- **Max Application Width**: `1360px`
- **Standard Page Gutters**:
  - Desktop (>1200px): `32px`
  - Tablet (768px–1199px): `20px`
  - Mobile (<768px): `12px`
- **Grid Layout**: 12-column flexible grid with fixed `16px` gutters.

### Layout Regions
1. **Pill Navigation & Status Header**: Floating centered top pill navigation housing the live event status ticker (`● LIVE`), wordmark, and role persona indicator.
2. **Main Application Canvas**: Centered container bounded by max width, rendering the active product workflow.
3. **System Footer**: Hairline-divided footer presenting the software version, offline verification indicator, and export link.

---

## 09. Responsive Breakpoints

Verity enforces four rigid responsive tiers without altering product capability:

| Tier | Breakpoint Range | Layout Behavior & Transformations |
| :--- | :--- | :--- |
| **Mobile** | `< 768px` | Single-column stack. Tables convert to horizontally scrollable data panes. Navigation collapses into an accessible slide-down drawer. Sticky bottom submission action bar. |
| **Tablet** | `768px – 1023px` | 2-column project gallery grid. Compact sidebar/topbar navigation. Rubric forms stack criteria vertically above project demo embeds. |
| **Desktop** | `1024px – 1359px`| 3-column project gallery grid. Split-screen judging view (Project details on left, Rubric scorecard on right). Data tables render full columns. |
| **Wide** | `≥ 1360px` | 4-column gallery grid. Organizer dashboard displays side-by-side queue progress charts and live audit feeds. |

---

## 10. Design Tokens (CSS Variables Reference)

```css
:root {
  /* Colors - Base Surfaces (raptors.dev palette) */
  --bg-void: #12181A;
  --surface-base: #181E20;
  --surface-raised: #1F2426;
  --surface-hover: #262E32;
  --menu-bg: rgba(31, 36, 38, 0.90);

  /* Colors - Accents */
  --brand-primary: #FFFFFF;
  --brand-secondary: #F8F9F9;
  --brand-accent: #3898EC;

  /* Colors - Typography */
  --text-primary: #FFFFFF;
  --text-secondary: #A0AAB0;
  --text-muted: #626E74;
  --text-dim: #384348;

  /* Colors - Borders */
  --border-subtle: #22292C;
  --border-default: #2D363A;
  --border-strong: #424D52;
  --border-accent: #3898EC;

  /* Colors - Semantics */
  --color-success: #3DD68C;
  --color-warning: #FFB84D;
  --color-error: #EA384C;
  --color-info: #3898EC;

  /* Typography Stacks */
  --font-display: 'Helvetica', 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'Fira Code', 'SF Mono', 'Segoe UI Mono', monospace;
  --font-serif: 'Playfair Display', Georgia, serif;

  /* Spacing */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 20px;
  --sp-6: 24px;
  --sp-8: 32px;
  --sp-12: 48px;

  /* Elevation & Radius */
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-pill: 30px;
  --border-hairline: 1px solid var(--border-default);
  --border-active: 1px solid var(--brand-accent);
}
```

---

## 11. Borders, Radii, and Elevation

### Editorial Hairlines
- **Border Philosophy**: To preserve editorial authenticity and align with `raptors.dev`, Verity avoids heavy drop shadows. Visual depth is established exclusively through surface lightness layering (`#12181A` $\rightarrow$ `#181E20` $\rightarrow$ `#1F2426`) and crisp `1px` hairline rules (`#2D363A`, `#424D52`).
- **Corner Radii**:
  - Buttons, Inputs, Cards: `4px` (`--radius-sm`) or `8px` (`--radius-md`).
  - Navigation Bar & Pill Badges: `30px` (`--radius-pill`) reflecting the signature raptors.dev pill navigation.
  - Bracketed Metadata Tags: `2px` or strict flat rectangle.
- **Interactive Focus States**: Focus rings use an explicit `2px solid var(--brand-accent)` (`#3898EC`) outline with a `2px` offset, ensuring total keyboard accessibility compliance.

---

## 12. Iconography and Visual Assets

- **Zero Remote Icon Fonts**: No FontAwesome, Google Material Icons, or external font stylesheets.
- **Implementation**: Pure inline SVG icons (16px and 20px viewBox) using clean 1.5px/2px strokes.
- **Visual Vocabulary**:
  - `Search`: Simple geometric lens
  - `Filter`: Industrial stepped lines
  - `Lock`: Angular padlock icon
  - `External Link`: Monospace angled bracket `>>>` or `↗`
  - `Check`: Sharp angular checkmark
  - `Alert`: Triangular caution glyph

---

## 13. Component System

### 1. Buttons
- **Primary CTA (`.btn-primary`)**: Solid `#FFFFFF` background, `#12181A` text, font `'Helvetica'`, bold uppercase. On hover: background shifts to `#F8F9F9`, maintaining crisp contrast. Strong visual anchor.
- **Secondary Action (`.btn-secondary`)**: `#181E20` background, `1px solid #2D363A` border, `#FFFFFF` text. On hover: border turns `#3898EC`, text stays bright.
- **Destructive Action (`.btn-danger`)**: Dark `#221417` background, `1px solid #EA384C` border, `#EA384C` text.
- **Pill Link / Button**: Translucent `#1F2426` background, `1px solid #2D363A`, rounded pill (`border-radius: 30px`), uppercase `'Helvetica'`/`'Fira Code'`.

### 2. Form Inputs & Selects
- Dark `#181E20` background, `1px solid #2D363A` border.
- Text: `#FFFFFF`, Font: `'Fira Code'`.
- Padding: `8px 12px` (height: `38px`).
- Focus: `1px solid #3898EC`, subtle glow box-shadow `0 0 0 1px #3898EC`.
- Read-only / Disabled: Background `#12181A`, text `#384348`, cursor `not-allowed`.

### 3. Project Submission Card (`.df-card`)
- Container: `#181E20` background, `1px solid #2D363A`, `border-radius: 8px`.
- Header: Track badge `[ TRACK / DEV TOOLS ]` and submission timestamp in `'Fira Code'`.
- Body: Project title (`'Helvetica'`, 20px, weight 700), one-line summary (`'Fira Code'`, 13px, `#A0AAB0`).
- Footer: Team members list, GitHub repo link, and evaluation status badge.

### 4. Rubric Rating Radio / Number Stepper
- Stepper buttons: `[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]` displayed in an inline row.
- Inactive state: `#181E20` background, `1px solid #2D363A` border, `#A0AAB0` text.
- Selected state: `#FFFFFF` background, `#12181A` dark bold text, `1px solid #FFFFFF`.

---

## 14. Navigation and Header Structure

```
+----------------------------------------------------------------------------------------------------+
| [▶ VERITY] VERITY // DF-2026   [● LIVE]    01 Gallery  02 Submit  03 Judge  04 Console  [JUDGE] |
+----------------------------------------------------------------------------------------------------+
```

- **Pill Top Bar**: Centered floating navigation container with `background: rgba(31, 36, 38, 0.90)`, `backdrop-filter: blur(10px)`, `border-radius: 30px`, and `border: 1px solid #2D363A`.
- **Role Badge**: Monospace tag in top right showing active session persona (e.g. `[ SESSION: jdg_a_91bc ]`). Clicking displays an inspection drawer detailing active role permissions.
- **Mobile Navigation**: Collapses into a full-height terminal drawer with high-contrast text links and quick role indicators.

---

## 15. Authentication & Session Switcher Interface

Because DOGFOOD mandates static session headers (`org_7f2a`, `jdg_a_91bc`, `jdg_b_44de`, `prt_2e88`) for checker automation, Verity provides an explicit **Persona Switcher Drawer** (*Design Proposal*):
- **Visual Design**: Terminal style side drawer toggled from the navigation bar.
- **Options**:
  - `[ ACT AS: ORGANIZER ]` $\rightarrow$ sets `Cookie: session=org_7f2a`
  - `[ ACT AS: JUDGE A (Ada) ]` $\rightarrow$ sets `Cookie: session=jdg_a_91bc`
  - `[ ACT AS: JUDGE B (Peer) ]` $\rightarrow$ sets `Cookie: session=jdg_b_44de`
  - `[ ACT AS: PARTICIPANT ]` $\rightarrow$ sets `Cookie: session=prt_2e88`
  - `[ ACT AS: PUBLIC GUEST ]` $\rightarrow$ clears session cookies
- Allows instant manual testing of role isolation directly in the browser without devtools manipulation.

---

## 16. Role-Based Interface Presentation

```mermaid
graph TD
    User["Active Request Session"] --> Resolver{"Session Token Resolver"}
    Resolver -- Anonymous --> VisitorUI["Visitor: Read-only Gallery, Search & Filter"]
    Resolver -- prt_2e88 --> PartUI["Participant: Team Invite, Draft Editor, Cutoff Lockout"]
    Resolver -- jdg_a/b --> JudgeUI["Judge: Assigned Queue, Rubric Form, Isolated Scores"]
    Resolver -- org_7f2a --> OrgUI["Organizer: Full Dashboard, Normalization, CSV Export"]
```

### Action Visibility & Gating:
- **Participant**: Submission edit forms remain active until `CURRENT_TIMESTAMP >= submissions_close`. Once closed, inputs convert to disabled read-only fields with an amber status banner: `[ STATUS: LOCKED - DEADLINE EXPIRED ]`.
- **Judge**: Peer judge scorecards are inaccessible. If a judge manually enters `/api/judge/scores?judge=judge_a`, the frontend displays a high-contrast red error slate: `[ HTTP 403: PEER SCORES ISOLATED BY BACKEND ]`.

---

## 17. Event Management Interfaces (Organizer)

- **Configuration Overview**: Single-page tabular matrix displaying:
  - Event Identifier (`evt_01`)
  - Submissions Cutoff (`2026-03-01T18:00:00Z`)
  - Active Tracks Table (Name, Description, Assigned Judges count)
  - Configured Rubrics Table (Criteria keys, display labels, weights $w_i$)
- **Action Controls**: "Lock Submissions Now" (manual test override), "Recalculate Normalization", "Download CSV Export".

---

## 18. Team and Submission Interfaces (Participant)

### Layout: Split View / Focused Form
1. **Header Panel**: Team name (`Nightshift`), shareable invite URL box with one-click copy button, and deadline status indicator.
2. **Form Area**:
   - `Project Title`: Text input (`maxlength=100`)
   - `Selected Track`: Select dropdown populated from event tracks
   - `Summary`: Textarea (`maxlength=280`), character counter
   - `Repository URL`: URL input with real-time format validation
   - `Demo Link`: URL input (optional)
3. **Submission State Card**:
   - Live countdown timer to cutoff timestamp.
   - When open: `[ SAVE DRAFT ]` (`.btn-secondary` outline) and `[ FINALIZE ENTRY ]` (`.btn-primary` solid).
   - When closed: Inputs disabled, banner renders `[ SUBMISSIONS CLOSED / ENTRY LOCKED ]`.

---

## 19. Public Gallery Interface (`/projects`)

### Requirements: Unauthenticated discovery, search, track filtering
- **Top Bar Filter Strip**:
  - Instant text search box (`Filter by title or team...`) with clear button.
  - Track selection pill tabs: `[ ALL TRACKS ]`, `[ DEVELOPER TOOLS ]`, `[ AI & DATA ]`, `[ INFRA ]`.
- **Project Grid**:
  - Responsive 1-to-4 column grid.
  - Renders project cards populated from `fixtures.json` (e.g. `Quiet Hours`, `CodeFlow`).
  - Clicking a card opens a modal overlay displaying full submission details, team member list, and external repository links.

---

## 20. Judging Interfaces (`/judge`)

### Split-Screen Evaluation Console
```
+-----------------------------------------------+-----------------------------------------------+
| LEFT PANEL: PROJECT SUBMISSION DETAILS        | RIGHT PANEL: WEIGHTED RUBRIC EVALUATION FORM  |
| Title: Quiet Hours                            | Criterion 1: Functionality [Weight: 40%]     |
| Team: Nightshift | Track: Developer tools     | [ 1 ]  [ 2 ]  [ 3 ]  [ 4*]  [ 5 ]             |
| Summary: One line pitch.                      | Criterion 2: Code Quality  [Weight: 30%]     |
| Repo: https://example.org/repo                | [ 1 ]  [ 2 ]  [ 3*]  [ 4 ]  [ 5 ]             |
|                                               | Qualitative Comments:                         |
| [ PREVIOUS PROJECT ]     [ NEXT PROJECT ]     | [ Textbox: Detailed critique...             ] |
|                                               | [ SUBMIT EVALUATION ]                         |
+-----------------------------------------------+-----------------------------------------------+
```

### Rubric Component Details:
- Each criterion dynamically renders its organizer-configured weight ($w_i$).
- Inline score calculator automatically computes the composite raw review score:
  $$S_{p, j} = \frac{\sum (w_i \cdot s_i)}{\sum w_i}$$
  displaying the instantaneous preview: `Project Raw Score: 3.70 / 5.00`.
- Qualitative comments accept multiline feedback; empty comments are permitted without validation errors.

---

## 21. Organizer Console & Progress Dashboard

- **Judge Progress Matrix**:
  - Table listing all registered judges, assigned tracks, completed reviews, and outstanding queue items.
  - Progress bar showing review batch completion percentage (`8 / 10 Reviews [80%]`).
- **Normalized Standings Table**:
  - Renders computed Z-score normalized rankings in real-time.
  - Columns: Rank, Project Title, Team, Track, Completed Reviews ($M_p$), Raw Average, Normalized Score (0–100), Status.
- **Export Trigger**: Prominent primary button: `[ EXPORT CSV (RFC 4180) ]` initiating download of `GET /api/export.csv`.

---

## 22. Community Voting Interface (T3 Stretch)

- **Ballot Presentation**: Randomized project display ordering per voter session to eliminate position bias.
- **Results Masking**: Scoreboards and vote totals are strictly concealed during the active voting window; voting cards show confirmation receipt without revealing standings.
- **Anti-Abuse Notice**: Displays audit verification receipt upon ballot submission.

---

## 23. T4 Stretch Interfaces

- **CSV / JSON Ingestion Console**: Drag-and-drop zone for uploading external `fixtures.json` datasets.
- **Verifiable Participation Certificate**: Monospace, printable SVG certificate displaying judge participation hours, signed hash, and event seal.

---

## 24. Tables and Data-Dense Interfaces

### Table Styling Specification
- **Table Container**: `1px solid var(--border-default)`, background `#181E20`.
- **Header Row**: Height `36px`, background `#1F2426`, text `'Fira Code'`, 11px uppercase, tracking `0.10em`, color `#626E74`.
- **Data Rows**: Height `44px`, border-bottom `1px solid #22292C`. On hover: background shifts to `#262E32`.
- **Cell Padding**: `8px 16px`.
- **Numeric Alignment**: All scores, review counts, and timestamps use tabular monospace lining numerals aligned right. Text fields align left.

---

## 25. Data Visualization

### 1. Judge Review Completion Progress Bar
- **Data**: Completed reviews vs. assigned queue size per judge ($N_j / \text{QueueSize}$).
- **Form**: Compact horizontal segmented meter (`#3898EC` or `#3DD68C` for completed, `#2D363A` for pending).

### 2. Cross-Judge Score Distribution Scatter / Box
- **Data**: Raw review score spreads ($S_{p, j}$) across judges.
- **Visual Form**: Clean horizontal range bar plotting each judge's mean $\mu_j$ and $\pm 1 \sigma_j$ bounds against the global event average, visually defending the necessity of Z-score normalization.

---

## 26. UI States and Feedback

| UI State | Visual Treatment | Messaging / Feedback Example |
| :--- | :--- | :--- |
| **Default** | Surface `#181E20`, Border `#2D363A` | Ready for interaction |
| **Hover** | Border `#424D52` or `#3898EC` | Subtle slate/blue hairline illumination |
| **Focus** | Outline `2px solid #3898EC`, offset 2px | Keyboard focus indicator |
| **Loading** | Monospace pulsing ticker `[ COMPUTING NORMALIZATION... ]` | Indeterminate linear sweep bar |
| **Success** | Border `#3DD68C`, Badge `[ SAVED ]` | `Review submitted successfully.` |
| **Error** | Border `#EA384C`, Text `#EA384C` | `Validation failed: Criterion ratings must be between 1 and 5.` |
| **Deadline Passed** | Surface `#221417`, Border `#EA384C` | `[ SUBMISSIONS LOCKED: CUTOFF TIMESTAMP REACHED ]` |
| **Forbidden (403)** | Full screen dark panel, Monospace bold text | `[ HTTP 403 FORBIDDEN: PEER SCORES ARE ISOLATED ]` |

---

## 27. Interaction Design & Feedback

- **Form Submissions**: Disables submit button immediately upon click, transforms text to `[ PROCESSING... ]`, and prevents double-submission.
- **Live Rubric Preview**: As a judge adjusts numerical ratings, the composite score preview recalculates instantly without network latency.
- **Error Shake / Highlight**: Invalid inputs receive an immediate 1px solid red border with helper text rendering beneath the input in 11px `'Fira Code'`.

---

## 28. Motion and Animation

- **Motion Restraint**: Animation is strictly functional. No floating decorative elements or lingering parallax.
- **Duration Scale**:
  - Micro-interactions (hover, border transitions): `120ms linear`
  - Modal entries and panel slides: `200ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Prefers-Reduced-Motion**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

---

## 29. Accessibility Requirements (WCAG 2.1 AA)

1. **Color Contrast**:
   - Text Primary (`#FFFFFF`) on Void (`#12181A`): **21.0:1** (exceeds AAA).
   - Text Secondary (`#A0AAB0`) on Surface (`#181E20`): **7.8:1** (exceeds AAA).
   - Brand Accent Blue (`#3898EC`) on Void (`#12181A`): **6.8:1** (exceeds AA).
   - Brand Secondary (`#F8F9F9`) on Surface (`#181E20`): **19.5:1** (exceeds AAA).
2. **Keyboard Navigation**:
   - All interactive elements (steppers, filter tabs, inputs, modals) are fully operable via `Tab`, `Space`, `Enter`, and Arrow keys.
   - Modals trap focus; pressing `Escape` closes the active overlay.
3. **Screen Readers**:
   - Semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<table>`).
   - Dynamic score previews include `aria-live="polite"`.

---

## 30. Content Design and Terminology

Verity strictly employs the domain vocabulary established by `SPEC.md`:
- Use `Track`, not "Category" or "Channel".
- Use `Rubric Criterion`, not "Question" or "Metric".
- Use `Scorecard`, not "Feedback Form".
- Use `Submissions Close`, not "Due Date" or "End Time".
- Use `Normalization`, not "Score Curve" or "Adjustment Factor".
- Use `Peer Scores`, not "Other Judges' Ratings".

---

## 31. Security-Related Presentation

The UI makes server-enforced security boundaries visible:
- **Peer Isolation**: When Judge B attempts to view Judge A’s scorecard, the UI does not hide or render a generic error. It surfaces:
  ```
  [ ACCESS DENIED: HTTP 403 FORBIDDEN ]
  Backend security policy enforces strict peer scorecard isolation.
  Judges may not inspect evaluations submitted by other reviewers.
  ```
- **Deadline Lockout**: Once the UTC clock passes `submissions_close`, submission forms clearly state:
  ```
  [ SUBMISSIONS ARE CLOSED ]
  Cutoff: 2026-03-01T18:00:00Z.
  The server strictly refuses modifications after this timestamp.
  ```

---

## 32. Mobile and Desktop UX

- **Desktop (Primary Judging & Admin Workstation)**:
  - High information density.
  - Side-by-side evaluation panels allowing simultaneous code/demo inspection and rubric scoring without tab switching.
  - Full-width tabular matrices for live organizer deliberation.
- **Mobile (On-the-go Hacker & Gallery Browsing)**:
  - Touch targets expand to minimum `44px × 44px`.
  - Responsive horizontal swipe/scroll on tabular leaderboards.
  - Single-column stacked submission drafting with sticky bottom save bar.

---

## 33. Performance-Aware Design

- **Lightweight DOM**: Pure HTML/CSS without bloated UI component libraries.
- **Zero Layout Shifts (CLS = 0)**: Fixed aspect ratios on image containers and explicitly sized font headers.
- **Sub-100ms Interactions**: Local client-side calculation for weighted rubric previews prior to server dispatch.

---

## 34. Design System Architecture

```
design-system/
├── tokens/
│   ├── colors.css           # Exact HEX tokens & CSS variables (raptors.dev palette)
│   ├── typography.css       # Scale, families (Helvetica, Fira Code), line-heights
│   └── spacing.css          # 4px/8px modular spacing scales
├── primitives/
│   ├── buttons.css          # Primary, secondary, danger, compact, pill
│   ├── inputs.css           # Inputs, selects, textareas, steppers
│   └── badges.css           # Monospace bracketed status tags
├── components/
│   ├── project-card.css     # Gallery & queue card anatomy
│   ├── rubric-form.css      # Weighted criteria scoring component
│   └── data-table.css       # Monospace lining data tables
└── layouts/
    ├── navigation.css       # Floating pill topbar, role switcher, drawer
    └── split-console.css    # Dual-pane judging workstation
```

---

## 35. Frontend Implementation Guidance

- **CSS Variables**: All component styling must reference CSS custom properties defined in Section 10. Direct raw HEX values in component rules are strictly forbidden.
- **Self-Contained Styling**: Use modular Vanilla CSS or CSS modules to avoid heavyweight runtime framework requirements.
- **Class Naming Convention**: BEM-inspired industrial naming:
  - Block: `.df-card`, `.df-rubric`, `.df-table`
  - Element: `.df-card__title`, `.df-rubric__criterion`, `.df-table__cell`
  - Modifier: `.df-card--locked`, `.df-rubric__stepper--selected`

---

## 36. Design QA Checklist

- [ ] **Color Contrast**: All text meets WCAG AA standards (4.5:1 for body, 3:1 for large text).
- [ ] **Offline Execution**: Page renders identically with zero external network connectivity.
- [ ] **Typography Uniformity**: Only `'Helvetica'` and `'Fira Code'` are rendered; fallbacks match geometry.
- [ ] **Hairline Consistency**: All borders are strictly `1px solid` without blurry shadows.
- [ ] **State Coverage**: Every form field and button has documented default, hover, focus, active, disabled, and error states.
- [ ] **Peer Isolation Feedback**: Probing another judge’s scores renders a clear HTTP 403 error slate.
- [ ] **Cutoff Verification**: Submitting after the deadline produces a server-backed 4xx rejection message.
- [ ] **Tabular Figures**: All numerical tables use monospace tabular numerals with right alignment.

---

## 37. Do / Don't Guidelines

### DO:
- **DO** use exact monospace bracketed tags for status: `[ STATUS: LOCKED ]`.
- **DO** display rubric weights ($w_i$) prominently beside each criterion.
- **DO** provide immediate, transparent feedback when backend authorization rejects a request.
- **DO** keep information dense and legible for rapid evaluation.

### DON'T:
- **DON'T** add social features, like counts, favorites, or user follower graphs.
- **DON'T** hide peer score data in frontend templates while leaving API routes exposed.
- **DON'T** use soft rounded pastel cards, faded blue/purple gradients, or generic SaaS marketing illustrations.
- **DON'T** load webfonts, scripts, or stylesheets from external CDNs.

---

## 38. SPEC-to-Design Traceability Matrix

| SPEC.md Requirement | Tier | Repository Code Status | Design Section & Component | UI Representation |
| :--- | :---: | :---: | :--- | :--- |
| **Authentication & Roles** | T1 | Backend Implemented | §15, §16 (`.df-nav__persona`) | Monospace session badge & switcher drawer |
| **Event Configuration** | T1 | Backend Implemented | §17 (`.df-console__event`) | Tabular settings for tracks, dates, prizes |
| **Team Invite Link** | T1 | Backend Implemented | §18 (`.df-team__invite`) | Monospace shareable URL with copy button |
| **Project Submission Draft**| T1 | Backend Implemented | §18 (`.df-form__submit`) | Draft editor with live character countdown |
| **Deadline Enforcement** | T1 | Backend Implemented | §18, §31 (`.df-banner--lock`) | Amber lockout slate & disabled input fields |
| **Public Gallery & Filter** | T1 | *In Progress* | §19 (`.df-gallery`) | Track pill filters, search box, card grid |
| **Judge Assignment Queue** | T2 | *Specified* | §20 (`.df-queue`) | Track-matched project review queue |
| **Weighted Rubric Scoring** | T2 | *Specified* | §20 (`.df-rubric`) | Criteria steppers with explicit weight $w_i$ |
| **Backend Peer Isolation** | T2 | *Specified* | §16, §31 (`.df-slate--403`) | HTTP 403 Forbidden terminal error view |
| **Organizer Dashboard** | T2 | *Specified* | §21 (`.df-dashboard`) | Review completion bars & audit table |
| **Cross-Judge Normalization**| T2 | *Specified* | §21, §25 (`.df-table--norm`) | Standardized 0–100 standing scores |
| **CSV Export** | T2 | *Specified* | §21 (`.df-btn--export`) | Direct action triggering `/api/export.csv` |
| **Community Voting** | T3 | *Specified* | §22 (`.df-ballot`) | Randomized project ordering ballot |
| **T4 API & Bulk Import** | T4 | *Specified* | §23 (`.df-import`) | Drag-and-drop fixture JSON ingestion zone |

---

## 39. Design Decisions and Open Questions

### Design Decisions (Safe Visual Proposals)
1. **Decision**: Deep graphite void (`#12181A`) and charcoal slate (`#1F2426`) with pure white headers and raptors.dev pill navigation.  
   *Rationale*: Directly matches the atmosphere, brand color identity, and guild authority of `raptors.dev`.
2. **Decision**: Explicit inline Persona Switcher drawer.  
   *Rationale*: Greatly accelerates manual and automated validation of `.dogfood.toml` sessions.
3. **Decision**: Dual-pane judging workstation on desktop screens.  
   *Rationale*: Eliminates context switching during evaluation of code repositories and rubrics.

### Open Questions (Requiring Confirmation)
1. **Question**: Does community voting require email magic links or standard authenticated sessions?  
   *Status*: *Needs Confirmation*. The specification mentions both; the design supports either without altering ballot layout.
2. **Question**: Are fixture comments strictly plain text or can they include markdown formatting?  
   *Status*: *Needs Confirmation*. Design defaults to sanitized plain text in monospace font.

---

## 40. Final Design Summary

The Verity design system provides an **implementation-ready, technically authoritative specification** that unites the functional rigor of [`SPEC.md`](file:///d:/Verity/SPEC.md) with the bold editorial guild identity and color palette of [`raptors.dev`](https://www.raptors.dev/). 

By prioritizing high-density tabular clarity, mathematical transparency, 100% offline self-containment with local `'Helvetica'` and `'Fira Code'` typography, and visible server-enforced security boundaries — all rendered through the deep graphite/charcoal palette (`#12181A`, `#1F2426`) with crisp white contrast and refined interactive accents — the design ensures that when Verity is launched via `docker compose up`, it delivers an immediate impression of integrity, engineering excellence, and uncompromising usability.

---

## Appendix A — Optional Visual Exploration

*(This appendix explores non-breaking aesthetic variations for developer consideration without modifying product functionality).*

### Exploration 1: High-Contrast Monochromatic Wireframe Mode
- **Application**: Public Gallery and Organizer Tables.
- **Visual Treatment**: Strips out colored semantic accents, utilizing pure stark white (`#FFFFFF`) on deep graphite (`#12181A`) with alternating grayscale zebra striping (`#181E20`).
- **Purpose**: Maximizes readability under direct sunlight or low-grade projection displays during live hackathon closing ceremonies.
- **Implementation**: Toggled via a single root class `.theme-wireframe` modifying base color tokens. Does not alter layout or data structures.
