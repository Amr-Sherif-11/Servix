'use client'

import React from 'react'
import { X, Check, Crown, Zap, ShieldCheck, TrendingUp } from 'lucide-react'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  locale: string
}

export default function PremiumModal({ isOpen, onClose, locale }: PremiumModalProps) {
  if (!isOpen) return null

  const plans = [
    {
      id: 'weekly',
      name: 'الباقة الأسبوعية',
      nameEn: 'Weekly Plan',
      price: '5',
      duration: 'أسبوع',
      durationEn: 'Week',
      features: ['توثيق الحساب', 'ظهور في النتائج الأولى'],
      isPopular: false,
    },
    {
      id: 'monthly',
      name: 'الباقة الشهرية',
      nameEn: 'Monthly Plan',
      price: '15',
      duration: 'شهر',
      durationEn: 'Month',
      features: ['توثيق الحساب', 'ظهور في النتائج الأولى', 'دعم فني سريع'],
      isPopular: true,
    },
    {
      id: 'yearly',
      name: 'الباقة السنوية',
      nameEn: 'الباقة السنوية',
      price: '120',
      duration: 'سنة',
      durationEn: 'Year',
      features: ['توثيق الحساب', 'ظهور في النتائج الأولى', 'دعم فني VIP', 'خصم 30%'],
      isPopular: false,
    }
  ]

  const isAr = locale === 'ar'

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 cursor-default no-scrollbar"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Close Button Container */}
        <div className="sticky top-0 right-0 z-[70] p-4 flex justify-end pointer-events-none">
          <button 
            type="button"
            onClick={onClose}
            title={isAr ? 'إغلاق' : 'Close'}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="pointer-events-auto p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-red-500 hover:text-white rounded-2xl shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 active:scale-90 group"
          >
            <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        <div className="px-8 pb-12 md:px-12 -mt-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl mb-6 shadow-inner">
              <Crown className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
              ترقية إلى <span className="text-amber-600 dark:text-amber-400">Premium</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
              عند الاشتراك في خدمة Premium يتم توثيقك في الموقع وسوف تظهر في الصفوف الاولي في الموقع تبعا لبلدك ومدينتك ومهنتك
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative flex flex-col p-6 rounded-[2rem] border-2 transition-all duration-300 ${
                  plan.isPopular 
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 scale-105 shadow-xl shadow-amber-500/10' 
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-amber-200 dark:hover:border-amber-900/50'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 right-1/2 translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                    الأكثر مبيعاً
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-amber-600 dark:text-amber-400">${plan.price}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-bold">/ {plan.duration}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                    plan.isPopular
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'
                  }`}
                >
                  اشترك الآن
                </button>
              </div>
            ))}
          </div>

          {/* Benefits Footer */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 text-blue-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm text-gray-900 dark:text-white">توثيق رسمي</h4>
                <p className="text-xs text-gray-500">شارة زرقاء لحسابك</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm text-gray-900 dark:text-white">أولوية الظهور</h4>
                <p className="text-xs text-gray-500">كن دائماً في المقدمة</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0 text-orange-600">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm text-gray-900 dark:text-white">عملاء أكثر</h4>
                <p className="text-xs text-gray-500">زيادة فرص العمل</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
