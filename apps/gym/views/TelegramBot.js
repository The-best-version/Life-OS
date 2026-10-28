import { h, T, Card, Btn, Field, Pill, ar } from "/gym/lib/ui.js";

const { useState } = React;

export function TelegramBotView({ gym }) {
  const [copiedCmd, setCopiedCmd] = useState("");

  const copyText = (text) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedCmd(text);
      setTimeout(() => setCopiedCmd(""), 2000);
    } catch (e) {}
  };

  const COMMANDS = [
    { cmd: "صدر 60x10", desc: "تسجيل تمرين مع الوزن والتكرار مباشرة" },
    { cmd: "جيم 55 دقيقة", desc: "تسجيل حصة كاملة في النادي باحتساب الوقت" },
    { cmd: "وزن 79.5", desc: "تسجيل وزن اليوم وتحديث خط الاتجاه" },
    { cmd: "خصر 85 صدر 104", desc: "تسجيل قياسات الشريط دفعة واحدة" },
    { cmd: "وش تمريني اليوم؟", desc: "معرفة جدول وتمرين اليوم القادم" },
    { cmd: "حالة", desc: "ملخص أسبوعك وعدد الحصص والوزن الحالي" },
  ];

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 18 } },
    // بطاقة الترحيب والزر السريع
    h(
      Card,
      {
        style: {
          background: "linear-gradient(135deg, rgba(36, 161, 222, 0.16) 0%, rgba(255, 87, 34, 0.1) 100%)",
          borderColor: "rgba(36, 161, 222, 0.35)",
          padding: 22,
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          },
        },
        h(
          "div",
          null,
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: 8 } },
            h("span", { style: { fontSize: 24 } }, "🤖"),
            h("div", { style: { fontSize: 20, fontWeight: 900 } }, "بوت تيليجرام — مِحْوَر 2030 (@Mehwar_2030_bot)")
          ),
          h(
            "div",
            { style: { fontSize: 13, color: T.muted, marginTop: 4, lineHeight: 1.6 } },
            "مساعدك الرياضي الشخصي: تسجل أوزانك وتمارينك من شات تيليجرام في ثوانٍ وأنت في الصالة بدون فتح الموقع."
          )
        ),
        h(
          "div",
          { style: { display: "flex", gap: 10, flexWrap: "wrap" } },
          h(
            "a",
            {
              href: "https://t.me/Mehwar_2030_bot",
              target: "_blank",
              rel: "noopener noreferrer",
              style: {
                background: "linear-gradient(135deg, #24A1DE, #0088CC)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 13.5,
                padding: "11px 20px",
                borderRadius: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 16px rgba(36, 161, 222, 0.35)",
              },
            },
            "💬 فتح البوت في تيليجرام"
          )
        )
      )
    ),

    // حالة الاتصال والربط
    h(
      Card,
      null,
      h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 12 } }, "⚡ حالة البوت والمزامنة"),
      h(
        "div",
        { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 } },
        h(
          "div",
          { style: { padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } },
          h("div", { style: { fontSize: 11, fontWeight: 700, color: T.faint } }, "توكن البوت (Bot Token)"),
          h("div", { style: { fontSize: 13, fontWeight: 800, color: T.primary, marginTop: 4, fontFamily: "monospace" } }, "8887621954:AAGo... ✓ مفعّل")
        ),
        h(
          "div",
          { style: { padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } },
          h("div", { style: { fontSize: 11, fontWeight: 700, color: T.faint } }, "محادثتك في تيليجرام (Chat ID)"),
          h("div", { style: { fontSize: 13, fontWeight: 800, color: "#4ade80", marginTop: 4, fontFamily: "monospace" } }, "1388092197 ✓ مرتبط وموثق")
        ),
        h(
          "div",
          { style: { padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } },
          h("div", { style: { fontSize: 11, fontWeight: 700, color: T.faint } }, "الخادم المحلي (Sync Server)"),
          h("div", { style: { fontSize: 13, fontWeight: 800, color: T.sky, marginTop: 4, fontFamily: "monospace" } }, "http://127.0.0.1:47615 ✓ متصل")
        ),
        h(
          "div",
          { style: { padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } },
          h("div", { style: { fontSize: 11, fontWeight: 700, color: T.faint } }, "التذكير اليومي التلقائي"),
          h("div", { style: { fontSize: 13, fontWeight: 800, color: T.accent, marginTop: 4 } }, "الساعة 8:30 مساءً ⏰")
        )
      )
    ),

    // أوامر المحادثة السريعة
    h(
      Card,
      null,
      h(
        "div",
        { style: { marginBottom: 12 } },
        h("div", { style: { fontSize: 17, fontWeight: 700 } }, "💬 أوامر سريعة يمكنك إرسالها للبوت"),
        h("div", { style: { fontSize: 12, color: T.muted, marginTop: 2 } }, "اضغط على أي أمر لنسخه وتجربته في المحادثة مباشرة")
      ),
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 8 } },
        COMMANDS.map((c) =>
          h(
            "div",
            {
              key: c.cmd,
              onClick: () => copyText(c.cmd),
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                transition: "border-color 0.2s",
              },
            },
            h(
              "div",
              null,
              h(
                "span",
                {
                  style: {
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: T.ctaLift,
                    background: "rgba(255,87,34,0.1)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontFamily: "monospace",
                  },
                },
                c.cmd
              ),
              h("div", { style: { fontSize: 12, color: T.muted, marginTop: 4 } }, c.desc)
            ),
            h(
              "button",
              {
                style: {
                  background: "none",
                  border: "none",
                  color: copiedCmd === c.cmd ? T.primary : T.faint,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                },
              },
              copiedCmd === c.cmd ? "✓ تم النسخ" : "نسخ 📋"
            )
          )
        )
      )
    ),

    // تشغيل البوت في الخلفية
    h(
      Card,
      null,
      h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 8 } }, "🚀 تشغيل البوت في الخلفية"),
      h(
        "p",
        { style: { fontSize: 13, color: T.muted, lineHeight: 1.7, marginBottom: 12 } },
        "البوت يعمل عبر السيرفر على جهازك. لتشغيله في الخلفية تلقائياً دون إبقاء نافذة طرفية مفتوحة، يتوفر ملف تشغيل سريع:"
      ),
      h(
        "div",
        {
          style: {
            background: "#080C1D",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "monospace",
            color: T.sky,
            border: "1px solid rgba(255,255,255,0.08)",
            direction: "ltr",
          },
        },
        "services/launchers/run-gym-bot.vbs"
      )
    )
  );
}
