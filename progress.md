# progress.md — Alternate History Story

## START HERE
Last updated: 2026-10-27
Read order: [direction.md](direction.md) → this file → [chat.md](chat.md) → [brainstorm/](brainstorm/).
A **writing project** with one small static website (GitHub Pages) that shows the notes. Tim directs; Claude helps brainstorm, organize, research and later draft.
Live site: https://timothyhadfield.github.io/alternate-history-story/

## Goal right now
**Exploring possibilities. NOTHING about the story is decided**: not the location, time period, hero, government, route to power or plot. Tim, 2026-10-27: "We don't really have specifics about a plan, just looking through possibilities."
Possibilities raised so far (none chosen): a hidden homeland; southern Africa, Japan or North America; a two-stage start (rise at a court, then move); Mongol refugees; Fibonacci and Frederick II; a founder-led government with feedback systems. Talk about these as options ("one possibility"), never as "our plan" or "the hero does X".

## Status
| Piece | File | State |
|---|---|---|
| Tim's intent | [direction.md](direction.md) | Written from his first message |
| Raw ideas | [brainstorm/ideas-inbox.md](brainstorm/ideas-inbox.md) | Kept current, newest first |
| Ideas catalog (111 items, time to build, prereqs, impact, "In 1230") | [data/ideas.json](data/ideas.json) | First draft; source of truth for the site's Ideas tab |
| How times were estimated | [brainstorm/timeline.md](brainstorm/timeline.md) | First draft |
| The world in 1230 | [brainstorm/world-1200s.md](brainstorm/world-1200s.md) | First draft (whole world, not one location) |
| Tech tree, chemistry, tools, pure knowledge | [brainstorm/](brainstorm/) | First drafts |
| Time periods | [brainstorm/time-periods.md](brainstorm/time-periods.md) | Claude recommended ~1200–1230; NOT chosen by Tim |
| Prior art | [brainstorm/prior-art.md](brainstorm/prior-art.md) | From memory, not web-checked |
| Website | [index.html](index.html) | Ideas tab (time strip filter, category chips, ⭐ simple wins, detail with prereqs/unlocks/"from zero") + Notes tab (renders brainstorm md files) |
| Where to build (hidden homeland) | [brainstorm/homeland.md](brainstorm/homeland.md) | First draft, scored table of 9 places |
| Resources + who got rich | [brainstorm/resources.md](brainstorm/resources.md) + [data/places.json](data/places.json) | First draft; ~110 places on the site's Map tab |
| Trade & wealth | [brainstorm/trade-and-wealth.md](brainstorm/trade-and-wealth.md) | First draft; `t` field in ideas.json = trade value (💰 filter) |
| Long-term tech (10–100 yrs) | [brainstorm/long-term-tech.md](brainstorm/long-term-tech.md) | First draft; 30 long-term items added to ideas.json (141 total) |
| Government | [brainstorm/government.md](brainstorm/government.md) | Options explored, including Tim's idea of total power plus feedback systems and a successor. Not decided |
| Population | [brainstorm/population.md](brainstorm/population.md) | Max births + max immigration, never letting food/housing per person fall |
| Rising to power | [brainstorm/rise-to-power.md](brainstorm/rise-to-power.md) | 10 routes, proofs, by-society table. Prophecy only as one secret proof to one patron |
| Map modes | [index.html](index.html), [data/civs.json](data/civs.json), data/borders-1200.json, data/borders-1279.json | Map tab: Places · Civilizations · Religion · Population · Resources, year 1200/1279. Borders from aourednik/historical-basemaps (GPL-3.0), simplified with mapshaper to 30%. Religion = state religion of the rulers; populations are rough guesses from memory |
| Two-stage start | [brainstorm/two-stage-start.md](brainstorm/two-stage-start.md) | Rise-difficulty table, 4 example combinations (possibilities, not a plan) |
| Events 1200–1350 | [brainstorm/events-1200s.md](brainstorm/events-1200s.md) | First draft |
| Framing / plot / characters | — | Not started ("figure it out later") |

## Authorized next steps
- 2026-10-27: keep brainstorming and organizing with Tim; keep the site updated with the notes. No story prose until he asks.

