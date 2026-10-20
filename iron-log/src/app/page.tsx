"use client";

import {
  Activity,
  Award,
  CalendarCheck,
  Dumbbell,
  Grid,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { CoachInsight } from "@/components/dashboard/coach-insight";
import { ConsistencyCard } from "@/components/dashboard/consistency-card";
import { ExerciseProgressCard } from "@/components/dashboard/exercise-progress-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { MuscleSplitCard } from "@/components/dashboard/muscle-split-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecordsCard } from "@/components/dashboard/records-card";
import { StallCard } from "@/components/dashboard/stall-card";
import { StudioHero } from "@/components/dashboard/studio-hero";
import { VolumeLandmarksCard } from "@/components/dashboard/volume-landmarks-card";
import { VolumeTrendCard } from "@/components/dashboard/volume-trend-card";
import { dashboardSummary } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import { cn } from "@/lib/utils";

type TabId = "overview" | "lifts" | "muscles" | "consistency" | "all";

interface TabItem {
  id: TabId;
  label: string;
  icon: typeof Sparkles;
  badge?: string;
}

export default function DashboardPage() {
  const { db, index } = useIronLog();
  const summary = useMemo(() => dashboardSummary(db, index), [db, index]);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const tabs: TabItem[] = [
    { id: "overview", label: "نظرة شاملة", icon: Sparkles },
    {
      id: "lifts",
      label: "الأوزان والتقدم",
      icon: TrendingUp,
      badge: summary.stalled.length > 0 ? "تنبيه" : undefined,
    },
    { id: "muscles", label: "الجرعة والعضلات", icon: Dumbbell },
    { id: "consistency", label: "الالتزام", icon: CalendarCheck },
    { id: "all", label: "عرض الكل", icon: Grid },
  ];

  return (
    <div className="space-y-4 pb-8 pt-2">
      {/* 1. Hero Command Center */}
      <StudioHero summary={summary} />

      {/* 2. Quick Actions Bar */}
      <QuickActions />

      {/* 3. Intelligent Coach Insight */}
      <CoachInsight summary={summary} />

      {/* 4. Core KPI Numbers */}
      <KpiGrid />

      {/* 5. Smart Category Tab Bar */}
      <div className="sticky top-[60px] z-10 -mx-1 overflow-x-auto px-1 py-1.5 backdrop-blur-2xl">
        <nav
          className="flex min-w-max items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#0A0E18]/90 p-1.5 shadow-2xl backdrop-blur-2xl"
          aria-label="أقسام الداشبورد"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-black transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-primary to-[#C2002E] text-white shadow-[0_0_18px_rgba(255,42,85,0.45)]"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <Icon className={cn("size-4", isActive ? "text-white" : "text-slate-400")} />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-black",
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30",
                    )}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 6. Dynamic Tab Content Panels */}
      {activeTab === "overview" && (
        <div className="space-y-4 animate-fade-in">
          <div className="gap-4 lg:grid lg:grid-cols-2 lg:items-start">
            <div className="space-y-4">
              <SectionHeader
                icon={TrendingUp}
                title="تطور الحجم الأسبوعي"
                subtitle="مجموع الأوزان المرفوعة في آخر 14 حصة"
              />
              <VolumeTrendCard />

              <SectionHeader
                icon={CalendarCheck}
                title="الالتزام التدريبي"
                subtitle="أيام الحضور الأسبوعية مقابل الهدف"
              />
              <ConsistencyCard />
            </div>

            <div className="space-y-4">
              <SectionHeader
                icon={Activity}
                title="الجرعة الأسبوعية لكل عضلة"
                subtitle="مقارنة المجموعات بالنطاق الفعال (MEV / MAV / MRV)"
              />
              <VolumeLandmarksCard />

              <SectionHeader
                icon={Award}
                title="أحدث الأرقام القياسية"
                subtitle="الأوزان الجديدة المحققة مؤخراً"
              />
              <RecordsCard />
            </div>
          </div>
        </div>
      )}

      {activeTab === "lifts" && (
        <div className="space-y-4 animate-fade-in">
          <SectionHeader
            icon={TrendingUp}
            title="منحنى تقدم التمارين وقوة 1RM"
            subtitle="اختر التمرين لمشاهدة تطور الأوزان والتكرارات عبر الجلسات"
          />
          <ExerciseProgressCard />

          <div className="gap-4 lg:grid lg:grid-cols-2 lg:items-start">
            <div className="space-y-3">
              <SectionHeader
                icon={Award}
                title="الأرقام القياسية الشخصية (PRs)"
                subtitle="كل رقم قياسي جديد يعكس زيادة في الحمل التدريبي"
              />
              <RecordsCard />
            </div>

            <div className="space-y-3">
              <SectionHeader
                icon={Layers}
                title="رادار التمارين الواقفة"
                subtitle="تمارين لم يرتفع وزنها التقديري منذ 3 حصص أو أكثر"
              />
              <StallCard />
            </div>
          </div>
        </div>
      )}

      {activeTab === "muscles" && (
        <div className="space-y-4 animate-fade-in">
          <div className="gap-4 lg:grid lg:grid-cols-2 lg:items-start">
            <div className="space-y-3">
              <SectionHeader
                icon={Dumbbell}
                title="الجرعة الأسبوعية لكل عضلة"
                subtitle="تحليل المجموعات الفعلية مقابل النطاقات العلمية للتضخيم"
              />
              <VolumeLandmarksCard />
            </div>

            <div className="space-y-3">
              <SectionHeader
                icon={Layers}
                title="توزيع الحجم بين العضلات"
                subtitle="نسبة الجهد الموزع على العضلات في آخر 28 يوماً"
              />
              <MuscleSplitCard />
            </div>
          </div>
        </div>
      )}

      {activeTab === "consistency" && (
        <div className="space-y-4 animate-fade-in">
          <div className="gap-4 lg:grid lg:grid-cols-2 lg:items-start">
            <div className="space-y-3">
              <SectionHeader
                icon={CalendarCheck}
                title="الالتزام بالأسبوع"
                subtitle="تتبع الحضور الأسبوعي للوصول للهدف بانتظام"
              />
              <ConsistencyCard />
            </div>

            <div className="space-y-3">
              <SectionHeader
                icon={TrendingUp}
                title="مسار الحجم الكلي"
                subtitle="مراقبة الزيادة التدريجية للحمل الإجمالي"
              />
              <VolumeTrendCard />
            </div>
          </div>
        </div>
      )}

      {activeTab === "all" && (
        <div className="space-y-5 animate-fade-in">
          <div className="gap-4 lg:grid lg:grid-cols-2 lg:items-start">
            <div className="space-y-4">
              <SectionHeader icon={TrendingUp} title="الحمل والتقدم" subtitle="منحنيات الحجم وتطور الأوزان" />
              <VolumeTrendCard />
              <ExerciseProgressCard />

              <SectionHeader icon={CalendarCheck} title="الالتزام والتوزيع" subtitle="معدل الحضور والتوزيع العضلي" />
              <ConsistencyCard />
              <MuscleSplitCard />
            </div>

            <div className="space-y-4">
              <SectionHeader icon={Activity} title="الجرعة الأسبوعية" subtitle="مجموعات كل عضلة مقابل السقف" />
              <VolumeLandmarksCard />

              <SectionHeader icon={Layers} title="التشخيص ورادار الثبات" subtitle="تمارين بحاجة لتغيير الخطة" />
              <StallCard />

              <SectionHeader icon={Award} title="الإنجازات والأرقام" subtitle="سجل الأرقام القياسية الشخصية" />
              <RecordsCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2.5 pt-3 pb-1">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25 shadow-[0_0_10px_rgba(255,42,85,0.25)]">
        <Icon className="size-4" />
      </span>
      <div>
        <h3 className="text-[14px] font-black text-white leading-tight">
          {title}
        </h3>
        <p className="text-[11.5px] font-medium text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}
