# progress.md — Alternate History Story (handoff for Claude)

## START HERE
_Last updated 2026-10-28. For Claude only; Tim doesn't read this. Catch-up authorizes nothing: only "Authorized next steps" below is approved work._
1. Read this file.
2. Read [direction.md](direction.md) (Tim's intent; it overrules everything).
3. Skim the last 3 entries of [chat.md](chat.md). The notes themselves are in [brainstorm/](brainstorm/).

A **writing project** (a time-travel "uplift" story) plus a small static website on GitHub Pages that shows the notes. Tim directs; Claude brainstorms, organizes, researches and, later, drafts.

## Goal right now
**Exploring possibilities. NOTHING about the story is decided**: not the location, time period, hero, government, route to power or plot. Tim, 2026-10-27: "We don't really have specifics about a plan, just looking through possibilities."

Possibilities raised so far (none chosen):
- a hidden homeland, or a two-stage start (rise at a court, then move)
- Mongol refugees; Fibonacci and Frederick II
- a founder-led government with feedback systems
- six full variations (see Status)

Talk about these as options ("one possibility"), never "our plan" or "the hero does X".

**Latest work:** a month-by-month simulation of the North America variation, 1243–1282, shown on the site. Simulations for the other five variations would be the natural next step, but Tim hasn't asked for them.

## Status
| Area | File | State |
|---|---|---|
| Tim's intent | [direction.md](direction.md) | Written from his first message |
| Raw ideas | [brainstorm/ideas-inbox.md](brainstorm/ideas-inbox.md) | Kept current, newest first |
| Ideas catalog | [data/ideas.json](data/ideas.json) | 141 items: time to build, prereqs, impact, "In 1230", trade value `t`. Source for the site's Ideas tab |
| How times were estimated | [brainstorm/timeline.md](brainstorm/timeline.md) | First draft |
| The world in 1230 | [brainstorm/world-1200s.md](brainstorm/world-1200s.md) | First draft (whole world) |
| Tech tree, chemistry, tools, pure knowledge, long-term tech | [brainstorm/](brainstorm/) | First drafts |
| Time periods; dates and series | [time-periods.md](brainstorm/time-periods.md), [dates-and-series.md](brainstorm/dates-and-series.md) | ~1200–1230 recommended by Claude; NOT chosen |
| Prior art | [brainstorm/prior-art.md](brainstorm/prior-art.md) | From memory |
| Homeland, resources, trade, ships | [homeland.md](brainstorm/homeland.md), [resources.md](brainstorm/resources.md), [trade-and-wealth.md](brainstorm/trade-and-wealth.md), [ships-1200s.md](brainstorm/ships-1200s.md) | First drafts |
| Government, population, rising to power, two-stage start | [government.md](brainstorm/government.md), [population.md](brainstorm/population.md), [rise-to-power.md](brainstorm/rise-to-power.md), [two-stage-start.md](brainstorm/two-stage-start.md) | Options only. Includes Tim's ideas (total power plus feedback systems and a successor; maximum births plus maximum immigration) |
| People and events | [people-1200s.md](brainstorm/people-1200s.md), [events-1200s.md](brainstorm/events-1200s.md) | From memory |
| Location ratings | [location-shortlist.md](brainstorm/location-shortlist.md), [culture-acceptance.md](brainstorm/culture-acceptance.md), [location-factors.md](brainstorm/location-factors.md) | Top 10 rated /10. Latest overall: N. America with settlers 7.8, N. America 6.5, Britain 6.2, southern Africa 6.1, Java 6.1. NOT chosen |
| Six variations | [brainstorm/variations.md](brainstorm/variations.md) + [brainstorm/variations/](brainstorm/variations/) | North America, Southern Africa, Britain, Java, Andes, Sweden: a full plan for each. For comparison; none chosen |
| Fitting in and conflict | [brainstorm/fitting-in-and-conflict.md](brainstorm/fitting-in-and-conflict.md) | Fitting in /10 and peace /10 for each variation; 10 safeguards |
| Home tab (location maps) | [index.html](index.html) + [data/regions/](data/regions/) | 6 cards, each opening a regional map with 7 layers, emoji icons, a hover card and Wikimedia photos. `#<slug>` opens one directly |
| Map tab | index.html, [data/civs.json](data/civs.json), data/borders-1200.json, data/borders-1279.json | Places · Civilizations · Religion · Population · Resources, for 1200 and 1279 |
| **North America simulation** | [sim/north-america.mjs](sim/north-america.mjs) → [data/sim/north-america.json](data/sim/north-america.json); write-up [brainstorm/sim-north-america.md](brainstorm/sim-north-america.md); plan [docs/sim-plan.md](docs/sim-plan.md) | Done and live 2026-10-28. Monthly model, 1243–1282; converges at pass 4 after 6 manual review rounds. Site: "Simulation" button in the region header → `#north-america/sim`, with 8 chip sections. 1282: 118k settlers, 195k allied, settler e0 50, all 47 techs done |
| Simulations for the other 5 variations | — | Not started; not asked for |
| Framing, plot, characters | — | Not started ("figure it out later") |

## Authorized next steps
- 2026-10-27 · Keep brainstorming and organizing with Tim, and keep the site updated with the notes. No story prose until he asks.

## Standing instructions (Tim's words)
- "A 2026 american will need to learn to live like a native american if they're going to start there before they're able to gain influence ... consider conflicts that might happen due to predjudices, irrational beliefs ... if europeans think they have a god-right to the land or something I don't want them killing native americans." (2026-10-28) → In every variation, fitting in comes before influence, and any group that moves needs safeguards. See fitting-in-and-conflict.md.
- "don't ask me a question to commit to, give me info on each one like I asked. Rate each one out of 10" (2026-10-28) → When Tim is choosing, give info on every option with a /10 rating. No question box asking him to pick.
- "I don't necessarily think we should be looking for something to 'fight' or beat ... The goal is just do develope a group of people as much as you possibly can." (2026-10-27) → Don't frame anything around an enemy.
- "your notes on what we have right now are really wrong. It seems like we brought up some ideas and now are assuming that they are what we're doing. We don't really have specifics about a plan, just looking through possibilities." (2026-10-27) → Never write "our plan", "plan A", "the hero will" or "settled".
- On the simulation: "I don't really care about your meathod though. Just take each step carefully and output me something that is your best." (2026-10-28)
- "Right now just help me brainstorm and write down my thoughts and organize them with me."
- "the best improvements are simple things that nobody thought about but have massive implications."
- How he got sent back: "this part doesn't really matter much so let's figure it out later."
- On heresy and Church talk: "That's getting ahead of ourselves ... Let's focus on the inventions and procedures first."
- If the hero leads: "the leader isn't going to die for a long time, but the leader will still be considering it as a possibility in their plan." (an idea, not a decision)
- Population idea: "maximum population growth as well as maximum immigration while maintaining positive growth." (an idea, not a decision)
- Predicting events: "I don't love the predicting events thing; it's kind of a cliche ... not repeatable." It's OK only as one proof to a single powerful person he reveals the truth to.

## Traps / rules that bite
- `Alternate_history.html` in the root is an empty 0-byte file Tim created → leave it untracked and untouched.
- `.nojekyll` is required, or Pages turns .md files into .html and the Notes tab can't fetch them.
- The site fetches files → test it through a local server (`python -m http.server <port>`), not file://. Port 8765 is taken by another project.
- New brainstorm files must be added to the `NOTES` list in index.html, or they won't show on the site.
- `main` needs `min-height:0`, or on phones a tall view grows past the screen.
- Region map point labels show only at zoom ≥ 7 (`#rmap.z-lbl`). Map tiles are Esri World_Physical_Map, because CARTO now needs a key (native max zoom 8).
- The historical-basemaps borders for 1200 have errors (they show the Fatimids, Buyids, Ghaznavids, Liao, Huari and Tiwanaku). civs.json fixes the names only. Polities not in civs.json default to "Local / traditional".
- Map tab labels show at zoom 3 only for populations of 5M or more, and at zoom 4+ for 1M or more (to avoid overlap in Europe).
- PowerShell 5.1 `Invoke-WebRequest` stalls on big downloads → use `curl` in Bash.
- phone-view's WebKit engine crashed at launch on 2026-10-27 → use `--engine chrome`.
- Simulation:
  - After changing `sim/north-america.mjs`, run `node sim/north-america.mjs`. It rewrites the JSON, but the numbers in brainstorm/sim-north-america.md must be updated by hand.
  - The log of Claude's reviews is the `REVIEWS` array in the .mjs.
  - `routeHash()` must run after the `SIMS` and `simOn` declarations in index.html (temporal dead zone).
  - Chart.js 4.4.1 is loaded on demand from cdnjs.
  - The palette is the dataviz reference palette, validated on #fffdf8 and #221e19. Three light-mode colors are under 3:1 contrast, so the Table section must stay.
  - Work category "spare" is labeled "Free time & extra goods".

## Decisions
- D1 · 2026-10-27 · Folder layout: direction, progress and chat at the root; notes in `brainstorm/`; the catalog in `data/`; drafts later go in `story/`.
- D2 · 2026-10-27 · Time estimates run from the day he starts to working at a useful scale, assuming power and a workshop, ~1230s Europe, and prerequisites done. "From zero" adds the longest prerequisite chain.
- D3 · 2026-10-27 · Time buckets: <2 mo, 3–11 mo, 1–2 yr, 3–5 yr, 6–10 yr, 11–20 yr, 21–50 yr, 50+ yr, colored green → red.
- D4 · 2026-10-27 · Repo made **public** because GitHub Pages is free only for public repos ($0 rule).
- D5 · 2026-10-28 · Site tabs: Home (default) · Ideas · Map · Notes.
- D6 · 2026-10-28 · Claude picked 6 variations at Tim's request (reasons for leaving out Japan, Chile, Ethiopia and SE Australia are in variations.md).
- D7 · 2026-10-28 · The simulation lives inside the region view (button → `#<slug>/sim`), not as a new tab, because it's the plainest fit. Tim hasn't reviewed the look.
- D8 · 2026-10-28 · Simulation method: monthly model + a whole-timeline foresight loop (stops when key numbers move under 1% and no tech date moves over 2 months) + Claude's review rounds against history. Tech dates come out of the model; they're never typed in.

## NOT verified
- Prior-art details and 1230s-world facts are from memory, not web-checked.
- All time estimates are story estimates, not research numbers.
- The site hasn't been checked on Tim's real iPhone. Ideas and Notes were checked in WebKit at 393 px; Map, Home and Simulation only in the Chrome engine.
- Place coordinates and "found" dates are approximate, from memory.
- data/regions/*.json was researched by subagents with ~15 web searches each. Almost all 1230 populations are marked "(guess)", some tonnages are from memory, and coordinates were only spot-checked.
- Civilization populations and religions in civs.json are from memory. "Resources" density counts only the ~110 sites in places.json.
- The simulation's rates are reasoned, not researched: mortality multipliers, labor per ha, design times and joining speed. Native joining speed is the most optimistic part.

## Rejected / parked
- ~~Heresy and Church risk markers in pure-knowledge.md~~ · 2026-10-27 · Tim said it's getting ahead of ourselves.
- ~~Question box asking Tim to pick a location~~ · 2026-10-28 · He wants info and /10 ratings instead.
- ~~Japan, Central Chile, Ethiopia, SE Australia as variations~~ · 2026-10-28 · Lower scores or overlap with others (see variations.md).

## Map
- `index.html` · the whole site (tabs, Leaflet maps, Notes renderer, Simulation view)
- `brainstorm/*.md` · the notes (listed in `NOTES` in index.html)
- `data/` · ideas.json, places.json, civs.json, borders, regions/*.json (one per variation), sim/north-america.json
- `sim/north-america.mjs` · the simulation model (node ESM, no dependencies)
- `docs/sim-plan.md` · the simulation plan, with a BUILT section
- Tests: no test suite. Last checks 2026-10-28: `node --check sim/north-america.mjs` OK; phone-view (Chrome engine) at 393 px on all 8 sim sections and at laptop width on 4; live-check served 9f2c34d.
- Live: https://timothyhadfield.github.io/alternate-history-story/ · GitHub Pages from `main` of TimothyHadfield/alternate-history-story (public). Every push redeploys.
- Project path: `C:\Users\timha\OneDrive\Documents\Projects & Hobbies\Alternate History Story`
