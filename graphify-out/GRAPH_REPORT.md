# Graph Report - claude code  (2026-09-23)

## Corpus Check
- Corpus is ~9,046 words - fits in a single context window. You may not need a graph.

## Summary
- 99 nodes · 117 edges · 24 communities (10 shown, 14 thin omitted)
- Extraction: 85% EXTRACTED · 14% INFERRED · 1% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Focus Flow UI Components
- Suhail Pricing & Launch Setup
- Suhail Growth Metrics & Costing
- Focus Flow State & Formatting
- Focus Flow Timer Controls
- Focus Flow Timer Rendering
- Suhail Brand & Trust Signals
- Suhail Content Shoot Routine
- Suhail Legal Registration
- Suhail Equipment & Storage
- Focus Flow Task Rendering
- Suhail Customer Retention
- Suhail Booking Policies
- Suhail Booking Log & WhatsApp
- Suhail Launch Announcements
- Obsidian Welcome Note
- Suhail Partnerships
- Suhail Installation Rehearsal
- Suhail Rental Terms
- Suhail Bank Account
- Suhail Social Handles
- Suhail Transport System
- Suhail VAT Exemption

## God Nodes (most connected - your core abstractions)
1. `complete()` - 10 edges
2. `renderTimer()` - 9 edges
3. `Timer Card (focus/break modes, dial, controls)` - 8 edges
4. `stop()` - 7 edges
5. `renderTasks()` - 7 edges
6. `setMode()` - 6 edges
7. `قائمة الأسعار الموصى بها (Recommended Price List)` - 6 edges
8. `renderStats()` - 5 edges
9. `Focus Flow App Page (index.html)` - 5 edges
10. `Stats Card (today's sessions, minutes, sparkline, history)` - 5 edges

## Surprising Connections (you probably didn't know these)
- `تأمين مسترد (Refundable Deposit, 100 SAR)` --semantically_similar_to--> `قائمة الأسعار الموصى بها (Recommended Price List)`  [INFERRED] [semantically similar]
  Suhail-Project/سهيل-للجلسات.html → Suhail-Project/نموذج-تسعير-سهيل.html
- `بند الخصوصية (Privacy Statement)` --semantically_similar_to--> `قماش مقاوم للسوائل (Liquid-Resistant Fabric)`  [AMBIGUOUS] [semantically similar]
  Suhail-Project/خطوات-تأسيس-سهيل.html → Suhail-Project/سهيل-للجلسات.html
- `توثيق النشاط (Business Verification)` --semantically_similar_to--> `سُهَيْل (Brand Identity)`  [INFERRED] [semantically similar]
  Suhail-Project/خطوات-تأسيس-سهيل.html → Suhail-Project/سهيل-للجلسات.html
- `عرض التأسيس (Launch Offer — 20% for first 10 bookings)` --semantically_similar_to--> `عرض الإطلاق (Launch Offer — 20% for first 10, swap not discount)`  [INFERRED] [semantically similar]
  Suhail-Project/خطوات-تأسيس-سهيل.html → Suhail-Project/نموذج-تسعير-سهيل.html
- `حساب الإهلاك (Depreciation Fund, 35 SAR/booking)` --semantically_similar_to--> `عزل الإهلاك (Depreciation Isolation, 35 SAR/booking)`  [INFERRED] [semantically similar]
  Suhail-Project/خطوات-تأسيس-سهيل.html → Suhail-Project/نموذج-تسعير-سهيل.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Launch Phase Actions (Suhail Setup Steps)** — suhail_setup_launch_posts, suhail_setup_public_pricing, suhail_setup_launch_offer, suhail_setup_review_first_10 [EXTRACTED 0.90]
- **Growth Engine Components (Flywheel)** — suhail_growth_flywheel, suhail_growth_content_harvesting, suhail_growth_referral_program, suhail_growth_reminder_calendar, suhail_growth_customer_database, suhail_growth_partnerships [EXTRACTED 0.90]
- **Pricing Decision Toolkit** — suhail_pricing_calculator, suhail_pricing_corrections, suhail_pricing_recommended_list, suhail_pricing_ten_rules [EXTRACTED 0.85]
- **Session Tracking / Stats Display Flow** — focus_flow_index_todaysessions, focus_flow_index_todayminutes, focus_flow_index_sparkline, focus_flow_index_history, focus_flow_index_streakbox [INFERRED 0.80]
- **Timer UI Components (mode tabs, dial, controls)** — focus_flow_index_timercard, focus_flow_index_ringprogress, focus_flow_index_timedisplay, focus_flow_index_activetasklabel [EXTRACTED 1.00]

