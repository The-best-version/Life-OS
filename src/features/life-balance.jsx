import React, { useMemo } from 'react';
import { T, Card } from "../components/life-shared.jsx";
import { Target, HeartPulse, Briefcase, Wallet, Users, Sparkles } from 'lucide-react';
import { PILLARS, goalPct } from "../state/life-state.mjs";

const PILLAR_ICONS = {
  faith: Target,
  health: HeartPulse,
  career: Briefcase,
  money: Wallet,
  social: Users,
  self: Sparkles,
};

const PILLAR_COLORS = {
  faith: '#34d399',
  health: '#f87171',
  career: '#60a5fa',
  money: '#fbbf24',
  social: '#a78bfa',
  self: '#f472b6',
};

export default function LifeBalance({ state }) {
  const scores = useMemo(() => {
    const result = {};
    
    // نتأكد إن PILLARS مصفوفة قبل ما نلف عليها
    const pillarsList = Array.isArray(PILLARS) ? PILLARS : [];

    pillarsList.forEach((pillar) => {
      const pillarGoals = (state?.goals || []).filter(g => g && g.pillar === pillar.id);
      
      if (pillarGoals.length > 0) {
        const totalPct = pillarGoals.reduce((sum, goal) => {
          let pct = 0;
          try {
            // نحاول نحسب النسبة، ولو صار خطأ نرجع صفر
            if (typeof goalPct === 'function') {
              // بعض الدوال تحتاج الـ state، فنجرب نمرره
              pct = goalPct(goal, state) || 0; 
            } else if (goal.pct !== undefined) {
              pct = goal.pct;
            }
          } catch (e) {
            // لو انهارت الدالة، نطنش ونكمل
            pct = 0;
          }
          return sum + pct;
        }, 0);
        
        result[pillar.id] = Math.round(totalPct / pillarGoals.length);
      } else {
        result[pillar.id] = 0;
      }
    });

    return result;
  }, [state?.goals, state]);

  const size = 300;
  const center = size / 2;
  const maxRadius = 110;
  const pillarsList = Array.isArray(PILLARS) ? PILLARS : [];
  const numPoints = pillarsList.length || 6; 

  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const dataPoints = pillarsList.map((p, i) => getPoint(i, scores[p.id] || 0));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const sortedPillars = [...pillarsList].sort((a, b) => (scores[a.id] || 0) - (scores[b.id] || 0));
  const weakestPillar = sortedPillars[0] || { id: 'none', label: 'لا يوجد' };
  const strongestPillar = sortedPillars[sortedPillars.length - 1] || { id: 'none', label: 'لا يوجد' };

  return (
    <Card className="p-6 sm:p-8 relative overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
      <div className="flex flex-col md:flex-row items-center gap-10">
        
        <div className="relative shrink-0">
          <svg width={size} height={size} className="overflow-visible">
            {[0.25, 0.5, 0.75, 1].map((scale) => (
              <polygon
                key={scale}
                points={pillarsList.map((_, i) => {
                  const p = getPoint(i, scale * 100);
                  return `${p.x},${p.y}`;
                }).join(' ')}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            ))}

            {pillarsList.map((_, i) => {
              const p = getPoint(i, 100);
              return (
                <line
                  key={i}
                  x1={center} y1={center}
                  x2={p.x} y2={p.y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
              );
            })}

            <polygon
              points={dataPolygon}
              fill="rgba(249, 115, 22, 0.25)"
              stroke="#f97316"
              strokeWidth="2.5"
              className="transition-all duration-1000 ease-out"
            />

            {dataPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#f97316" strokeWidth="2" />
            ))}

            {pillarsList.map((p, i) => {
              const outer = getPoint(i, 125);
              const score = scores[p.id] || 0;
              return (
                <g key={p.id}>
                  <text
                    x={outer.x} y={outer.y + 4}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="12"
                    fontWeight="bold"
                    className="drop-shadow-md"
                  >
                    {p.label}
                  </text>
                  <text
                    x={outer.x} y={outer.y + 18}
                    textAnchor="middle"
                    fill={PILLAR_COLORS[p.id] || '#fff'}
                    fontSize="11"
                    fontWeight="900"
                  >
                    {score}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
              <Target size={18} />
            </span>
            توازنك الحياتي
          </h3>
          
          <p className="text-sm leading-relaxed text-white/60">
            هذا المخطط يعكس حالة الأركان الستة بناءً على نسبة إنجازك في أهدافك. التوازن لا يعني 100% في كل ركن، بل يعني ألا يطغى ركن على حساب آخر.
          </p>

          <div className="space-y-3 mt-4">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3.5">
              <p className="text-[12px] font-bold text-green-400 mb-1 flex items-center gap-1.5">
                <span>🌟</span> أقوى ركن لديك: {strongestPillar.label}
              </p>
              <p className="text-[11.5px] text-white/70">
                أنت تبلي بلاءً حسناً هنا بنسبة <span className="font-bold text-green-400">{scores[strongestPillar.id] || 0}%</span>. استمر في هذا الأداء.
              </p>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3.5">
              <p className="text-[12px] font-bold text-red-400 mb-1 flex items-center gap-1.5">
                <span>⚠️</span> انتبه لهذا الركن: {weakestPillar.label}
              </p>
              <p className="text-[11.5px] text-white/70">
                نسبة إنجازك هنا <span className="font-bold text-red-400">{scores[weakestPillar.id] || 0}%</span>، وهي الأقل. خصص وقتاً لهذا الجانب عشان ترجع لتوازنك.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}