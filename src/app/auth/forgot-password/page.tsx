'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Sparkles, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/appStore'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { locale } = useAppStore()
  const isRTL = ['ar', 'fa', 'ur'].includes(locale)
  const supabase = createClient()

  const t = {
    en: {
      title: 'Forgot Password',
      subtitle: 'Enter your email to receive a reset code',
      subtitle2: 'Enter the 6-digit code sent to your email',
      email: 'Email address',
      emailPlaceholder: 'hello@example.com',
      sendCode: 'Send Code',
      verifyCode: 'Verify Code',
      backToLogin: 'Back to Sign In',
      otpCode: '6-Digit Code',
      otpPlaceholder: '000000',
    },
    ar: {
      title: 'نسيت كلمة المرور',
      subtitle: 'أدخل بريدك الإلكتروني لتلقي كود إعادة التعيين',
      subtitle2: 'أدخل الكود المكون من 6 أرقام المرسل لبريدك',
      email: 'البريد الإلكتروني',
      emailPlaceholder: 'hello@example.com',
      sendCode: 'إرسال الكود',
      verifyCode: 'التحقق من الكود',
      backToLogin: 'العودة إلى تسجيل الدخول',
      otpCode: 'الكود (6 أرقام)',
      otpPlaceholder: '000000',
    },
    fr: {
      title: 'Mot de passe oublié',
      subtitle: 'Entrez votre e-mail pour recevoir un code',
      subtitle2: 'Entrez le code à 6 chiffres envoyé à votre e-mail',
      email: 'Adresse e-mail',
      emailPlaceholder: 'hello@example.com',
      sendCode: 'Envoyer le code',
      verifyCode: 'Vérifier le code',
      backToLogin: 'Retour à la connexion',
      otpCode: 'Code à 6 chiffres',
      otpPlaceholder: '000000',
    }
  }

  const txt = (t as any)[locale] || t.en

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSendCode = async (data: FormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email)
      if (resetError) {
        setError(resetError.message)
        return
      }
      setEmail(data.email)
      setStep(2)
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const onVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      setError(locale === 'ar' ? 'يجب أن يتكون الكود من 6 أرقام' : 'Code must be 6 digits')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      })
      if (verifyError) {
        setError(verifyError.message)
        return
      }
      // Successfully verified code, user is logged in automatically.
      // Redirect to the reset password page.
      router.push('/auth/reset-password')
    } catch (err: any) {
      setError(err?.message || 'Invalid code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen gradient-bg flex flex-col items-center justify-center px-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">{txt.title}</h1>
          <p className="text-white/70">{step === 1 ? txt.subtitle : txt.subtitle2}</p>
        </div>

        <div className="glass rounded-3xl p-6 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSubmit(onSendCode)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{txt.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    {...register('email')}
                    type="email"
                    className="input-field pl-10"
                    placeholder={txt.emailPlaceholder}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full text-center flex justify-center">
                {isLoading ? (
                  <span className="animate-spin w-5 h-5 border-2 border-white/50 border-t-white rounded-full" />
                ) : (
                  txt.sendCode
                )}
              </button>

              <div className="text-center pt-2">
                <Link 
                  href="/auth/login" 
                  className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-semibold transition-all duration-300"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  {txt.backToLogin}
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={onVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{txt.otpCode}</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="input-field pl-10 tracking-widest font-bold text-center"
                    placeholder={txt.otpPlaceholder}
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading || otp.length < 6} className="btn-primary w-full text-center flex justify-center">
                {isLoading ? (
                  <span className="animate-spin w-5 h-5 border-2 border-white/50 border-t-white rounded-full" />
                ) : (
                  txt.verifyCode
                )}
              </button>

              <div className="text-center pt-2 flex justify-between">
                <button 
                  type="button"
                  onClick={() => { setStep(1); setError(null); }}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 font-semibold transition-all duration-300"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  {txt.backToLogin} {/* Using same text but could be 'Back' */}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
