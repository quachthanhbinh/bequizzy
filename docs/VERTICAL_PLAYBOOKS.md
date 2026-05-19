# RevLooper — Vertical Playbooks

**Version:** 1.0  
**Last Updated:** May 2026

> These playbooks serve two purposes:
> 1. **Pre-built campaign templates** shown to users on first signup (instant value, zero configuration)
> 2. **System RAG source material** — chunked and embedded into RevLooper's knowledge base so the AI advisor draws from proven patterns when generating campaigns and recommendations for each vertical

---

## Table of Contents

1. [Playbook Structure](#1-playbook-structure)
2. [Recruitment Playbook](#2-recruitment-playbook)
3. [Insurance Playbook](#3-insurance-playbook)
4. [Travel Playbook](#4-travel-playbook)
5. [Marketing Agency Playbook](#5-marketing-agency-playbook)
6. [B2B SaaS / Tech Sales Playbook](#6-b2b-saas--tech-sales-playbook)
7. [Real Estate Playbook](#7-real-estate-playbook)
8. [Objection Handler Library](#8-objection-handler-library)
9. [Subject Line Formulas](#9-subject-line-formulas)
10. [Follow-up Cadence Guide](#10-follow-up-cadence-guide)

---

## 1. Playbook Structure

Each playbook defines:
- **ICP (Ideal Customer Profile):** Who to target and what signals to look for
- **Core pain points:** What keeps this prospect up at night
- **Value proposition:** How RevLooper users (from this vertical) should position themselves
- **Sequence:** Step-by-step outreach flow with timing
- **Email templates:** Ready-to-use copy with `{{variables}}`
- **Subject line bank:** 10+ proven subject lines for this vertical
- **Objection responses:** Pre-written replies to the top 5 objections
- **Stop conditions:** When to stop the sequence and what action to take next

---

## 2. Recruitment Playbook

### 2A — Candidate Sourcing Campaign

**Goal:** Attract passive candidates for an open role

**ICP:** Professionals with 2–8 years experience in a target skill, currently employed (passive), located in target geography

**Pain points (candidate):** Feeling underpaid, limited growth, poor management, want new challenges

**Sequence Timing:** 5 steps over 14 days

---

**Step 1 — Initial Outreach (Day 1)**

Subject: `Quick question about your {{skill}} background, {{first_name}}`

```
Hi {{first_name}},

I came across your profile and was genuinely impressed by your experience in {{skill}} at {{company}}.

I'm working with a {{industry}} company in {{location}} who's looking for someone with exactly your background. The role involves {{brief_role_description}} and offers {{key_benefit}} (remote flexibility / strong comp / fast growth — whichever applies).

Would it make sense to have a 15-minute call this week to see if it's worth exploring?

Best,
{{sender_name}}
```

---

**Step 2 — Follow-up (Day 4, if no reply)**

Subject: `Re: Quick question about your {{skill}} background, {{first_name}}`

```
Hi {{first_name}},

Just bumping this up — I know how busy it gets.

To be transparent: the company I'm recruiting for is {{company_name_if_ok_to_share}}, and the package is in the {{salary_range}} range. It's a role many {{skill}} professionals in {{location}} would find interesting.

Worth a quick 15-minute conversation?

{{sender_name}}
```

---

**Step 3 — Value add (Day 7, if no reply)**

Subject: `The {{skill}} market in {{location}} — thought you'd find this interesting`

```
Hi {{first_name}},

I've placed 12 {{skill}} professionals in the last 6 months and wanted to share something: compensation for your profile in {{location}} has moved up significantly — the average is now {{market_rate}}.

If you're curious whether your current package is competitive, I'm happy to give you a market read in a 10-minute call, no strings attached.

Either way, the role I reached out about is still open.

{{sender_name}}
```

---

**Step 4 — Social proof (Day 10, if no reply)**

Subject: `How {{similar_candidate}} went from {{old_company}} to {{new_company}}`

```
Hi {{first_name}},

Last month I helped a {{title}} with {{skill}} experience move from {{old_company}} to {{new_company}} — a 35% comp increase and full remote work.

I mention it only because their profile was very similar to yours.

If the timing isn't right, I completely understand. But if you ever want to explore what's out there, I'd love to be a resource.

{{sender_name}}
```

---

**Step 5 — Graceful close (Day 14, if no reply)**

Subject: `Closing the loop, {{first_name}}`

```
Hi {{first_name}},

I'll stop reaching out after this — I don't want to be a nuisance.

If you're ever open to hearing about opportunities in {{skill}} / {{industry}} in the future, feel free to reach out directly. I'd be glad to help.

Best of luck,
{{sender_name}}
```

**Stop conditions:** Reply received → move to inbox; booking link clicked → mark as meeting booked

---

### 2B — Client Business Development Campaign

**Goal:** Win a new hiring mandate from a company that hasn't used your recruitment services before

**ICP:** HR Manager, Talent Acquisition Lead, or Department Head at a company with 20–500 employees, actively hiring (LinkedIn job posts = strong signal)

**Pain points (client):** Slow time-to-hire, too many unqualified applicants, high agency fees, lack of market insight

**Sequence Timing:** 5 steps over 21 days

---

**Step 1 — Initial Outreach (Day 1)**

Subject: `{{company}} is hiring {{role}} — I can help you close it faster`

```
Hi {{first_name}},

I noticed {{company}} recently posted a {{role}} opening on LinkedIn. Those roles tend to take 45–90 days to fill through traditional methods — I help companies cut that in half.

I specialize in placing {{skill_area}} talent in {{industry}} companies in {{location}}, and I have a shortlist of 3 pre-screened candidates available right now who match your requirements.

Would it be worth a 20-minute conversation this week to see if any of them fit?

{{sender_name}}
{{agency_name}}
```

---

**Step 2 — Follow-up with insight (Day 5)**

Subject: `The {{skill_area}} hiring market in {{location}} — quick data point`

```
Hi {{first_name}},

One thing I've seen consistently this quarter: companies waiting 60+ days to fill {{role}} roles are losing candidates to competing offers at the final stage.

The talent pool for {{skill_area}} in {{location}} is tight. The companies filling roles fastest are the ones working with a specialist recruiter who already has a warm pipeline.

Happy to share what I'm seeing — 15 minutes?

{{sender_name}}
```

---

**Steps 3–5:** Similar pattern — social proof, case study, graceful close.

**Subject line bank:**
- `{{company}} is hiring — I have 3 candidates ready`
- `How long has your {{role}} role been open?`
- `Placed 5 {{skill}} hires in {{location}} this quarter`
- `Quick question about your hiring process, {{first_name}}`
- `Your {{role}} posting — have you considered this approach?`

---

## 3. Insurance Playbook

### 3A — Life/Health Insurance Outreach

**Goal:** Book a discovery call with a warm prospect who fits the ICP for a life or health policy

**ICP:** Professional aged 28–45, married with children, steady income, no current life insurance or underinsured, recent life event (new baby, house purchase, marriage — check LinkedIn/social signals)

**Pain points:** Worry about family financial security, not understanding options, fear of complex processes, past bad experiences with pushy agents

**Sequence Timing:** 6 steps over 21 days (insurance requires more nurture than B2B)

---

**Step 1 — Initial Outreach (Day 1)**

Subject: `A question about financial protection for your family, {{first_name}}`

```
Hi {{first_name}},

Congratulations on {{life_event}} — it's a big milestone.

Many people in your position start thinking more seriously about what would happen to their family financially if the unexpected occurred. It's not a comfortable topic, but it's an important one.

I help families in {{location}} build a protection plan that fits their budget and lifestyle — no pressure, no jargon.

Would you be open to a 20-minute conversation to explore what's right for you?

{{sender_name}}
{{company}}
```

---

**Step 2 — Education value (Day 4)**

Subject: `The one thing most people get wrong about life insurance`

```
Hi {{first_name}},

The most common mistake I see: people assume life insurance is expensive, so they delay.

In reality, a solid protection plan for a {{age_range}}-year-old in good health often costs less than a daily coffee. The cost of waiting 5 years can be 2–3x higher.

I put together a quick 3-question checklist to help you understand if your current coverage is enough — happy to walk through it with you in 15 minutes.

{{sender_name}}
```

---

**Step 3 — Social proof (Day 8)**

Subject: `How {{first_name_similar}} protected her family for less than expected`

```
Hi {{first_name}},

Last month I helped a {{profession}} in {{location}} — similar background to yours — put together a comprehensive plan that covered her family for 20 years at {{monthly_cost}}/month.

She came in thinking she couldn't afford it. She left with peace of mind.

If you're curious whether something similar would work for you, I'm happy to run the numbers in a quick call.

{{sender_name}}
```

---

**Steps 4–6:** Objection handling ("I already have coverage through work"), market insight ("Group insurance gaps most employees don't know about"), graceful close.

**Subject line bank:**
- `A quick question about your family's financial protection`
- `Most people are underinsured — are you?`
- `What happens to your mortgage if something happens to you?`
- `I'll keep this short, {{first_name}}`
- `Still open to a quick conversation?`

---

### 3B — Policy Renewal / Upsell Campaign

**Goal:** Re-engage existing clients approaching policy renewal or who have had a life change

**Sequence Timing:** 3 steps over 10 days (warm audience, shorter nurture needed)

---

**Step 1 — Renewal reminder (Day 1)**

Subject: `Your policy renewal is coming up, {{first_name}} — let's review`

```
Hi {{first_name}},

Your {{policy_type}} policy is coming up for renewal in {{days_until_renewal}} days.

Before renewing on the same terms, it's worth a quick review — your situation may have changed since we last spoke, and there may be better options available now.

Can we find 20 minutes this week to go over it?

{{sender_name}}
```

---

## 4. Travel Playbook

### 4A — Package Promotion Campaign

**Goal:** Convert warm inquiries or past customers into bookings for a new package

**ICP:** Past customers who booked in the last 2 years, or new leads who inquired via website/social and haven't converted

**Pain points:** Overwhelmed by options, worried about hidden costs, bad past experiences, unsure if this is the right time

**Sequence Timing:** 4 steps over 10 days (travel decisions can be fast; urgency works)

---

**Step 1 — Package introduction (Day 1)**

Subject: `{{first_name}}, you asked about {{destination}} — here's what we put together`

```
Hi {{first_name}},

Following up on your interest in {{destination}} — I've put together a package based on what you described.

**{{package_name}}** — {{duration}} days / {{nights}} nights
- ✈️ Flights from {{departure_city}}
- 🏨 {{hotel_name}} ({{stars}} stars, breakfast included)
- 🗺️ {{included_activities}}
- 💰 From {{price_per_person}}/person

Availability is limited for {{travel_dates}}. Would you like me to hold a spot while you review the details?

{{sender_name}}
{{agency_name}}
```

---

**Step 2 — Urgency + social proof (Day 3)**

Subject: `Only {{spots_remaining}} spots left for {{destination}} in {{month}}`

```
Hi {{first_name}},

Just wanted to let you know — the {{destination}} package for {{travel_dates}} only has {{spots_remaining}} spots remaining.

We've had 3 families book in the last week. The most common feedback: "We wish we'd booked earlier."

I can reserve your spot with a small deposit and hold it for 72 hours while you decide.

{{sender_name}}
```

---

**Step 3 — Objection handle: price (Day 6)**

Subject: `Re: {{destination}} — flexible payment options`

```
Hi {{first_name}},

I realize the full package cost can feel like a big commitment upfront.

We offer a flexible payment plan: {{deposit_amount}} to hold your spot, with the balance due {{balance_due_date}}. Many of our customers find this makes it much easier to plan.

Also happy to customize the package if there's something specific you'd like to adjust.

{{sender_name}}
```

---

**Step 4 — Final close (Day 10)**

Subject: `Last chance — {{destination}} {{month}} availability closing`

```
Hi {{first_name}},

This will be my last message about the {{destination}} package — I don't want to keep following up if the timing isn't right.

If you'd like to book or have any questions, I'm here. Otherwise, I hope we get to plan a trip for you in the future.

{{sender_name}}
```

---

### 4B — Rebooking / Past Customer Winback

**Goal:** Re-engage customers who haven't booked in 6–18 months

**Step 1 — Warm reconnect (Day 1)**

Subject: `{{first_name}}, it's been a while — time for another adventure?`

```
Hi {{first_name}},

I was looking through our past trips and remembered how much you enjoyed {{past_destination}} last {{year}}.

We have a new {{destination}} package launching this season that I thought you'd love — similar vibe, {{unique_feature}}.

Want me to send over the details?

{{sender_name}}
```

---

## 5. Marketing Agency Playbook

### 5A — New Client Prospecting Campaign

**Goal:** Book a discovery call with a business owner or marketing manager who needs a digital marketing agency

**ICP:** Business owner or marketing manager at a company spending on ads (check Facebook Ad Library, Google Ads signals), 10–200 employees, no in-house marketing team or existing agency relationship ending soon

**Pain points:** Poor ROI on current ads, agency not communicating, don't know if marketing is working, no time to manage it themselves

**Sequence Timing:** 5 steps over 18 days

---

**Step 1 — Specific observation hook (Day 1)**

Subject: `Noticed something about {{company}}'s ads, {{first_name}}`

```
Hi {{first_name}},

I was doing some research in your industry and noticed {{company}} is running ads on {{platform}}. I looked at a few of them and had some thoughts on what might improve performance.

I work with {{industry}} businesses to improve their paid ad ROI — typically 2–3x return within 90 days.

Would it be worth a 20-minute call to share what I noticed and see if it's relevant?

{{sender_name}}
{{agency_name}}
```

---

**Step 2 — Case study (Day 4)**

Subject: `How we helped a {{industry}} company go from {{old_result}} to {{new_result}}`

```
Hi {{first_name}},

Quick one — we recently worked with a {{industry}} company similar to {{company}}, and in 90 days:
- Ad spend stayed the same
- Cost per lead dropped by 40%
- Revenue from paid channels increased by {{revenue_increase}}

Happy to share exactly what we did in a 20-minute walkthrough — no pitch, just the playbook.

{{sender_name}}
```

---

**Step 3 — Free audit offer (Day 8)**

Subject: `Free 15-minute ad account audit for {{company}}`

```
Hi {{first_name}},

I'll keep this simple: I'll review your current ad setup for free and give you 3 specific things you can do right now to improve results — whether you work with us or not.

No catch. I do this because it's the easiest way to show what we're capable of.

Interested? Takes 15 minutes on a call.

{{sender_name}}
```

---

**Steps 4–5:** Follow-up + graceful close.

**Subject line bank:**
- `A quick look at your {{platform}} ads, {{first_name}}`
- `Your competitors are doing this — you're not (yet)`
- `I'll do a free audit of your ad account`
- `3 things holding back your {{platform}} performance`
- `How much are you spending on ads right now?`

---

### 5B — Retainer Renewal / Upsell Campaign

**Goal:** Re-engage an existing client about renewing or upgrading their retainer

**Step 1 (Day 1)**

Subject: `{{first_name}} — your Q{{quarter}} review + what's next`

```
Hi {{first_name}},

Before we get into Q{{next_quarter}}, I wanted to share a summary of what we achieved together this quarter:

- {{metric_1}}: {{result_1}}
- {{metric_2}}: {{result_2}}
- {{metric_3}}: {{result_3}}

Based on these results, I have some ideas for Q{{next_quarter}} that I think could push performance further. Can we schedule 30 minutes to discuss?

{{sender_name}}
```

---

## 6. B2B SaaS / Tech Sales Playbook

### 6A — Outbound Prospecting (Founder-Led Sales)

**Goal:** Book product demo calls with decision-makers at companies in your ICP

**ICP:** Operations Manager, VP of Sales, or Founder at a company with 10–200 employees, using tools in your adjacent category (detected via job posts, G2 reviews, LinkedIn tools section)

**Sequence Timing:** 5 steps over 16 days

---

**Step 1 — Specific problem hook (Day 1)**

Subject: `How {{company}} handles {{pain_point_process}}`

```
Hi {{first_name}},

I noticed {{company}} is scaling its {{department}} team — congrats on the growth.

Most companies at your stage run into the same problem with {{pain_point_process}}: {{specific_problem_description}}.

We built {{product_name}} specifically for this. {{one_sentence_outcome}}.

Worth a 20-minute call to see if it could help?

{{sender_name}}
{{company}}
```

---

**Step 2 — Competitor/alternative displacement (Day 4)**

Subject: `Are you still using {{competitor_or_current_tool}} for {{use_case}}?`

```
Hi {{first_name}},

Many of our customers switched from {{competitor}} because {{specific_limitation}} — and they typically see {{improvement}} within {{timeframe}}.

Not saying your current setup doesn't work. But if you're open to a 20-minute look, I'm happy to show you specifically what's different.

{{sender_name}}
```

---

**Steps 3–5:** Social proof, free trial offer, graceful close.

---

## 7. Real Estate Playbook

### 7A — Buyer Lead Nurture Campaign

**Goal:** Convert a property inquiry into a viewing appointment

**ICP:** Individual or couple who submitted a web inquiry or visited an open house, looking to buy within 3–12 months, first home or upsizing

**Sequence Timing:** 5 steps over 21 days

---

**Step 1 — Fast response (Within 1 hour of inquiry)**

Subject: `{{first_name}} — properties matching what you're looking for`

```
Hi {{first_name}},

Thanks for your inquiry about {{property_or_area}}.

Based on what you described, I've picked out {{number}} properties that match your criteria:

1. {{property_1}} — {{price_1}} — {{key_feature_1}}
2. {{property_2}} — {{price_2}} — {{key_feature_2}}
3. {{property_3}} — {{price_3}} — {{key_feature_3}}

Would you like to arrange a viewing this week? I can usually work around your schedule.

{{sender_name}}
{{agency}}
```

---

**Step 2 — Market insight (Day 4)**

Subject: `What's happening in {{area}} property market right now`

```
Hi {{first_name}},

Quick market update for {{area}}: 3 properties in your target range sold in the last 14 days — all within {{days_on_market}} days of listing.

Inventory is {{tight/increasing}}, which means {{implication_for_buyer}}.

If you're serious about {{area}}, it's worth being ready to move quickly. Would it make sense to get pre-qualified and shortlist 2–3 properties to view this week?

{{sender_name}}
```

---

### 7B — Seller Lead Campaign

**Goal:** Win a property listing from a homeowner thinking about selling

**Step 1 (Day 1)**

Subject: `What's your home in {{suburb}} worth right now, {{first_name}}?`

```
Hi {{first_name}},

Property in {{suburb}} has moved significantly in the last 12 months — homes similar to yours on {{street_type}} have been selling for {{price_range}}.

I'd love to give you a current market appraisal — no obligation, takes about 30 minutes at the property.

When would work for you?

{{sender_name}}
```

---

## 8. Objection Handler Library

These are pre-loaded AI responses for common objections across all verticals. The AI Reply Assistant draws from this library when it detects objection signals in an inbound reply.

### Universal Objections

| Objection Signal | Suggested Response Strategy |
|---|---|
| "Not interested" | Acknowledge + ask if timing is the issue or if it's the wrong fit — offer to close the loop entirely |
| "We already have a solution / provider" | Validate, pivot to "What does that look like for you?" — uncover gaps |
| "Too busy right now" | Suggest a specific short time slot + reschedule for a specific future date |
| "Too expensive / not in budget" | Break down into per-day cost, ask about budget cycle, offer a lighter starting point |
| "Send me more information" | Qualify first — ask 1 question before sending anything; prevents dead-end info dumps |
| "We're not looking right now" | Ask when would be the right time → schedule a reminder → exit gracefully |
| "Who are you / how did you get my contact?" | Be transparent about source, clarify value prop in 1 sentence |

### Recruitment-Specific Objections

| Objection | Response |
|---|---|
| "We use LinkedIn Recruiter for this" | "So do most of our clients — the difference is we already have warm relationships with passive candidates who don't respond to InMail" |
| "Your fees are too high" | "Our placement fee is {{fee}}% — the average cost of an unfilled role for 60+ days is typically 3–5x that in lost productivity and management time" |
| "We had a bad experience with a recruiter before" | "That's fair — may I ask what happened? I'd like to understand so I can show you specifically how we work differently" |

### Insurance-Specific Objections

| Objection | Response |
|---|---|
| "I have coverage through work" | "Most group policies cover 1–2x salary, which rarely covers mortgages and long-term family needs — worth a 15-min comparison?" |
| "I'll think about it" | "Of course — what would help you feel confident making a decision? Is it about cost, coverage type, or timing?" |
| "I'm too young to worry about this" | "The best time to get protected is actually now — premiums are lowest in your {{age_range}}s and health conditions don't yet complicate things" |

---

## 9. Subject Line Formulas

High-performing subject line patterns used across verticals. The AI draws from these when generating campaign subject lines.

### Formula Types

| Formula | Example | Best For |
|---|---|---|
| Specific observation | `Noticed {{company}}'s {{thing}}` | Cold B2B outreach |
| Question (pain-based) | `How are you handling {{pain_point}}?` | B2B, SaaS |
| Social proof number | `Placed 12 {{skill}} hires in Q1` | Recruitment |
| Urgency + scarcity | `Only {{n}} spots left for {{destination}}` | Travel |
| Curiosity gap | `The one thing most {{role}}s get wrong` | Insurance, B2B |
| Personalized reference | `Re: your {{job_post / recent_post / event}}` | All verticals |
| Benefit-first | `How to get 3x more replies from cold email` | Agency, SaaS |
| Direct ask | `Quick 15-minute call this week, {{first_name}}?` | Warm follow-up |
| Re: thread opener | `Re: our conversation about {{topic}}` | Follow-up sequence |
| Free offer | `Free {{audit / analysis / review}} for {{company}}` | Agency, SaaS |

### Subject Line Rules
- Keep under 50 characters when possible (mobile preview cutoff)
- Never use ALL CAPS or excessive punctuation (spam filters)
- Use `{{first_name}}` sparingly — powerful in step 1, feels mechanical in later steps
- Question subject lines outperform statement subject lines for cold outreach
- "Re:" in follow-up steps increases open rate significantly (use ethically — only when it is genuinely a follow-up)

---

## 10. Follow-up Cadence Guide

### Optimal Timing by Vertical

| Vertical | Step 1 | Step 2 | Step 3 | Step 4 | Step 5 | Total Duration |
|---|---|---|---|---|---|---|
| **Recruitment (Candidate)** | Day 1 | Day 4 | Day 7 | Day 10 | Day 14 | 14 days |
| **Recruitment (Client BD)** | Day 1 | Day 5 | Day 10 | Day 16 | Day 21 | 21 days |
| **Insurance** | Day 1 | Day 4 | Day 8 | Day 13 | Day 19 | 21 days |
| **Travel (Promotion)** | Day 1 | Day 3 | Day 6 | Day 10 | — | 10 days |
| **Marketing Agency** | Day 1 | Day 4 | Day 8 | Day 13 | Day 18 | 18 days |
| **B2B SaaS** | Day 1 | Day 4 | Day 7 | Day 11 | Day 16 | 16 days |
| **Real Estate (Buyer)** | Hour 1 | Day 4 | Day 9 | Day 15 | Day 21 | 21 days |

### Cadence Principles

1. **First follow-up should be short** — reference the previous email, don't repeat it. 3–5 sentences max.
2. **Each step should add value** — new information, insight, case study, or a genuine offer. Never just "bumping this up" with no substance.
3. **Step 3 is the pivot point** — if someone hasn't replied by step 3, change the angle (different pain point, different value prop, or a free offer).
4. **Final step: graceful close** — "I'll stop reaching out after this." This step frequently generates replies from people who were meaning to respond.
5. **Send window:** Tuesdays–Thursdays, 9am–11am recipient timezone, consistently outperforms other windows for B2B outreach.
6. **Weekend sends:** Acceptable for consumer-facing verticals (insurance, travel, real estate) — people browse on weekends.
7. **Reply immediately:** When a lead replies, the sequence stops and the lead enters your inbox. Respond within 4 hours for maximum conversion — the AI Reply Assistant handles this.

### When to Stop Immediately (Hard Stop Conditions)
- Lead replies (any reply — positive, negative, or "unsubscribe")
- Lead clicks the booking link
- Lead books a meeting
- Email hard bounces
- Lead is manually marked as Won or Lost in CRM
- Lead requests removal (legally required: process within 24 hours)
