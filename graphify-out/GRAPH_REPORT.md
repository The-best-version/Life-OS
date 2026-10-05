# Graph Report - claude code  (2026-10-05)

## Corpus Check
- Large corpus: 127 files · ~711,701 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1216 nodes · 3069 edges · 85 communities (52 shown, 33 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.85)
- Token cost: 13,362 input · 1,029 output

## Graph Freshness
- Built from commit: `679ad200`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Life OS Core & Seed Data
- Iron Log Screens
- Report Agent & Charts
- Sync Server & Prayer Times
- Iron Log Metrics & Logger
- Life OS Modules
- Life OS Shapes & Goals
- Iron Log Theme & Layout
- Iron Log Repository
- Iron Log Dashboard
- Iron Log Storage & Seed
- Life OS University
- Iron Log Store & Types
- Focus Flow App
- Life OS Habits & Career
- Iron Log Seed Catalog
- Iron Log Body Metrics
- Life OS Agenda & Day Sheet
- Life OS Countdown & Quarters
- Life OS Build Pipeline
- Iron Log Chart Kit
- TypeScript Config
- Life OS Discipline & Lease
- Shadcn Components Config
- Package Manifest
- Iron Log App Shell
- Suhail Brand & Pricing
- Focus Flow Page
- Iron Log Rest Timer
- Iron Log UI Primitives
- Life OS UI Primitives
- Iron Log Standalone Routes
- Prayer Times Solar Maths
- Runtime Dependencies
- Life OS Career Plan
- Suhail Growth Engine
- Iron Log Legacy Import
- Build Dependencies
- Iron Log Bundled Runtime
- Life OS Boot & Storage
- Iron Log Stat Tiles
- Life OS Library & Reading
- Unified Hub Page
- React & Icon Vendors
- Standalone Navigation Shim
- Iron Log Settings Page
- Standalone TS Config
- Build Scripts
- Life OS Sky & Motion
- STEP Study Arena
- Tailwind Config
- Suhail Guarantees
- Next Config
- PostCSS Config
- Link Shim
- Not Found Page
- Life OS Service Worker
- Suhail Commercial Terms
- Suhail Equipment
- Hub paintSky & skyAt
- Iron Log Standalone Entry
- Tailwind Merge Utils
- Progress Dashboard
- Life OS Cue Image
- STEP Arena Sync
- Suhail محرك-نمو-سهيل
- Suhail سهيل-للجلسات
- Suhail خطوات-تأسيس-سهيل
- Suhail خطوات-تأسيس-سهيل
- ATS_Resume_Ziyad_2026
- Businessman مرحبًا
- Hub dayKey
- icon-512
- Iron Log index
- Suhail محرك-نمو-سهيل
- Suhail خطوات-تأسيس-سهيل
- Suhail خطوات-تأسيس-سهيل
- Suhail خطوات-تأسيس-سهيل
- Suhail خطوات-تأسيس-سهيل
- Suhail خطوات-تأسيس-سهيل
- Suhail خطوات-تأسيس-سهيل
- Hub setTile
- Icon 192px

