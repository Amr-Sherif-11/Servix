'use client'
import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Eye, EyeOff, Mail, Lock, User, Phone, Briefcase, 
  DollarSign, AlertCircle, ChevronDown, Globe, MapPin, 
  Sparkles, ArrowRight, ArrowLeft, Check, Award, Search
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { countries, getStatesOfCountry, getCitiesOfState, professions, professionSpecializations, type CountryData } from '@/lib/data/locations'
import { locales, localeNames, type Locale } from '@/i18n/config'

const baseUserSchema = z.object({
  firstName: z.string().min(2, 'Name too short').max(50, 'Name too long'),
  lastName: z.string().min(2, 'Name too short').max(50, 'Name too long'),
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  phone: z.string().optional(),
})

const userSchema = baseUserSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const proSchema = baseUserSchema.extend({
  profession: z.string().min(1, 'Required'),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  price: z.number({ coerce: true }).min(0, 'Cannot be negative'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ProFormData = z.infer<typeof proSchema>

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled,
  isRTL
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (val: string) => void
  placeholder: string
  searchPlaceholder: string
  disabled?: boolean
  isRTL?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  const selected = options.find(o => o.id === value)

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`input-field w-full flex items-center justify-between ${isRTL ? 'text-right flex-row-reverse' : 'text-left'} disabled:opacity-50`}
      >
        <span className={selected ? 'text-white' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 w-full mt-2 glass border border-white/10 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
            <div className="p-2 border-b border-white/5 relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-4' : 'left-4'}`} />
              <input
                type="text"
                className={`w-full bg-black/20 border border-white/10 rounded-xl py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-brand-500 ${isRTL ? 'pl-4 pr-10 text-right' : 'pl-10 pr-4 text-left'}`}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-2 scrollbar-hide relative z-50">
              {filtered.length === 0 ? (
                <div className="p-3 text-center text-sm text-gray-500">No results found</div>
              ) : (
                filtered.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={`w-full p-3 rounded-xl text-sm transition-colors ${isRTL ? 'text-right' : 'text-left'} ${
                      value === opt.id ? 'bg-brand-500/20 text-brand-400' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // States for multi-step
  // 1: Locale/Location, 2: Role, 3: Basic Info, 4: Professional Info
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1) 
  const [selectedRole, setSelectedRole] = useState<'user' | 'professional' | null>(
    (searchParams.get('role') as any) || null
  )
  
  const { 
    locale: storeLocale, country: storeCountry, state: storeState, city: storeCity, 
    setLocale, setCountry, setState, setCity 
  } = useAppStore()
  
  const [tempLocale, setTempLocale] = useState<Locale>(storeLocale as Locale || 'ar')
  const [tempCountry, setTempCountry] = useState(storeCountry || 'EG')
  const [tempState, setTempState] = useState(storeState || '')
  const [tempCity, setTempCity] = useState(storeCity || '')
  
  const isRTL = ['ar', 'fa', 'ur'].includes(tempLocale)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
  const [verificationStep, setVerificationStep] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const supabase = createClient()

  // i18n
  const t = {
    en: {
      step1: `Your Location`,
      step2: `Choose Role`,
      step3: `Account Details`,
      step4: `Professional Info`,
      userTitle: `I need a service`,
      userDesc: `Find and hire skilled professionals`,
      proTitle: `I offer services`,
      proDesc: `Grow your professional business`,
      next: `Continue`,
      back: `Back`,
      firstName: `First Name`,
      lastName: `Last Name`,
      email: `Email`,
      password: `Password`,
      phone: `Phone`,
      profession: `Profession`,
      specialization: `Specialization`,
      bio: `Bio`,
      price: `Price`,
      signUp: `Create Account`,
      hasAccount: `Already have an account?`,
      signIn: `Sign In`,
      country: `Country`,
      state: `State/Governorate`,
      city: `City/Region`,
      lang: `Language`,
      verifyTitle: `Verify Account`,
      verifyDesc: `Enter the code sent to`,
      verifyBtn: `Verify Account`,
      otpPlaceholder: `000000`,
      invalidOtp: `Invalid or expired code`,
      searchCountry: `Search countries...`,
      searchState: `Search states...`,
      searchCity: `Search cities/regions...`,
      loading: `Loading...`,
      step1Desc: `Choose your language and location to start`,
      step2Desc: `How do you want to use Servix?`,
      step3Desc: `Enter your personal information`,
      step4Desc: `Tell clients about your skills`,
      confirmPassword: `Confirm Password`,
      otpLengthError: `Code must be 6 digits`,
    },
    ar: {
      step1: `موقعك`,
      step2: `اختر دورك`,
      step3: `تفاصيل الحساب`,
      step4: `معلومات المهنة`,
      userTitle: `أحتاج خدمة`,
      userDesc: `ابحث عن محترفين واستأجرهم`,
      proTitle: `أنا محترف`,
      proDesc: `قدم خدماتك وطوّر عملك`,
      next: `المتابعة`,
      back: `رجوع`,
      firstName: `الاسم الأول`,
      lastName: `الاسم الأخير`,
      email: `البريد الإلكتروني`,
      password: `كلمة المرور`,
      phone: `رقم الهاتف`,
      profession: `المهنة`,
      specialization: `التخصص`,
      bio: `نبذة عنك`,
      price: `السعر`,
      signUp: `إنشاء الحساب`,
      hasAccount: `لديك حساب بالفعل؟`,
      signIn: `تسجيل الدخول`,
      country: `الدولة`,
      state: `المحافظة / الولاية`,
      city: `المنطقة`,
      lang: `اللغة`,
      verifyTitle: `تأكيد البريد الإلكتروني`,
      verifyDesc: `أدخل الكود المرسل إلى`,
      verifyBtn: `تأكيد الحساب`,
      otpPlaceholder: `000000`,
      invalidOtp: `الكود غير صحيح أو منتهي الصلاحية`,
      searchCountry: `البحث عن دولة...`,
      searchState: `البحث عن محافظة...`,
      searchCity: `البحث عن منطقة...`,
      searchLang: `البحث عن لغة...`,
      loading: `جارٍ التحميل...`,
      step1Desc: `اختر لغتك وموقعك للبدء`,
      step2Desc: `كيف تريد استخدام Servix؟`,
      step3Desc: `أدخل معلوماتك الشخصية`,
      step4Desc: `أخبر العملاء عن مهاراتك`,
      confirmPassword: `تأكيد كلمة المرور`,
      otpLengthError: `يجب أن يتكون الرمز من 6 أرقام`,
    },
    fr: {
      step1: `Votre emplacement`,
      step2: `Choisir le rôle`,
      step3: `Détails du compte`,
      step4: `Infos professionnelles`,
      userTitle: `J'ai besoin d'un service`,
      userDesc: `Trouvez et engagez des professionnels`,
      proTitle: `J'offre des services`,
      proDesc: `Développez votre activité professionnelle`,
      next: `Continuer`,
      back: `Retour`,
      firstName: `Prénom`,
      lastName: `Nom`,
      email: `E-mail`,
      password: `Mot de passe`,
      phone: `Téléphone`,
      profession: `Profession`,
      specialization: `Spécialisation`,
      bio: `Bio`,
      price: `Prix`,
      signUp: `Créer un compte`,
      hasAccount: `Vous avez déjà un compte ?`,
      signIn: `Se connecter`,
      country: `Pays`,
      state: `État/Gouvernorat`,
      city: `Ville/Région`,
      lang: `Langue`,
      verifyTitle: `Vérifier le compte`,
      verifyDesc: `Entrez le code envoyé à`,
      verifyBtn: `Vérifier le compte`,
      otpPlaceholder: `000000`,
      invalidOtp: `Code invalide ou expiré`,
      searchCountry: `Rechercher des pays...`,
      searchState: `Rechercher des états...`,
      searchCity: `Rechercher des villes/régions...`,
      searchLang: `Rechercher des langues...`,
      loading: `Chargement...`,
      step1Desc: `Choisissez votre langue et votre emplacement pour commencer`,
      step2Desc: `Comment souhaitez-vous utiliser Servix ?`,
      step3Desc: `Entrez vos informations personnelles`,
      step4Desc: `Parlez aux clients de vos compétences`,
      confirmPassword: `Confirmez le mot de passe`,
      otpLengthError: `Le code doit être composé de 6 chiffres`,
    },
    es: {
      step1: `Tu ubicación`,
      step2: `Elegir rol`,
      step3: `Detalles de la cuenta`,
      step4: `Información profesional`,
      userTitle: `Necesito un servicio`,
      userDesc: `Encuentra y contrata profesionales capacitados`,
      proTitle: `Ofrezco servicios`,
      proDesc: `Haz crecer tu negocio profesional`,
      next: `Continuar`,
      back: `Atrás`,
      firstName: `Nombre`,
      lastName: `Apellido`,
      email: `Correo electrónico`,
      password: `Contraseña`,
      phone: `Teléfono`,
      profession: `Profesión`,
      specialization: `Especialización`,
      bio: `Biografía`,
      price: `Precio`,
      signUp: `Crear cuenta`,
      hasAccount: `¿Ya tienes una cuenta?`,
      signIn: `Iniciar sesión`,
      country: `País`,
      state: `Estado/Provincia`,
      city: `Ciudad/Región`,
      lang: `Idioma`,
      verifyTitle: `Verificar cuenta`,
      verifyDesc: `Introduce el código enviado a`,
      verifyBtn: `Verificar cuenta`,
      otpPlaceholder: `000000`,
      invalidOtp: `Código no válido o caducado`,
      searchCountry: `Buscar países...`,
      searchState: `Buscar estados...`,
      searchCity: `Buscar ciudades/regiones...`,
      searchLang: `Buscar idiomas...`,
      loading: `Cargando...`,
      step1Desc: `Elige tu idioma y ubicación para comenzar`,
      step2Desc: `¿Cómo quieres utilizar Servix?`,
      step3Desc: `Introduce tu información personal`,
      step4Desc: `Cuéntele a los clientes sobre sus habilidades`,
      confirmPassword: `confirmar Contraseña`,
      otpLengthError: `El código debe tener 6 dígitos.`,
    },
    de: {
      step1: `Ihr Standort`,
      step2: `Rolle wählen`,
      step3: `Kontodetails`,
      step4: `Professionelle Infos`,
      userTitle: `Ich brauche einen Service`,
      userDesc: `Finden und engagieren Sie Fachkräfte`,
      proTitle: `Ich biete Dienstleistungen an`,
      proDesc: `Bauen Sie Ihr professionelles Geschäft aus`,
      next: `Weiter`,
      back: `Zurück`,
      firstName: `Vorname`,
      lastName: `Nachname`,
      email: `E-Mail`,
      password: `Passwort`,
      phone: `Telefon`,
      profession: `Beruf`,
      specialization: `Spezialisierung`,
      bio: `Bio`,
      price: `Preis`,
      signUp: `Konto erstellen`,
      hasAccount: `Haben Sie bereits ein Konto?`,
      signIn: `Anmelden`,
      country: `Land`,
      state: `Bundesland/Provinz`,
      city: `Stadt/Region`,
      lang: `Sprache`,
      verifyTitle: `Konto verifizieren`,
      verifyDesc: `Geben Sie den Code ein, der gesendet wurde an`,
      verifyBtn: `Konto verifizieren`,
      otpPlaceholder: `000000`,
      invalidOtp: `Ungültiger oder abgelaufener Code`,
      searchCountry: `Länder suchen...`,
      searchState: `Bundesländer suchen...`,
      searchCity: `Städte/Regionen suchen...`,
      searchLang: `Sprachen suchen...`,
      loading: `Laden...`,
      step1Desc: `Wählen Sie zunächst Ihre Sprache und Ihren Standort`,
      step2Desc: `Wie möchten Sie Servix nutzen?`,
      step3Desc: `Geben Sie Ihre persönlichen Daten ein`,
      step4Desc: `Erzählen Sie Ihren Kunden von Ihren Fähigkeiten`,
      confirmPassword: `Passwort bestätigen`,
      otpLengthError: `Der Code muss 6-stellig sein`,
    },
    tr: {
      step1: `Konumunuz`,
      step2: `Rol Seçin`,
      step3: `Hesap Detayları`,
      step4: `Profesyonel Bilgi`,
      userTitle: `Bir hizmete ihtiyacım var`,
      userDesc: `Yetenekli profesyoneller bulun ve işe alın`,
      proTitle: `Hizmet sunuyorum`,
      proDesc: `Profesyonel işinizi büyütün`,
      next: `Devam et`,
      back: `Geri`,
      firstName: `Ad`,
      lastName: `Soyadı`,
      email: `E-posta`,
      password: `Şifre`,
      phone: `Telefon`,
      profession: `Meslek`,
      specialization: `Uzmanlık`,
      bio: `Biyografi`,
      price: `Fiyat`,
      signUp: `Hesap Oluştur`,
      hasAccount: `Zaten bir hesabınız var mı?`,
      signIn: `Oturum aç`,
      country: `Ülke`,
      state: `Eyalet/Valilik`,
      city: `Şehir/Bölge`,
      lang: `Dil`,
      verifyTitle: `Hesabı Doğrula`,
      verifyDesc: `Gönderilen kodu girin`,
      verifyBtn: `Hesabı Doğrula`,
      otpPlaceholder: `000000`,
      invalidOtp: `Geçersiz veya süresi dolmuş kod`,
      searchCountry: `Ülkeleri ara...`,
      searchState: `Eyaletleri ara...`,
      searchCity: `Şehirleri/bölgeleri ara...`,
      searchLang: `Dilleri ara...`,
      loading: `Yükleniyor...`,
      step1Desc: `Başlamak için dilinizi ve konumunuzu seçin`,
      step2Desc: `Servix'i nasıl kullanmak istiyorsunuz?`,
      step3Desc: `Kişisel bilgilerinizi girin`,
      step4Desc: `Müşterilerinize becerilerinizi anlatın`,
      confirmPassword: `Şifreyi Onayla`,
      otpLengthError: `Kod 6 haneli olmalıdır`,
    },
    fa: {
      step1: `موقعیت مکانی شما`,
      step2: `نقش را انتخاب کنید`,
      step3: `جزئیات حساب`,
      step4: `اطلاعات حرفه ای`,
      userTitle: `من نیاز به یک سرویس دارم`,
      userDesc: `متخصصان ماهر را بیابید و استخدام کنید`,
      proTitle: `من خدمات ارائه می کنم`,
      proDesc: `کسب و کار حرفه ای خود را توسعه دهید`,
      next: `ادامه دهید`,
      back: `برگشت`,
      firstName: `نام`,
      lastName: `نام خانوادگی`,
      email: `ایمیل`,
      password: `رمز عبور`,
      phone: `تلفن`,
      profession: `حرفه`,
      specialization: `تخصص`,
      bio: `بیوگرافی`,
      price: `قیمت`,
      signUp: `ایجاد حساب کاربری`,
      hasAccount: `از قبل حساب کاربری دارید؟`,
      signIn: `وارد شوید`,
      country: `کشور`,
      state: `استان/فرمانداری`,
      city: `شهر/منطقه`,
      lang: `زبان`,
      verifyTitle: `تأیید حساب`,
      verifyDesc: `کد ارسال شده را وارد کنید`,
      verifyBtn: `تأیید حساب`,
      otpPlaceholder: `000000`,
      invalidOtp: `کد نامعتبر یا منقضی شده است`,
      searchCountry: `جستجوی کشورها...`,
      searchState: `جستجوی استان‌ها...`,
      searchCity: `جستجوی شهرها/مناطق...`,
      searchLang: `جستجوی زبان ها...`,
      loading: `درحال بارگذاری...`,
      step1Desc: `زبان و مکان خود را برای شروع انتخاب کنید`,
      step2Desc: `چگونه می خواهید از Servix استفاده کنید؟`,
      step3Desc: `اطلاعات شخصی خود را وارد کنید`,
      step4Desc: `به مشتریان در مورد مهارت های خود بگویید`,
      confirmPassword: `رمز عبور را تایید کنید`,
      otpLengthError: `کد باید 6 رقمی باشد`,
    },
    ur: {
      step1: `آپ کا مقام`,
      step2: `کردار کا انتخاب کریں۔`,
      step3: `اکاؤنٹ کی تفصیلات`,
      step4: `پیشہ ورانہ معلومات`,
      userTitle: `مجھے ایک خدمت کی ضرورت ہے۔`,
      userDesc: `ہنر مند پیشہ ور افراد کو تلاش کریں اور ان کی خدمات حاصل کریں۔`,
      proTitle: `میں خدمات پیش کرتا ہوں۔`,
      proDesc: `اپنے پیشہ ورانہ کاروبار میں اضافہ کریں۔`,
      next: `جاری رکھیں`,
      back: `پیچھے`,
      firstName: `پہلا نام`,
      lastName: `آخری نام`,
      email: `ای میل`,
      password: `پاس ورڈ`,
      phone: `فون`,
      profession: `پیشہ`,
      specialization: `تخصص`,
      bio: `بایو`,
      price: `قیمت`,
      signUp: `اکاؤنٹ بنائیں`,
      hasAccount: `پہلے سے ہی اکاؤنٹ ہے؟`,
      signIn: `سائن ان کریں۔`,
      country: `ملک`,
      state: `ریاست/گورنری`,
      city: `شہر/علاقہ`,
      lang: `زبان`,
      verifyTitle: `اکاؤنٹ کی تصدیق کریں۔`,
      verifyDesc: `بھیجے گئے کوڈ کو درج کریں۔`,
      verifyBtn: `اکاؤنٹ کی تصدیق کریں۔`,
      otpPlaceholder: `000000`,
      invalidOtp: `غلط یا ختم شدہ کوڈ`,
      searchCountry: `ممالک تلاش کریں...`,
      searchState: `ریاستیں تلاش کریں...`,
      searchCity: `شہر/علاقے تلاش کریں...`,
      searchLang: `زبانیں تلاش کریں...`,
      loading: `لوڈ ہو رہا ہے...`,
      step1Desc: `شروع کرنے کے لیے اپنی زبان اور مقام کا انتخاب کریں۔`,
      step2Desc: `آپ Servix کیسے استعمال کرنا چاہتے ہیں؟`,
      step3Desc: `اپنی ذاتی معلومات درج کریں۔`,
      step4Desc: `گاہکوں کو اپنی صلاحیتوں کے بارے میں بتائیں`,
      confirmPassword: `پاس ورڈ کی تصدیق کریں۔`,
      otpLengthError: `کوڈ 6 ہندسوں کا ہونا چاہیے۔`,
    },
    hi: {
      step1: `आपका स्थान`,
      step2: `भूमिका चुनें`,
      step3: `खाता विवरण`,
      step4: `पेशेवर जानकारी`,
      userTitle: `मुझे सेवा की आवश्यकता है`,
      userDesc: `कुशल पेशेवरों को ढूंढें और काम पर रखें`,
      proTitle: `मैं सेवाएं प्रदान करता हूं`,
      proDesc: `अपने पेशेवर व्यवसाय को बढ़ाएं`,
      next: `जारी रखें`,
      back: `पीछे`,
      firstName: `पहला नाम`,
      lastName: `अंतिम नाम`,
      email: `ईमेल`,
      password: `पासवर्ड`,
      phone: `फ़ोन`,
      profession: `पेशा`,
      specialization: `विशेषज्ञता`,
      bio: `बायो`,
      price: `कीमत`,
      signUp: `खाता बनाएं`,
      hasAccount: `पहले से ही एक खाता है?`,
      signIn: `लॉग इन करें`,
      country: `देश`,
      state: `राज्य/प्रांत`,
      city: `शहर/क्षेत्र`,
      lang: `भाषा`,
      verifyTitle: `खाता सत्यापित करें`,
      verifyDesc: `भेजा गया कोड दर्ज करें`,
      verifyBtn: `खाता सत्यापित करें`,
      otpPlaceholder: `000000`,
      invalidOtp: `अमान्य या समाप्त हो चुका कोड`,
      searchCountry: `देश खोजें...`,
      searchState: `राज्य खोजें...`,
      searchCity: `शहर/क्षेत्र खोजें...`,
      searchLang: `भाषाएं खोजें...`,
      loading: `लोड हो रहा है...`,
      step1Desc: `आरंभ करने के लिए अपनी भाषा और स्थान चुनें`,
      step2Desc: `आप सर्विक्स का उपयोग कैसे करना चाहते हैं?`,
      step3Desc: `अपनी व्यक्तिगत जानकारी दर्ज करें`,
      step4Desc: `ग्राहकों को अपने कौशल के बारे में बताएं`,
      confirmPassword: `पासवर्ड की पुष्टि कीजिये`,
      otpLengthError: `कोड 6 अंकों का होना चाहिए`,
    },
    bn: {
      step1: `আপনার অবস্থান`,
      step2: `ভূমিকা চয়ন করুন`,
      step3: `অ্যাকাউন্টের বিবরণ`,
      step4: `পেশাদার তথ্য`,
      userTitle: `আমার একটি সেবা প্রয়োজন`,
      userDesc: `দক্ষ পেশাদারদের খুঁজুন এবং নিয়োগ করুন`,
      proTitle: `আমি সেবা অফার করি`,
      proDesc: `আপনার পেশাদার ব্যবসা বৃদ্ধি করুন`,
      next: `চলুন`,
      back: `ফিরে যান`,
      firstName: `প্রথম নাম`,
      lastName: `শেষ নাম`,
      email: `ইমেল`,
      password: `পাসওয়ার্ড`,
      phone: `ফোন`,
      profession: `পেশা`,
      specialization: `বিশেষায়িতকরণ`,
      bio: `বায়ো`,
      price: `মূল্য`,
      signUp: `অ্যাকাউন্ট তৈরি করুন`,
      hasAccount: `ইতিমধ্যে একটি অ্যাকাউন্ট আছে?`,
      signIn: `সাইন ইন করুন`,
      country: `দেশ`,
      state: `রাষ্ট্র/প্রদেশ`,
      city: `শহর/অঞ্চল`,
      lang: `ভাষা`,
      verifyTitle: `অ্যাকাউন্ট যাচাই করুন`,
      verifyDesc: `পাঠানো কোড লিখুন`,
      verifyBtn: `অ্যাকাউন্ট যাচাই করুন`,
      otpPlaceholder: `000000`,
      invalidOtp: `অবৈধ বা মেয়াদোত্তীর্ণ কোড`,
      searchCountry: `দেশ অনুসন্ধান করুন...`,
      searchState: `রাষ্ট্র অনুসন্ধান করুন...`,
      searchCity: `শহর/অঞ্চল অনুসন্ধান করুন...`,
      searchLang: `ভাষা অনুসন্ধান করুন...`,
      loading: `লোড হচ্ছে...`,
      step1Desc: `শুরু করতে আপনার ভাষা এবং অবস্থান চয়ন করুন৷`,
      step2Desc: `আপনি কিভাবে Servix ব্যবহার করতে চান?`,
      step3Desc: `আপনার ব্যক্তিগত তথ্য লিখুন`,
      step4Desc: `আপনার দক্ষতা সম্পর্কে ক্লায়েন্টদের বলুন`,
      confirmPassword: `পাসওয়ার্ড নিশ্চিত করুন`,
      otpLengthError: `কোড অবশ্যই 6 সংখ্যার হতে হবে`,
    },
    pt: {
      step1: `Sua localização`,
      step2: `Escolher papel`,
      step3: `Detalhes da conta`,
      step4: `Informações profissionais`,
      userTitle: `Preciso de um serviço`,
      userDesc: `Encontre e contrate profissionais qualificados`,
      proTitle: `Ofereço serviços`,
      proDesc: `Aumente seu negócio profissional`,
      next: `Continuar`,
      back: `Voltar`,
      firstName: `Nome`,
      lastName: `Sobrenome`,
      email: `E-mail`,
      password: `Senha`,
      phone: `Telefone`,
      profession: `Profissão`,
      specialization: `Especialização`,
      bio: `Biografia`,
      price: `Preço`,
      signUp: `Criar conta`,
      hasAccount: `Já tem uma conta?`,
      signIn: `Entrar`,
      country: `País`,
      state: `Estado/Província`,
      city: `Cidade/Região`,
      lang: `Idioma`,
      verifyTitle: `Verificar conta`,
      verifyDesc: `Insira o código enviado para`,
      verifyBtn: `Verificar conta`,
      otpPlaceholder: `000000`,
      invalidOtp: `Código inválido ou expirado`,
      searchCountry: `Buscar países...`,
      searchState: `Buscar estados...`,
      searchCity: `Buscar cidades/regiões...`,
      searchLang: `Buscar idiomas...`,
      loading: `Carregando...`,
      step1Desc: `Escolha seu idioma e local para começar`,
      step2Desc: `Como você deseja usar o Servix?`,
      step3Desc: `Insira suas informações pessoais`,
      step4Desc: `Conte aos clientes sobre suas habilidades`,
      confirmPassword: `Confirme sua senha`,
      otpLengthError: `O código deve ter 6 dígitos`,
    },
    ru: {
      step1: `Ваше местоположение`,
      step2: `Выберите роль`,
      step3: `Детали аккаунта`,
      step4: `Профессиональная информация`,
      userTitle: `Мне нужна услуга`,
      userDesc: `Найдите и наймите квалифицированных специалистов`,
      proTitle: `Я предлагаю услуги`,
      proDesc: `Развивайте свой профессиональный бизнес`,
      next: `Продолжить`,
      back: `Назад`,
      firstName: `Имя`,
      lastName: `Фамилия`,
      email: `Электронная почта`,
      password: `Пароль`,
      phone: `Телефон`,
      profession: `Профессия`,
      specialization: `Специализация`,
      bio: `Биография`,
      price: `Цена`,
      signUp: `Создать аккаунт`,
      hasAccount: `Уже есть аккаунт?`,
      signIn: `Войти`,
      country: `Страна`,
      state: `Штат/Провинция`,
      city: `Город/Регион`,
      lang: `Язык`,
      verifyTitle: `Подтвердить аккаунт`,
      verifyDesc: `Введите код, отправленный на`,
      verifyBtn: `Подтвердить аккаунт`,
      otpPlaceholder: `000000`,
      invalidOtp: `Недействительный или просроченный код`,
      searchCountry: `Поиск стран...`,
      searchState: `Поиск штатов...`,
      searchCity: `Поиск городов/регионов...`,
      searchLang: `Поиск языков...`,
      loading: `Загрузка...`,
      step1Desc: `Выберите язык и местоположение, чтобы начать`,
      step2Desc: `Как вы хотите использовать Servix?`,
      step3Desc: `Введите вашу личную информацию`,
      step4Desc: `Расскажите клиентам о своих навыках`,
      confirmPassword: `Подтвердите пароль`,
      otpLengthError: `Код должен состоять из 6 цифр`,
    },
    zh: {
      step1: `您的位置`,
      step2: `选择角色`,
      step3: `账户详情`,
      step4: `专业信息`,
      userTitle: `我需要服务`,
      userDesc: `寻找并雇用有能力的专业人员`,
      proTitle: `我提供服务`,
      proDesc: `发展您的专业业务`,
      next: `继续`,
      back: `返回`,
      firstName: `名字`,
      lastName: `姓氏`,
      email: `电子邮件`,
      password: `密码`,
      phone: `电话`,
      profession: `专业`,
      specialization: `专业方向`,
      bio: `个人简介`,
      price: `价格`,
      signUp: `创建账户`,
      hasAccount: `已有账户？`,
      signIn: `登录`,
      country: `国家`,
      state: `州/省`,
      city: `城市/地区`,
      lang: `语言`,
      verifyTitle: `验证账户`,
      verifyDesc: `输入发送至的验证码`,
      verifyBtn: `验证账户`,
      otpPlaceholder: `000000`,
      invalidOtp: `无效或过期的验证码`,
      searchCountry: `搜索国家...`,
      searchState: `搜索省份...`,
      searchCity: `搜索城市/地区...`,
      searchLang: `搜索语言...`,
      loading: `加载中...`,
      step1Desc: `选择您的语言和位置开始`,
      step2Desc: `您想如何使用 Servix？`,
      step3Desc: `输入您的个人信息`,
      step4Desc: `向客户介绍您的技能`,
      confirmPassword: `确认密码`,
      otpLengthError: `代码必须是 6 位数字`,
    },
    ja: {
      step1: `あなたの場所`,
      step2: `役割を選択`,
      step3: `アカウント詳細`,
      step4: `専門情報`,
      userTitle: `サービスが必要です`,
      userDesc: `熟練したプロを探して雇用する`,
      proTitle: `サービスを提供します`,
      proDesc: `プロフェッショナルなビジネスを成長させる`,
      next: `続ける`,
      back: `戻る`,
      firstName: `名`,
      lastName: `姓`,
      email: `メールアドレス`,
      password: `パスワード`,
      phone: `電話番号`,
      profession: `職業`,
      specialization: `専門分野`,
      bio: `略歴`,
      price: `料金`,
      signUp: `アカウント作成`,
      hasAccount: `すでにアカウントをお持ちですか？`,
      signIn: `サインイン`,
      country: `国`,
      state: `州/都道府県`,
      city: `都市/地域`,
      lang: `言語`,
      verifyTitle: `アカウントの確認`,
      verifyDesc: `以下に送信されたコードを入力してください`,
      verifyBtn: `アカウントの確認`,
      otpPlaceholder: `000000`,
      invalidOtp: `無効または期限切れのコード`,
      searchCountry: `国を検索...`,
      searchState: `都道府県を検索...`,
      searchCity: `都市/地域を検索...`,
      searchLang: `言語を検索...`,
      loading: `読み込み中...`,
      step1Desc: `言語と場所を選択して開始してください`,
      step2Desc: `Servix をどのように使用したいですか?`,
      step3Desc: `個人情報を入力してください`,
      step4Desc: `あなたのスキルをクライアントに伝える`,
      confirmPassword: `パスワードを認証する`,
      otpLengthError: `コードは6桁である必要があります`,
    },
    ko: {
      step1: `내 위치`,
      step2: `역할 선택`,
      step3: `계정 세부 정보`,
      step4: `전문 정보`,
      userTitle: `서비스가 필요합니다`,
      userDesc: `숙련된 전문가 찾기 및 고용`,
      proTitle: `서비스를 제공합니다`,
      proDesc: `전문 비즈니스 성장`,
      next: `계속`,
      back: `뒤로`,
      firstName: `이름`,
      lastName: `성`,
      email: `이메일`,
      password: `비밀번호`,
      phone: `전화번호`,
      profession: `직업`,
      specialization: `전문 분야`,
      bio: `약력`,
      price: `가격`,
      signUp: `계정 만들기`,
      hasAccount: `이미 계정이 있으신가요?`,
      signIn: `로그인`,
      country: `국가`,
      state: `주/도`,
      city: `도시/지역`,
      lang: `언어`,
      verifyTitle: `계정 인증`,
      verifyDesc: `여기로 전송된 코드 입력`,
      verifyBtn: `계정 인증`,
      otpPlaceholder: `000000`,
      invalidOtp: `잘못되거나 만료된 코드`,
      searchCountry: `국가 검색...`,
      searchState: `지역 검색...`,
      searchCity: `도시/지역 검색...`,
      searchLang: `언어 검색...`,
      loading: `로딩 중...`,
      step1Desc: `시작하려면 언어와 위치를 선택하세요.`,
      step2Desc: `Servix를 어떻게 사용하고 싶으신가요?`,
      step3Desc: `개인정보를 입력하세요`,
      step4Desc: `고객에게 당신의 기술을 알려주세요`,
      confirmPassword: `비밀번호 확인`,
      otpLengthError: `코드는 6자리여야 합니다.`,
    },
    id: {
      step1: `Lokasi Anda`,
      step2: `Pilih Peran`,
      step3: `Detail Akun`,
      step4: `Info Profesional`,
      userTitle: `Saya butuh layanan`,
      userDesc: `Temukan dan pekerjakan profesional terampil`,
      proTitle: `Saya menawarkan layanan`,
      proDesc: `Kembangkan bisnis profesional Anda`,
      next: `Lanjutkan`,
      back: `Kembali`,
      firstName: `Nama Depan`,
      lastName: `Nama Belakang`,
      email: `Email`,
      password: `Kata Sandi`,
      phone: `Telepon`,
      profession: `Profesi`,
      specialization: `Spesialisasi`,
      bio: `Bio`,
      price: `Harga`,
      signUp: `Buat Akun`,
      hasAccount: `Sudah punya akun?`,
      signIn: `Masuk`,
      country: `Negara`,
      state: `Negara Bagian/Provinsi`,
      city: `Kota/Wilayah`,
      lang: `Bahasa`,
      verifyTitle: `Verifikasi Akun`,
      verifyDesc: `Masukkan kode yang dikirim ke`,
      verifyBtn: `Verifikasi Akun`,
      otpPlaceholder: `000000`,
      invalidOtp: `Kode tidak valid atau kedaluwarsa`,
      searchCountry: `Cari negara...`,
      searchState: `Cari provinsi...`,
      searchCity: `Cari kota/wilayah...`,
      searchLang: `Cari bahasa...`,
      loading: `Memuat...`,
      step1Desc: `Pilih bahasa dan lokasi Anda untuk memulai`,
      step2Desc: `Bagaimana Anda ingin menggunakan Servix?`,
      step3Desc: `Masukkan informasi pribadi Anda`,
      step4Desc: `Beritahu klien tentang keahlian Anda`,
      confirmPassword: `Konfirmasi Kata Sandi`,
      otpLengthError: `Kode harus 6 digit`,
    },
    ms: {
      step1: `Lokasi Anda`,
      step2: `Pilih Peranan`,
      step3: `Butiran Akaun`,
      step4: `Maklumat Profesional`,
      userTitle: `Saya memerlukan perkhidmatan`,
      userDesc: `Cari dan upah profesional mahir`,
      proTitle: `Saya menawarkan perkhidmatan`,
      proDesc: `Kembangkan perniagaan profesional anda`,
      next: `Teruskan`,
      back: `Kembali`,
      firstName: `Nama Depan`,
      lastName: `Nama Belakang`,
      email: `E-mel`,
      password: `Kata laluan`,
      phone: `Telefon`,
      profession: `Profesion`,
      specialization: `Pengkhususan`,
      bio: `Bio`,
      price: `Harga`,
      signUp: `Daftar Akaun`,
      hasAccount: `Sudah mempunyai akaun?`,
      signIn: `Log Masuk`,
      country: `Negara`,
      state: `Negeri/Wilayah`,
      city: `Bandar/Kawasan`,
      lang: `Bahasa`,
      verifyTitle: `Sahkan Akaun`,
      verifyDesc: `Masukkan kod yang dihantar ke`,
      verifyBtn: `Sahkan Akaun`,
      otpPlaceholder: `000000`,
      invalidOtp: `Kod tidak sah atau tamat tempoh`,
      searchCountry: `Cari negara...`,
      searchState: `Cari negeri...`,
      searchCity: `Cari bandar/kawasan...`,
      searchLang: `Cari bahasa...`,
      loading: `Memuatkan...`,
      step1Desc: `Pilih bahasa dan lokasi anda untuk bermula`,
      step2Desc: `Bagaimana anda mahu menggunakan Servix?`,
      step3Desc: `Masukkan maklumat peribadi anda`,
      step4Desc: `Beritahu pelanggan tentang kemahiran anda`,
      confirmPassword: `Sahkan Kata Laluan`,
      otpLengthError: `Kod mestilah 6 digit`,
    },
    it: {
      step1: `La tua posizione`,
      step2: `Scegli il ruolo`,
      step3: `Dettagli dell'account`,
      step4: `Info professionali`,
      userTitle: `Ho bisogno di un servizio`,
      userDesc: `Trova e assumi professionisti qualificati`,
      proTitle: `Offro servizi`,
      proDesc: `Fai crescere la tua attività professionale`,
      next: `Continua`,
      back: `Indietro`,
      firstName: `Nome`,
      lastName: `Cognome`,
      email: `E-mail`,
      password: `Password`,
      phone: `Telefono`,
      profession: `Professione`,
      specialization: `Specializzazione`,
      bio: `Biografia`,
      price: `Prezzo`,
      signUp: `Crea un account`,
      hasAccount: `Hai già un account?`,
      signIn: `Accedi`,
      country: `Paese`,
      state: `Stato/Provincia`,
      city: `Città/Regione`,
      lang: `Lingua`,
      verifyTitle: `Verifica account`,
      verifyDesc: `Inserisci il codice inviato a`,
      verifyBtn: `Verifica account`,
      otpPlaceholder: `000000`,
      invalidOtp: `Codice non valido o scaduto`,
      searchCountry: `Cerca paesi...`,
      searchState: `Cerca stati...`,
      searchCity: `Cerca città/regioni...`,
      searchLang: `Cerca lingue...`,
      loading: `Caricamento...`,
      step1Desc: `Scegli la lingua e la posizione per iniziare`,
      step2Desc: `Come vuoi utilizzare Servix?`,
      step3Desc: `Inserisci le tue informazioni personali`,
      step4Desc: `Racconta ai clienti le tue capacità`,
      confirmPassword: `Conferma password`,
      otpLengthError: `Il codice deve essere di 6 cifre`,
    },
    nl: {
      step1: `Uw locatie`,
      step2: `Kies rol`,
      step3: `Accountgegevens`,
      step4: `Professionele informatie`,
      userTitle: `Ik heb een dienst nodig`,
      userDesc: `Vind en huur bekwame professionals`,
      proTitle: `Ik bied diensten aan`,
      proDesc: `Laat uw professionele onderneming groeien`,
      next: `Ga door`,
      back: `Terug`,
      firstName: `Voornaam`,
      lastName: `Achternaam`,
      email: `E-mail`,
      password: `Wachtwoord`,
      phone: `Telefoon`,
      profession: `Beroep`,
      specialization: `Specialisatie`,
      bio: `Biografie`,
      price: `Prijs`,
      signUp: `Account aanmaken`,
      hasAccount: `Heeft u al een account?`,
      signIn: `Inloggen`,
      country: `Land`,
      state: `Staat/Provincie`,
      city: `Stad/Regio`,
      lang: `Taal`,
      verifyTitle: `Account verifiëren`,
      verifyDesc: `Voer de code in die is verzonden naar`,
      verifyBtn: `Account verifiëren`,
      otpPlaceholder: `000000`,
      invalidOtp: `Ongeldige of verlopen code`,
      searchCountry: `Landen zoeken...`,
      searchState: `Zoek staten...`,
      searchCity: `Zoek steden/regio's...`,
      searchLang: `Talen zoeken...`,
      loading: `Laden...`,
      step1Desc: `Kies uw taal en locatie om te beginnen`,
      step2Desc: `Hoe wilt u Servix gebruiken?`,
      step3Desc: `Voer uw persoonlijke gegevens in`,
      step4Desc: `Vertel klanten over uw vaardigheden`,
      confirmPassword: `Bevestig wachtwoord`,
      otpLengthError: `De code moet uit 6 cijfers bestaan`,
    },
    pl: {
      step1: `Twoja lokalizacja`,
      step2: `Wybierz rolę`,
      step3: `Szczegóły konta`,
      step4: `Informacje zawodowe`,
      userTitle: `Potrzebuję usługi`,
      userDesc: `Znajdź i zatrudnij wykwalifikowanych specjalistów`,
      proTitle: `Oferuję usługi`,
      proDesc: `Rozwijaj swój profesjonalny biznes`,
      next: `Kontynuuj`,
      back: `Powrót`,
      firstName: `Imię`,
      lastName: `Nazwisko`,
      email: `E-mail`,
      password: `Hasło`,
      phone: `Telefon`,
      profession: `Zawód`,
      specialization: `Specjalizacja`,
      bio: `Życiorys`,
      price: `Cena`,
      signUp: `Utwórz konto`,
      hasAccount: `Masz już konto?`,
      signIn: `Zaloguj się`,
      country: `Kraj`,
      state: `Województwo/Prowincja`,
      city: `Miasto/Region`,
      lang: `Język`,
      verifyTitle: `Zweryfikuj konto`,
      verifyDesc: `Wpisz kod wysłany do`,
      verifyBtn: `Zweryfikuj konto`,
      otpPlaceholder: `000000`,
      invalidOtp: `Nieprawidłowy lub wygasły kod`,
      searchCountry: `Wyszukaj kraje...`,
      searchState: `Szukaj województw...`,
      searchCity: `Wyszukaj miasta/regionów...`,
      searchLang: `Wyszukaj języki...`,
      loading: `Ładowanie...`,
      step1Desc: `Aby rozpocząć, wybierz język i lokalizację`,
      step2Desc: `Jak chcesz korzystać z Servix?`,
      step3Desc: `Wprowadź swoje dane osobowe`,
      step4Desc: `Opowiedz klientom o swoich umiejętnościach`,
      confirmPassword: `Potwierdź hasło`,
      otpLengthError: `Kod musi składać się z 6 cyfr`,
    },
    sv: {
      step1: `Din plats`,
      step2: `Välj roll`,
      step3: `Kontouppgifter`,
      step4: `Professionell information`,
      userTitle: `Jag behöver en tjänst`,
      userDesc: `Hitta och anlita skickliga proffs`,
      proTitle: `Jag erbjuder tjänster`,
      proDesc: `Få ditt företag att växa`,
      next: `Fortsätt`,
      back: `Tillbaka`,
      firstName: `Förnamn`,
      lastName: `Efternamn`,
      email: `E-post`,
      password: `Lösenord`,
      phone: `Telefon`,
      profession: `Yrke`,
      specialization: `Specialisering`,
      bio: `Bio`,
      price: `Pris`,
      signUp: `Skapa konto`,
      hasAccount: `Har du redan ett konto?`,
      signIn: `Logga in`,
      country: `Land`,
      state: `Stat/Provins`,
      city: `Stad/Region`,
      lang: `Språk`,
      verifyTitle: `Verifiera konto`,
      verifyDesc: `Ange korden som skickats till`,
      verifyBtn: `Verifiera konto`,
      otpPlaceholder: `000000`,
      invalidOtp: `Ogiltig eller utgången kod`,
      searchCountry: `Sök länder...`,
      searchState: `Sök stater...`,
      searchCity: `Sök städer/regioner...`,
      searchLang: `Sök språk...`,
      loading: `Laddar...`,
      step1Desc: `Välj språk och plats för att börja`,
      step2Desc: `Hur vill du använda Servix?`,
      step3Desc: `Ange din personliga information`,
      step4Desc: `Berätta för kunderna om dina färdigheter`,
      confirmPassword: `Bekräfta lösenord`,
      otpLengthError: `Koden måste vara 6 siffror`,
    },
    da: {
      step1: `Din placering`,
      step2: `Vælg rolle`,
      step3: `Kontooplysninger`,
      step4: `Professionel info`,
      userTitle: `Jeg har brug for en service`,
      userDesc: `Find og ansæt dygtige fagfolk`,
      proTitle: `Jeg tilbyder tjenester`,
      proDesc: `Få din professionelle virksomhed til at vokse`,
      next: `Fortsæt`,
      back: `Tilbage`,
      firstName: `Fornavn`,
      lastName: `Efternavn`,
      email: `E-mail`,
      password: `Adgangskode`,
      phone: `Telefon`,
      profession: `Erhverv`,
      specialization: `Specialisering`,
      bio: `Bio`,
      price: `Pris`,
      signUp: `Opret konto`,
      hasAccount: `Har du allerede en konto?`,
      signIn: `Log ind`,
      country: `Land`,
      state: `Stat/Provins`,
      city: `By/Region`,
      lang: `Sprog`,
      verifyTitle: `Bekræft konto`,
      verifyDesc: `Indtast koden sendt til`,
      verifyBtn: `Bekræft konto`,
      otpPlaceholder: `000000`,
      invalidOtp: `Ugyldig eller udløbet kode`,
      searchCountry: `Søg lande...`,
      searchState: `Søg stater...`,
      searchCity: `Søg byer/regioner...`,
      searchLang: `Søg sprog...`,
      loading: `Indlæser...`,
      step1Desc: `Vælg dit sprog og din placering for at starte`,
      step2Desc: `Hvordan vil du bruge Servix?`,
      step3Desc: `Indtast dine personlige oplysninger`,
      step4Desc: `Fortæl kunderne om dine færdigheder`,
      confirmPassword: `Bekræft adgangskode`,
      otpLengthError: `Koden skal være på 6 cifre`,
    },
    no: {
      step1: `Din lokasjon`,
      step2: `Velg rolle`,
      step3: `Kontodetaljer`,
      step4: `Profesjonell info`,
      userTitle: `Jeg trenger en tjeneste`,
      userDesc: `Finn og ansett dyktige fagfolk`,
      proTitle: `Jeg tilbyr tjenester`,
      proDesc: `Få din profesjonelle virksomhet til å vokse`,
      next: `Fortsett`,
      back: `Tilbake`,
      firstName: `Fornavn`,
      lastName: `Etternavn`,
      email: `E-post`,
      password: `Passord`,
      phone: `Telefon`,
      profession: `Yrke`,
      specialization: `Spesialisering`,
      bio: `Bio`,
      price: `Pris`,
      signUp: `Opprett konto`,
      hasAccount: `Har du allerede en konto?`,
      signIn: `Logg på`,
      country: `Land`,
      state: `Stat/Provins`,
      city: `By/Region`,
      lang: `Språk`,
      verifyTitle: `Bekreft konto`,
      verifyDesc: `Skriv inn koden sendt til`,
      verifyBtn: `Bekreft konto`,
      otpPlaceholder: `000000`,
      invalidOtp: `Ugyldig eller utløpt kode`,
      searchCountry: `Søk etter land...`,
      searchState: `Søk stater...`,
      searchCity: `Søk byer/regioner...`,
      searchLang: `Søk språk...`,
      loading: `Laster...`,
      step1Desc: `Velg språk og plassering for å starte`,
      step2Desc: `Hvordan vil du bruke Servix?`,
      step3Desc: `Skriv inn din personlige informasjon`,
      step4Desc: `Fortell kundene om dine ferdigheter`,
      confirmPassword: `Bekreft passord`,
      otpLengthError: `Koden må være på 6 sifre`,
    },
    fi: {
      step1: `Sijaintisi`,
      step2: `Valitse rooli`,
      step3: `Tilin tiedot`,
      step4: `Ammatilliset tiedot`,
      userTitle: `Tarvitsen palvelua`,
      userDesc: `Etsi ja palkkaa ammattitaitoisia ammattilaisia`,
      proTitle: `Tarjoan palveluita`,
      proDesc: `Kasvata ammatillista toimintaasi`,
      next: `Jatka`,
      back: `Takaisin`,
      firstName: `Etunimi`,
      lastName: `Sukunimi`,
      email: `Sähköposti`,
      password: `Salasana`,
      phone: `Puhelin`,
      profession: `Ammatti`,
      specialization: `Erikoistuminen`,
      bio: `Bio`,
      price: `Hinta`,
      signUp: `Luo tili`,
      hasAccount: `Onko sinulla jo tili?`,
      signIn: `Kirjaudu sisään`,
      country: `Maa`,
      state: `Osavaltio/Maakunta`,
      city: `Kaupunki/Alue`,
      lang: `Kieli`,
      verifyTitle: `Vahvista tili`,
      verifyDesc: `Syötä koodi, joka lähetettiin osoitteeseen`,
      verifyBtn: `Vahvista tili`,
      otpPlaceholder: `000000`,
      invalidOtp: `Virheellinen tai vanhentunut koodi`,
      searchCountry: `Hae maita...`,
      searchState: `Hae osavaltioita...`,
      searchCity: `Hae kaupunkeja/alueita...`,
      searchLang: `Hae kieliä...`,
      loading: `Ladataan...`,
      step1Desc: `Aloita valitsemalla kieli ja sijainti`,
      step2Desc: `Miten haluat käyttää Servixiä?`,
      step3Desc: `Anna henkilötietosi`,
      step4Desc: `Kerro asiakkaillesi osaamisestasi`,
      confirmPassword: `Vahvista salasana`,
      otpLengthError: `Koodissa on oltava 6 numeroa`,
    },
    cs: {
      step1: `Vaše poloha`,
      step2: `Vyberte roli`,
      step3: `Podrobnosti o účtu`,
      step4: `Profesionální info`,
      userTitle: `Potřebuji službu`,
      userDesc: `Najděte a najměte kvalifikované odborníky`,
      proTitle: `Nabízím služby`,
      proDesc: `Rozvíjejte své profesionální podnikání`,
      next: `Pokračovat`,
      back: `Zpět`,
      firstName: `Křestní jméno`,
      lastName: `Příjmení`,
      email: `E-mail`,
      password: `Heslo`,
      phone: `Telefon`,
      profession: `Profese`,
      specialization: `Specializace`,
      bio: `Bio`,
      price: `Cena`,
      signUp: `Vytvořit účet`,
      hasAccount: `Již máte účet?`,
      signIn: `Přihlásit se`,
      country: `Země`,
      state: `Stát/Provincie`,
      city: `Město/Region`,
      lang: `Jazyk`,
      verifyTitle: `Ověřit účet`,
      verifyDesc: `Zadejte kód odeslaný na`,
      verifyBtn: `Ověřit účet`,
      otpPlaceholder: `000000`,
      invalidOtp: `Neplatný kód nebo kód s vypršenou platností`,
      searchCountry: `Hledat země...`,
      searchState: `Hledat státy...`,
      searchCity: `Hledat města/regiony...`,
      searchLang: `Hledat jazyky...`,
      loading: `Načítání...`,
      step1Desc: `Začněte výběrem jazyka a umístění`,
      step2Desc: `Jak chcete používat Servix?`,
      step3Desc: `Zadejte své osobní údaje`,
      step4Desc: `Řekněte klientům o svých dovednostech`,
      confirmPassword: `Potvrďte heslo`,
      otpLengthError: `Kód musí mít 6 číslic`,
    },
    ro: {
      step1: `Locația ta`,
      step2: `Alege rolul`,
      step3: `Detalii cont`,
      step4: `Informații profesionale`,
      userTitle: `Am nevoie de un serviciu`,
      userDesc: `Găsește și angajează profesioniști calificați`,
      proTitle: `Ofer servicii`,
      proDesc: `Dezvoltă-ți afacerea profesională`,
      next: `Continuă`,
      back: `Înapoi`,
      firstName: `Prenume`,
      lastName: `Nume de familie`,
      email: `E-mail`,
      password: `Parolă`,
      phone: `Telefon`,
      profession: `Profesie`,
      specialization: `Specializare`,
      bio: `Bio`,
      price: `Preț`,
      signUp: `Creează cont`,
      hasAccount: `Ai deja un cont?`,
      signIn: `Conectează-te`,
      country: `Țară`,
      state: `Stat/Provincie`,
      city: `Oraș/Regiune`,
      lang: `Limbă`,
      verifyTitle: `Verifică contul`,
      verifyDesc: `Introdu codul trimis la`,
      verifyBtn: `Verifică contul`,
      otpPlaceholder: `000000`,
      invalidOtp: `Cod nevalid sau expirat`,
      searchCountry: `Caută țări...`,
      searchState: `Caută state...`,
      searchCity: `Caută orașe/regiuni...`,
      searchLang: `Caută limbi...`,
      loading: `Se încarcă...`,
      step1Desc: `Alegeți limba și locația pentru a începe`,
      step2Desc: `Cum doriți să utilizați Servix?`,
      step3Desc: `Introduceți informațiile dvs. personale`,
      step4Desc: `Spune-le clienților despre abilitățile tale`,
      confirmPassword: `Confirmați parola`,
      otpLengthError: `Codul trebuie să aibă 6 cifre`,
    },
    hu: {
      step1: `Az Ön helye`,
      step2: `Válasszon szerepet`,
      step3: `Fiók részletei`,
      step4: `Szakmai információk`,
      userTitle: `Szolgáltatásra van szükségem`,
      userDesc: `Keressen és alkalmazzon képzett szakembereket`,
      proTitle: `Szolgáltatásokat kínálok`,
      proDesc: `Fejlessze szakmai vállalkozását`,
      next: `Folytatás`,
      back: `Vissza`,
      firstName: `Keresztnév`,
      lastName: `Vezetéknév`,
      email: `E-mail`,
      password: `Jelszó`,
      phone: `Telefon`,
      profession: `Szakma`,
      specialization: `Szakterület`,
      bio: `Bio`,
      price: `Ár`,
      signUp: `Fiók létrehozása`,
      hasAccount: `Már van fiókja?`,
      signIn: `Bejelentkezés`,
      country: `Ország`,
      state: `Állam/Megye`,
      city: `Város/Régió`,
      lang: `Nyelv`,
      verifyTitle: `Fiók ellenőrzése`,
      verifyDesc: `Adja meg a küldött kódot ide:`,
      verifyBtn: `Fiók ellenőrzése`,
      otpPlaceholder: `000000`,
      invalidOtp: `Érvénytelen vagy lejárt kód`,
      searchCountry: `Országok keresése...`,
      searchState: `Államok keresése...`,
      searchCity: `Városok/régiók keresése...`,
      searchLang: `Nyelvek keresése...`,
      loading: `Betöltés...`,
      step1Desc: `A kezdéshez válassza ki a nyelvet és a helyet`,
      step2Desc: `Hogyan szeretné használni a Servixet?`,
      step3Desc: `Adja meg személyes adatait`,
      step4Desc: `Mondja el ügyfeleinek képességeit`,
      confirmPassword: `Jelszó megerősítése`,
      otpLengthError: `A kódnak 6 számjegyből kell állnia`,
    },
    el: {
      step1: `Η τοποθεσία σας`,
      step2: `Επιλέξτε ρόλο`,
      step3: `Στοιχεία λογαριασμού`,
      step4: `Επαγγελματικές πληροφορίες`,
      userTitle: `Χρειάζομαι μια υπηρεσία`,
      userDesc: `Βρείτε και προσλάβετε ειδικευμένους επαγγελματίες`,
      proTitle: `Προσφέρω υπηρεσίες`,
      proDesc: `Αναπτύξτε την επαγγελματική σας επιχείρηση`,
      next: `Συνέχεια`,
      back: `Πίσω`,
      firstName: `Όνομα`,
      lastName: `Επώνυμο`,
      email: `E-mail`,
      password: `Κωδικός πρόσβασης`,
      phone: `Τηλέφωνο`,
      profession: `Επάγγελμα`,
      specialization: `Εξειδίκευση`,
      bio: `Βιογραφικό`,
      price: `Τιμή`,
      signUp: `Δημιουργία λογαριασμού`,
      hasAccount: `Έχετε ήδη λογαριασμό;`,
      signIn: `Είσοδος`,
      country: `Χώρα`,
      state: `Πολιτεία/Επαρχία`,
      city: `Πόλη/Περιοχή`,
      lang: `Γλώσσα`,
      verifyTitle: `Επαλήθευση λογαριασμού`,
      verifyDesc: `Εισαγάγετε τον κωδικό που στάλθηκε στο`,
      verifyBtn: `Επαλήθευση λογαριασμού`,
      otpPlaceholder: `000000`,
      invalidOtp: `Μη έγκυρος ή ληγμένος κωδικός`,
      searchCountry: `Αναζήτηση χωρών...`,
      searchState: `Αναζήτηση πολιτειών...`,
      searchCity: `Αναζήτηση πόλεων/περιοχών...`,
      searchLang: `Αναζήτηση γλωσσών...`,
      loading: `Φόρτωση...`,
      step1Desc: `Επιλέξτε τη γλώσσα και την τοποθεσία σας για να ξεκινήσετε`,
      step2Desc: `Πώς θέλετε να χρησιμοποιήσετε το Servix;`,
      step3Desc: `Εισαγάγετε τα προσωπικά σας στοιχεία`,
      step4Desc: `Πείτε στους πελάτες για τις δεξιότητές σας`,
      confirmPassword: `Επιβεβαίωση κωδικού πρόσβασης`,
      otpLengthError: `Ο κωδικός πρέπει να είναι 6ψήφιος`,
    },
    th: {
      step1: `ตำแหน่งของคุณ`,
      step2: `เลือกบทบาท`,
      step3: `รายละเอียดบัญชี`,
      step4: `ข้อมูลระดับมืออาชีพ`,
      userTitle: `ฉันต้องการบริการ`,
      userDesc: `ค้นหาและจ้างผู้เชี่ยวชาญที่มีทักษะ`,
      proTitle: `ฉันเสนอบริการ`,
      proDesc: `ขยายธุรกิจมืออาชีพของคุณ`,
      next: `ต่อไป`,
      back: `ย้อนกลับ`,
      firstName: `ชื่อจริง`,
      lastName: `นามสกุล`,
      email: `อีเมล`,
      password: `รหัสผ่าน`,
      phone: `โทรศัพท์`,
      profession: `อาชีพ`,
      specialization: `ความเชี่ยวชาญ`,
      bio: `ประวัติส่วนตัว`,
      price: `ราคา`,
      signUp: `สร้างบัญชี`,
      hasAccount: `มีบัญชีอยู่แล้วใช่ไหม?`,
      signIn: `เข้าสู่ระบบ`,
      country: `ประเทศ`,
      state: `รัฐ/จังหวัด`,
      city: `เมือง/ภูมิภาค`,
      lang: `ภาษา`,
      verifyTitle: `ยืนยันบัญชี`,
      verifyDesc: `ป้อนรหัสที่ส่งไปยัง`,
      verifyBtn: `ยืนยันบัญชี`,
      otpPlaceholder: `000000`,
      invalidOtp: `รหัสไม่ถูกต้องหรือหมดอายุ`,
      searchCountry: `ค้นหาประเทศ...`,
      searchState: `ค้นหารัฐ...`,
      searchCity: `ค้นหาเมือง/ภูมิภาค...`,
      searchLang: `ค้นหาภาษา...`,
      loading: `กำลังโหลด...`,
      step1Desc: `เลือกภาษาและที่ตั้งของคุณเพื่อเริ่มต้น`,
      step2Desc: `คุณต้องการใช้ Servix อย่างไร?`,
      step3Desc: `ใส่ข้อมูลส่วนบุคคลของคุณ`,
      step4Desc: `บอกลูกค้าเกี่ยวกับทักษะของคุณ`,
      confirmPassword: `ยืนยันรหัสผ่าน`,
      otpLengthError: `รหัสต้องเป็นตัวเลข 6 หลัก`,
    },
    vi: {
      step1: `Vị trí của bạn`,
      step2: `Chọn vai trò`,
      step3: `Chi tiết tài khoản`,
      step4: `Thông tin chuyên môn`,
      userTitle: `Tôi cần một dịch vụ`,
      userDesc: `Tìm và thuê các chuyên gia lành nghề`,
      proTitle: `Tôi cung cấp dịch vụ`,
      proDesc: `Phát triển kinh doanh chuyên nghiệp của bạn`,
      next: `Tiếp tục`,
      back: `Quay lại`,
      firstName: `Tên`,
      lastName: `Họ`,
      email: `Email`,
      password: `Mật khẩu`,
      phone: `Điện thoại`,
      profession: `Nghề nghiệp`,
      specialization: `Chuyên môn`,
      bio: `Tiểu sử`,
      price: `Giá`,
      signUp: `Tạo tài khoản`,
      hasAccount: `Đã có tài khoản?`,
      signIn: `Đăng nhập`,
      country: `Quốc gia`,
      state: `Bang/Tỉnh`,
      city: `Thành phố/Khu vực`,
      lang: `Ngôn ngữ`,
      verifyTitle: `Xác minh tài khoản`,
      verifyDesc: `Nhập mã đã gửi đến`,
      verifyBtn: `Xác minh tài khoản`,
      otpPlaceholder: `000000`,
      invalidOtp: `Mã không hợp lệ hoặc hết hạn`,
      searchCountry: `Tìm kiếm quốc gia...`,
      searchState: `Tìm kiếm bang...`,
      searchCity: `Tìm kiếm thành phố/khu vực...`,
      searchLang: `Tìm kiếm ngôn ngữ...`,
      loading: `Đang tải...`,
      step1Desc: `Chọn ngôn ngữ và vị trí của bạn để bắt đầu`,
      step2Desc: `Bạn muốn sử dụng Servix như thế nào?`,
      step3Desc: `Nhập thông tin cá nhân của bạn`,
      step4Desc: `Nói với khách hàng về kỹ năng của bạn`,
      confirmPassword: `Xác nhận mật khẩu`,
      otpLengthError: `Mã phải có 6 chữ số`,
    },
    uk: {
      step1: `Ваше місцезнаходження`,
      step2: `Оберіть роль`,
      step3: `Деталі облікового запису`,
      step4: `Професійна інформація`,
      userTitle: `Мені потрібна послуга`,
      userDesc: `Знайдіть та найміть кваліфікованих спеціалістів`,
      proTitle: `Я пропоную послуги`,
      proDesc: `Розвивайте свій професійний бізнес`,
      next: `Продовжити`,
      back: `Назад`,
      firstName: `Ім'я`,
      lastName: `Прізвище`,
      email: `Електронна пошта`,
      password: `Пароль`,
      phone: `Телефон`,
      profession: `Професія`,
      specialization: `Спеціалізація`,
      bio: `Біографія`,
      price: `Ціна`,
      signUp: `Створити акаунт`,
      hasAccount: `Вже маєте акаунт?`,
      signIn: `Увійти`,
      country: `Країна`,
      state: `Штат/Область`,
      city: `Місто/Регіон`,
      lang: `Мова`,
      verifyTitle: `Підтвердити обліковий запис`,
      verifyDesc: `Введіть код, надісланий на`,
      verifyBtn: `Підтвердити обліковий запис`,
      otpPlaceholder: `000000`,
      invalidOtp: `Недійсний або прострочений код`,
      searchCountry: `Пошук країн...`,
      searchState: `Пошук штатів...`,
      searchCity: `Пошук міст/регіонів...`,
      searchLang: `Пошук мов...`,
      loading: `Завантаження...`,
      step1Desc: `Щоб почати, виберіть мову та місце розташування`,
      step2Desc: `Як ви хочете використовувати Servix?`,
      step3Desc: `Введіть свою особисту інформацію`,
      step4Desc: `Розкажіть клієнтам про свої навички`,
      confirmPassword: `Підтвердьте пароль`,
      otpLengthError: `Код повинен складатися з 6 цифр`,
    },
  } as any
  const txt = t[tempLocale] || t.en

  const { register, handleSubmit, watch, trigger, getValues, formState: { errors, isSubmitting } } = useForm<ProFormData>({
    resolver: zodResolver(selectedRole === 'professional' ? proSchema : userSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      profession: '',
      specialization: '',
      bio: '',
      price: '' as any
    }
  })

  const currentProfession = watch('profession')
  const currentCountry = countries.find(c => c.code === tempCountry)
  const currentStates = tempCountry ? getStatesOfCountry(tempCountry) : []
  const currentCities = (tempCountry && tempState) ? getCitiesOfState(tempCountry, tempState) : []

  const [translatedStates, setTranslatedStates] = useState<Record<string, string>>({})
  const [translatedCities, setTranslatedCities] = useState<Record<string, string>>({})
  const [isTranslating, setIsTranslating] = useState(tempLocale !== 'en')

  useEffect(() => {
    setIsTranslating(true)
    if (tempLocale === 'en') {
      setTranslatedStates({})
      setTranslatedCities({})
      setIsTranslating(false)
      return
    }
    let isMounted = true
    const stateObj = tempCountry ? getStatesOfCountry(tempCountry) : []
    const cityObj = (tempCountry && tempState) ? getCitiesOfState(tempCountry, tempState) : []
    const stateNames = stateObj.map(s => s.name.en)
    const cityNames = cityObj.map(c => c.name.en)
    const allTexts = [...stateNames, ...cityNames]
    if (allTexts.length === 0) { setIsTranslating(false); return }
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: allTexts, locale: tempLocale })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !Array.isArray(data)) return
        const newStates: Record<string, string> = {}
        stateObj.forEach((s, idx) => { newStates[s.id] = data[idx] || s.name.en })
        const newCities: Record<string, string> = {}
        cityObj.forEach((c, idx) => { newCities[c.id] = data[stateObj.length + idx] || c.name.en })
        setTranslatedStates(newStates)
        setTranslatedCities(newCities)
      })
      .catch(err => console.error('Translation error:', err))
      .finally(() => { if (isMounted) setIsTranslating(false) })
    return () => { isMounted = false }
  }, [tempCountry, tempState, tempLocale])

  const handleNextStep = async () => {
    if (step === 1) {
      if (!tempCountry || !tempState || !tempCity) return
      setStep(2)
    } else if (step === 2) {
      if (!selectedRole) return
      setStep(3)
    } else if (step === 3) {
      const isValid = await trigger(['firstName', 'lastName', 'email', 'password', 'confirmPassword'])
      if (isValid) {
        if (selectedRole === 'professional') { setStep(4) } else { handleSubmit(onSubmit)() }
      }
    }
  }

  const handleBackStep = () => { setStep((s) => (s - 1) as any) }

  const onSubmit = async (data: ProFormData) => {
    setAuthError(null)
    try {
      setLocale(tempLocale); setCountry(tempCountry); setState(tempState); setCity(tempCity)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ email: data.email, password: data.password })
      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('No user returned')
      setUserEmail(data.email)
      setVerificationStep(true)
    } catch (err: any) { setAuthError(err.message || 'Registration failed') }
  }

  const handleFacebook = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin + '/auth/callback?next=/' + tempLocale + '/home'
      }
    })
    if (error) {
      setAuthError(error.message)
    }
  }

  const handleVerifyOtp = async () => {
    setAuthError(null)
    try {
      if (otpCode.length < 6) { setAuthError((txt as any).otpLengthError || 'Code must be 6 digits'); return }
      const { data: verifyData, error } = await supabase.auth.verifyOtp({ email: userEmail, token: otpCode, type: 'signup' })
      if (error) throw error
      const userId = verifyData.user?.id
      if (userId) {
        const formData = getValues()
        const currentCountry = countries.find(c => c.code === tempCountry)
        const profileData = {
          id: userId, role: selectedRole,
          first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone || null,
          country_code: tempCountry, state: tempState, city: tempCity, language: tempLocale, dark_mode: false,
        }
        await (supabase.from('profiles') as any).upsert(profileData)
        useAuthStore.getState().setProfile(profileData as any)
        if (selectedRole === 'professional') {
          await (supabase.from('professional_details') as any).upsert({
            profile_id: userId, profession: formData.profession,
            specialization: formData.specialization || null, bio: formData.bio, price: formData.price,
            currency: currentCountry?.currency || 'USD', is_available: true, rating: 0, total_reviews: 0,
          })
        }
      }
      router.push(`/${tempLocale}/home`)
      router.refresh()
    } catch (err: any) { setAuthError(err.message || txt.invalidOtp) }
  }

  return (
    <div className={`min-h-screen gradient-bg flex flex-col items-center justify-center px-6 py-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full blur-[120px]" />
      </div>
      <div className="relative w-full max-w-xl animate-fade-in">
        <div className="flex gap-2 mb-8 px-4">
          {[1, 2, 3, (selectedRole === 'professional' ? 4 : null)].filter(Boolean).map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-500 flex-1 ${step >= (s as number) ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/20'}`} />
          ))}
        </div>
        <div className="glass rounded-[2.5rem] p-8 shadow-2xl border border-white/10 relative overflow-hidden">
          {verificationStep ? (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/30">
                  <Mail className="w-8 h-8 text-brand-400" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">{(txt as any).verifyTitle}</h1>
                <p className="text-white/60">{(txt as any).verifyDesc} <span className="text-white font-bold block mt-1">{userEmail}</span></p>
              </div>
              <div className="space-y-6">
                <div className="flex justify-center">
                  <input type="text" maxLength={6} value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full max-w-[280px] h-16 bg-white/5 border-2 border-white/10 rounded-2xl text-center text-3xl font-black tracking-[0.5em] text-white focus:border-brand-500 focus:bg-brand-500/10 outline-none transition-all placeholder:text-white/10"
                    placeholder={(txt as any).otpPlaceholder}
                  />
                </div>
                {authError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm justify-center">
                    <AlertCircle className="w-4 h-4" />{authError}
                  </div>
                )}
                <button onClick={handleVerifyOtp} disabled={otpCode.length < 6} className="btn-primary w-full h-14 rounded-2xl font-black text-lg">
                  {(txt as any).verifyBtn}<ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => setVerificationStep(false)} className="w-full text-center text-white/40 text-sm font-bold hover:text-white transition-colors">
                  {txt.back}
                </button>
              </div>
            </div>
          ) : (
            <>
          {step === 1 && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden p-2">
                  <Image src="/logo.png" alt="Servix Logo" width={96} height={96} className="w-full h-full object-contain" priority />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">{txt.step1}</h1>
                <p className="text-white/60">{(txt as any).step1Desc || 'Choose your language and location to start'}</p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-white/50 mb-2 ml-1">{txt.lang}</label>
                  <SearchableSelect options={locales.map(l => ({ id: l, label: localeNames[l as Locale] }))} value={tempLocale} onChange={(val) => setTempLocale(val as Locale)} placeholder={txt.lang} searchPlaceholder={(txt as any).searchLang} isRTL={isRTL} />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-white/50 mb-2 ml-1">{txt.country}</label>
                    <SearchableSelect options={countries.map(c => ({ id: c.code, label: c.name[tempLocale as keyof typeof c.name] || c.name.en }))} value={tempCountry} onChange={(val) => { setTempCountry(val); setTempState(''); setTempCity('') }} placeholder={txt.country} searchPlaceholder={(txt as any).searchCountry} isRTL={isRTL} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-white/50 mb-2 ml-1">{(txt as any).state || 'State'}</label>
                    <SearchableSelect options={currentStates.map(s => ({ id: s.id, label: translatedStates[s.id] || s.name.en || s.id }))} value={tempState} onChange={(val) => { setTempState(val); setTempCity('') }} placeholder={isTranslating ? (txt as any).loading || 'Loading...' : ((txt as any).state || 'State')} searchPlaceholder={(txt as any).searchState || 'Search states...'} disabled={!currentCountry} isRTL={isRTL} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-white/50 mb-2 ml-1">{txt.city}</label>
                    <SearchableSelect options={currentCities.map(c => ({ id: c.id, label: translatedCities[c.id] || c.name.en || c.id }))} value={tempCity} onChange={(val) => setTempCity(val)} placeholder={isTranslating ? (txt as any).loading || 'Loading...' : txt.city} searchPlaceholder={(txt as any).searchCity} disabled={!tempState} isRTL={isRTL} />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleNextStep}
                disabled={!tempCountry || !tempCity}
                className="btn-primary w-full mt-8 h-14 rounded-2xl font-black text-lg"
              >
                {txt.next}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}

          {/* Form Step 2: Role Selection (WAS STEP 1) */}
          {step === 2 && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white mb-2">{txt.step2}</h1>
                <p className="text-white/60">{(txt as any).step2Desc || 'How do you want to use Servix?'}</p>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setSelectedRole('user')}
                  className={`w-full p-6 rounded-3xl border-2 transition-all duration-300 text-left flex items-center gap-5 group relative overflow-hidden ${
                    selectedRole === 'user' 
                      ? 'border-brand-500 bg-brand-500/10' 
                      : 'border-white/5 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    selectedRole === 'user' ? 'bg-brand-500 text-white' : 'bg-white/10 text-gray-400 group-hover:text-white'
                  }`}>
                    <User className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{txt.userTitle}</h3>
                    <p className="text-sm text-white/50">{txt.userDesc}</p>
                  </div>
                  {selectedRole === 'user' && <Check className="w-6 h-6 text-brand-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('professional')}
                  className={`w-full p-6 rounded-3xl border-2 transition-all duration-300 text-left flex items-center gap-5 group relative overflow-hidden ${
                    selectedRole === 'professional' 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-white/5 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    selectedRole === 'professional' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400 group-hover:text-white'
                  }`}>
                    <Briefcase className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{txt.proTitle}</h3>
                    <p className="text-sm text-white/50">{txt.proDesc}</p>
                  </div>
                  {selectedRole === 'professional' && <Check className="w-6 h-6 text-indigo-500" />}
                </button>
              </div>

              <div className="flex gap-4 mt-8">
                <button type="button" onClick={handleBackStep} title={txt.back} aria-label={txt.back} className="h-14 px-6 glass rounded-2xl text-white font-bold flex items-center justify-center">
                  <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
                <button 
                  onClick={handleNextStep}
                  disabled={!selectedRole}
                  className="btn-primary flex-1 h-14 rounded-2xl font-black text-lg"
                >
                  {txt.next}
                  <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* Form Step 3: Account Details */}
          {step === 3 && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white mb-2">{txt.step3}</h1>
                <p className="text-white/60">{tempLocale === 'ar' ? 'أدخل معلوماتك الشخصية' : 'Enter your personal information'}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input {...register('firstName')} type="text" className="input-field text-sm" placeholder={txt.firstName} />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <input {...register('lastName')} type="text" className="input-field text-sm" placeholder={txt.lastName} />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input {...register('email')} type="email" className="input-field pl-9" placeholder={txt.email} />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input {...register('password')} type={showPassword ? 'text' : 'password'} className="input-field pl-9 pr-10" placeholder={txt.password} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input {...register('confirmPassword')} type={showPassword ? 'text' : 'password'} className="input-field pl-9" placeholder={tempLocale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={handleBackStep} title={txt.back} aria-label={txt.back} className="h-14 px-6 glass rounded-2xl text-white font-bold flex items-center justify-center">
                    <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                  </button>
                  <button 
                    type="button" 
                    onClick={handleNextStep} 
                    className="btn-primary flex-1 h-14 rounded-2xl font-black text-lg"
                  >
                    {selectedRole === 'professional' ? txt.next : txt.signUp}
                    <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-sm text-white/50">{tempLocale === 'ar' ? 'أو المتابعة بواسطة' : 'Or continue with'}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button type="button" onClick={handleFacebook} className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-3 text-white font-bold">
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  {tempLocale === 'ar' ? 'المتابعة عبر فيسبوك' : 'Continue with Facebook'}
                </button>
              </div>
            </div>
          )}

          {/* Form Step 4: Professional Info */}
          {step === 4 && selectedRole === 'professional' && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white mb-2">{txt.step4}</h1>
                <p className="text-white/60">{tempLocale === 'ar' ? 'أخبر العملاء عن مهاراتك' : 'Tell clients about your skills'}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select 
                      {...register('profession')} 
                      title={txt.profession}
                      aria-label={txt.profession}
                      className="input-field pl-9 appearance-none"
                    >
                      <option value="" disabled>{txt.profession}</option>
                      {professions.map(p => (
                        <option key={p.id} value={p.id}>{p.name[tempLocale] || p.name?.en || p.id}</option>
                      ))}
                    </select>
                  </div>

                  {currentProfession && professionSpecializations[currentProfession] && (
                    <div className="relative">
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
                      <select 
                        {...register('specialization')} 
                        title={txt.specialization}
                        aria-label={txt.specialization}
                        className="input-field pl-9 appearance-none"
                      >
                        <option value="">{txt.specialization}</option>
                        {professionSpecializations[currentProfession].map(s => (
                          <option key={s.id} value={s.id}>{s[tempLocale] || s.en || s.id}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <textarea {...register('bio')} rows={4} className="input-field resize-none py-3" placeholder={txt.bio} />
                  {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <DollarSign className="w-5 h-5 text-brand-400" />
                  <input {...register('price')} type="number" min="0" className="bg-transparent border-none outline-none text-white font-bold flex-1" placeholder={txt.price} />
                  <span className="text-gray-500 font-bold">{currentCountry?.currency || 'USD'}</span>
                </div>

                {authError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {authError}
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={handleBackStep} title={txt.back} aria-label={txt.back} className="h-14 px-6 glass rounded-2xl text-white font-bold flex items-center justify-center">
                    <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 h-14 rounded-2xl font-black text-lg">
                    {isSubmitting ? <span className="animate-spin w-5 h-5 border-2 border-white/50 border-t-white rounded-full" /> : txt.signUp}
                  </button>
                </div>
              </form>
            </div>
          )}

          </>
          )}

          <p className="text-center text-sm text-gray-500 mt-8 font-medium">
            {txt.hasAccount}{' '}
            <Link href={`/auth/login`} className="text-brand-500 font-bold hover:underline">{txt.signIn}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
