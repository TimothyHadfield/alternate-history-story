# progress.md — Alternate History Story

## START HERE
Last updated: 2026-10-27
Read order: [direction.md](direction.md) → this file → [chat.md](chat.md) → [brainstorm/](brainstorm/).
A **writing project** with one small static website (GitHub Pages) that shows the notes. Tim directs; Claude helps brainstorm, organize, research and later draft.
Live site: https://timothyhadfield.github.io/alternate-history-story/

## Goal right now
Brainstorm and organize **inventions and procedures** (Tim's focus). Location and time period not chosen yet.

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
| Framing / plot / characters | — | Not started ("figure it out later") |

## Authorized next steps
- 2026-10-27: keep brainstorming and organizing with Tim; keep the site updated with the notes. No story prose until he asks.

## Standing instructions (Tim's words)
- "Right now just help me brainstorm and write down my thoughts and organize them with me."
- "the best improvements are simple things that nobody thought about but have massive implications."
- How he got sent back: "this part doesn't really matter much so let's figure it out later."
- On heresy/Church talk: "That's getting ahead of ourselves. We don't even know for sure what location we're being dropped off in ... Let's focus on the inventions and procedures first." → No religion/politics/plot risks for now.

## Traps
- `Alternate_history.html` in the root is an empty 0-byte file Tim created. Left untouched (not the site; the site is `index.html`).
- Repo was made **public** on 2026-10-27 because GitHub Pages is free only for public repos ($0 rule). Tim asked for the site on his GitHub.
- `.nojekyll` is required: without it Pages turns .md files into .html and the Notes tab can't fetch them.
- The site fetches files, so test it through a local server (`python -m http.server <port>`), not file://. Port 8765 is used by another project on this laptop.
- New brainstorm files need adding to the `NOTES` list in index.html to show on the site.

## Decisions
- Folder layout: direction/progress/chat at root, notes in `brainstorm/`, catalog in `data/`, later `story/` for drafts.
- Time estimates = from the day he starts to working at useful scale, assuming power + workshop, ~1230s Europe, prerequisites done. "From zero" on the site adds the longest prerequisite chain.
- Time buckets: <2 mo, 3–11 mo, 1–2 yr, 3–5 yr, 6–10 yr, 11–20 yr, 20+ yr, colored green → red.

## NOT verified
- Prior-art details and 1230s-world facts are from memory, not web-checked.
- All time estimates are story estimates, not research numbers.
- Site not yet checked on Tim's real iPhone (checked in phone-view WebKit at 393px).

## Rejected / parked
- ~~Heresy/Church risk markers in pure-knowledge.md~~: removed 2026-10-27, Tim said it's getting ahead of ourselves.
