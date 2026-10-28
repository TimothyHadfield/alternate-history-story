# Simulation: North America, 1243–1282

*Story estimates from a month-by-month model. Not research results, and not a decision: this is one possible run of variation ① ([the plan](variations/north-america.md)).*
**See the charts:** Home → ① North America → **Simulation** (or open `#north-america/sim` on the site).

Tim (2026-10-28): "estimate each month by optimal plan and change each number acordingly based on what's happened since the last month and then review the whole timeline (maybe 40 years) and then repeat until you feel like a full review doesn't really change anything."

## Headline results (1282, 40 years in)
| | 1250 | 1260 | 1270 | 1282 |
|---|---|---|---|---|
| Settlers | 7,900 | ~25,000 | 56,600 | **118,000** |
| Allied Native nations | 19,300 | ~110,000 | 167,000 | **195,000** |
| Settler life expectancy | 48 | 50 | 50 | **50** (Europe then ~25) |
| Allied life expectancy | 40 | 42 | 43 | **43** (before contact ~31) |
| Iron made (t/yr) | 33 | ~360 | 810 | **1,590** (13.5 kg per person) |
| Literacy (settlers) | 32% | 44% | 54% | **63%** |

- **All 47 tech projects finish.** Highlights: sawmill and vaccine calf farm 1243, bloomery iron 1245, paper and printing 1248–49, the Forks of the Ohio town 1251, blast furnace 1252, hospital 1255, coke furnace 1258, telegraph 1264, Newcomen pump 1267, textile mill 1266, Watt-type engine 1273.
- **Population growth:** about 2.6% a year from births, plus 2.5% from immigrants. The settler birth rate is ~42 per 1,000 against a death rate of ~16.
- **Native towns:** almost every town has joined by ~1265; about 12,000 people stay outside.
- **Work:** farming and herding take about 25% of settler work time. By 1282 about 40% is **free time and extra goods**, because mills, machines and better tools take over work.

## How it works
- **Every month:**
  - Everyone ages, by single year and sex, in four settler groups: the fleet, born here, immigrants, and Native people living in towns. Each of the 20 Native peoples is split into joined and not joined.
  - Deaths are applied by cause. The baseline is medieval Europe at ~25 years; each fix (wells, soap, vaccine, germ rules, the hospital) cuts a specific cause.
  - Births follow natural-fertility rates, at about 7 children per woman for settlers.
  - Work time is shared out in priority order:
    1. crews for projects already under way
    2. health, schools and government
    3. farming (seasonal), herds and home work
    4. firewood and repairs
    5. trades and the workshops already built
    6. houses, then clearing land
    7. new projects, boats, and training apprentices
- **Tech dates are not typed in.** A project starts when the ones before it are done and the experience and market are big enough. It finishes once it has design time (the hero or engineers), a trained crew, labor, materials and time for trials.
- **Whole-timeline review:** after each full 40-year run, the plan is rewritten so apprentices are trained ahead of when the last run needed them. It stopped at **pass 4**, when key numbers moved under 1% and no tech date moved more than 2 months.
  - Pass 1: 95k settlers in 1282.
  - Pass 2: 116k, with 31 tech dates moved by up to 3 years.
  - Pass 3: 118k.
  - Pass 4: 118k.
- **Claude's reviews:** each full run was also read against real history, and what looked wrong was fixed. There were six rounds:
  1. **Growth and techs were too fast** (172k settlers, germ theory in 1246, a coke furnace in 1251). Recruits now grow 4% a year; joining needs translators and longer talks; techs wait for experience, market size and trials.
  2. **Steam engines never finished,** because nobody could teach machinists. Millwrights and engineers now train them.
  3. **Clearing ran away** (850,000 ha) and too much time showed as crafts. Herd, hay, home, firewood, fence and spinning work were added.
  4. **No Native town joined before 1258,** because the gift waited for 800 cattle. Towns now join on vaccine, iron and seed, and animals follow as herds allow.
  5. **Cattle stayed scarce.** Pigs now forage in woodlots, and immigrant ships carry breeding stock.
  6. **Work was too light.** Sundays and feast days off, winter threshing, roads and drains, and trades such as shoemakers were added.

## Assumptions to know
- **The fleet:** ~3,000 people land in the Hudson in April 1243. Recruits come every June after that: 300 in 1244, then ~700 a year growing 4% a year, with extra waves after the 1258 Samalas famine and in 1266–68. Arrivals are limited by ships, food in store and a 15% absorption rule.
- **Native nations join by agreement.** Each one needs:
  - contact, which spreads ~100–140 km a year
  - a few years of trust
  - one translator per ~800 people
  - a gift of vaccine, iron tools and seed
- **After contact, each town gets one wave of childhood diseases.** Measles and similar have no vaccine here; quarantine and nursing keep the wave far below what followed 1492. This is the **biggest health risk** in the story, and the model is optimistic about it.
- **The plan keeps two years of grain in store.** The 1258 cold summer is survived on that store.
- **Climate events:** a poor harvest in 1258–59 (Samalas) and a slightly worse Ohio climate from 1276.

## What's most uncertain
- **The joining speed** is the most optimistic part. Almost every town joins within ~20 years of contact, with no wars and no splits.
- **Tech dates** assume a hero who really knows how each thing works and devotes ~60% of his time to design.
- **Life expectancy stops near 50.** That's about where the world was before antibiotics (the US was at 47 in 1900). Pushing past it needs antibiotics or much cleaner cities.
- **"Free time & extra goods"** is time the plan doesn't need. In the story it could go to more immigration, exports, a bigger army of teachers, or simply a better life.

## Files
- Model: `sim/north-america.mjs` (run with `node sim/north-america.mjs`)
- Output: `data/sim/north-america.json`
- Plan: `docs/sim-plan.md`
