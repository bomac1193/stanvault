# Sigma Test: Twitch Streamer ICP Stress Test

> Simulated 200-user beta (80 Twitch streamers + 120 viewers) over 90 days using real Stan Score engine.
> Purpose: Determine whether Twitch streamers are a viable ICP for StanVault.
> Run date: 2026-02-24
> Script: `scripts/simulate-twitch-beta.ts`

---

## TL;DR

**4 KILL metrics. Twitch streamers score WORSE than OnlyFans creators.**

Avg Stan Score of **26.2** (vs 33.4 OF, 42.8 Music). Zero SUPERFANs. 44% of fans stuck at CASUAL — the scoring system barely registers their existence. StanVault sees **1.7% of actual fan spend** ($256 visible / $14,420 on Twitch subs+bits+gifts).

The same exception applies: **Music streamers retain at 50%** — but they're musicians who happen to stream, not streamers who happen to make music.

---

## Three-Way Comparison: Music vs OF vs Twitch

| Metric | Music | OF | Twitch | Target |
|--------|-------|-----|--------|--------|
| Creator Retention | **83.6%** PASS | 18.8% KILL | **22.5%** KILL | 75%+ |
| Fan Retention | **48.3%** PASS | 12.5% KILL | **8.3%** KILL | 45%+ |
| Spotify Verification | 73.3% WARN | 20.0% KILL | **15.0%** KILL | 80%+ |
| Conviction Activation | **80.0%** PASS | 1.7% KILL | **4.2%** KILL | 60%+ |
| Avg Stan Score | **42.8** | 33.4 | **26.2** | — |
| SUPERFANs | 10 (1.8%) | 1 (0.8%) | **0 (0.0%)** | — |
| Revenue Visibility | ~80% | 0.5% | **1.7%** | — |

**Twitch is the worst-performing ICP test so far.** Lower scores than OF across the board except conviction (marginally higher because more streamers have merch/Ko-fi than OF creators).

---

## Revenue Visibility Gap

| | Amount |
|---|---|
| Fan spend on Twitch (subs + bits + gift subs) | **$14,420** |
| Fan spend visible to StanVault (Ko-fi + Patreon + Merch) | **$256** |
| **Revenue visibility** | **1.7%** |

Slightly better than OF's 0.5% because more streamers have merch stores and Ko-fi/Patreon sidecars. But still catastrophic — StanVault misses 98.3% of the money fans actually spend.

---

## Score Component Breakdown

| Component | Twitch | OF | Music | Max | Problem |
|-----------|--------|-----|-------|-----|---------|
| Conviction | **0.6** | 0.3 | ~5+ | 35 | No Dasham, no Bandcamp, Twitch revenue invisible |
| Engagement | **10.7** | 16.9 | ~18+ | 30 | No Spotify streams; social is thinner than OF |
| Platform | **8.1** | 9.0 | ~8+ | 10 | Twitter + maybe YouTube, but fewer platforms than OF |
| Longevity | **5.3** | 5.5 | ~6+ | 15 | Time-based — similar |
| Recency | **1.6** | 1.8 | ~5+ | 10 | Very low retention = very low recency |
| **TOTAL** | **26.2** | **33.4** | **42.8** | 100 | |

### Why Twitch scores LOWER than OF

Surprising result. The hypothesis was "Twitch should be slightly better because of YouTube/social breadth." Wrong. Here's why:

1. **OF fans have higher social engagement.** OF creators' discovery funnel runs through Instagram and Twitter — their fans follow, like, and comment on social more actively than Twitch viewers who primarily engage on Twitch itself (chat, subs, bits — all invisible).

2. **Twitch viewers' primary interaction is chat.** Chat messages, watch hours, raid participation — all high-fidelity engagement signals that StanVault has zero visibility into. A viewer who spends 40 hours/month watching streams and sends 500 chat messages/month shows zero engagement to StanVault.

3. **YouTube engagement is shallow.** While many streamers have YouTube, their fans' YouTube engagement (watch VODs, maybe subscribe) generates lower scores than OF fans' Instagram/Twitter engagement (likes, comments, follows).

4. **Discord is the community hub, not social media.** Twitch communities live on Discord — another platform invisible to StanVault. OF communities live on Instagram/Twitter — platforms StanVault can see.

---

## Tier Distribution

| Tier | Twitch | OF | Music |
|------|--------|-----|-------|
| CASUAL | **44.2%** | 20.0% | 3.4% |
| ENGAGED | **50.8%** | 75.0% | 84.5% |
| DEDICATED | **5.0%** | 4.2% | 10.3% |
| SUPERFAN | **0.0%** | 0.8% | 1.8% |

44% stuck at CASUAL is devastating. Nearly half of all scored fans — including paying Tier 3 subscribers and bit whales — register as casual because their spending and engagement happen on Twitch/Discord, not on platforms StanVault can see.

A fan spending $24.99/mo for 36 months ($900 lifetime) + donating 50,000 bits ($500) = **$1,400 total spend** → scores as **CASUAL** because that revenue is invisible.

---

## Streamer Segment Retention

