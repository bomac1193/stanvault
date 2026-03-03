# Sigma Test: OnlyFans Creator ICP Stress Test

> Simulated 200-user beta (80 OF creators + 120 OF fans) over 90 days using real Stan Score engine.
> Purpose: Determine whether OnlyFans creators are a viable ICP for StanVault.
> Run date: 2026-02-24
> Script: `scripts/simulate-onlyfans-beta.ts`

---

## TL;DR

**4 KILL metrics. OnlyFans creators are structurally excluded from StanVault's value proposition.**

StanVault sees **0.5% of actual fan spend.** Fans spending $15,691 on OnlyFans subscriptions and tips generated only $83 of visible revenue through Ko-fi/Patreon/Merch. The scoring system correctly identifies this as low conviction — because it IS low conviction from StanVault's perspective, even though the actual fan-creator relationship is extremely monetized.

The exception: **OF creators who also make music retain at 50%.** These are musicians first, OF creators second. StanVault works for their music career, not their OF career.

---

## Population

| | Count |
|---|---|
| Creators | 80 |
| Fans | 120 |
| Fan-Creator Links | 148 |
| Scored Fan Records | 120 |
| Drops Created | 29 |
| Drop Claims | 33 |

---

## Head-to-Head: OF Beta vs Music Beta

| Metric | OF Beta | Music Beta | Target | OF Status |
|--------|---------|------------|--------|-----------|
| Creator Retention | **18.8%** | 83.6% | 75%+ | KILL |
| Fan Retention | **12.5%** | 48.3% | 45%+ | KILL |
| Drops / Creator | **1.9** | 3.8 | 3+ | WARN |
| Spotify Verification | **20.0%** | 73.3% | 80%+ | KILL |
| Drop Claim Rate | **113.8%** | 148.8% | 55%+ | PASS |
| Cross-Creator Fans | **12.5%** | 28.3% | 20%+ | WARN |
| Conviction Activation | **1.7%** | 80.0% | 60%+ | KILL |

