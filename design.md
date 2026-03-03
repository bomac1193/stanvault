# Imprint Design Reference

## Hot Pink Era (v1 — March 2026)

### Accent Color
- **Primary**: `#FF2D92` (hot pink)
- **Bright**: `#FF5AAB`
- **Dim**: `#FF2D9233`

### Design System: "Bourgeois Rebel"
Balenciaga meets Apple meets Napster. Black canvas, white type, hot pink accent. No rounded corners. No softness.

### Typography
- **Brand**: Canela (serif) — used for "Imprint" wordmark on landing page
- **Body**: Sohne (sans-serif)
- **Mono**: Sohne Mono
- **Scale**: Brutal — 8rem display down to 0.625rem overline

### Landing Page
- "Imprint" in Canela serif, top-left
- Hero: "Not all fans are **equal**." (equal in accent color)
- Two doors: Creators & Teams (white accent) / Fans (hot pink accent)
- No subtitle, no genre grid, no tagline — just the statement

### Color Palette
- Background: pure black `#000000`
- Text: white `#FFFFFF`, gray scale `#737373` to `#F5F5F5`
- Accent: hot pink `#FF2D92`
- Secondary: purple `#8B5CF6`
- Status: success `#00FF88`, warning `#FFD600`, error `#FF0040`
- Tier colors: monochrome hierarchy (gray → white for superfan)

### Key Decisions
- No rounded corners (borderRadius DEFAULT = 0)
- Ambient glow: `bg-accent/[0.03] blur-[120px]` for subtle pink atmosphere
- Borders: `border-gray-800` default, accent borders for fan-facing elements
- Transitions: 300-500ms duration, ease-out
- Cards: no border-radius, `border-[#1a1a1a]`
- Buttons: flat, no radius, uppercase tracking on labels

### Auth Layout
- Split: left panel (brand + tagline), right panel (form)
- Desktop: "Imprint" wordmark + "Not all fans are equal."
- Mobile: compact "Imprint" header

### Dashboard
- Sidebar: logo area with breathing room (p-6), taller than header
- Header: h-16, search + bell + avatar + artist name
- Cards: dark bg, subtle borders, no section icons