| Segment | Retained | Rate | |
|---------|----------|------|-|
| Top Streamers | 3/10 | 30.0% | ██████ |
| Mid-Tier | 2/20 | 10.0% | ██ |
| Small Streamers | 5/15 | 33.3% | ███████ |
| **Music Streamers** | **5/10** | **50.0%** | **██████████** |
| Variety/IRL | 1/10 | 10.0% | ██ |
| YouTube-Heavy | 2/10 | 20.0% | ████ |
| Esports/Competitive | 0/5 | 0.0% | |

Same pattern as OF: **the only segment that works is the one that makes music.** Music streamers at 50% retention because StanVault can score their Spotify/Bandcamp signals.

Esports is 0% — worst of all. Esports fans care about gameplay skill, not personal connection. The "superfan relationship" model fundamentally doesn't map.

---

## Fan Segment Retention

| Segment | Retained | Rate |
|---------|----------|------|
| Whale Subs (T3 + Bits) | 3/15 | 20% |
| Tier 1 Subs | 3/30 | 10% |
| Free Viewers | 2/30 | 7% |
| YouTube-First Fans | 1/15 | 7% |
| Discord Members | 1/15 | 7% |
| Lurkers | 0/15 | 0% |

Even whale subs (the most financially convicted fans) retain at only 20% because their Stan Scores don't reflect their actual relationship. They see "CASUAL" or "ENGAGED" and think "this tool doesn't know me."

---

## Why Twitch Is Structurally Worse Than OF

| Signal | OF | Twitch | Winner |
|--------|-----|--------|--------|
| Primary fan spend platform | OnlyFans (invisible) | Twitch (invisible) | Tie — both invisible |
| Social discovery | Instagram + Twitter (visible) | Twitter + Discord (Discord invisible) | OF |
| Fan social engagement | High IG/Twitter (visible) | Moderate Twitter, high chat (invisible) | OF |
| Cross-platform purchases | Ko-fi sometimes | Ko-fi/Merch sometimes | Twitch (slightly) |
| YouTube presence | Some | Many (VODs/highlights) | Twitch |
| Community platform | Instagram DMs (partially visible) | Discord (invisible) | OF |
| Spotify relevance | Near zero | Near zero | Tie |

**OF fans are more socially visible to StanVault** because the OF discovery/engagement funnel runs through Instagram and Twitter. Twitch fans' highest-fidelity engagement (chat, watch time, bits, subs) and community activity (Discord) are both completely invisible.

---

## Invisible Signals StanVault Would Need

To serve Twitch streamers, StanVault would need:

1. **Twitch API integration** — sub tier, sub duration, bits donated, gift subs, chat frequency, watch time
2. **Discord API integration** — server membership, message count, role, activity level
3. **Channel point tracking** — Twitch's loyalty point system (a built-in conviction signal)
4. **Raid/host tracking** — community engagement across streamers

That's two major platform integrations (Twitch + Discord) plus Twitch-specific metrics. Each one is weeks of engineering that doesn't benefit the music ICP at all.

---

## Could We Add Value Without Bending The Product?

| Idea | Value | Cost | Verdict |
|------|-------|------|---------|
| Add Twitch as a Platform enum + API | Would unlock sub/bits scoring | Major engineering, Twitch API complexity | No — doesn't help music ICP |
| Add Discord integration | Would capture community signals | Major engineering, Discord API rate limits | No — doesn't help music ICP |
| Just offer drops/campaigns | Twitch already has channel points, sub perks, raid rewards | No engineering needed — but also no value added | No — redundant to Twitch native |
| Cross-platform audience report | "Here's your Twitch audience on Twitter/YouTube" | Moderate engineering | Maybe later — but Streamlabs/StreamElements already do this |

**Every path to serving Twitch streamers requires building Twitch/Discord integrations that provide zero value to the core ICP.** The music pipeline (Dasham, Oryx, Bandcamp, Ko-fi, Spotify) is what makes StanVault's scoring unique. Twitch integration would make StanVault a worse version of StreamElements.

---

## Verdict

| Question | Answer |
|----------|--------|
| Are Twitch streamers an ICP? | **No.** 4 KILL metrics. Scores worse than OF. |
| Are they worse than OF? | **Yes.** 26.2 avg score vs 33.4. Zero SUPERFANs vs 1. |
| Why worse? | Twitch fans engage via chat/bits/subs (invisible) and Discord (invisible). OF fans at least engage on Instagram/Twitter (visible). |
| Exception? | Music streamers at 50% — same as OF+Music. They're musicians first. |
| Revenue visibility? | 1.7% (slightly better than OF's 0.5% due to merch, but still catastrophic) |
| Should we build Twitch integration? | **No.** Would make StanVault a worse StreamElements. Core ICP gets zero value. |
| What to tell someone who asks? | "StanVault scores fans through streaming, purchasing, and social signals. Your fans' deepest signals — Twitch subs, bits, chat, Discord activity — live on platforms we can't see. Your whale who spent $1,400 on Twitch would score as CASUAL. That's not useful to either of us." |

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
| Major label artists | **Non-customer** | Label owns the data |
| Vanity metrics artists | **Non-customer** | Want followers, not conviction |
