---
name: momi-ui
description: Build and change React UI in projects that use momi-ui, a Tailwind CSS v4 + Radix component library (shadcn-style, plus Kanban, EventCalendar, DataTable, DateTimePicker, Combobox, Toolbar, landing-page blocks and built-in English/Vietnamese text). Use this skill whenever the project depends on momi-ui (it is in package.json or code imports from 'momi-ui') and you build or edit screens, forms, dialogs, menus, tables, boards, calendars, landing pages, theming, dark mode or translations — even if the user never says "momi-ui". Also use it before writing a custom widget in such a project, to find the component that already exists, and when the library seems to be missing something.
---

# momi-ui

momi-ui is a general-purpose React 19 component library on Tailwind CSS v4 and Radix. This skill ships inside the package, so it describes the version installed in this project. For exact props, search `references/components.md` (generated from the source for this version); for the full Vietnamese guide with more examples, read `node_modules/momi-ui/README.md`.

## Before writing UI

1. **Look for the component first.** Search `references/components.md` for what you need (a name like `Combobox`, or a word like `drag`, `resize`, `shortcut`). The library covers far more than buttons and inputs: resizable panels, sortable lists, Kanban, an event calendar, date/time pickers, number fields you can drag, color pickers, toolbars, context menus opened at a point, toasts, a lightbox, landing-page sections. Hand-rolled replacements are the most common mistake in apps using it, and they lose what the library already handles — keyboard use, screen-reader announcements, touch, RTL, i18n, dark mode, density.
2. **Compose before you style raw elements.** Most screens are momi-ui parts arranged with Tailwind layout classes (`grid`, `flex`, `gap-*`). Reach for plain `<div>`s with hand-made borders and colors only for layout, not for things the library draws.
3. **Copy from `examples/`** when the screen resembles one; they are type-checked against this version:
   - `app-root.tsx` — providers, language switch, Toaster
   - `settings-dialog.tsx` — Dialog + FormField + Select / Switch / NumberField, AlertDialog confirm, `toast.promise`
   - `embedded-preview.tsx` — a UI inside part of the page (PortalProvider) and a non-modal side sheet
   - `schedule.tsx` — EventCalendar with app-owned events
   - `board.tsx` — Kanban, Combobox that creates tags, DateTimePicker
   - `data-table.tsx` — typed DataTable columns with sorting, totals and row menus

## Setup (check once per project)

- **CSS.** With Tailwind v4 (preferred), the app's main CSS has both imports, in this order:
  ```css
  @import 'tailwindcss';
  @import 'momi-ui/tailwind.css'; /* tokens + @source for the library's own classes */
  ```
  Without Tailwind, `import 'momi-ui/styles.css'` once instead. If the app has older global CSS (`button { … }`), wrap it in a layer between `base` and `components` so it stops overriding the components:
  ```css
  @layer theme, base, legacy, components, utilities;
  @import 'tailwindcss';
  @import 'momi-ui/tailwind.css';
  @import './legacy.css' layer(legacy);
  ```
- **Providers** near the root (see `examples/app-root.tsx`): `ThemeProvider`, `LocaleProvider`, optional `TooltipProvider`, and one `<Toaster />` if anything calls `toast()`. `ThemeScript` in `<head>` avoids a light flash in dark mode for server-rendered pages. In Astro, each island is its own React root: put providers inside the island.
- **Installing.** Apps pin a git tag (`"momi-ui": "github:HoangDuong2k/momi-ui#v0.4.0"`) or use `file:../momi-ui` while developing both. With Vite, set `resolve.dedupe: ['react', 'react-dom']`. npm 11 may warn that momi-ui's `prepare` script is not approved: the package is already built when installed from git, so the warning is harmless (`npm install-scripts approve momi-ui` silences it).

## Conventions every component follows

Knowing these lets you guess most APIs correctly — then confirm in the reference.

- **State:** `value` + `onValueChange` (controlled) or `defaultValue`. Drag controls (`Slider`, `NumberField`, `ColorPicker`) call `onValueChange` on every step and `onValueCommit` once per gesture — save, validate or push undo history in `onValueCommit`. Open state is `open` / `defaultOpen` / `onOpenChange`; switches and checkboxes use `checked` / `onCheckedChange`.
- **Look:** `variant` (`solid · soft · outline · ghost · link`), `tone` (`primary · neutral · danger`, plus `success · warning · info` where it makes sense), `size` (`xs · sm · md · lg`). `<DensityProvider density="compact">` makes `xs` the default inside a dense panel.
- **Styling:** `className` is merged last with tailwind-merge, so it overrides anything. `asChild` renders your element with the component's behavior (`<Button asChild><a href="…" /></Button>`). Every root has `data-slot="…"` for tests and targeted CSS.
- **Forms:** put a control inside `<FormField label description error required>` and it gets the id, label and ARIA wiring automatically. `Switch` and `Checkbox` take their own `label` / `description`.
- **Text:** built-in strings (buttons, placeholders, empty states, screen-reader text) come from `LocaleProvider` (`messages={vi}` for Vietnamese, partial objects merge) or a component's `labels` prop. Dates and numbers follow `locale` (prop → provider → browser); times follow it too, `hourCycle` forces 12/24 h. Text the app passes in (labels, titles, options) is the app's to translate.
- **Accessibility:** icon-only buttons need `aria-label` (`IconButton` requires it). Drag-and-drop components take `getItemLabel` so moves can be announced. Keep that wiring; don't replace interactive parts with `div onClick`.