**Score: 1 PASS, 2 WARN, 4 KILL** (vs Music Beta's 5 PASS, 4 WARN, 0 KILL)

---

## Score Component Breakdown

| Component | OF Avg | Max | Music Avg (est.) | Problem |
|-----------|--------|-----|-------------------|---------|
| Conviction | **0.3** | 35 | ~5+ | No Dasham, no Bandcamp, OF revenue invisible |
| Engagement | **16.9** | 30 | ~18+ | Social-only; no streaming depth signals |
| Platform | **9.0** | 10 | ~8+ | IG + Twitter present, but narrow |
| Longevity | **5.5** | 15 | ~6+ | Time-based — works normally |
| Recency | **1.8** | 10 | ~5+ | Low retention = low recency |
| **TOTAL** | **33.4** | 100 | **42.8** | 22% lower than music beta |

---

## Tier Distribution

| Tier | OF Count | OF % | Music % |
|------|----------|------|---------|
| CASUAL | 24 | 20.0% | 3.4% |
| ENGAGED | 90 | 75.0% | 84.5% |
| DEDICATED | 5 | 4.2% | 10.3% |
| SUPERFAN | 1 | 0.8% | 1.8% |

OF fans cluster at CASUAL (20%) and ENGAGED (75%). Almost no one reaches DEDICATED or SUPERFAN because the conviction signals that push fans upward (financial spend) are invisible.

---

## The Revenue Visibility Gap

This is the core structural problem:

| | Amount |
|---|---|
| Total fan spend on OnlyFans (subscriptions + tips + PPV) | **$15,691** |
| Total fan spend visible to StanVault (Ko-fi + Patreon + Merch) | **$83** |
| **Revenue visibility** | **0.5%** |

StanVault sees half a percent of actual fan-creator economic activity. A fan paying $50/mo for 3 months ($150 lifetime value) scores the same as someone who followed the creator on Instagram and liked 5 posts.

---

## Creator Segment Retention

| Segment | Retained | Rate | |
|---------|----------|------|-|
| Top OF Creators | 3/15 | 20.0% | ████ |
| Mid-Tier OF | 4/25 | 16.0% | ███ |
| Micro OF | 3/15 | 20.0% | ████ |
| **OF + Music** | **5/10** | **50.0%** | **██████████** |
| OF + Ko-fi/Patreon | 0/10 | 0.0% | |
| Fitness/Lifestyle | 0/5 | 0.0% | |

The only segment that retains meaningfully is **OF creators who also make music** — because StanVault actually works for their music side.

---

## Fan Segment Retention

| Segment | Retained | Rate |
|---------|----------|------|
| Paying Subscribers ($15-50/mo on OF) | 4/30 | 13% |
| Casual Subscribers ($5-10/mo on OF) | 2/30 | 7% |
| Social-Only Fans | 4/25 | 16% |
| Cross-Platform Superfans | 5/15 | 33% |
| Lurkers | 0/20 | 0% |

Cross-platform superfans retain best (33%) because they're the only ones with enough visible signals (Ko-fi + Patreon + social + maybe merch) for the scoring to feel meaningful. Everyone else sees scores that don't reflect their actual relationship with the creator.

---

## Why OF Creators Are NOT the ICP

### 1. The Scoring System Can't See Their Fans' Conviction

OnlyFans IS the conviction signal. A fan paying $50/mo and tipping $500/year is deeply convicted. But StanVault measures conviction through:
- Dasham tips → OF fans don't use Dasham
- Bandcamp purchases → OF creators don't sell on Bandcamp
- Ko-fi/Patreon → Very few OF fans ALSO sub elsewhere
- Streaming depth → No music to stream
- City presence → OF is purely digital, no geographic signal

The 35-point conviction component (the richest scoring signal) returns **0.3 average** for OF fans.

### 2. OF Already Has Better Fan Intelligence

OnlyFans natively provides:
- Subscriber retention / rebill rate
- Revenue per subscriber
- Tip history per fan
- Message open rates
- PPV conversion rates
- Subscription duration

StanVault would tell an OF creator less about their fans than OnlyFans itself already does.

### 3. Spotify Verification Is Meaningless

80% of OF fans don't have Spotify connected to the creator. The "verify via Spotify" flow — StanVault's core trust mechanism — doesn't apply.

### 4. Drops Don't Map to OF Content Model

OF creators already have gated content (the entire platform is gated). StanVault drops are designed for musicians offering presale access, exclusive tracks, merch. OF creators already have PPV messages, locked posts, and tiered content.

---

## The Exception: OF + Music Creators (50% retention)

Creators who make music AND have an OF presence retain at 50% — because StanVault works for their music career:
- Their fans stream on Spotify (engagement signals fire)
- Some fans buy on Bandcamp (conviction signals fire)
- Some fans sub on Patreon/Ko-fi for music content (conviction signals fire)
- Spotify verification works (fans have accounts)

These are **musicians who also have OF**, not **OF creators who also make music**. The distinction matters. Their primary use case is music fan intelligence; the OF income is supplementary.

**Verdict: Don't target this segment specifically.** They'll find StanVault organically through the music pipeline (Oryx/Palmlion ecosystem, Music Twitter). No need to acquire them as "OF creators."

---

## Blindspots & Could We Add Value?

### Could we add an OnlyFans integration?

Technically possible (OF has an API). Would require:
- OAuth with OF to pull subscription data
- Mapping OF subscribers to StanVault fan records
- Scoring OF subscription duration, tip history, PPV purchases

**But this bends the product away from the core ICP.** Every engineering hour on OF integration is an hour not spent on deepening Dasham conviction scoring, building the manager dashboard, or improving the Starter tier onboarding. The core ICP (African music artists) has 83.6% retention. OF creators have 18.8%. The ROI math is clear.

### Could Emissar (campaigns) add value?

OF creators already have mass messaging on OnlyFans. Emissar's value prop is reaching fans across platforms with tier-targeted messaging. But OF fans' primary engagement is ON OnlyFans — not across scattered platforms. The cross-platform campaign thesis is weaker when one platform dominates the relationship.

### What about the content gating (drops)?

OF IS content gating. The entire business model is "pay to unlock content." StanVault drops would be redundant.

### Where OF creators COULD get value (but it's not worth building for)

1. **Cross-platform audience unification** — knowing that their IG follower is also their OF subscriber. This is genuinely useful but not enough to justify the integration cost.
2. **Fan migration during OF deplatforming scares** — when OF threatened to ban adult content (2021), creators scrambled to identify fans outside the platform. StanVault could theoretically help with this, but it's a fear-based, reactive use case — not a sustainable ICP.
3. **SFW creators on OF** — fitness, cooking, lifestyle creators who use OF as a paywall. They're closer to Patreon creators than adult content creators. Some might get value from StanVault, but they'd be better served by Patreon's own analytics.

---

## Verdict

| Question | Answer |
|----------|--------|
| Are OF creators an ICP? | **No.** 4 KILL metrics. Structurally excluded. |
| Should we add OF integration? | **No.** Bends product away from core ICP for 18.8% retention. |
| Are OF fans non-customers? | **Yes.** Their conviction signals are invisible. StanVault would undervalue their best fans. |
| Exception? | OF + Music creators retain at 50% — but they're musicians first. They'll find us through music channels. |
| Does this hurt the beachhead? | **Yes, if we pursue it.** Every resource spent on OF integration dilutes the African music scoring moat. |
| What to tell someone who asks? | "StanVault measures fan conviction through streaming, tipping, and purchasing signals. OnlyFans fans' primary conviction signal (subscription revenue) lives inside a platform we can't see. We'd show you 0.5% of what your fans actually spend. That's not useful." |

---

## Keep the Beachhead. Don't Chase OF.

The music beta proved the thesis: 83.6% core ICP retention, 80% conviction activation. The OF beta proves the counter-thesis: some creator segments are structurally incompatible with the scoring system, and that's fine. Not every creator with fans is our customer.

**Non-customers to firmly exclude:**
- Pure OF creators (no music)
- DJs without streaming presence (from prior analysis)
- A&Rs (different product needed)
- Major label artists (label owns the data)
- Vanity metrics artists (want followers, not conviction)

**The beachhead remains: Post-Algorithm African Artist, 5K-100K listeners, earning from music, fan signals scattered across platforms that StanVault unifies.**
