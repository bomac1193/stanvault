# Sigma Test: Podcaster ICP Stress Test

> Simulated 200-user beta (80 podcasters + 120 listeners) over 90 days using real Stan Score engine.
> Purpose: Determine whether podcasters are a viable ICP for StanVault.
> Run date: 2026-02-24
> Script: `scripts/simulate-podcaster-beta.ts`

---

## TL;DR

**Surprisingly strong — but for the wrong reasons.** Avg Stan Score of **40.2** (nearly matching Music's 42.8), **6.7% SUPERFANs**, and **51.3% revenue visibility**. These numbers look great. But dig in and the story fractures: **Music podcasters drive 80% retention** (they're musicians who have podcasts) while pure podcasters retain at 15-40%. The high scores come from Patreon/Ko-fi conviction signals firing — not because StanVault understands podcast audiences.

The real problem: **podcast downloads are invisible.** A listener who downloads every episode for 2 years and listens to 100% of each one shows zero engagement unless they ALSO subscribe on Patreon, follow on social, or join the newsletter.

---

## Five-Way Comparison: Music vs OF vs Twitch vs Podcast vs Producer

| Metric | Music | OF | Twitch | Podcast | Target |
|--------|-------|-----|--------|---------|--------|
| Creator Retention | **83.6%** PASS | 18.8% KILL | 22.5% KILL | **37.5%** WARN | 75%+ |
| Fan Retention | **48.3%** PASS | 12.5% KILL | 8.3% KILL | **20.0%** KILL | 45%+ |
| Spotify Verification | 73.3% WARN | 20.0% KILL | 15.0% KILL | **30.8%** KILL | 80%+ |
| Conviction Activation | **80.0%** PASS | 1.7% KILL | 4.2% KILL | **19.2%** KILL | 60%+ |
| Avg Stan Score | **42.8** | 33.4 | 26.2 | **40.2** | — |
| SUPERFANs | 10 (1.8%) | 1 (0.8%) | 0 (0.0%) | **8 (6.7%)** | — |
| Revenue Visibility | ~80% | 0.5% | 1.7% | **51.3%** | — |

**Score: 0 PASS, 1 WARN, 4 KILL.** The high avg score is misleading — retention and verification are terrible for non-music podcasters.

---

## Revenue Visibility Gap

| | Amount |
|---|---|
| Fan spend invisible to StanVault (ad revenue, Apple Podcast subs, donations on podcast platforms) | **$3,363** |
| Fan spend visible to StanVault (Patreon + Ko-fi + Merch + Bandcamp) | **$3,549** |
| **Revenue visibility** | **51.3%** |

This is dramatically better than OF (0.5%) and Twitch (1.7%). Why? Because podcasters' monetization stack (Patreon, Ko-fi, merch) runs through platforms StanVault can see. But the 48.7% invisible portion (Apple Podcast subscriptions, Spotify podcast ad revenue, direct podcast platform donations) still creates a scoring gap.

---

## Score Component Breakdown

| Component | Podcast | Twitch | OF | Music | Max | Problem |
|-----------|---------|--------|-----|-------|-----|---------|
| Conviction | **4.3** | 0.6 | 0.3 | ~5+ | 35 | Patreon/Ko-fi fire well; but no Dasham, limited Bandcamp |
| Engagement | **19.4** | 10.7 | 16.9 | ~18+ | 30 | Social + email signals fire; podcast listens invisible |
| Platform | **8.9** | 8.1 | 9.0 | ~8+ | 10 | Twitter + IG + YouTube, decent cross-platform |
| Longevity | ~5.5 | 5.3 | 5.5 | ~6+ | 15 | Time-based — similar |
| Recency | ~2.2 | 1.6 | 1.8 | ~5+ | 10 | Low retention drags this down |
| **TOTAL** | **40.2** | **26.2** | **33.4** | **42.8** | 100 | |

### Why Podcasters Score Higher Than OF and Twitch

1. **Patreon/Ko-fi conviction fires.** Podcasters' primary monetization (Patreon memberships, Ko-fi tips) is VISIBLE to StanVault. This generates actual conviction scores, unlike OF subscriptions or Twitch subs.

