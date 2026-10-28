# Plan: the North America simulation (variation ①)

Tim (2026-10-28): "go ahead and do one variation now, maybe the america one. Make a plan on how you're going to go through each step and then continue. Maybe the best step is to just estimate each month by optimal plan and change each number acordingly based on what's happened since the last month and then review the whole timeline (maybe 40 years) and then repeat until you feel like a full review doesn't really change anything. I don't really care about your meathod though. Just take each step carefully and output me something that is your best."

Earlier (same day): graphs of "population measurements with seperations of groups of people/professions", "each resource production/quantity, life expectancy, leading causes of death ... in respect to time"; "estimate specific times when we develope technologies which would dictate professions"; "when you change your mind on something like a date ... work backwards and adjust".

## What it is
A month-by-month model of variation ① from **January 1243** (the fleet at sea) to **December 1282** (40 years, 480 months), following the plan in [brainstorm/variations/north-america.md](../brainstorm/variations/north-america.md) as well as it can be followed. Everything is a **story estimate**, labelled as such on the site.

## Method
1. **Inner loop, every month** (`sim/north-america.mjs`):
   1. Events: landing, immigrant ships (each June), Native towns joining, harvests, climate events.
   2. People: deaths by age, sex and cause; births; aging every January. Single-year ages, 0–99, both sexes, per group.
   3. Labor: everyone's work time, split by priority:
      - health, schools and government
      - farming (seasonal: planting, tending, harvest)
      - firewood, houses
      - running the workshops and mills already built
      - clearing land
      - tech projects in plan order
      - boats and trade
   4. Production and stocks: grain, livestock, iron, salt, lumber and the rest.
   5. Record everything.
2. **Tech dates are not typed in. They come out of the model.** Each project needs:
   - the projects before it
   - the hero's or engineers' design time
   - a skilled crew
   - labor, materials and a minimum build time

   It finishes when all of those have been met.
3. **Outer loop, the whole-timeline review** (Tim's "repeat until a full review doesn't change anything"):
   - Pass *k* runs all 40 years with plan *k*.
   - The review then rewrites the plan with foresight. Apprentices are trained ahead of when pass *k* showed they were needed. Land is cleared ahead of need. Immigration is matched to the food and houses actually available.
   - Pass *k+1* runs again. Stop when key outputs move less than 1% between passes.
4. **My own review passes** on top: compare each run against real analogues and fix wrong assumptions. The analogues:
   - colonial New England's births, deaths and farm output
   - Saugus ironworks (1646, 16 years after Massachusetts Bay was founded)
   - colonial iron use per person
   - Native population estimates

   Every change is logged in the pass log with its reason.

## Groups
- **Settlers:**
  - fleet founders (Hungarian, Tuscan, Dalmatian, Cuman, Rus'/Polish)
  - born here
  - later immigrants
  - Native people living in settler towns
- **Allied Native nations,** joined by agreement:
  - Iroquoian
  - Algonquian
  - Ohio Valley (Monongahela, Fort Ancient, Whittlesey)
  - Mississippian
  - Great Lakes and prairie peoples

  The populations come from [data/regions/north-america.json](../data/regions/north-america.json). A town joins after contact, a trust period, enough translators and a gift package (iron tools, breeding animals, seed and vaccine).

## Outputs (graphs, each over time)
- Population: the federation by group, and the settlers by origin
- Births, deaths and immigrants per year
- Work: share of settler work time in 7 kinds of job
- Life expectancy at birth and infant deaths (settlers vs. allied)
- Deaths by cause per 1,000 people (8 causes)
- Food: grain produced vs. needed, and months of grain in store
- Livestock
- Iron and steel
- Small multiples: salt, lumber, coal, charcoal, copper, paper and books, water and steam power, houses, cleared land, literacy, ships
- Tech timeline (when each project finished) and the event list
- Pass log (what each review changed)

## Where it shows
In the North America region view, a **"Simulation"** button opens the charts in place of the map. Back returns to the map. The URL is `#north-america/sim`. This is the plainest fit for the existing layout; Tim decides the final look.

## Files
- `sim/north-america.mjs`: the model plus the outer review loop. Run it with `node sim/north-america.mjs`; it writes the output file.
- `data/sim/north-america.json`: the output (yearly series, a few monthly ones, tech dates, events, pass log).
- `brainstorm/sim-north-america.md`: the assumptions, results and pass log, written up for Notes.
- `index.html`: the Simulation view (Chart.js 4.4.1 from cdnjs, using the dataviz skill's palette, checked against the site's colors).

## Verify
- The model checks itself every run:
  - no negative stocks
  - labor never over-spent
  - food per person reported
  - the life table sums correctly
- Site: phone-view at 393 px and at laptop width, with no console errors, no page scroll, and charts visible.

## BUILT 2026-10-28 (commit 9f2c34d)
- **Shipped as planned:**
  - model, output, write-up, and the Simulation view (button in the region header, `#north-america/sim`)
  - 8 chip sections: People, Work, Health, Food, Goods, Techs, How it was made, Table
  - Chart.js loaded on demand
- **Where the plan was wrong:**
  - **Work categories:** 8 (7 jobs plus "Free time & extra goods"), not 7.
  - **Self-checks:** the model doesn't run explicit checks (stocks ≥ 0, labor never over-spent, life table). These are enforced in the code paths, not asserted.
  - **The six review rounds found real flaws:**
    - growth and techs too fast
    - no machinist teachers
    - runaway clearing
    - joining blocked by the cattle gift
    - scarce cattle
    - work too light

  They're logged in `REVIEWS`, and on the site under "How it was made".
- **Converged:** pass 4 (95k → 116k → 118k → 118k settlers in 1282).
- **Verified:** phone-view (Chrome engine), 2026-10-28.
  - At 393 px: all 8 sections; no page scroll, no overflow.
  - At 1440×900: 4 sections.
  - Back from the sim returns to the map. Live at 9f2c34d.
