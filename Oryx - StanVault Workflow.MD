# Oryx → StanVault Workflow

> How Oryx (formerly Dasham) feeds conviction data into StanVault's scoring engine.

---

## Background

**Dasham was the old brand name for Oryx.** Renamed Feb 12, 2026. The word "dash" (Nigerian slang for tip) stayed as the tipping verb. In StanVault's codebase, the platform enum is still `DASHAM` and the scoring references Dasham — they mean the same thing.

**Oryx** is a tipping platform for African music moments. Fan sees a moment (clip/event), tips the artist via Paystack (Nigeria) or Flutterwave (Kenya/SA). Real money, real payment rails, mobile money verification.

**Palmlion** is a planned cross-platform conviction aggregator (Boomplay, Audiomack, MTN Music). Demo stage only — doesn't talk to StanVault yet. The Palmlion + Oryx merge mentioned in CLAUDE.md hasn't happened; they run independently.

---

## Data Flow

```
Fan tips artist on Oryx (moment)
        │
        ▼
completeDash() in payment.service.ts
        │
        ├──► LOCAL: normalizeDash() → calculateConviction() → emit to Socket.io
        │
        └──► STANVAULT: reportTipToStanVault() (fire-and-forget, 5s timeout)
                │
                ▼
        POST /api/stanvault/fan/import
        Headers: X-Ecosystem-Secret, X-Source: oryx
                │
                ▼
        StanVault creates/updates FanPlatformLink (platform: DASHAM)
                │
                ▼
        Recalculates Stan Score using calculateStanScore()
```

If StanVault is down, the tip still completes. The report is non-blocking.

---

## What Oryx Sends

Every completed dash fires a `DashTipEvent` to StanVault:

```typescript
{
  fanEmail?: string
  fanPhone?: string
  fanDisplayName: string
  fanId: string                    // Oryx user ID
  artistId: string                 // Oryx creator ID
  artistName: string
  tipAmountMinor: number           // In smallest currency unit (e.g. kobo)
  tipCurrency: string              // NGN, ZAR, KES, GHS, UGX
  tipAmountUsd: number             // Normalized USD equivalent
  normalizedAmountUsd?: number     // Income-adjusted USD equivalent
  incomeBracketMultiplier?: number // LOW=1.5x, MID=1.0x, HIGH=0.7x
  platformWeight?: number          // Mobile money=1.3x, Card=1.0x
  momentId: string
  momentTitle: string
  city: string                     // LAGOS, JOBURG, NAIROBI, ACCRA, KAMPALA
  dashId: string                   // Transaction ID
  completedAt: string              // ISO8601
  verifiedVia: 'mobile_money' | 'card'
  provider: string                 // PAYSTACK or FLUTTERWAVE
  conviction?: {                   // Full 4-component breakdown (if available)
    financialConviction: number
    durability: number
    attributedPropagation: number
    geographicSignal: number
    totalScore: number
    tier: string
  }
}
```

**Key detail:** Mobile money (Flutterwave/M-Pesa) sets `verifiedVia: 'mobile_money'`, which StanVault treats as real identity verification. You can't fake spending real M-Pesa money.

---

## What StanVault Stores

Stored in `FanPlatformLink` with `platform: DASHAM`:

| Field | What It Tracks |
|---|---|
| `tipCount` | Total tips sent (incremented per dash) |
| `tipAmountUsd` | Cumulative tip amount in USD |
| `tipFrequency` | Unique months with tips (durability signal) |
| `momentSaves` | Moments saved/engaged with |
| `cityAffiliation` | Fan's city from the tip transaction |

Tip frequency tracks unique months via metadata stored in `platformFanId` as JSON.

---

## How StanVault Scores Dasham Data

### Conviction Component (35 points max, Dasham can reach 30)

| Signal | Formula | Max Points |
|---|---|---|
| Tip count | `tipCount × 3` | 10 |
| Tip amount | `tipAmountUsd / 5` | 10 |
| Tip frequency | `tipFrequency × 2` (unique months) | 5 |
| Moment saves | `momentSaves × 1` | 5 |
| **Dasham total** | | **30** |
| City presence bonus | +5 if fan city = artist city | 5 |
| **Full conviction max** | | **35** |

Without Dasham, conviction relies on Bandcamp/Ko-fi/Patreon (max 25/35) or the behavioral proxy from Spotify streams (max 10/35, only fires when conviction = 0).

### Full Stan Score (100 points)

| Component | Max | Dasham Impact |
|---|---|---|
| Conviction | 35 | Direct — Dasham is the primary conviction signal |
| Engagement | 30 | Indirect — Dasham fans usually also stream on Spotify |
| Platform breadth | 10 | +5 for Dasham as an additional platform |
| Longevity | 15 | None — time-based only |
| Recency | 10 | Indirect — active Dasham tippers have recent activity |

