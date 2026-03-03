# Sigma Test: Producer/Beatmaker ICP Stress Test

> Simulated 200-user beta (80 producers/beatmakers + 120 fans/customers) over 90 days using real Stan Score engine.
> Purpose: Determine whether producers/beatmakers are a viable ICP for StanVault.
> Run date: 2026-02-24
> Script: `scripts/simulate-producer-beta.ts`

---

## TL;DR

**The most interesting non-customer result yet.** Avg Stan Score of **39.6** (close to Music's 42.8), highest conviction activation of any non-music segment at **36%**, and **23.8% revenue visibility**. Producers are ecosystem-adjacent — their monetization runs through Bandcamp, Ko-fi, Patreon, and (for Afro producers) Dasham, all visible to StanVault.

But zero SUPERFANs. And the structural problem: **BeatStars is invisible.** BeatStars is the #1 marketplace for producers selling beats, and StanVault can't see any of it. A beat buyer who spent $500 on BeatStars scores as CASUAL. Afrobeats producers at 60% retention are the exception — they're in the Oryx/Palmlion ecosystem and Dasham tips fire conviction.

**Producers are the closest non-customer to being a customer.** But "close" still means 0 SUPERFANs and 20% fan retention.

---

## Five-Way Comparison: Music vs OF vs Twitch vs Podcast vs Producer

| Metric | Music | OF | Twitch | Podcast | Producer | Target |
|--------|-------|-----|--------|---------|----------|--------|
| Creator Retention | **83.6%** PASS | 18.8% KILL | 22.5% KILL | 37.5% WARN | **36.3%** WARN | 75%+ |
| Fan Retention | **48.3%** PASS | 12.5% KILL | 8.3% KILL | 20.0% KILL | **17.5%** KILL | 45%+ |
| Spotify Verification | 73.3% WARN | 20.0% KILL | 15.0% KILL | 30.8% KILL | **25.0%** KILL | 80%+ |
| Conviction Activation | **80.0%** PASS | 1.7% KILL | 4.2% KILL | 19.2% KILL | **35.8%** WARN | 60%+ |
| Avg Stan Score | **42.8** | 33.4 | 26.2 | 40.2 | **39.6** | — |
| SUPERFANs | 10 (1.8%) | 1 (0.8%) | 0 (0.0%) | 8 (6.7%) | **0 (0.0%)** | — |
| Revenue Visibility | ~80% | 0.5% | 1.7% | 51.3% | **23.8%** | — |

**Score: 0 PASS, 2 WARN, 3 KILL.** The best non-customer KILL ratio, but still not passing.

---

## Revenue Visibility Gap

| | Amount |
|---|---|
| Fan spend on BeatStars + Splice (INVISIBLE) | **$4,021** |
| Fan spend visible to StanVault (Bandcamp + Ko-fi + Patreon + Merch + Dasham) | **$1,254** |
| **Revenue visibility** | **23.8%** |

Better than OF (0.5%) and Twitch (1.7%), worse than Podcasters (51.3%) and Music (~80%). The difference: BeatStars is the dominant marketplace for beat sales, and it's completely invisible. Bandcamp, Ko-fi, Patreon, and Dasham all fire — but they represent the secondary revenue channels, not the primary one.

### Why Producer Revenue Visibility Is Lower Than Podcasters

Podcasters' PRIMARY monetization (Patreon) is visible. Producers' PRIMARY monetization (BeatStars) is invisible. Producers' SECONDARY monetization (Bandcamp/Ko-fi/Patreon) is visible, but it's the smaller slice.

---

## Score Component Breakdown

| Component | Producer | Podcast | Twitch | OF | Music | Max | Problem |
|-----------|----------|---------|--------|-----|-------|-----|---------|
| Conviction | **4.6** | 4.3 | 0.6 | 0.3 | ~5+ | 35 | Bandcamp/Ko-fi/Patreon/Dasham all fire. BeatStars invisible. |
| Engagement | **17.9** | 19.4 | 10.7 | 16.9 | ~18+ | 30 | Spotify (beat tapes) + social + YouTube tutorials. Decent. |
| Platform | **10.0** | 8.9 | 8.1 | 9.0 | ~8+ | 10 | Highest platform score — producers are cross-platform natives |
| Longevity | ~5.3 | ~5.5 | 5.3 | 5.5 | ~6+ | 15 | Time-based — similar |
| Recency | ~1.8 | ~2.2 | 1.6 | 1.8 | ~5+ | 10 | Low retention = low recency |
| **TOTAL** | **39.6** | **40.2** | **26.2** | **33.4** | **42.8** | 100 | |

### Why Producers Score Well

1. **Bandcamp conviction fires hard.** Producers sell beat tapes, sample packs, and albums on Bandcamp. Purchase signals go directly into conviction scoring.

2. **Cross-platform presence is strong.** Producers are on YouTube (tutorials), Twitter (networking), Instagram (promos), Spotify (beat tapes), AND selling on Bandcamp/Ko-fi. Platform score hits 10.0 — the highest of any ICP test.

3. **Afro producers have Dasham.** The Afrobeats/Amapiano producer segment is in the Oryx/Palmlion ecosystem. Dasham tips fire conviction scoring the same way it does for music artists.

4. **Ko-fi/Patreon subscriptions fire.** Producers sell exclusive stems, project files, tutorials via Ko-fi/Patreon. Monthly subscription data creates recurring conviction signals.

### Why Zero SUPERFANs Despite High Scores

The SUPERFAN tier requires high signals across ALL components — conviction AND engagement AND platform AND longevity. Producers' fans cluster at ENGAGED (74.2%) because:

- Conviction fires but not deeply enough (4.6 avg vs 5+ for music)
- Spotify streams are lower (beat tape listeners stream less than music fans)
- No city affiliation bonus (producers are geographically dispersed)
- BeatStars spend (the highest-conviction signal) is invisible

A fan who spent $500 on BeatStars + $50 on Bandcamp scores on the $50, not the $500.

---

## Tier Distribution

| Tier | Producer | Podcast | Twitch | OF | Music |
|------|----------|---------|--------|-----|-------|
| CASUAL | **5.8%** | 14.2% | 44.2% | 20.0% | 3.4% |
| ENGAGED | **74.2%** | 62.5% | 50.8% | 75.0% | 84.5% |
| DEDICATED | **20.0%** | 16.7% | 5.0% | 4.2% | 10.3% |
| SUPERFAN | **0.0%** | 6.7% | 0.0% | 0.8% | 1.8% |

Only 5.8% CASUAL — the lowest of any ICP test including Music (3.4% is lower, but 5.8% is impressive for a non-customer segment). 20% DEDICATED is strong — higher than Music's 10.3%. The scoring system can SEE producer fans. It just can't see them DEEPLY enough for SUPERFAN.

---

## Producer Segment Retention

| Segment | Retained | Rate | |
|---------|----------|------|-|
| **Afrobeats/Amapiano** | **9/15** | **60.0%** | **████████████** |
| Hip-Hop Beatmakers | 6/15 | 40.0% | ████████ |
| Electronic/EDM | 2/10 | 20.0% | ████ |
| Lo-fi/Ambient | 4/10 | 40.0% | ████████ |
| Topliner/Session | 1/10 | 10.0% | ██ |
| YouTube Tutorial | 2/10 | 20.0% | ████ |
| **Multi-Genre Indie** | **5/10** | **50.0%** | **██████████** |

### Afrobeats/Amapiano Producers: 60% Retention

The standout segment. These producers are:
- In the Oryx/Palmlion ecosystem (Dasham tips visible)
- Based in Lagos/London/Joburg (city affiliation fires)
- Selling beat tapes on Bandcamp (conviction fires)
- On Spotify (engagement fires)

They're one step removed from the core ICP. They MAKE the beats that artists use. Their fans are often the same people who follow those artists. **60% retention is the closest any non-core segment has come to the 75% target.**

### Multi-Genre Indie Producers: 50% Retention

These are producers who release their own albums (not just beats for others). They have Spotify presence, Bandcamp sales, cross-platform engagement. They're essentially **artists who call themselves producers**. Same pattern as "OF creators who make music" and "Twitch streamers who make music" — the scoring works when the person creates distributable music.

### Topliner/Session Producers: 10% Retention

These are work-for-hire producers. They serve other artists, not fans. They have no direct fanbase. StanVault is the wrong product — they need LinkedIn for music, not fan intelligence.

---

## Fan Segment Retention

| Segment | Retained | Rate |
|---------|----------|------|
| Beat Buyers | 5/25 | 20% |
| Sample Pack Buyers | 4/20 | 20% |
| Spotify Listeners | 4/20 | 20% |
| YouTube Subscribers | 1/20 | 5% |
| Social Followers | 3/20 | 15% |
| Ko-fi/Patreon Supporters | 4/15 | 27% |

**Ko-fi/Patreon supporters retain best (27%)** — their financial conviction is visible. **Beat buyers at 20%** — they spent the most money but BeatStars spend is invisible, so their scores feel wrong.

**YouTube subscribers at 5%** — they watch tutorials and type beats on YouTube, but that engagement doesn't translate into Stan Score depth. They're STUDENTS, not fans.

---

## The BeatStars Blindspot

| What BeatStars Reveals | What StanVault Misses |
|---|---|
| Beat purchase history per customer | All of it — no API access |
| License type (basic, premium, exclusive) | Conviction signal: exclusive license = $500+ spend |
| Repeat purchase behavior | Highest-fidelity loyalty signal for producers |
| Custom beat requests | Direct relationship indicator |
| BeatStars Pro Page analytics | Producer's own dashboard is better |

A beat buyer who purchased 10 beats ($300-$500 total), requested 2 custom beats ($200-$400), and holds 3 exclusive licenses ($1,500+) is one of the most convicted fans possible. StanVault sees: $0 of this. They score as CASUAL or low ENGAGED based on social follows.

---

## Why Producers Are NOT the ICP (Despite Being Close)

### 1. BeatStars Invisibility

BeatStars is to producers what OnlyFans is to OF creators — the primary revenue platform, completely invisible. The difference is BeatStars isn't as dominant (many producers ALSO sell on Bandcamp/Ko-fi), which is why revenue visibility is 23.8% vs 0.5%. But the primary revenue is still invisible.

### 2. Producer-Fan Relationships Are Transactional

Music artist-fan relationships are emotional and identity-based ("I'm a [Artist] fan"). Producer-fan relationships are more transactional ("I buy beats from [Producer]"). The "superfan" model maps less cleanly. A rapper who buys 10 beats from the same producer is a loyal customer, not necessarily a superfan who wants presale access to drops.

### 3. Producer Analytics Already Exist

BeatStars Pro provides: sales analytics, customer segmentation, repeat buyer identification, licensing analytics, marketing tools. Distrokid/TuneCore provide streaming analytics. YouTube Studio provides video analytics. StanVault would add cross-platform unification, but the primary platforms already serve producers.

### 4. Zero SUPERFANs Is a Kill Signal

Despite good average scores, NO fan reaches SUPERFAN. The ceiling is DEDICATED. This means the product's highest-value promise (identify your superfans) is empty for producers.

---

## The Afrobeats Producer Exception

Afrobeats producers at **60% retention** are the closest any non-core segment has come to viability. Why:

1. **Dasham tips fire** — they're in the ecosystem
2. **City affiliation works** — Lagos/Joburg/Nairobi
3. **Bandcamp is a real channel** — beat tapes, production packs
4. **Their fans overlap with artist fans** — same ecosystem

**Should we target them?** No — they'll come organically through the Oryx/Palmlion ecosystem. A Lagos Afrobeats producer who uses Dasham will discover StanVault the same way artists do. The Starter tier at $29/mo is the right entry point.

---

## Could We Add Value Without Bending The Product?

| Idea | Value | Cost | Verdict |
|------|-------|------|---------|
| Add BeatStars API integration | Would unlock beat purchase conviction scoring | Major engineering, BeatStars API uncertain | No — doesn't help music ICP |
| Just use existing Bandcamp/Ko-fi scoring | Already works for the 30-40% who sell there | No engineering | This is what Starter tier does |
| Producer-specific drops (stems, project files) | Value for fans | Drop type is already flexible | Already possible — no changes needed |
| Sample pack marketplace | Would attract producers | Major engineering, different product | No — that's Splice, not StanVault |
| Producer collaboration matching | "Producers with similar fans" | Moderate engineering | Interesting but different product |

---

## Verdict

| Question | Answer |
|----------|--------|
| Are producers an ICP? | **No.** 3 KILL metrics. Zero SUPERFANs. BeatStars invisible. |
| Are they the closest non-customer? | **Yes.** 39.6 avg score, 36% conviction activation, 20% DEDICATED — all best or near-best for non-music ICPs. |
| Why still non-customer? | BeatStars is invisible (the primary revenue platform). Fan relationships are transactional. Zero SUPERFANs. |
| Exception? | Afrobeats producers at 60% — ecosystem-adjacent, Dasham fires, city affiliation works. They'll come organically. |
| Multi-genre indie producers? | 50% retention — they're artists who call themselves producers. Same pattern as every other exception. |
| Revenue visibility? | 23.8% — better than OF/Twitch, worse than Podcasters/Music. Bandcamp + Ko-fi + Dasham visible. BeatStars invisible. |
| Should we build BeatStars integration? | **No.** BeatStars API maturity is uncertain, and it doesn't help the core ICP. |
| What to tell someone who asks? | "StanVault scores fans through streaming, purchasing, and social signals. Your Bandcamp and Ko-fi supporters will score well. But your BeatStars customers — likely your most loyal buyers — are invisible. A rapper who bought 10 beats from you ($500+) would score as CASUAL. If you release your own music on Spotify AND sell on Bandcamp, the Starter tier at $29/mo could work for you." |

---

## Updated Non-Customer List

| Segment | Status | Why |
|---------|--------|-----|
| Post-Algorithm African Artists | **CORE ICP** | 83.6% retention. Ship it. |
| Direct-to-Fan Indie (Bandcamp/Ko-fi) | **Secondary ICP** | 32% Starter retention. Needs onboarding work. |
| DJs (pure selectors) | **Non-customer** | Attendance/dance floor signals invisible |
| A&Rs | **Non-customer** (distribution channel later) | Need read-only API product |
| OnlyFans creators | **Non-customer** | 0.5% revenue visibility, 18.8% retention |
| Twitch streamers | **Non-customer** | 1.7% revenue visibility, 22.5% retention, 0 SUPERFANs |
| Podcasters | **Non-customer** | 51.3% rev visibility (best), but 20% fan retention, downloads invisible |
| Producers/Beatmakers | **Non-customer** (closest) | 23.8% rev visibility, 0 SUPERFANs, BeatStars invisible. Afro producers come organically. |
| Major label artists | **Non-customer** | Label owns the data |
| Vanity metrics artists | **Non-customer** | Want followers, not conviction |