## Things that look right but break

- **Tailwind classes must appear literally in source.** `bg-${tone}-500` or `` `w-[${px}px]` `` is never generated. Map values to full class names (`{ danger: 'bg-destructive', … }`) or use `style` for computed numbers.
- **Theme tokens go on `:root` / `.dark`, not on a wrapper.** Menus, popovers, dialogs and toasts render in a portal outside your wrapper and would miss the colors. Tokens: `background foreground card popover primary secondary muted accent destructive success warning info border input ring` (each with `-foreground` where relevant), `--radius`, and optional `--surface-sunken`, `--surface-raised`, `--border-strong`. Dark mode is `.dark` or `data-theme="dark"` on `<html>` (`ThemeProvider` sets it).
- **Changing the palette yourself** (outside `ThemeProvider`) fades colors through the controls' 150 ms transitions; wrap the change in `withoutTransitions(() => …)`.
- **UI embedded in part of the page** (device frame, panel, widget): wrap it in `PortalProvider container={frame} collisionBoundary={frame}` and give the frame `contain: layout` (or a transform/filter). `container-type` alone does not make it a containing block, so dialogs and drawers would still cover the whole window.
- **Overlays inside overlays just work** (a Select in a Dialog, a DatePicker in a Drawer). Don't add your own `z-index`, portals or Escape handlers to fix layering; Escape closes the topmost layer.
- **Non-modal side sheets:** `<Drawer modal={false}>` with `<DrawerContent closeOnInteractOutside={false}>` keeps the page usable and the sheet open; offset it with `style={{ top: 48 }}`.
- **EventCalendar `end` is exclusive** (iCalendar style): an all-day event on the 5th–7th ends at midnight on the 8th. The calendar never stores events — update your list in `onEventChange`, create in `onSelectRange`, load in `onRangeChange`. Expand repeating events yourself and mark generated ones `editable: false`. Give it a height (`className="h-[640px]"` or `h-full`).
- **Kanban value is `Record<columnId, T[]>`**, items need `id` (or `getItemId`); use `onValueChange` for the whole board and `onCardMove` to save one move.
- **`DateTimePicker` value is `{ date, time }`** with `time` as `"HH:mm"` or `null` for all day — not a single `Date`.
- **Animated backgrounds** (`ParticleWave`, `Fireflies`, `LightBeams`, `DustMotes`, `BackgroundPattern`) are decorative layers: put them first inside a `relative isolate` parent so they sit behind the content, and pass brand colors through `colors` (theme variables work). **Image effects** (`ParticleImage`, `HalftoneImage`, `PixelTrail`) fill their parent, so give it a size; their `src` must be same-origin or CORS-enabled, and they need `alt` when the image carries meaning. All of them pause off screen, handle reduced motion and light/dark backgrounds — don't wrap them in your own visibility or motion logic.
- **Toasts:** call `toast()`, `toast.success()`, `toast.promise()` anywhere; mount `<Toaster />` once.
- **Keyboard shortcuts:** `useShortcut('n', fn)` for app shortcuts (single keys are ignored while the user types in a field), `formatShortcut` / `<Kbd keys>` / the `shortcut` prop of `Tooltip` and menu items to show them. `useCommandShortcut(fn, 'k')` treats a single key as ⌘K / Ctrl+K.

## Verify

Type-check and build the app. Then run it and check the screen in light and dark, with the keyboard (Tab, Enter, Escape, arrow keys in menus and grids), at a narrow width, and — for embedded UIs — that overlays stay inside the frame.

## When momi-ui seems to lack something

1. Search the reference again under other words; many needs are props (`renderX`, `labels`, `container`, `presets`, `columnWidth="fill"`…), not new components.
2. Compose: a `Popover` around a `DatePickerPanel`, a `DropdownMenu` with `position` for a menu at the cursor, `className` for one-off styling.
3. Don't edit `node_modules`, fight internals with `!important` or DOM queries, or copy a component's source into the app — those break on the next version.
4. If it really is missing, keep a small, clearly marked workaround in the app and draft a request for the library. momi-ui is shared by several apps, so describe the general need (who else would use it, proposed props following the conventions above, defaults that suit any app) rather than this app's specifics, and hand it to the user.

## Reference files

- `references/components.md` — every export with its own props, defaults and one-line docs, generated from this version's source. Search it; it is long.
- `examples/*.tsx` — working screens to adapt.
- `node_modules/momi-ui/README.md` — the library's guide (Vietnamese): theming, i18n, density, DataTable, Kanban, EventCalendar and landing blocks in depth.
- `node_modules/momi-ui/dist/index.d.ts` — exact types, when the reference is not enough.