2. **Email engagement is strong.** Newsletter podcasters drive 8-30 email opens and 3-12 clicks. Email signals fire the engagement component hard.

3. **Social engagement is moderate.** Podcasters maintain Twitter/IG presence for promotion. Their fans follow, like, comment — all visible.

4. **Some podcasters are on Spotify.** Podcast episodes on Spotify generate streams. Even though these are podcast listens (not music), the scoring engine counts them.

### Why Podcasters Still Can't Be the ICP

1. **Podcast downloads are invisible.** The #1 engagement signal for podcasters (weekly downloads, listen-through rate, episode completion) is completely invisible. A listener who downloads 200 episodes shows zero engagement.

2. **20% fan retention is a KILL.** Fans don't stick around because their Stan Scores feel wrong. Someone who listens 10 hours/week for a year sees "ENGAGED" because their deepest signal (listening) is invisible.

3. **30.8% Spotify verification is a KILL.** Most podcast listeners don't connect to Spotify through StanVault. The verification flow doesn't make sense to them.

4. **Podcast analytics already exist.** Chartable, Spotify for Podcasters, Apple Podcasts Connect — podcasters already have download analytics, listener demographics, and episode performance. StanVault would tell them LESS about their audience.

---

## Tier Distribution

| Tier | Podcast | Twitch | OF | Music |
|------|---------|--------|-----|-------|
| CASUAL | **14.2%** | 44.2% | 20.0% | 3.4% |
| ENGAGED | **62.5%** | 50.8% | 75.0% | 84.5% |
| DEDICATED | **16.7%** | 5.0% | 4.2% | 10.3% |
| SUPERFAN | **6.7%** | 0.0% | 0.8% | 1.8% |

The 6.7% SUPERFAN rate looks exceptional — higher than Music's 1.8%. But this is an artifact: Patreon supporters with 6+ months of subscriptions + Ko-fi tips + social engagement + email opens stack up enough signals to hit SUPERFAN. These are real fans with visible signals. The problem is that they represent the <20% of podcast fans who monetize through Patreon. The other 80% are invisible listeners who score as CASUAL or low ENGAGED.

---

## Podcaster Segment Retention

| Segment | Retained | Rate | |
|---------|----------|------|-|
| Top Podcasters | 4/10 | 40.0% | ████████ |
| Mid-Tier Podcasters | 3/20 | 15.0% | ███ |
| Small/Indie Podcasters | 3/15 | 20.0% | ████ |
| **Music Podcasters** | **8/10** | **80.0%** | **████████████████** |
| Video Podcasters | 5/10 | 50.0% | ██████████ |
| Newsletter Podcasters | 4/10 | 40.0% | ████████ |
| Mid-Tier (Extra) | 3/5 | 60.0% | ████████████ |

**Music podcasters at 80%** — the highest exception retention of any non-core ICP segment. These are music journalists, music review channels, artist interview shows. Their fans stream the music they discuss on Spotify, buy on Bandcamp, support on Ko-fi. The scoring works because the content drives fans TO music platforms.

**Newsletter podcasters at 40%** — email signals (opens, clicks) fire engagement scoring well. These podcasters already have email lists that StanVault can leverage.

**Video podcasters at 50%** — YouTube engagement (subscribed, views) is visible. But they'd be better served by YouTube Studio analytics.

---

## Fan Segment Retention

| Segment | Retained | Rate |
|---------|----------|------|
| Patreon Supporters | 7/20 | 35% |
| Regular Listeners | 4/30 | 13% |
| Social-Engaged Fans | 7/25 | 28% |
| Newsletter Subscribers | 6/15 | 40% |
| YouTube Viewers | 0/15 | 0% |
| Casual/Cold | 0/15 | 0% |

**Newsletter subscribers retain at 40%** — email signals fire, their scores feel real. **Patreon supporters at 35%** — financial conviction is visible, scores feel meaningful.

**Regular listeners at 13%** — they listen to every episode, love the podcast, but their Stan Scores say "ENGAGED" at best. They leave.

---

## Why Podcasters Are Structurally Problematic

