---
title: "Why your website loads slowly on mobile — and what you can fix yourself"
description: "The real reasons a business site takes too long to load on a phone, how to measure speed properly with Google PageSpeed, and which fixes you can do yourself before paying anyone."
date: "2026-09-04"
category: "Web Development"
tags: [wordpress, pagespeed, performance, mobile, web-development]
affiliatePrograms: []
image: "/api/og?title=Slow+Site+on+Mobile&category=Web+Development&tags=pagespeed,performance"
verification: "market-analysis"
---

# Why your website loads slowly on mobile — and what you can fix yourself

Your site opens fast on your laptop, on the office wifi, from the cache of a browser that has seen it a thousand times. Your customer opens it on a four-year-old phone, on weak 4G, standing up, thumb hovering over the back button. The two of you are not visiting the same website.

That's the first trap: **your own impression is not a measurement.** The second trap is just as common: speed is not a cosmetic issue. A visitor who waits too long doesn't get annoyed — they leave. And you never find out, because they don't show up in any statistic you read.

## Measure first. It takes a minute and costs nothing.

Go to [PageSpeed Insights](https://pagespeed.web.dev/), enter your site's address, and look at the **mobile** score, not the desktop one, which is almost always flattering. Google gives you a score out of 100 and, more usefully, tells you what's dragging it down.

An honest yardstick from our own practice: under 50 means you're measurably losing visitors; 50-75 is the "works, but leaves money on the table" zone; above 85 is solid. And as proof that we don't preach from a tower: our own site sat at 70 until recently, because of an animation that kept the page title invisible until all the JavaScript loaded. We fixed it only after we measured it. Which is exactly the lesson of this article.

## The usual suspects, in order of frequency

**Unsized images.** Someone uploaded the photo straight from a phone, 4,000 pixels wide and 6 MB, and the site displays it in a 400-pixel box. Your customer's phone downloads the whole mountain to show a pebble. It's the number one cause by a distance, and the easiest to fix.

**Plugins accumulated over years.** Every "let's just try this one" left behind scripts that load on every page whether they do anything or not. We've seen brochure sites with 40+ active plugins, half of them doing nothing for years.

**Third-party scripts.** The chat widget nobody uses anymore, the tracking pixels added "temporarily" in 2023, the embedded map that loads half a megabyte before anyone scrolls to it. Each looks small; together they often weigh several times more than the site itself.

**Bargain hosting.** At low traffic it seems fine. Except the server responds slowly to the first request — and the first request is exactly when the visitor decides whether to stay.

**No caching at all.** Without a cache, WordPress rebuilds every page from scratch, for every visitor, every time. It's cooking each order separately even when everyone ordered the same dish.

## What you can fix yourself, today, without breaking anything

1. **Compress your images.** A plugin like Smush or ShortPixel (both have free tiers) walks through your media library and does the work. For future images: resize before uploading.
2. **Install a caching plugin.** LiteSpeed Cache or WP Super Cache with default settings makes a visible difference on day one.
3. **Clean up plugins.** Deactivate what you don't recognise as used — one at a time, a day apart, so you notice if something breaks. Whatever stays deactivated for a month without anyone missing it can be deleted.
4. **Remove dead scripts.** The abandoned chat widget and old tracking pixels come out of the theme or the tag manager in minutes.
5. **Measure again.** Same PageSpeed, same page. The difference you see is yours, for free.

## When the problem runs deeper

If the score still won't move after all that, the cause is usually structural: a heavy theme built on a bloated page builder, hosting that can't keep up, or years of improvisations stepping on each other. Fixes at that level need someone who does this daily — and honestly, they need a correct diagnosis first, not a quote on sight.

That diagnosis is what we do for free: the [site health report](/raport-site) — give us your address, get 3-4 concrete findings within 24 working hours, including what you can fix yourself and what would need intervention. No installs, no passwords, no unsolicited calls. If your site is already fast, the report will tell you that too.