## Standing instructions (Tim's words)
- "don't ask me a question to commit to, give me info on each one like I asked. Rate each one out of 10" (2026-10-28) → When Tim is choosing, give info on every option with a /10 rating. No question box asking him to pick; he'll say when he's chosen.
- "I don't necessarily think we should be looking for something to 'fight' or beat ... The goal is just do develope a group of people as much as you possibly can." (2026-10-27) → Don't frame eras or plots around an enemy or a deadline to beat. Judge options by how far a group can be developed.
- "your notes on what we have right now are really wrong. It seems like we brought up some ideas and now are assuming that they are what we're doing. We don't really have specifics about a plan, just looking through possibilities." (2026-10-27) → Everything is an option until Tim says he's chosen it. Don't write "our plan", "plan A", "the hero will", or "settled".
- "Right now just help me brainstorm and write down my thoughts and organize them with me."
- "the best improvements are simple things that nobody thought about but have massive implications."
- How he got sent back: "this part doesn't really matter much so let's figure it out later."
- On heresy/Church talk: "That's getting ahead of ourselves. We don't even know for sure what location we're being dropped off in ... Let's focus on the inventions and procedures first." → No religion/politics/plot risks for now.
- If the hero leads: "the leader isn't going to die for a long time, but the leader will still be considering it as a possibility in their plan." (an idea, not a decision)
- Population idea: "maximum population growth as well as maximum immigration while maintaining positive growth." (an idea, not a decision)
- Predicting events: "I don't love the predicting events thing; it's kind of a cliche ... not repeatable." OK only as one proof to a single powerful person he reveals the truth to.

## Traps
- `Alternate_history.html` in the root is an empty 0-byte file Tim created. Left untouched (not the site; the site is `index.html`).
- Repo was made **public** on 2026-10-27 because GitHub Pages is free only for public repos ($0 rule). Tim asked for the site on his GitHub.
- `.nojekyll` is required: without it Pages turns .md files into .html and the Notes tab can't fetch them.
- The site fetches files, so test it through a local server (`python -m http.server <port>`), not file://. Port 8765 is used by another project on this laptop.
- New brainstorm files need adding to the `NOTES` list in index.html to show on the site.
- Map tiles: CARTO now shows "API KEY REQUIRED"; using Esri World_Physical_Map (no key, no modern borders, native max zoom 8).
- The historical-basemaps borders have errors for 1200 (Fatimids, Buyids, Ghaznavids, Liao, Huari and Tiwanaku are shown although they were gone by then). [data/civs.json](data/civs.json) fixes the display names; the shapes are left as they are. Polities not listed in civs.json default to "Local / traditional, population unknown".
- Map labels: shown at zoom 3 only for populations of 5M or more, and at zoom 4+ for 1M or more (to avoid overlap in Europe).
- PowerShell 5.1 `Invoke-WebRequest` stalls on big downloads here; use `curl` in Bash.
- phone-view's WebKit engine crashed at launch on 2026-10-27 ("browserContext.newPage: Target page ... closed"); Map/Trade checks that day used `--engine chrome`.

## Decisions
- Folder layout: direction/progress/chat at root, notes in `brainstorm/`, catalog in `data/`, later `story/` for drafts.
- Time estimates = from the day he starts to working at useful scale, assuming power + workshop, ~1230s Europe, prerequisites done. "From zero" on the site adds the longest prerequisite chain.
- Time buckets: <2 mo, 3–11 mo, 1–2 yr, 3–5 yr, 6–10 yr, 11–20 yr, 21–50 yr, 50+ yr, colored green → red.
- Site tabs: Ideas · Map · Notes.

## NOT verified
- Prior-art details and 1230s-world facts are from memory, not web-checked.
- All time estimates are story estimates, not research numbers.
- Site not yet checked on Tim's real iPhone (Ideas/Notes checked in WebKit 393px; Map only in Chrome engine).
- Place coordinates and "found" dates are approximate, from memory.
- Civilization populations and religions in civs.json are from memory. "Resources" density counts only the ~110 sites in places.json, not a real survey.

## Rejected / parked
- ~~Heresy/Church risk markers in pure-knowledge.md~~: removed 2026-10-27, Tim said it's getting ahead of ourselves.
