---
title: "The Bug That Corrupted Data for Three Days in Silence"
description: "A regex missing one anchor turned €1,230 into €230 across a production database. No errors, no logs, no alerts. How silent data corruption survives tests, monitoring, and even the fix itself."
date: "2026-08-03"
category: "Engineering"
tags: [data-quality, debugging, regex, python, production, code-audit]
affiliatePrograms: []
image: "/images/blog/silent-data-corruption-regex-stale-process.webp"
verification: "production-tested"
---

# The Bug That Corrupted Data for Three Days in Silence

A three-room apartment in Bucharest, furnished, next to a mall, listed at **€230 a month**.

That is the number my system showed me. It is also roughly what you would pay for a room in a shared flat forty minutes outside the city. The real price was €1,230.

Nothing crashed. No exception was raised, no alert fired, no log line turned red. The scraper ran, the database accepted the write, the query returned results, the bot formatted them nicely. Every component reported success. The only thing that failed was the truth.

I found it because a listing looked too good. That is a terrible detection mechanism, and it is the one most teams are actually running.

---

## What the regex did

The price extractor looked like this:

```python
r"(\d{1,3}(?:[ .,]\d{3})*(?:[.,]\d+)?)\s*(€|EUR|euro)"
```

Read it slowly and it looks fine. It handles `1.200 €`, `1,200 €`, `450 EUR`. It has a thousands separator group. Someone thought about this.

Now feed it the string `1230 €`.

The engine starts at position 0. It tries `\d{1,3}` and grabs `123`. Then it needs a thousands separator or the currency symbol. What follows is `0` — neither. So the match fails at position 0.

Then the engine does what regex engines do: it advances one character and tries again. Position 1: `230`, followed by a space, followed by `€`. Clean match.

**The result is always the last three digits.** €1,230 becomes €230. €1,050 becomes €50. €1,100 becomes €100. And €1,000 becomes zero, because `"000"` parses to `0`.

Eleven characters would have prevented all of it: `(?<![\d.,])`, a negative lookbehind that says *do not start a match immediately after a digit*. With it, position 1 is rejected and the whole thing fails loudly instead of quietly returning garbage.

![How a regex silently truncates a price: the engine fails at position 0, advances one character, and returns the last three digits](/images/blog/regex-truncation-mechanism.svg)

That is the entire bug. One missing anchor, three digits gone, no error anywhere.

---

## Why nothing caught it

![A pressure gauge, needle resting calmly inside the green band](/images/blog/silent-monitoring-all-green.webp)

This is the part worth your attention, because the regex is the boring half of the story.

**The type was still correct.** `230` is a valid integer. The column accepted it. Any schema validation, any Pydantic model, any `NOT NULL` constraint — all satisfied. Type systems catch shape errors. This was a *value* error wearing the right shape.

**The value stayed inside the plausible range.** A €230 rent is unusual but not impossible. Had the bug produced €2,300,000 or `-1`, a range check would have caught it on day one. Corruption that lands inside the plausible band is the kind that survives.

**Tests passed.** There were four price-parsing tests: `600 EUR`, `EUR 600`, `600 €`, and `1,200 €`. Three of them are three-digit prices. The fourth is four digits — and it passed, because the comma made it parse correctly. The bug only fires on four digits written *without* a separator. Every fixture was written by the same person who wrote the regex, holding the same mental model of what a price looks like.

**Monitoring had nothing to alert on.** Error rate: zero. Latency: normal. Throughput: normal. Every dashboard was green, because every dashboard was measuring whether the system *ran*, not whether it was *right*.

![Five detection layers, all of them green while the data was wrong](/images/blog/five-layers-all-green.svg)

Five layers of defence — types, constraints, tests, monitoring, code review — and the bad value walked through all of them without touching the sides.

---

## The second bug, hiding behind the first

Here is where it got uncomfortable.

I checked the git history. **The regex had already been fixed.** A commit on July 26 added the lookbehind. Correct fix, properly tested, committed.

