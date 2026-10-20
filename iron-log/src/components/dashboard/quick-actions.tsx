"use client";

import { ChevronLeft, Dumbbell, History, Settings, Utensils } from "lucide-react";
import Link from "next/link";

interface QuickActionItem {
  title: string;
  subtitle: string;
  href: string;
  icon: typeof Dumbbell;
  gradient: string;
  iconBg: string;
  badge?: string;
}

export function QuickActions() {
  const actions: QuickActionItem[] = [
    {
      title: "تسجيل تمرين",
      subtitle: "سجّل أوزانك وعداتك اليوم",
      href: "/workout",
      icon: Dumbbell,
      gradient: "border-primary/30 hover:border-primary/60 hover:shadow-[0_8px_30px_rgba(255,45,85,0.22)]",
      iconBg: "bg-primary text-white shadow-[0_0_15px_rgba(255,45,85,0.5)]",
      badge: "الحصة اليومية",
    },
    {
      title: "التغذية والماكروز",
      subtitle: "نطاق البروتين واحتياج السعرات",
      href: "/nutrition",
      icon: Utensils,
      gradient: "border-emerald-500/25 hover:border-emerald-500/50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)]",
      iconBg: "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]",
    },
    {
      title: "سجل الحصص",
      subtitle: "أرشيف تمارينك وتاريخها",
      href: "/history",
      icon: History,
      gradient: "border-cyan-500/25 hover:border-cyan-500/50 hover:shadow-[0_8px_30px_rgba(0,229,255,0.2)]",
      iconBg: "bg-cyan-500 text-white shadow-[0_0_15px_rgba(0,229,255,0.5)]",
    },
    {
      title: "إدارة التمارين",
      subtitle: "تعديل الأجهزة والنسخ الاحتياطي",
      href: "/settings",
      icon: Settings,
      gradient: "border-violet-500/25 hover:border-violet-500/50 hover:shadow-[0_8px_30px_rgba(139,92,246,0.2)]",
      iconBg: "bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <Link
            key={act.href}
            href={act.href}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-gradient-to-br from-[#121827]/95 via-[#0D121F]/90 to-[#090C14]/95 p-4 backdrop-blur-xl shadow-lg transition-all duration-250 hover:-translate-y-1.5 ${act.gradient}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`flex size-10 items-center justify-center rounded-xl shadow-md transition-transform duration-250 group-hover:scale-110 ${act.iconBg}`}
              >
                <Icon className="size-5" />
              </span>
              {act.badge ? (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary border border-primary/30">
                  {act.badge}
                </span>
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full bg-white/[0.04] text-muted-foreground transition-all duration-250 group-hover:-translate-x-1 group-hover:text-foreground group-hover:bg-white/[0.08]">
                  <ChevronLeft className="size-3.5" />
                </span>
              )}
            </div>

            <div className="mt-3.5">
              <h4 className="text-[13.5px] font-black text-foreground group-hover:text-primary transition-colors">
                {act.title}
              </h4>
              <p className="mt-0.5 text-[11px] font-medium leading-tight text-muted-foreground line-clamp-1">
                {act.subtitle}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
