import React, { useState } from 'react';

// ==========================================
// ملاحظة: هذي بيانات تجريبية (Mock Data)
// لما تجي تربطها بملفات الـ State حقك (مثل life-state-habits.mjs)
// استبدل هذي الأرقام بالمتغيرات الحقيقية
// ==========================================
const MOCK_DATA = {
  year: 2026,
  streakDays: 45,
  totalPrayers: 1250,
  deepWorkHours: 320,
  booksRead: 12,
  distractionsAvoided: 84,
  totalTasksDone: 450,
};

const LifeWrapped = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // ==========================================
  // 1. منطق الليل والنهار (محاكاة اليوم)
  // ==========================================
  // حالياً نستخدم ساعة الجهاز كاحتياط (من 6 المغرب لـ 5 الفجر = ليل)
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 18 || currentHour < 5; 
  
  // TODO: لما تربط ملف prayer-times.mjs، استخدم هذا السطر بدلاً من اللي فوق:
  // const isNight = prayerTimes.isNight; 
  // أو بناءً على وقت المغرب والفجر من الملف.

  // ==========================================
  // 2. تصميم الشرائح (بناءً على الليل والنهار)
  // ==========================================
  const slides = [
    {
      id: 'intro',
      title: isNight ? `سهرة ${MOCK_DATA.year} مع أثر..` : `سنة ${MOCK_DATA.year} مع أثر..`,
      subtitle: 'خلنا نشوف وش سويت هالسنة!',
      icon: isNight ? '🌙' : '☀️',
      // تدرجات لونية ليلية (غامقة) ونهارية (دافئة)
      gradient: isNight 
        ? 'from-slate-900 via-indigo-950 to-black' 
        : 'from-orange-400 via-rose-500 to-purple-800',
    },
    {
      id: 'habits',
      title: 'الالتزام ما كان سهل..',
      subtitle: `لكنك حافظت على سلسلة إنجاز لمدة ${MOCK_DATA.streakDays} يوم متواصل!`,
      value: MOCK_DATA.streakDays,
      unit: 'يوم',
      gradient: isNight ? 'from-purple-950 to-slate-900' : 'from-amber-600 to-orange-800',
    },
    {
      id: 'prayers',
      title: 'أساس يومك كان..',
      subtitle: 'حافظت على صلواتك وأديت وردك اليومي.',
      value: MOCK_DATA.totalPrayers,
      unit: 'صلاة',
      gradient: isNight ? 'from-emerald-950 to-slate-900' : 'from-emerald-600 to-teal-800',
    },
    {
      id: 'focus',
      title: 'غصت في العمل العميق..',
      subtitle: 'ساعات من التركيز الخالي من المشتتات.',
      value: MOCK_DATA.deepWorkHours,
      unit: 'ساعة',
      gradient: isNight ? 'from-blue-950 to-slate-900' : 'from-blue-600 to-indigo-900',
    },
    {
      id: 'breaker',
      title: 'وحاربت التشتت!',
      subtitle: 'كسرت العادات السيئة وتجاوزت السكرول.',
      value: MOCK_DATA.distractionsAvoided,
      unit: 'مرة',
      gradient: isNight ? 'from-rose-950 to-black' : 'from-rose-700 to-red-900',
    },
  ];

  // ==========================================
  // 3. دوال التنقل
  // ==========================================
  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const current = slides[currentSlide];

  return (
    <div 
      className={`w-full h-screen flex flex-col items-center justify-center p-6 text-white transition-all duration-1000 bg-gradient-to-br ${current.gradient} relative overflow-hidden font-sans`}
    >
      {/* تأثير النجوم في الليل فقط */}
      {isNight && (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
          }}
        ></div>
      )}

      {/* أزرار التنقل (المناطق الشفافة على اليمين واليسار) */}
      <div className="absolute inset-y-0 left-0 w-1/3 cursor-pointer z-10" onClick={prevSlide} title="السابق"></div>
      <div className="absolute inset-y-0 right-0 w-1/3 cursor-pointer z-10" onClick={nextSlide} title="التالي"></div>

      {/* شريط التقدم (مثل الستوري) */}
      <div className="absolute top-6 left-6 right-6 flex gap-2 z-20">
        {slides.map((_, index) => (
          <div 
            key={index} 
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ease-out ${index <= currentSlide ? 'bg-white' : 'bg-white/20'}`}
          />
        ))}
      </div>

      {/* محتوى الشريحة */}
      <div 
        key={current.id} // هذا المفتاح مهم عشان يعيد تشغيل الأنيميشن مع كل شريحة
        className="flex flex-col items-center text-center z-20 animate-fade-in-up w-full px-4"
      >
        <div className="text-6xl mb-6">{current.icon}</div>
        
        <h2 className="text-3xl md:text-4xl font-bold mb-3 drop-shadow-lg leading-snug">
          {current.title}
        </h2>
        
        <p className="text-lg md:text-xl text-white/80 mb-10 max-w-md mx-auto drop-shadow">
          {current.subtitle}
        </p>
        
        {/* عرض الأرقام الضخمة (تظهر فقط في الشرائح اللي فيها أرقام) */}
        {current.value && (
          <div className="text-8xl md:text-9xl font-black text-white drop-shadow-2xl mt-4 animate-scale-in">
            {current.value} 
            <span className="text-2xl md:text-3xl font-medium text-white/70 block mt-4">{current.unit}</span>
          </div>
        )}
      </div>

      {/* زر الإعادة في آخر شريحة */}
      {currentSlide === slides.length - 1 && (
        <button 
          onClick={() => setCurrentSlide(0)} 
          className="mt-12 px-10 py-4 bg-white text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-transform z-20 shadow-2xl flex items-center gap-2"
        >
          إعادة العرض 🔄
        </button>
      )}

      {/* إضافة أنيميشن مخصص داخل المكون عشان يشتغل بدون ما تعدل تايلويند */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.5s ease-out 0.2s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default LifeWrapped;