And yet six rows were corrupted on July 27 — the day *after* the fix. Two thirds of the total damage was written by code that had already been repaired.

The scraper is a long-running process. It imported the module once, at startup, and kept executing that bytecode. The fix sat on disk, committed and green in CI, doing absolutely nothing, because nobody restarted the thing that was running.

It stopped writing corrupted rows on the 27th only because the source stopped serving prices in that exact shape, not because anything was fixed.

**A fix that is not deployed is not a fix. It is a commit.** The gap between "merged" and "running" is invisible in every tool most of us look at: the pull request is closed, the tests are green, the ticket says done. Meanwhile the old code is still in memory, still deciding what gets written to a production database.

![Timeline: the fix was committed on July 26; the process that kept writing prices was not restarted until the evening of July 28, by accident](/images/blog/fix-committed-not-deployed.svg)

The corrected code did eventually load. Two days later, just before ten in the evening on July 28, entirely by accident.

There was a file watcher sitting in the repository, committed that same afternoon fourteen minutes before the fix itself, wired to watch exactly these paths and restart anything that changed. No startup script ever launched it. When it finally did run, on the 28th, its process-detection check queried a PowerShell property that does not exist on Windows. Every service it supervised looked permanently dead, so it spawned a fresh copy of each one every thirty seconds: thirteen duplicate copies of one content runner, eleven of another, hundreds of orphaned processes, a quarter hour of alert spam. Somewhere in that mess, a scraper started up with the corrected regex.

That is what deployed my fix. Not a decision. A different bug.

The rule I wrote into the project's operating instructions afterwards is deliberately unglamorous: *touching these files requires running the restart script.* A human step, in a file a human reads. The clever version had been in the repository the entire time, and its first act was to take the system down.

---

## Finding the damage

![An open ledger under a desk lamp, the only lit thing in a dark room](/images/blog/silent-audit-ledger.webp)

Once you know a value can be wrong, the question becomes: how wrong, and how often?

The naive approach is a range check. Flag everything under €250, eyeball it. That gets you a list contaminated with legitimately cheap listings — a room in a shared flat, a studio outside the city — and no way to tell them apart.

The approach that worked used a property of the data itself. Each listing stores both a parsed price and the raw scraped description. The description is written once, on first insert, and never updated. **It still contained the original text.**

So: for every row, extract every number followed by a currency marker from the description, and check whether the stored price is among them.

```python
AMOUNT = re.compile(r"(?<![\d.,])(\d{3,4})\s*(?:€|EUR|euro)", re.I)

for row in rows:
    found = {int(m) for m in AMOUNT.findall(row["description"])}
    if found and row["price"] not in found:
        suspects.append(row)
```

That first pass returned 25 rows out of 999 — a mismatch list, not a bug list. Some of those rows were legitimate: a price that changed after the description was captured looks identical to a price that was parsed wrong.

The second pass is what made it actionable. Every genuine truncation carries the same arithmetic signature, so the predicate became `stored == real % 1000`, restricted to a four-digit real price:

```python
if real >= 1000 and stored == real % 1000:
    confirmed.append(row)
```

Nine rows. Zero false positives.

The order matters and it is easy to get backwards. My first attempt at the tight rule was looser — does the stored price appear as a *suffix* of some number in the description — and it dragged in rows like `"Etaj 1 520 €"` (floor 1, 520 euros), which reads exactly like a truncated 1,520. That row was fine. Tighten until false positives reach zero, then repair. A repair script that is 60% correct is worse than none, because it creates a second generation of corruption with no original left to compare against.

![Detection strategy: comparing the parsed value against the raw text that produced it](/images/blog/detection-cross-reference.svg)

---

## The mirror bug

Fixing the original meant also handling the non-breaking space in the thousands separator. `1<NBSP>600 €` is a shape the old parser would have mangled into `600` the same way — not yet triggered, waiting for the source to change its formatting.

So I widened the character class. And immediately created the opposite bug.

Listing cards render as one flat blob of text: photo counter, price, price-per-square-metre, all concatenated. `1 / 13 500 € 8,47 €/m²`. With the ASCII space in the separator class, `13 500` reads as a thousands-separated number and a €500 apartment becomes €13,500.