## Communities (24 total, 14 thin omitted)

### Community 0 - "Focus Flow UI Components"
Cohesion: 0.15
Nodes (17): Active Task Label Element, app.js (external script, referenced but not in this chunk), History List Element (#history), Focus Flow App Page (index.html), Ring Progress SVG Element, Sparkline Element (#sparkline, last 7 days), Stats Card (today's sessions, minutes, sparkline, history), Streak Box Element (#streakBox, consecutive-day streak) (+9 more)

### Community 1 - "Suhail Pricing & Launch Setup"
Cohesion: 0.17
Nodes (13): تأجير دفاية غاز فقط (Heater-Only Rental Add-on, 250 SAR), خدمة الجبيل (Jubail Add-on, +150 SAR), الباقات (Small / Family / Family+Hospitality Tiers), مناطق الخدمة (Dammam, Khobar, Jubail), خمس خطوات هذا الأسبوع (This Week's Action Steps), خمسة أخطاء في التسعير السابق (Five Prior Pricing Corrections), عزل الإهلاك (Depreciation Isolation, 35 SAR/booking), عرض الإطلاق (Launch Offer — 20% for first 10, swap not discount) (+5 more)

### Community 2 - "Suhail Growth Metrics & Costing"
Cohesion: 0.18
Nodes (12): خمسة أشياء تهدم المحرك (Five Engine-Killing Mistakes), روتين حصاد المحتوى (Six-Shot Content Harvesting Routine), دولاب النمو (Growth Flywheel, K=1.11), إرسال الصور مجاناً بعد التأمين (Free Edited Photo Delivery), أربعة مقاييس أسبوعية (Four Weekly Metrics), الإحالة المزدوجة (Double Referral Program, 100/100 SAR), نموذج السنة الأولى المالي (Year One Financial Model), سقف تكلفة الاكتساب (CAC Ceiling via LTV, 505 SAR) (+4 more)

### Community 3 - "Focus Flow State & Formatting"
Cohesion: 0.24
Nodes (8): arabicPlural(), dayKey(), DURATIONS, el, formatClock(), LABELS, renderStats(), state

### Community 4 - "Focus Flow Timer Controls"
Cohesion: 0.60
Nodes (6): chime(), complete(), setMode(), skip(), stop(), toast()

### Community 5 - "Focus Flow Timer Rendering"
Cohesion: 0.40
Nodes (6): formatTime(), renderTimer(), reset(), selectedTask(), start(), tick()

### Community 6 - "Suhail Brand & Trust Signals"
Cohesion: 0.40
Nodes (5): سُهَيْل (Brand Identity), قماش مقاوم للسوائل (Liquid-Resistant Fabric), تأمين مسترد (Refundable Deposit, 100 SAR), توثيق النشاط (Business Verification), بند الخصوصية (Privacy Statement)

### Community 7 - "Suhail Content Shoot Routine"
Cohesion: 0.50
Nodes (4): فيديو قبل وبعد (Before/After Video), روتين اللقطات الخمس (Five-Shot Routine), فيديو اختبار السوائل (Liquid Test Video), ثلاث جلسات تجريبية (351 SAR)

### Community 8 - "Suhail Legal Registration"
Cohesion: 0.67
Nodes (3): السجل التجاري (Commercial Registration), وثيقة العمل الحر (Freelance Document), العنوان الوطني (National Address)

### Community 9 - "Suhail Equipment & Storage"
Cohesion: 0.67
Nodes (3): شراء المعدات (Equipment Purchase, 2,849 SAR), رش حماية القماش على شريط السدو, تجهيز غرفة التخزين

## Ambiguous Edges - Review These
- `بند الخصوصية (Privacy Statement)` → `قماش مقاوم للسوائل (Liquid-Resistant Fabric)`  [AMBIGUOUS]
  Suhail-Project/سهيل-للجلسات.html · relation: semantically_similar_to

## Knowledge Gaps
- **30 isolated node(s):** `DURATIONS`, `LABELS`, `state`, `el`, `Obsidian Default Welcome Note` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 47 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `بند الخصوصية (Privacy Statement)` and `قماش مقاوم للسوائل (Liquid-Resistant Fabric)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `قائمة الأسعار الموصى بها (Recommended Price List)` connect `Suhail Pricing & Launch Setup` to `Suhail Brand & Trust Signals`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Timer Card (focus/break modes, dial, controls)` (e.g. with `Streak Box Element (#streakBox, consecutive-day streak)` and `Toast Notification Element (#toast)`) actually correct?**
  _`Timer Card (focus/break modes, dial, controls)` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DURATIONS`, `LABELS`, `state` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._