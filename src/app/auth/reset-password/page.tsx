'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Sparkles, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/appStore'

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

function calculatePasswordStrength(pass: string): number {
  if (!pass) return 0
  let score = 0
  if (pass.length >= 6) score += 1
  if (/\d/.test(pass)) score += 1
  if (/[A-Z]/.test(pass)) score += 1
  if (/[^A-Za-z0-9]/.test(pass) || pass.length >= 10) score += 1
  return score
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const { locale } = useAppStore()
  const isRTL = ['ar', 'fa', 'ur'].includes(locale)

  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const t = {
    en: {
      title: 'Reset Password',
      subtitle: 'Enter your new password below',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      resetBtn: 'Reset Password',
      successMsg: 'Password updated successfully! Redirecting to login...',
      errorInvalidSession: 'Invalid or expired session. Please request a new password reset link.',
      requestNewLink: 'Request New Link',
      passwordsMismatch: 'Passwords do not match',
      passwordMinLength: 'Password must be at least 6 characters',
      strength: 'Password Strength',
      strengthLevel: ['Too Short', 'Weak', 'Fair', 'Good', 'Strong'],
      verifying: 'Verifying session...',
    },
    ar: {
      title: 'إعادة تعيين كلمة المرور',
      subtitle: 'أدخل كلمة المرور الجديدة أدناه',
      newPassword: 'كلمة المرور الجديدة',
      confirmPassword: 'تأكيد كلمة المرور',
      resetBtn: 'إعادة تعيين كلمة المرور',
      successMsg: 'تم تحديث كلمة المرور بنجاح! جاري تحويلك لصفحة تسجيل الدخول...',
      errorInvalidSession: 'الجلسة غير صالحة أو منتهية الصلاحية. يرجى طلب رابط جديد.',
      requestNewLink: 'طلب رابط جديد',
      passwordsMismatch: 'كلمات المرور غير متطابقة',
      passwordMinLength: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل',
      strength: 'قوة كلمة المرور',
      strengthLevel: ['قصيرة جداً', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية'],
      verifying: 'جاري التحقق من الجلسة...',
    },
    fr: {
      title: 'Réinitialiser le mot de passe',
      subtitle: 'Entrez votre nouveau mot de passe ci-dessous',
      newPassword: 'Nouveau mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      resetBtn: 'Réinitialiser le mot de passe',
      successMsg: 'Mot de passe mis à jour avec succès! Redirection...',
      errorInvalidSession: 'Session invalide ou expirée. Veuillez demander un nouveau lien.',
      requestNewLink: 'Demander un nouveau lien',
      passwordsMismatch: 'Les mots de passe ne correspondent pas',
      passwordMinLength: 'Le mot de passe doit comporter au moins 6 caractères',
      strength: 'Force du mot de passe',
      strengthLevel: ['Trop court', 'Faible', 'Moyen', 'Bon', 'Fort'],
      verifying: 'Vérification de la session...',
    }
  }

  const txt = (t as any)[locale] || t.en

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setSessionValid(true)
        } else {
          setSessionValid(false)
        }
      } catch (err) {
        setSessionValid(false)
      } finally {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [supabase])

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const passwordVal = watch('password', '')
  const strength = calculatePasswordStrength(passwordVal)

  const onSubmit = async (data: FormData) => {
    setError(null)
    setSuccess(false)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: data.password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred')
    }
  }

  const getStrengthColor = (lvl: number) => {
    switch (lvl) {
      case 1: return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
      case 2: return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'
      case 3: return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'
      case 4: return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
      default: return 'bg-gray-700'
    }
  }

  const getStrengthTextColor = (lvl: number) => {
    switch (lvl) {
      case 1: return 'text-red-400'
      case 2: return 'text-orange-400'
      case 3: return 'text-yellow-400'
      case 4: return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-4">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
          <p className="text-white/70 text-sm font-semibold">{txt.verifying}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen gradient-bg flex flex-col items-center justify-center px-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">{txt.title}</h1>
          <p className="text-white/70">{txt.subtitle}</p>
        </div>

        {/* Form card */}
        <div className="glass rounded-3xl p-6 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {!sessionValid ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Session Expired</h3>
              <p className="text-gray-300 text-sm">{txt.errorInvalidSession}</p>
              
              <div className="pt-4">
                <Link 
                  href="/auth/forgot-password" 
                  className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-semibold transition-all duration-300"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  {txt.requestNewLink}
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Success</h3>
              <p className="text-gray-300 text-sm">{txt.successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{txt.newPassword}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}

                {/* Password Strength Indicator */}
                {passwordVal && (
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">{txt.strength}:</span>
                      <span className={`font-semibold ${getStrengthTextColor(strength)}`}>
                        {txt.strengthLevel[strength]}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1 mt-1">
                      {[1, 2, 3, 4].map((index) => (
                        <div
                          key={index}
                          className={`h-full rounded-full transition-all duration-300 ${
                            strength >= index ? getStrengthColor(strength) : 'bg-gray-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{txt.confirmPassword}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-center flex justify-center mt-6">
                {isSubmitting ? (
                  <span className="animate-spin w-5 h-5 border-2 border-white/50 border-t-white rounded-full" />
                ) : (
                  txt.resetBtn
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