## God Nodes (most connected - your core abstractions)
1. `cn()` - 57 edges
2. `react` - 48 edges
3. `dayKey()` - 42 edges
4. `useIronLog()` - 38 edges
5. `UniModule()` - 32 edges
6. `uid()` - 32 edges
7. `formatNumber()` - 31 edges
8. `toIsoDate()` - 28 edges
9. `lucide-react` - 28 edges
10. `round()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `بند الخصوصية (Privacy Statement)` --semantically_similar_to--> `قماش مقاوم للسوائل (Liquid-Resistant Fabric)`  [AMBIGUOUS] [semantically similar]
  Suhail-Project/خطوات-تأسيس-سهيل.html → Suhail-Project/سهيل-للجلسات.html
- `تأمين مسترد (Refundable Deposit, 100 SAR)` --semantically_similar_to--> `قائمة الأسعار الموصى بها (Recommended Price List)`  [INFERRED] [semantically similar]
  Suhail-Project/سهيل-للجلسات.html → Suhail-Project/نموذج-تسعير-سهيل.html
- `The Hub (المركز)` --references--> `2027 Life OS`  [EXTRACTED]
  hub.html → CLAUDE.md
- `onStorage()` --calls--> `normalizeDatabase()`  [EXTRACTED]
  iron-log/src/lib/store.tsx → iron-log/src/lib/storage.ts
- `parseOptional()` --calls--> `toFiniteNumber()`  [EXTRACTED]
  iron-log/src/components/workout/exercise-logger.tsx → iron-log/src/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pricing Decision Toolkit** — suhail_pricing_calculator, suhail_pricing_corrections, suhail_pricing_recommended_list, suhail_pricing_ten_rules [EXTRACTED 0.85]
- **DOM Rendering Flow** — react_dom_client, react_reconciler, view_transition_api [EXTRACTED 0.90]
- **Growth Engine Components (Flywheel)** — suhail_growth_flywheel, suhail_growth_content_harvesting, suhail_growth_referral_program, suhail_growth_reminder_calendar, suhail_growth_customer_database, suhail_growth_partnerships [EXTRACTED 0.90]
- **Launch Phase Actions (Suhail Setup Steps)** — suhail_setup_launch_posts, suhail_setup_public_pricing, suhail_setup_launch_offer, suhail_setup_review_first_10 [EXTRACTED 0.90]
- **Iron Log Core Architecture** — iron_log_src_lib_repository, iron_log_src_lib_metrics, iron_log_src_lib_storage [EXTRACTED 0.95]
- **Timer UI Components (mode tabs, dial, controls)** — focus_flow_index_timercard, focus_flow_index_ringprogress, focus_flow_index_timedisplay, focus_flow_index_activetasklabel [EXTRACTED 1.00]
- **React Core Architecture** — react_reconciler, react_hooks, event_system [EXTRACTED 1.00]
- **Data Persistence Flow** — iron_log_standalone_index_al, iron_log_standalone_index_bl, iron_log_standalone_index_cl [EXTRACTED 1.00]
- **Session Tracking / Stats Display Flow** — focus_flow_index_todaysessions, focus_flow_index_todayminutes, focus_flow_index_sparkline, focus_flow_index_history, focus_flow_index_streakbox [INFERRED 0.80]
- **UI Context Providers** — iron_log_standalone_index_e0, iron_log_standalone_index_q0, iron_log_standalone_index_bl [INFERRED 0.80]
- **Life OS Dashboard Data Flow** — hub_state_fetcher, hub_settile, hub_daykey [EXTRACTED 1.00]
- **App Icons** — apple_touch_icon_png, icon_192_png, icon_512_png [EXTRACTED 1.00]

## Communities (85 total, 33 thin omitted)

### Community 0 - "Life OS Core & Seed Data"
Cohesion: 0.02
Nodes (87): ADDED_HABITS, ADDED_TASKS, AGENDA_VIEWS, AM_CORE, AM_MINUTES, AM_ROUTINE, APP_STAGES, AR_MONTHS (+79 more)

### Community 1 - "Iron Log Screens"
Cohesion: 0.15
Nodes (30): MacroKey, COLUMNS, ICONS, BarList(), BarListProps, BarListRow, LandmarkRow(), STATUS_LABEL (+22 more)

### Community 2 - "Report Agent & Charts"
Cohesion: 0.09
Nodes (52): ref_vm, addDays(), ar(), argv, barsRTL(), C, card(), chartGym() (+44 more)

### Community 3 - "Sync Server & Prayer Times"
Cohesion: 0.07
Nodes (49): clockAt(), nextPrayer(), PrayerCard(), armToday(), AUTO, blockMessage(), blockTimers, cors() (+41 more)

### Community 4 - "Iron Log Metrics & Logger"
Cohesion: 0.18
Nodes (34): HealthPanel(), healthPatch(), bodyChange(), bodySeries(), chartableExerciseIds(), currentStreak(), DashboardSummary, estimate1rm() (+26 more)

### Community 5 - "Life OS Modules"
Cohesion: 0.08
Nodes (41): AmStep(), AnalyticsModule(), arCount(), BadHabitCard(), BadHabitFormModal(), bandAt(), bandOf(), bestRun() (+33 more)

### Community 6 - "Life OS Shapes & Goals"
Cohesion: 0.11
Nodes (42): ADDED_GOALS(), appShape(), buildGoals(), careerShape(), CareerWar(), carryOf(), clampGoal(), clampNum() (+34 more)

### Community 7 - "Iron Log Theme & Layout"
Cohesion: 0.09
Nodes (24): iron_log_src_app_globals, metadata, viewport, OPTIONS, ThemeChoiceGroup(), ThemeToggle(), ToastContextValue, ToastProvider() (+16 more)

### Community 8 - "Iron Log Repository"
Cohesion: 0.13
Nodes (26): Iron Log Documentation, addExerciseToDay(), BodyPatch, clearHistory(), deleteSet(), ensureSession(), ExercisePatch, findSessionByDate() (+18 more)

### Community 9 - "Iron Log Dashboard"
Cohesion: 0.19
Nodes (22): DashboardPage(), BodyPanel(), bodyPatch(), ChartShell(), TableColumn, COLUMNS, ConsistencyCard(), ExerciseProgressCard() (+14 more)

### Community 10 - "Iron Log Storage & Seed"
Cohesion: 0.23
Nodes (29): handleSave(), createSeedDatabase(), asArray(), asMuscleGroup(), asNullableNumber(), asPositiveInt(), asString(), asTimestamp() (+21 more)

### Community 11 - "Life OS University"
Cohesion: 0.12
Nodes (28): absenceCapOf(), attendBand(), CourseCard(), CourseDesk(), courseName(), coursesIn(), courseStanding(), daySections() (+20 more)

### Community 12 - "Iron Log Store & Types"
Cohesion: 0.12
Nodes (11): ExerciseLoggerProps, DbIndex, AddExerciseInput, LogSetInput, IronLogActions, Id, IsoDate, MuscleGroup (+3 more)

### Community 13 - "Focus Flow App"
Cohesion: 0.18
Nodes (22): arabicPlural(), chime(), complete(), dayKey(), DURATIONS, el, formatClock(), formatTime() (+14 more)

### Community 14 - "Life OS Habits & Career"
Cohesion: 0.12
Nodes (28): amCoreDone(), askedOn(), badHabitShape(), bookForHabit(), BreakerModule(), CareerModule(), careerToday(), dailyStreak() (+20 more)

### Community 15 - "Iron Log Seed Catalog"
Cohesion: 0.12
Nodes (21): ImportOutcome, buildIndex(), CATALOG, DB_VERSION, DEFAULT_SETTINGS, PROGRAM, LoadResult, serializeDatabase() (+13 more)

### Community 16 - "Iron Log Body Metrics"
Cohesion: 0.09
Nodes (21): BODY_FIELD_META, BODY_FIELDS, BodyField, BodyMetric, BodyPoint, ExerciseProgressPoint, HEALTH_FIELD_META, HEALTH_FIELDS (+13 more)

### Community 17 - "Life OS Agenda & Day Sheet"
Cohesion: 0.19
Nodes (23): addDays(), AgendaModule(), alertsOf(), arDate(), byClock(), courseIn(), DaySheet(), daysUntil() (+15 more)

### Community 18 - "Life OS Countdown & Quarters"
Cohesion: 0.11
Nodes (29): BookDesk(), bookShape(), clockLabel(), CountdownCard(), CountdownStrip(), currentQuarter(), daysTo(), DeadlineChip() (+21 more)

### Community 19 - "Life OS Build Pipeline"
Cohesion: 0.13
Nodes (19): modules, REACT_EXPORTS, root, site, src, work, outDir, root (+11 more)

### Community 20 - "Iron Log Chart Kit"
Cohesion: 0.19
Nodes (19): AxisYLabels(), Baseline(), ChartShellProps, GridLines(), LegendKey(), linePath(), makeScale(), niceTicks() (+11 more)

### Community 21 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 22 - "Life OS Discipline & Lease"
Cohesion: 0.15
Nodes (13): coreOf(), disciplineOf(), inReflectWindow(), LifeOS(), moveBefore(), NavOrderEditor(), nudgeInList(), orderedNav() (+5 more)

### Community 23 - "Shadcn Components Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 24 - "Package Manifest"
Cohesion: 0.11
Nodes (17): description, name, private, version, autoprefixer, clsx, postcss, @radix-ui/react-label (+9 more)

### Community 25 - "Iron Log App Shell"
Cohesion: 0.14
Nodes (10): TodayChip(), BottomNav(), ITEMS, Skeleton(), formatWeight(), FULL_DATE, NUMBER_FORMAT, SHORT_DATE (+2 more)

### Community 26 - "Suhail Brand & Pricing"
Cohesion: 0.12
Nodes (18): تأجير دفاية غاز فقط (Heater-Only Rental Add-on, 250 SAR), خدمة الجبيل (Jubail Add-on, +150 SAR), سُهَيْل (Brand Identity), قماش مقاوم للسوائل (Liquid-Resistant Fabric), الباقات (Small / Family / Family+Hospitality Tiers), تأمين مسترد (Refundable Deposit, 100 SAR), مناطق الخدمة (Dammam, Khobar, Jubail), خمس خطوات هذا الأسبوع (This Week's Action Steps) (+10 more)

### Community 27 - "Focus Flow Page"
Cohesion: 0.15
Nodes (17): Active Task Label Element, app.js (external script, referenced but not in this chunk), History List Element (#history), Focus Flow App Page (index.html), Ring Progress SVG Element, Sparkline Element (#sparkline, last 7 days), Stats Card (today's sessions, minutes, sparkline, history), Streak Box Element (#streakBox, consecutive-day streak) (+9 more)

### Community 28 - "Iron Log Rest Timer"
Cohesion: 0.17
Nodes (9): buzz(), chime(), formatClock(), RestSession, RestTimerBar(), RestTimerContext, RestTimerPrefs, RestTimerProvider() (+1 more)

### Community 29 - "Iron Log UI Primitives"
Cohesion: 0.08
Nodes (19): Sparkline(), SparklineProps, COLUMNS, Metric, StatTile(), StatTileProps, StatTone, TONE (+11 more)

### Community 30 - "Life OS UI Primitives"
Cohesion: 0.13
Nodes (15): Checkbox(), CopyBox(), cupWord(), MatrixModule(), PromptCard(), SprintCard(), sprintDone(), sprintOpenDay() (+7 more)

### Community 31 - "Iron Log Standalone Routes"
Cohesion: 0.24
Nodes (11): host, ROUTES, HistoryPage(), BodyScreen(), macroPatch(), WorkoutPage(), AppShell(), proteinBand() (+3 more)

### Community 32 - "Prayer Times Solar Maths"
Cohesion: 0.29
Nodes (13): asrAltitude(), atHour(), BLOCK_ANCHORS, blockTimes(), dCos(), dSin(), dTan(), fixAngle() (+5 more)

### Community 33 - "Runtime Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, class-variance-authority, clsx, lucide-react, next, @radix-ui/react-label, @radix-ui/react-separator, @radix-ui/react-slot (+5 more)

### Community 34 - "Life OS Career Plan"
Cohesion: 0.18
Nodes (18): careerDayNo(), CareerKit(), CareerPlan(), CareerTrack(), careerWeekNo(), ConsistencyCard(), daysBetween(), missionCount() (+10 more)

### Community 35 - "Suhail Growth Engine"
Cohesion: 0.18
Nodes (12): خمسة أشياء تهدم المحرك (Five Engine-Killing Mistakes), روتين حصاد المحتوى (Six-Shot Content Harvesting Routine), دولاب النمو (Growth Flywheel, K=1.11), إرسال الصور مجاناً بعد التأمين (Free Edited Photo Delivery), أربعة مقاييس أسبوعية (Four Weekly Metrics), الإحالة المزدوجة (Double Referral Program, 100/100 SAR), نموذج السنة الأولى المالي (Year One Financial Model), سقف تكلفة الاكتساب (CAC Ceiling via LTV, 505 SAR) (+4 more)

### Community 36 - "Iron Log Legacy Import"
Cohesion: 0.15
Nodes (24): SettingsPage(), handleExport(), handleImport(), handleSavePreferences(), useArmedAction(), arm(), disarm(), handleAdd() (+16 more)

### Community 37 - "Build Dependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, esbuild, postcss, tailwindcss, tailwindcss-animate, @types/node, @types/react (+2 more)

### Community 38 - "Iron Log Bundled Runtime"
Cohesion: 0.28
Nodes (9): aL (Database Loader), bL (IronLogProvider), Cl (Database Initializer), Kd (useHash Hook), LL (App Layout), Os (Link Component), P0 (RestTimer UI), q0 (RestTimerProvider) (+1 more)

### Community 39 - "Life OS Boot & Storage"
Cohesion: 0.33
Nodes (9): api(), boot(), cacheShell(), DataHealth(), keepStorage(), pullDisk(), served(), syncLocal() (+1 more)

### Community 40 - "Iron Log Stat Tiles"
Cohesion: 0.16
Nodes (17): Toast, ToastContext, ToastTone, useToast(), AddExerciseForm(), ExerciseLogger(), ExercisePanel(), parseOptional() (+9 more)

### Community 41 - "Life OS Library & Reading"
Cohesion: 0.40
Nodes (6): claimHandover(), dropLock(), readLock(), tabId(), useWriteLease(), writeLock()

### Community 42 - "Unified Hub Page"
Cohesion: 0.29
Nodes (8): 2027 Life OS, Knowledge Graph, Graph Report, The Hub (المركز), Sky Engine, State Fetcher, Iron Log Data, STEP Data

### Community 43 - "React & Icon Vendors"
Cohesion: 0.33
Nodes (7): React Synthetic Event System, React DOM Standalone, Lucide Icons, React DOM Client, React Hooks Implementation, React Reconciler, View Transition Integration

### Community 44 - "Standalone Navigation Shim"
Cohesion: 0.38
Nodes (4): App(), readPathname(), subscribe(), usePathname()

### Community 46 - "Standalone TS Config"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, extends, next/link, next/navigation, ./tsconfig.json

### Community 47 - "Build Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, build:standalone, dev, start, typecheck

### Community 49 - "STEP Study Arena"
Cohesion: 0.40
Nodes (5): AiTutor, STEP Study Arena, askTutor, logAct, MockExam

### Community 50 - "Tailwind Config"
Cohesion: 0.50
Nodes (3): config, tailwindcss, tailwindcss-animate

### Community 51 - "Suhail Guarantees"
Cohesion: 0.50
Nodes (4): فيديو قبل وبعد (Before/After Video), روتين اللقطات الخمس (Five-Shot Routine), فيديو اختبار السوائل (Liquid Test Video), ثلاث جلسات تجريبية (351 SAR)

### Community 57 - "Suhail Commercial Terms"
Cohesion: 0.67
Nodes (3): السجل التجاري (Commercial Registration), وثيقة العمل الحر (Freelance Document), العنوان الوطني (National Address)

### Community 58 - "Suhail Equipment"
Cohesion: 0.67
Nodes (3): شراء المعدات (Equipment Purchase, 2,849 SAR), رش حماية القماش على شريط السدو, تجهيز غرفة التخزين

## Ambiguous Edges - Review These
- `قماش مقاوم للسوائل (Liquid-Resistant Fabric)` → `بند الخصوصية (Privacy Statement)`  [AMBIGUOUS]
  Suhail-Project/سهيل-للجلسات.html · relation: semantically_similar_to

## Knowledge Gaps
- **323 isolated node(s):** `MacroKey`, `BarListProps`, `BarListRow`, `PageHeroProps`, `EmptyStateProps` (+318 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 413 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `قماش مقاوم للسوائل (Liquid-Resistant Fabric)` and `بند الخصوصية (Privacy Statement)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `react` connect `Iron Log Screens` to `Life OS Core & Seed Data`, `Iron Log Theme & Layout`, `Iron Log Stat Tiles`, `Iron Log Dashboard`, `Standalone Navigation Shim`, `Iron Log Seed Catalog`, `Iron Log Chart Kit`, `Link Shim`, `Package Manifest`, `Iron Log App Shell`, `Iron Log Rest Timer`, `Iron Log UI Primitives`, `Iron Log Standalone Routes`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Iron Log UI Primitives` to `Life OS Core & Seed Data`, `Iron Log Screens`, `Iron Log Theme & Layout`, `Iron Log Stat Tiles`, `Iron Log Dashboard`, `Iron Log Chart Kit`, `Package Manifest`, `Iron Log App Shell`, `Iron Log Rest Timer`, `Iron Log Standalone Routes`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `esbuild` connect `Life OS Build Pipeline` to `Package Manifest`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `MacroKey`, `BarListProps`, `BarListRow` to the rest of the system?**
  _323 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Life OS Core & Seed Data` be split into smaller, more focused modules?**
  _Cohesion score 0.015873015873015872 - nodes in this community are weakly interconnected._
- **Should `Report Agent & Charts` be split into smaller, more focused modules?**
  _Cohesion score 0.0936408106219427 - nodes in this community are weakly interconnected._