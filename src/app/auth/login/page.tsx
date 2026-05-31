'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Mail, Lock, Sparkles, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client';
import { signIn } from 'next-auth/react';
import { useAppStore } from '@/store/appStore'
import type { Locale } from '@/i18n/config'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
type FormData = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'user'
  const { locale } = useAppStore()
  const isRTL = ['ar', 'fa', 'ur'].includes(locale)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const supabase = createClient()

  const t = {
    en: {
      title: `Welcome back`,
      subtitle: `Sign in to your account`,
      email: `Email address`,
      password: `Password`,
      forgot: `Forgot password?`,
      signIn: `Sign In`,
      noAccount: `Don't have an account?`,
      register: `Register`,
      orWith: `Or continue with`,
      facebook: `Continue with Facebook`,
    },
    ar: {
      title: `مرحبًا بعودتك`,
      subtitle: `سجّل دخولك إلى حسابك`,
      email: `البريد الإلكتروني`,
      password: `كلمة المرور`,
      forgot: `نسيت كلمة المرور؟`,
      signIn: `تسجيل الدخول`,
      noAccount: `ليس لديك حساب؟`,
      register: `إنشاء حساب`,
      orWith: `أو المتابعة بواسطة`,
      facebook: `المتابعة عبر فيسبوك`,
    },
    fr: {
      title: `Bon retour`,
      subtitle: `Connectez-vous à votre compte`,
      email: `Adresse e-mail`,
      password: `Mot de passe`,
      forgot: `Mot de passe oublié?`,
      signIn: `Se connecter`,
      noAccount: `Pas de compte?`,
      register: `S'inscrire`,
      orWith: `Ou continuer avec`,
      facebook: `Continuer avec Facebook`,
    },
    es: {
      title: `Bienvenido de nuevo`,
      subtitle: `Inicia sesión en tu cuenta`,
      email: `Dirección de correo electrónico`,
      password: `Contraseña`,
      forgot: `¿Has olvidado tu contraseña?`,
      signIn: `Iniciar sesión`,
      noAccount: `¿No tienes una cuenta?`,
      register: `Registro`,
      orWith: `O continuar con`,
      facebook: `Continuar con Facebook`,
    },
    de: {
      title: `Willkommen zurück`,
      subtitle: `Melden Sie sich bei Ihrem Konto an`,
      email: `E-Mail-Adresse`,
      password: `Passwort`,
      forgot: `Passwort vergessen?`,
      signIn: `Anmelden`,
      noAccount: `Sie haben noch kein Konto?`,
      register: `Registrieren`,
      orWith: `Oder fahren Sie fort mit`,
      facebook: `Weiter mit Facebook`,
    },
    tr: {
      title: `tekrar hoşgeldiniz`,
      subtitle: `Hesabınızda oturum açın`,
      email: `E-posta adresi`,
      password: `Şifre`,
      forgot: `Parolanızı mı unuttunuz?`,
      signIn: `Oturum aç`,
      noAccount: `Hesabınız yok mu?`,
      register: `Kayıt olmak`,
      orWith: `Veya ile devam edin`,
      facebook: `Facebook'la devam et`,
    },
    fa: {
      title: `خوش آمدید`,
      subtitle: `وارد حساب کاربری خود شوید`,
      email: `آدرس ایمیل`,
      password: `رمز عبور`,
      forgot: `رمز عبور را فراموش کرده اید؟`,
      signIn: `وارد شوید`,
      noAccount: `حساب کاربری ندارید؟`,
      register: `ثبت نام کنید`,
      orWith: `یا ادامه دهید`,
      facebook: `با فیس بوک ادامه دهید`,
    },
    ur: {
      title: `دوبارہ خوش آمدید`,
      subtitle: `اپنے اکاؤنٹ میں سائن ان کریں۔`,
      email: `ای میل ایڈریس`,
      password: `پاس ورڈ`,
      forgot: `پاس ورڈ بھول گئے؟`,
      signIn: `سائن ان کریں۔`,
      noAccount: `اکاؤنٹ نہیں ہے؟`,
      register: `رجسٹر کریں۔`,
      orWith: `یا جاری رکھیں`,
      facebook: `فیس بک کے ساتھ جاری رکھیں`,
    },
    hi: {
      title: `वापसी पर स्वागत है`,
      subtitle: `अपने खाते में साइन इन करें`,
      email: `मेल पता`,
      password: `पासवर्ड`,
      forgot: `पासवर्ड भूल गए?`,
      signIn: `दाखिल करना`,
      noAccount: `कोई खाता नहीं है?`,
      register: `पंजीकरण करवाना`,
      orWith: `या जारी रखें`,
      facebook: `फेसबुक के साथ जारी रखें`,
    },
    bn: {
      title: `আবার স্বাগতম`,
      subtitle: `আপনার অ্যাকাউন্টে সাইন ইন করুন`,
      email: `ইমেইল ঠিকানা`,
      password: `পাসওয়ার্ড`,
      forgot: `পাসওয়ার্ড ভুলে গেছেন?`,
      signIn: `সাইন ইন করুন`,
      noAccount: `একটি অ্যাকাউন্ট নেই?`,
      register: `নিবন্ধন করুন`,
      orWith: `অথবা চালিয়ে যান`,
      facebook: `ফেসবুকের সাথে চালিয়ে যান`,
    },
    pt: {
      title: `bem vindo de volta`,
      subtitle: `Faça login na sua conta`,
      email: `Endereço de email`,
      password: `Senha`,
      forgot: `Esqueceu sua senha?`,
      signIn: `Entrar`,
      noAccount: `Não tem uma conta?`,
      register: `Cadastre-se`,
      orWith: `Ou continue com`,
      facebook: `Continuar com o Facebook`,
    },
    ru: {
      title: `Добро пожаловать`,
      subtitle: `Войдите в свою учетную запись`,
      email: `Адрес электронной почты`,
      password: `Пароль`,
      forgot: `Забыли пароль?`,
      signIn: `Войти`,
      noAccount: `У вас нет учетной записи?`,
      register: `Зарегистрироваться`,
      orWith: `Или продолжить с`,
      facebook: `Продолжить через Facebook`,
    },
    zh: {
      title: `欢迎回来`,
      subtitle: `登录您的帐户`,
      email: `电子邮件`,
      password: `密码`,
      forgot: `忘记密码？`,
      signIn: `登入`,
      noAccount: `没有帐户？`,
      register: `登记`,
      orWith: `或者继续`,
      facebook: `继续使用 Facebook`,
    },
    ja: {
      title: `おかえり`,
      subtitle: `アカウントにサインインする`,
      email: `電子メールアドレス`,
      password: `パスワード`,
      forgot: `パスワードをお忘れですか？`,
      signIn: `サインイン`,
      noAccount: `アカウントをお持ちでない場合は、`,
      register: `登録する`,
      orWith: `または続行してください`,
      facebook: `Facebookを続ける`,
    },
    ko: {
      title: `돌아온 것을 환영합니다`,
      subtitle: `귀하의 계정에 로그인하세요`,
      email: `이메일 주소`,
      password: `비밀번호`,
      forgot: `비밀번호를 잊으셨나요?`,
      signIn: `로그인`,
      noAccount: `계정이 없나요?`,
      register: `등록하다`,
      orWith: `아니면 계속해서`,
      facebook: `페이스북으로 계속하기`,
    },
    id: {
      title: `Selamat Datang kembali`,
      subtitle: `Masuk ke akun Anda`,
      email: `Alamat email`,
      password: `Kata sandi`,
      forgot: `Lupa kata sandi?`,
      signIn: `Masuk`,
      noAccount: `Belum punya akun?`,
      register: `Daftar`,
      orWith: `Atau lanjutkan dengan`,
      facebook: `Lanjutkan dengan Facebook`,
    },
    ms: {
      title: `Selamat kembali`,
      subtitle: `Log masuk ke akaun anda`,
      email: `Alamat e-mel`,
      password: `Kata laluan`,
      forgot: `Lupa kata laluan?`,
      signIn: `Log Masuk`,
      noAccount: `Tiada akaun?`,
      register: `Daftar`,
      orWith: `Atau teruskan dengan`,
      facebook: `Teruskan dengan Facebook`,
    },
    it: {
      title: `Bentornato`,
      subtitle: `Accedi al tuo account`,
      email: `Indirizzo e-mail`,
      password: `Password`,
      forgot: `Ha dimenticato la password?`,
      signIn: `Registrazione`,
      noAccount: `Non hai un account?`,
      register: `Registro`,
      orWith: `Oppure continua con`,
      facebook: `Continua con Facebook`,
    },
    nl: {
      title: `Welkom terug`,
      subtitle: `Meld u aan bij uw account`,
      email: `E-mailadres`,
      password: `Wachtwoord`,
      forgot: `Wachtwoord vergeten?`,
      signIn: `Inloggen`,
      noAccount: `Heeft u geen account?`,
      register: `Register`,
      orWith: `Of ga verder met`,
      facebook: `Ga verder met Facebook`,
    },
    pl: {
      title: `Witamy z powrotem`,
      subtitle: `Zaloguj się na swoje konto`,
      email: `Adres e-mail`,
      password: `Hasło`,
      forgot: `Zapomniałeś hasła?`,
      signIn: `Zalogować się`,
      noAccount: `Nie masz konta?`,
      register: `Rejestr`,
      orWith: `Lub kontynuuj`,
      facebook: `Kontynuuj na Facebooku`,
    },
    sv: {
      title: `Välkommen tillbaka`,
      subtitle: `Logga in på ditt konto`,
      email: `E-postadress`,
      password: `Lösenord`,
      forgot: `Glömt lösenordet?`,
      signIn: `Logga in`,
      noAccount: `Har du inget konto?`,
      register: `Register`,
      orWith: `Eller fortsätt med`,
      facebook: `Fortsätt med Facebook`,
    },
    da: {
      title: `Velkommen tilbage`,
      subtitle: `Log ind på din konto`,
      email: `E-mailadresse`,
      password: `Adgangskode`,
      forgot: `Glemt adgangskode?`,
      signIn: `Log ind`,
      noAccount: `Har du ikke en konto?`,
      register: `Register`,
      orWith: `Eller fortsæt med`,
      facebook: `Fortsæt med Facebook`,
    },
    no: {
      title: `Velkommen tilbake`,
      subtitle: `Logg på kontoen din`,
      email: `E-postadresse`,
      password: `Passord`,
      forgot: `Glemt passord?`,
      signIn: `Logg på`,
      noAccount: `Har du ikke en konto?`,
      register: `Register`,
      orWith: `Eller fortsett med`,
      facebook: `Fortsett med Facebook`,
    },
    fi: {
      title: `Tervetuloa takaisin`,
      subtitle: `Kirjaudu tilillesi`,
      email: `Sähköpostiosoite`,
      password: `Salasana`,
      forgot: `Unohditko salasanan?`,
      signIn: `Kirjaudu sisään`,
      noAccount: `Eikö sinulla ole tiliä?`,
      register: `Rekisteröidy`,
      orWith: `Tai jatka eteenpäin`,
      facebook: `Jatka Facebookissa`,
    },
    cs: {
      title: `Vítejte zpět`,
      subtitle: `Přihlaste se ke svému účtu`,
      email: `E-mailová adresa`,
      password: `Heslo`,
      forgot: `Zapomněli jste heslo?`,
      signIn: `Přihlaste se`,
      noAccount: `Nemáte účet?`,
      register: `Rejstřík`,
      orWith: `Nebo pokračujte`,
      facebook: `Pokračujte na Facebooku`,
    },
    ro: {
      title: `Bine ai revenit`,
      subtitle: `Conectați-vă la contul dvs`,
      email: `Adresa de e-mail`,
      password: `Parolă`,
      forgot: `Aţi uitat parola?`,
      signIn: `Conectare`,
      noAccount: `Nu ai un cont?`,
      register: `Registru`,
      orWith: `Sau continua cu`,
      facebook: `Continuați cu Facebook`,
    },
    hu: {
      title: `Isten hozott`,
      subtitle: `Jelentkezzen be fiókjába`,
      email: `E-mail cím`,
      password: `Jelszó`,
      forgot: `Elfelejtetted a jelszavad?`,
      signIn: `Jelentkezzen be`,
      noAccount: `Nincs fiókod?`,
      register: `Nyilvántartás`,
      orWith: `Vagy folytassa ezzel`,
      facebook: `Folytatás a Facebookon`,
    },
    el: {
      title: `Καλώς ήρθες πίσω`,
      subtitle: `Συνδεθείτε στον λογαριασμό σας`,
      email: `Διεύθυνση ηλεκτρονικού ταχυδρομείου`,
      password: `Σύνθημα`,
      forgot: `Ξεχάσατε τον κωδικό πρόσβασης;`,
      signIn: `Είσοδος`,
      noAccount: `Δεν έχετε λογαριασμό;`,
      register: `Μητρώο`,
      orWith: `Ή συνεχίστε με`,
      facebook: `Συνεχίστε με το Facebook`,
    },
    th: {
      title: `ยินดีต้อนรับกลับมา`,
      subtitle: `ลงชื่อเข้าใช้บัญชีของคุณ`,
      email: `ที่อยู่อีเมล`,
      password: `รหัสผ่าน`,
      forgot: `ลืมรหัสผ่าน?`,
      signIn: `เข้าสู่ระบบ`,
      noAccount: `ยังไม่มีบัญชี?`,
      register: `ลงทะเบียน`,
      orWith: `หรือต่อด้วย`,
      facebook: `ต่อด้วยเฟสบุ๊ค`,
    },
    vi: {
      title: `Chào mừng trở lại`,
      subtitle: `Đăng nhập vào tài khoản của bạn`,
      email: `Địa chỉ email`,
      password: `Mật khẩu`,
      forgot: `Quên mật khẩu?`,
      signIn: `Đăng nhập`,
      noAccount: `Bạn chưa có tài khoản?`,
      register: `Đăng ký`,
      orWith: `Hoặc tiếp tục với`,
      facebook: `Tiếp tục với Facebook`,
    },
    uk: {
      title: `Ласкаво просимо назад`,
      subtitle: `Увійдіть у свій обліковий запис`,
      email: `Адреса електронної пошти`,
      password: `Пароль`,
      forgot: `Забули пароль?`,
      signIn: `Увійти`,
      noAccount: `Немає облікового запису?`,
      register: `зареєструватися`,
      orWith: `Або продовжити`,
      facebook: `Продовжуйте з Facebook`,
    },
  }
  const txt = (t as any)[locale] || t.en

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setAuthError(locale === 'ar' ? 'الحساب غير موجود أو كلمة المرور خاطئة' : 'Account not found or invalid password')
      } else {
        setAuthError(error.message)
      }
      return
    }
    router.push(`/${locale}/home`)
    router.refresh()
  }

  const handleFacebook = async () => {
    // await signIn('facebook', { callbackUrl: `${window.location.origin}/${locale}/home` });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin + '/auth/callback?next=/' + locale + '/home'
      }
    })
    if (error) {
      setAuthError(error.message)
    }
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
          <div className="w-28 h-28 mx-auto mb-6">
            <Image src="/logo.png" alt="Servix Logo" width={112} height={112} className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(129,140,248,0.4)]" priority />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">{txt.title}</h1>
          <p className="text-white/70">{txt.subtitle}</p>
        </div>

        {/* Form card */}
        <div className="glass rounded-3xl p-6 shadow-2xl">
          {authError && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{txt.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  {...register('email')}
                  type="email"
                  className="input-field pl-10"
                  placeholder="hello@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{txt.password}</label>
                <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-medium">{txt.forgot}</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
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
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? <span className="animate-spin w-5 h-5 border-2 border-white/50 border-t-white rounded-full" /> : txt.signIn}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-sm text-gray-400">{txt.orWith}</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Facebook */}
          <button onClick={handleFacebook} className="btn-secondary w-full">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {txt.facebook}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            {txt.noAccount}{' '}
            <Link href={`/auth/register?role=${role}`} className="text-brand-600 hover:text-brand-700 font-semibold">
              {txt.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
