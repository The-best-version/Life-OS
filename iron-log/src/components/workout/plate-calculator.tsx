"use client";

import { Calculator, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { platesPerSide, PLATES_KG } from "@/lib/insights";
import { cn, formatNumber } from "@/lib/utils";

/**
 * IWF plate colours, worn down to the oxidized palette rather than the
 * vibrant competition set — the one place in the app a colour key is
 * referential (what is actually stamped on a gym plate) rather than
 * decorative, so it earns the exception to "one accent."
 */
const PLATE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  25: { bg: "bg-[#C0392B]/15", text: "text-[#7A2015]", border: "border-[#C0392B]/55" },
  20: { bg: "bg-steel/15", text: "text-steel", border: "border-steel/40" },
  15: { bg: "bg-[#D4A017]/20", text: "text-[#7A5A0A]", border: "border-[#D4A017]/55" },
  10: { bg: "bg-success/15", text: "text-success", border: "border-success/40" },
  5: { bg: "bg-surface", text: "text-fg", border: "border-line-strong" },
  2.5: { bg: "bg-fg", text: "text-surface", border: "border-fg" },
  1.25: { bg: "bg-fg-2", text: "text-surface", border: "border-fg-2" },
};

interface PlateCalculatorProps {
  initialWeight?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PlateCalculator({ initialWeight = 60, isOpen, onClose }: PlateCalculatorProps) {
  const [totalWeight, setTotalWeight] = useState<string>(String(initialWeight));
  const [barWeight, setBarWeight] = useState<number>(20);

  const numericWeight = parseFloat(totalWeight) || 0;
  const load = useMemo(() => {
    return platesPerSide(numericWeight, barWeight, PLATES_KG);
  }, [numericWeight, barWeight]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-line-strong bg-surface-2 p-5 shadow-lift">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/12 text-accent-glow">
              <Calculator className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-fg">حاسبة صفائح البار الأولمبي</h3>
              <p className="text-[11px] text-fg-3">كم كيلو تحط بكل جهة</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-fg-3 transition-colors hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-fg-3">الوزن الإجمالي المطلوب (كجم)</label>
            <Input
              type="number"
              inputMode="decimal"
              step="2.5"
              value={totalWeight}
              onChange={(e) => setTotalWeight(e.target.value)}
              className="mt-1 text-center text-lg font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-fg-3">وزن البار</label>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {[20, 15].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setBarWeight(w)}
                  className={cn(
                    "rounded-lg border py-2 text-xs font-bold transition-colors",
                    barWeight === w
                      ? "border-accent/50 bg-accent/15 text-accent-glow"
                      : "border-line-strong bg-surface text-fg-3 hover:text-fg",
                  )}
                >
                  {w} كجم
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 text-center">
          <div className="mb-2 text-[11px] font-bold text-fg-3">لكل جهة من البار (جهة واحدة):</div>

          {load && load.perSide.length > 0 ? (
            <div className="my-3 flex flex-wrap items-center justify-center gap-1.5">
              {load.perSide.map((plate: number, idx: number) => {
                const style = PLATE_COLORS[plate] ?? {
                  bg: "bg-surface-3",
                  text: "text-fg",
                  border: "border-line-strong",
                };
                return (
                  <div
                    key={`${plate}-${idx}`}
                    className={cn(
                      "flex min-w-[50px] flex-col items-center justify-center rounded-lg border px-3 py-2",
                      style.bg,
                      style.border,
                      style.text,
                    )}
                  >
                    <span className="num text-sm font-semibold">{plate}</span>
                    <span className="text-[9px] opacity-80">كجم</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-xs font-medium text-fg-3">
              {numericWeight <= barWeight
                ? "الوزن مساوٍ لوزن البار فقط، بدون أي صفائح"
                : "أدخل وزناً لحساب الصفائح"}
            </div>
          )}

          {load ? (
            <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-[11px] text-fg-3">
              <span>الوزن الفعلي المتحقق:</span>
              <span className="num font-bold text-fg">{formatNumber(load.loadedKg)} كجم</span>
            </div>
          ) : null}
        </div>

        <Button onClick={onClose} variant="secondary" className="w-full">
          تم
        </Button>
      </div>
    </div>
  );
}