**The fix for "digits are being dropped" is one character away from "digits are being invented."**

The resolution came from asking what each character actually means in context. A non-breaking space is a *typographic* separator — sites emit it inside a price element, deliberately, to prevent the number from wrapping. A regular space is what you get from prose and from concatenated DOM text. One belongs in the separator class. The other does not.

```python
_THOUSANDS_SEP = ".,   "   # NBSP, narrow NBSP, thin space — not ASCII space
```

I only found the mirror bug because an adversarial review pass specifically looked for it. The instruction was not "check my work" but *"assume this fix introduced a new bug; find it."* Those produce different results.

![The same character class produces opposite failures: dropped digits without NBSP, invented digits with ASCII space](/images/blog/mirror-bug-tradeoff.svg)

---

## What this costs a business

Nine rows out of 999. Under one percent. Easy to shrug off.

Except the nine were not random. Every one of them was a premium listing: three-room apartments in the expensive parts of the city, €1,050 to €1,600. The truncation moved them all into the €50–€600 band.

Which means they showed up at the top of every "cheapest first" query. A filter for *under €500* returned seven apartments that were never under €500. The corruption did not sit quietly in a corner of the database. It surfaced at the exact moment someone was making a decision, and it always surfaced as an opportunity.

Generalise that beyond apartments. Silent truncation in a pricing table quotes below cost. In an invoicing pipeline it undercharges. In a stock system it triggers reorders that are not needed. In a reporting layer it makes a bad quarter look survivable.

**A broken parser does not hand you an error message. It hands you a confident number, and something downstream acts on it.**

![Why the damage concentrated in premium listings and surfaced in exactly the wrong query](/images/blog/damage-concentration.svg)

---

## What I changed, beyond the regex

The regex fix took ten minutes. The rest took longer and matters more.

**Range checks tied to reality, not to types.** Rent below €250 in central Bucharest is not impossible, but it is rare enough to warrant a log line. Not a hard rejection — a signal. The point is to notice, not to block.

**Cross-field consistency as a first-class check.** While auditing, a second problem surfaced: seventy rows where the surface area was exactly equal to the price. A €400 apartment recorded as 400 square metres. Two fields, individually plausible, jointly impossible. Nobody had ever compared them, because each was valid on its own.

**Tests that cover the shape of the failure, not the shape of the happy path.** The test suite had four tests that parsed an actual price. It now has cases for four-digit prices, non-breaking spaces, aggregated card text, and prose numbers adjacent to prices — all of them derived from strings that actually appeared in production, not invented.

**Repair scripts that assume they are wrong.** Dry-run by default, read-only connection, a physical backup before any write, and a typed confirmation word. The script found nine rows and touched nine rows.

![Data quality checks: what each layer can and cannot catch](/images/blog/data-quality-layers.svg)

---

## The uncomfortable part

![An empty office at night, one dark monitor on a desk](/images/blog/silent-data-corruption-regex-stale-process.webp)

I wrote that regex. I wrote the tests that did not catch it. I fixed it and did not restart the process, so the old code kept running for two more days and wrote two thirds of the damage after the repair already existed. Then I fixed the fix and introduced a mirror bug, which a review pass caught, not me.

None of that is unusual. It is what debugging a real system looks like when you write down what actually happened instead of the version where you were right the first time.

The transferable part is smaller than a war story and more useful: **your monitoring probably tells you whether your system is running. It very likely does not tell you whether it is right.** Those are different questions, and only one of them has a dashboard.

My data was wrong for three days and stayed wrong for nine, because nothing was looking. If yours has drifted, you will probably find out the way I did: a number looks strange to whoever happens to be paying attention that day. Calling that a detection system is generous.

---

*I run [code and data audits](https://thinkflow.ro/services/technical-consulting) for teams that suspect their numbers have drifted — the kind of problem that has no error rate to alert on. If the story above felt familiar, that is usually the tell.*
