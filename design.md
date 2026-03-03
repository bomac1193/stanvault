# Imprint Design Reference

## Deep Rose Era (v2 — current)

### Accent Color
- **Primary**: `#D45068` (deep rose — devotion that aged)
- **Bright**: `#E8687E`
- **Dim**: `#D4506833`
- **CSS var**: `--accent: #D45068` in globals.css

### Why Deep Rose
Hot pink was too playful for the copy. Amber/gold was too institutional for fans. Deep rose sits between — passionate enough for a 19-year-old superfan proving devotion, earned enough for a creator reading intelligence. Heat without sugar.

### Brand Identity
- **Logo**: "Imprint" in Canela serif. No logomark, no brackets, no icon. The word is the logo.
- **No subtitles on pages**. Title only. The page speaks for itself.
- **No page descriptions** except Imprints (unique concept needs context).

### Typography
- **Brand**: Canela (serif) — "Imprint" wordmark, page titles, auth headings
- **Body**: Sohne (sans-serif)
- **Mono**: Sohne Mono
- **Scale**: Brutal — 8rem display down to 0.625rem overline

### Landing Page
- "Imprint" in Canela, top-left
- Hero: "Not all fans are **equal**." (equal in accent color)
- Two doors: Creators & Teams (white accent) / Fans (deep rose accent)
- No subtitle, no genre grid, no tagline — just the statement

### Color Palette
- Background: pure black `#000000`
- Text: white `#FFFFFF`, gray scale `#737373` to `#F5F5F5`
- Accent: deep rose `#D45068`
- Secondary: purple `#8B5CF6`
- Status: success `#00FF88`, error `#FF0040` (functional only — used for data direction, not decoration)
- Tier colors: monochrome hierarchy (gray → white for superfan)
- Selection highlight: deep rose (::selection in globals.css)

### Key Decisions
- No rounded corners (borderRadius DEFAULT = 0)
- Ambient glow: `bg-accent/[0.03] blur-[120px]` for subtle rose atmosphere
- Borders: `border-gray-800` default, accent borders for fan-facing elements
- Status colors (green/red) kept for functional data indicators — brand doesn't override usability
- Chart lines use `#D45068` (hardcoded where Recharts needs hex)
- Cards: no border-radius, `border-[#1a1a1a]`, no background tint
- Buttons: flat, no radius

### Auth Pages
- "Imprint" in Canela, centered (fan) or top-left (creator)
- No "Fan Portal" label — the content establishes context
- Login: no subtitle, just "Sign in"
- Register: one-line subtitle max ("Conviction over vanity.")
- Bottom links: stacked, spaced (`space-y-6`), question above action

### Dashboard
- Sidebar: logo area with breathing room (p-6), taller than header
- Header: h-16, search + bell + avatar + artist name
- Page titles only — no descriptions (except Imprints)
- Getting Started checklist uses accent for completed (not green)

---

## Hot Pink Era (v1 — March 2026, archived)

### Accent Color
- **Primary**: `#FF2D92` (hot pink)
- **Bright**: `#FF5AAB`
- **Dim**: `#FF2D9233`

### Notes
Balenciaga meets Apple meets Napster. Bold and rebellious but undercut the weight of the copy. "Not all fans are equal" is a confrontational statement — hot pink made it feel consumer/playful. Archived in commit `0e5498e`.