### Tier Thresholds

| Score | Tier |
|---|---|
| 75+ | SUPERFAN |
| 50-74 | DEDICATED |
| 25-49 | ENGAGED |
| 0-24 | CASUAL |

Without Dasham, practical ceiling is ~65 (DEDICATED). With Dasham, SUPERFAN (75+) is reachable.

---

## 3 Concrete Examples

### Example 1: Lagos fan, 5 tips over 3 months, $20 total

- Tip count: `5 × 3 = 15` → capped at **10**
- Tip amount: `$20 / 5 = 4` → **4**
- Tip frequency: `3 × 2 = 6` → capped at **5**
- Moment saves: 2 → **2**
- City bonus: fan in Lagos, artist in Lagos → **+5**
- **Conviction: 26/35**
- Add engagement (Spotify streams) + platform breadth + longevity + recency
- **Stan Score: ~55-65 → DEDICATED**

### Example 2: Same fan behavior, NO Dasham — just Twitter follows + 80 Spotify streams

- Conviction: 0 from financial signals. Behavioral proxy fires: ~5-10 pts from streams
- No city data → no city bonus
- **Conviction: 5-10/35**
- **Stan Score: ~25-35 → ENGAGED**

### Example 3: London diaspora fan, $15 Bandcamp purchase, no Dasham

- Bandcamp purchase: ~8-11/35 conviction (expanded scoring)
- No city bonus (London ≠ Lagos)
- **Conviction: 8-11/35**
- **Stan Score: ~30-40 → ENGAGED**

---

## Events StanVault Creates

| Event | When |
|---|---|
| `FIRST_TIP` | Fan's first Dasham tip to this artist |
| `MILESTONE_TIPS` | At 5, 10, 25, 50, 100 cumulative tips |

Events include metadata: momentId, dashId, city, amount.

---

## Mobile Money Verification

When `verifiedVia: 'mobile_money'`:
- StanVault marks the `FanUserArtistLink` as `verified: true`
- Records verification method and timestamp
- Mobile money = real KYC (MTN MoMo, M-Pesa require government ID to register)

This is the strongest identity verification in the system — stronger than Spotify OAuth.

---

## Oryx's Own Conviction Engine (4 Components)

Oryx calculates its own conviction score locally before reporting to StanVault. This is a different, more granular model:

| Component | Weight | What It Measures |
|---|---|---|
| Financial Conviction | 40% | Normalized tips (income-adjusted, platform-weighted, time-decayed) |
| Durability | 30% | Consistency over time (months active / months since first action) |
| Attributed Propagation | 20% | Referral conversions (share → signup → tip within 30 days) |
| Geographic Signal | 10% | Cross-city conviction spread |

**Income normalization:** A student tipping 200 NGN (LOW bracket, 1.5x multiplier) scores the same conviction as a banker tipping 5,000 NGN (HIGH bracket, 0.7x multiplier). Sacrifice is the signal, not wealth.

StanVault receives this breakdown in the `conviction` field of the tip event but currently only uses the raw tip data (count, amount, frequency, city) for its own scoring. The Oryx conviction breakdown is stored but not yet consumed.

---

## Is Dasham/Oryx Essential?

**For the core African ICP: yes, it's the moat.**
- Dasham tips are the highest-fidelity signal (money > streams)
- Mobile money verification = real identity
- City affiliation enables geographic conviction
- Without it, max practical score is ~65 (DEDICATED ceiling)

**For everyone else: no.**
- Expanded conviction scoring (Bandcamp, Ko-fi, Patreon, merch) covers up to 25/35 conviction
- Starter tier works for Western indie artists without Dasham
- The gap is by design — the system advantages the ecosystem where Oryx operates

---

## Key Files

| What | Where |
|---|---|
| StanVault scoring engine | `stanvault/src/lib/scoring/stan-score.ts` |
| StanVault import endpoint | `stanvault/src/app/api/stanvault/fan/import/route.ts` |
| StanVault tier query (for Oryx) | `stanvault/src/app/api/stanvault/tier/route.ts` |
| StanVault data model | `stanvault/prisma/schema.prisma` |
| Oryx ecosystem service | `oryx/backend/src/services/ecosystem.service.ts` |
| Oryx conviction engine | `oryx/backend/src/services/conviction.service.ts` |
| Oryx payment flow | `oryx/backend/src/services/payment.service.ts` |
| Oryx dash routes | `oryx/backend/src/routes/dash.ts` |
| Oryx DB schema | `oryx/backend/prisma/schema.prisma` |