| Signal | Podcasters | Music Artists | Winner |
|--------|-----------|---------------|--------|
| Primary engagement | Podcast downloads (invisible) | Spotify streams (visible) | Music |
| Primary monetization | Ads + Patreon (50% visible) | Streaming + tips + merch (~80% visible) | Music |
| Fan community | Discord + Subreddit (invisible) | Social media (visible) | Music |
| Email engagement | Strong (visible) | Mixed (visible) | Podcasters |
| Content gating | Already on Patreon | Drops add value | Music |
| Existing analytics | Chartable, Spotify, Apple | Limited, fragmented | Podcasters have more |

**Podcasters already have better analytics than StanVault would provide.** Spotify for Podcasters shows listener demographics, episode performance, and retention. Apple Podcasts Connect shows downloads, listen time, and geography. Chartable provides cross-platform analytics. StanVault would add cross-platform fan identity — but would MISS the primary engagement signal (listening).

---

## Invisible Signals StanVault Would Need

To serve podcasters, StanVault would need:

1. **Podcast download tracking** — RSS feed integration, episode-level download counts per listener
2. **Apple Podcasts API** — subscription data, listen-through rates, reviews
3. **Spotify for Podcasters data** — listener engagement, skip rates, episode completion
4. **Podcast adtech integration** — dynamic ad insertion impression data per listener
5. **Discord/Reddit community tracking** — where podcast fans gather

That's 3-5 major integrations that provide zero value to the music ICP.

---

## Could We Add Value Without Bending The Product?

| Idea | Value | Cost | Verdict |
|------|-------|------|---------|
| Add podcast RSS as signal source | Would unlock download tracking | Moderate engineering | No — completely different data model |
| Just use Patreon/Ko-fi scoring | Already works for the 20% on Patreon | No new engineering | Maybe — but 80% of fans still invisible |
| Cross-platform audience report | "Your listeners on Twitter/IG" | Light engineering | Competed by Chartable |
| Music podcast partner program | Help music podcasters score THEIR listeners' music taste | Moderate | Interesting — but niche |

---

## The Music Podcaster Exception

Music podcasters at **80% retention** is remarkable. These are:
- Music review channels (Fantano-style)
- Artist interview podcasts
- Genre-specific music discovery shows
- Music industry analysis shows

Their fans stream the music discussed, buy on Bandcamp, tip artists on Dasham/Ko-fi. The podcast is the DISCOVERY mechanism, but the FAN BEHAVIOR happens on music platforms StanVault can see.

**Should we target music podcasters?** Not directly. They'll find us through the music ecosystem. A music podcaster who recommends artists on StanVault creates organic distribution. Let them come naturally — don't build for them.

---

## Verdict

| Question | Answer |
|----------|--------|
| Are podcasters an ICP? | **No.** 4 KILL metrics. High scores are misleading — driven by Patreon/Ko-fi, not podcast engagement. |
| Are they better than OF/Twitch? | **Yes, significantly.** 40.2 avg score vs 33.4/26.2. 51.3% revenue visibility. But still not viable. |
| Why not viable? | Podcast downloads (the #1 signal) invisible. 20% fan retention. Existing analytics (Chartable, Spotify, Apple) are better. |
| Exception? | Music podcasters at 80%. Same pattern — they're music-adjacent, not podcasters-who-need-fan-scoring. |
| Newsletter podcasters? | 40% retention. Email signals fire well. But they're better served by ConvertKit/Substack analytics. |
| Revenue visibility? | 51.3% — best non-music ICP. Patreon/Ko-fi visible. But ad revenue + Apple subs invisible. |
| Should we build podcast integrations? | **No.** RSS/download tracking is a different product. Compete with Chartable? No. |
| What to tell someone who asks? | "StanVault scores fans through streaming, purchasing, and social signals. Your listeners' deepest signal — episode downloads and listen-through rates — lives on podcast platforms we can't see. Your Patreon supporters would score well, but 80% of your audience would be invisible. Chartable and Spotify for Podcasters serve you better." |

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
| Podcasters | **Non-customer** | 51.3% rev visibility (best non-music), but 20% fan retention, podcast downloads invisible |
| Major label artists | **Non-customer** | Label owns the data |
| Vanity metrics artists | **Non-customer** | Want followers, not conviction |
