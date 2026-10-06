'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Fingerprint,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Wifi,
  MapPin,
  KeyRound,
  X
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect') || searchParams.get('next') || '/'
  const redirectUrl = (rawRedirect === '/bites-app-web' || rawRedirect === '/bites-app-web/')
    ? '/'
    : rawRedirect.replace(/^\/bites-app-web/, '') || '/'

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberDevice, setRememberDevice] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Cargar usuario recordado previamente en este dispositivo
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('bites_saved_username')
      if (savedUser) {
        setUsernameOrEmail(savedUser)
      }
    } catch {
      // Ignorar en entornos sin localStorage
    }
  }, [])

  // Modals state
  const [helpOpen, setHelpOpen] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinValue, setPinValue] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinLoading, setPinLoading] = useState(false)

  const supabase = createClient()

  // Manejador de Login Principal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const trimmedIdentifier = usernameOrEmail.trim()
    if (!trimmedIdentifier || !password) {
      setErrorMessage('Por favor ingresa tu usuario/correo y contraseña.')
      return
    }

    setLoading(true)

    try {
      // Si el usuario no ingresó un '@', se asume el dominio interno de la empresa
      const email = trimmedIdentifier.includes('@')
        ? trimmedIdentifier
        : `${trimmedIdentifier.toLowerCase()}@bitesfood.com`

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Credenciales inválidas. Verifica tu usuario y contraseña de turno.')
        } else {
          setErrorMessage(error.message || 'Error al iniciar sesión. Inténtalo nuevamente.')
        }
        setLoading(false)
        return
      }

      if (data.session) {
        try {
          if (rememberDevice) {
            localStorage.setItem('bites_saved_username', trimmedIdentifier)
          } else {
            localStorage.removeItem('bites_saved_username')
          }
        } catch {
          // Ignorado si localStorage no está disponible
        }

        setSuccessMessage('¡Acceso concedido! Entrando al sistema...')
        setTimeout(() => {
          router.push(redirectUrl)
          router.refresh()
        }, 500)
      }
    } catch (err: unknown) {
      console.error('Error de autenticación:', err)
      setErrorMessage('Ocurrió un error inesperado al conectar con el servidor.')
      setLoading(false)
    }
  }

  // Manejador de Google Work OAuth
  const handleGoogleLogin = async () => {
    setErrorMessage(null)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
        },
      })
      if (error) {
        setErrorMessage(error.message || 'Error al conectar con Google Work.')
      }
    } catch (err) {
      console.error(err)
      setErrorMessage('No se pudo inicializar la autenticación con Google.')
    }
  }

  // Manejador de PIN rápido de turno POS
  const handlePinKey = (char: string) => {
    if (char === 'clear') {
      setPinValue('')
      setPinError(null)
      return
    }
    if (char === 'back') {
      setPinValue((prev) => prev.slice(0, -1))
      setPinError(null)
      return
    }
    if (pinValue.length < 4) {
      const nextPin = pinValue + char
      setPinValue(nextPin)
      setPinError(null)

      if (nextPin.length === 4) {
        executePinLogin(nextPin)
      }
    }
  }

  const executePinLogin = async (pin: string) => {
    setPinLoading(true)
    setPinError(null)

    // Simulación de validación de PIN de turno POS o cajero rápido
    setTimeout(async () => {
      // PINS rápidos de prueba permitidos para turnos de demostración / cajero
      if (['1234', '0000', '2407', '8888'].includes(pin)) {
        if (typeof document !== 'undefined') {
          document.cookie = 'bites_pos_session=active; path=/; max-age=2592000; SameSite=Lax'
        }
        setPinLoading(false)
        setPinModalOpen(false)
        setSuccessMessage('¡PIN verificado! Turno de cajero activado.')
        setTimeout(() => {
          router.push(redirectUrl)
          router.refresh()
        }, 400)
      } else {
        setPinLoading(false)
        setPinError('PIN incorrecto o no asignado a ningún turno activo.')
        setPinValue('')
      }
    }, 600)
  }

  return (
    <main
      className="min-h-screen w-full flex flex-col lg:flex-row bg-crumpled-paper relative overflow-hidden items-center justify-between"
      style={{ backgroundColor: '#10131B' }}
    >
      {/* Fondo de fotografía de street food y texturas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || '/bites-app-web'}/images/auth/login-bg.webp`}
          alt="Bites Street Food Atmosphere Background"
          fill
          priority
          className="object-cover object-center scale-[1.02] transform brightness-90 contrast-110"
        />
        {/* Capas de degradado para legibilidad y profundidad */}
        <div className="absolute inset-0 bg-[#090a0d]/65 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090a0d]/90 via-[#090a0d]/60 to-[#090a0d]/90 lg:to-[#090a0d]/65" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 65% 50%, rgba(245, 158, 11, 0.12) 0%, rgba(9, 10, 13, 0.4) 50%, rgba(9, 10, 13, 0.85) 100%)',
          }}
        />
      </div>

      {/* Resplandor ambiental decorativo */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-10 left-1/3 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"
      />

      {/* ======================================================== */}
      {/* SECCIÓN HERO IZQUIERDA (DESKTOP) / IDENTIDAD SUPERIOR (MÓVIL) */}
      {/* ======================================================== */}
      <section
        aria-label="BITES Street Food Branding"
        className="relative z-10 flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 xl:p-20 w-full min-h-[auto] lg:min-h-screen"
      >
        {/* Encabezado superior de marca (Izquierda) */}
        <div className="flex items-center justify-start gap-3 w-full">
          <div className="flex items-center gap-3">
            <div className="h-2 w-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-amber-500/30 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-amber-300 font-bold">
                FAST FOOD, REAL GOOD
              </span>
            </div>
          </div>
        </div>

        {/* Centro: Logotipo de Gran Impacto y Slogan */}
        <div className="my-auto max-w-xl py-6 lg:py-0 text-left w-full">
          {/* Logo centrado */}
          <div className="flex justify-center w-full">
            <div className="relative inline-block group">
              <div className="absolute -inset-8 bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-transparent rounded-3xl blur-3xl pointer-events-none" />
              <div className="relative w-44 sm:w-52 md:w-60 lg:w-[250px] xl:w-[280px] h-44 sm:h-52 md:h-60 lg:h-[250px] xl:h-[280px] mx-auto">
                <Image
                  src={`${process.env.NEXT_PUBLIC_BASE_PATH || '/bites-app-web'}/images/auth/bites-logo.png`}
                  alt="BITES Logo"
                  fill
                  priority
                  className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] filter contrast-125 brightness-105 logo-glow"
                />
              </div>
            </div>
          </div>

          {/* Tagline: SISTEMA DE LOGIN centrado */}
          <div className="flex items-center justify-center gap-3 mt-3 w-full">
            <span className="text-amber-500 font-black text-sm tracking-widest">▪</span>
            <p className="font-display uppercase text-[17px] sm:text-[23px] text-neutral-100 font-bold tracking-[0.3em] grunge-text text-center">
              SISTEMA DE LOGIN
            </p>
            <span className="text-amber-500 font-black text-sm tracking-widest">▪</span>
          </div>

          {/* Descripción (Alineada a la izquierda, sin centrar) */}
          <p className="text-neutral-300 text-xs sm:text-sm lg:text-base max-w-md mt-4 sm:mt-6 leading-relaxed lg:border-l-2 lg:border-amber-500/50 lg:pl-4 bg-gradient-to-r from-amber-500/10 to-transparent py-1.5 px-3 lg:px-4 rounded-lg text-left">
            Sistema de Operaciones, Terminal de Pedidos &amp; Punto de Venta. Ingresa con tus
            credenciales de turno asignadas.
          </p>
        </div>

        {/* Chips de Estado en Tiempo Real (Inferior, alineados a la izquierda en desktop) */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 pt-6 border-t border-neutral-800/80 text-xs text-neutral-400">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800 backdrop-blur-sm shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="font-medium text-neutral-200 tracking-wide text-[11px] sm:text-xs">
              Terminal en Línea
            </span>
          </div>
          <div className="hidden sm:block text-neutral-700">•</div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60 text-neutral-300 text-[11px] sm:text-xs">
            <MapPin className="size-3.5 text-amber-400" />
            <span className="text-neutral-400">Sucursal:</span>
            <span className="text-amber-400 font-bold tracking-wide">BOMBA BRISAS DEL ISIRO</span>
          </div>
          <div className="hidden lg:block text-neutral-700">•</div>
          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60 text-neutral-400 text-[11px]">
            <Wifi className="size-3.5 text-neutral-400" />
            <span>Red:</span>
            <span className="text-neutral-200 font-mono text-[11px]">Bites-HQ-LAN</span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECCIÓN DERECHA: TARJETA DE LOGIN SLEEK & HIGH-CONTRAST */}
      {/* ======================================================== */}
      <aside
        aria-label="Portal de Inicio de Sesión"
        className="relative z-20 w-full lg:w-[480px] xl:w-[530px] flex-shrink-0 flex items-center justify-center p-4 sm:p-6 lg:p-10 my-auto"
      >
        <div
          className="w-full max-w-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.08)] border border-amber-500/25 backdrop-blur-2xl flex flex-col justify-between space-y-6 relative overflow-hidden"
          style={{ backgroundColor: 'rgba(18, 26, 43, 0.85)' }}
        >
          {/* Acento dorado sutil en borde superior */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />

          {/* Encabezado del Card */}
          <header className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Mini logo BITES */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-950 border border-amber-500/35 flex items-center justify-center p-1.5 shadow-inner shadow-amber-500/10 overflow-hidden shrink-0">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH || '/bites-app-web'}/images/auth/bites-logo.png`}
                    alt="Logo BITES"
                    width={60}
                    height={60}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-[19px] sm:text-[23px] tracking-wider text-white">
                    BITES
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 shadow-xs">
                    STAFF POS
                  </span>
                </div>
              </div>

              {/* Botón de Ayuda */}
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="text-xs text-neutral-400 hover:text-amber-400 transition-colors font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700/60"
              >
                <HelpCircle className="w-4 h-4 text-amber-400/90" />
                <span>Ayuda</span>
              </button>
            </div>

            {/* Saludo y Título del Formulario */}
            <div>
              <h1 className="text-[23px] sm:text-[29px] font-display font-extrabold text-white tracking-wide uppercase grunge-text">
                INICIAR SESIÓN
              </h1>
              <p className="text-[11px] sm:text-[13px] text-neutral-400 mt-1">
                Bienvenido al portal operativo de{' '}
                <strong className="text-neutral-200 font-semibold">BITES Street Food</strong>.
              </p>
            </div>
          </header>

          {/* Mensajes de Alerta (Error / Éxito) */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in-50 duration-200"
            >
              <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-200"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in-50 duration-200"
            >
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Formulario de Autenticación */}
          <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-center">
            {/* Campo Usuario o Correo */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="username"
                className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300 text-left"
              >
                Usuario o Correo
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-400">
                  <User className="w-4 h-4 text-amber-400/80" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="ejemplo@bitesfood.com o ID turno"
                  className="block w-full pl-8 pr-4 py-3 bg-neutral-950/80 border border-neutral-700/80 rounded-xl text-[13px] text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition duration-150 backdrop-blur-sm text-left placeholder:text-left"
                />
              </div>
            </div>

            {/* Campo Contraseña con Toggle de Visibilidad */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-300 text-left"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline transition-colors font-medium"
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4 text-amber-400/80" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-8 pr-11 py-3 bg-neutral-950/80 border border-neutral-700/80 rounded-xl text-[13px] text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition duration-150 backdrop-blur-sm text-left placeholder:text-left"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  aria-label="Mostrar u ocultar contraseña"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-amber-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Mantener sesión iniciada */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-neutral-900 cursor-pointer"
                />
                <span className="text-[11px] text-neutral-300 group-hover:text-neutral-200 transition-colors">
                  Mantener sesión iniciada en este equipo
                </span>
              </label>
            </div>

            {/* Botón Principal Submit (Bold Street Amber) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] text-neutral-950 font-display font-black text-[15px] uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-950" />
                  <span>AUTENTICANDO...</span>
                </>
              ) : (
                <>
                  <span>ENTRAR AL SISTEMA</span>
                  <ArrowRight className="w-5 h-5 text-neutral-950 stroke-[2.5] transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Separador de Acceso Rápido */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800/80" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 rounded-full bg-neutral-900 text-neutral-400 uppercase tracking-widest text-[10px] font-bold border border-neutral-800/80">
                  O acceso rápido
                </span>
              </div>
            </div>

            {/* Accesos rápidos para personal de turno */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPinValue('')
                  setPinError(null)
                  setPinModalOpen(true)
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 hover:border-amber-500/50 border border-neutral-700/60 text-[11px] font-semibold text-neutral-300 hover:text-white transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <Fingerprint className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">PIN / Huella POS</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 hover:border-neutral-500 border border-neutral-700/60 text-[11px] font-semibold text-neutral-300 hover:text-white transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"
                    fill="currentColor"
                  />
                </svg>
                <span className="truncate">Google Work</span>
              </button>
            </div>
          </form>

          {/* Footer de Tarjeta: Versión y Seguridad */}
          <footer className="pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-neutral-300">BITES Hub v2.4</span>
              <span className="text-neutral-600">•</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                SSL Activo
              </span>
            </div>
            <div className="text-neutral-500 text-[11px]">© 2024 BITES Street Food</div>
          </footer>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MODALES INTERACTIVOS: AYUDA, RECUPERACIÓN Y PIN POS */}
      {/* ======================================================== */}

      {/* 1. Modal de PIN de Turno POS */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent className="sm:max-w-xs bg-neutral-950 border border-amber-500/30 text-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto size-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
              <KeyRound className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-white uppercase tracking-wider font-display">
              Acceso PIN de Turno
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Ingresa el código PIN de 4 dígitos asignado a tu puesto o cajero.
            </DialogDescription>
          </DialogHeader>

          {/* Display de PIN */}
          <div className="my-4">
            <div className="flex justify-center items-center gap-3">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pinValue.length > index
                return (
                  <div
                    key={index}
                    className={`size-11 rounded-xl flex items-center justify-center text-lg font-mono font-bold transition-all border ${
                      isFilled
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-600'
                    }`}
                  >
                    {isFilled ? '●' : '—'}
                  </div>
                )
              })}
            </div>

            {pinError && (
              <p className="text-center text-xs text-red-400 mt-2 font-medium">{pinError}</p>
            )}
            {pinLoading && (
              <div className="flex items-center justify-center gap-2 text-xs text-amber-400 mt-2">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Validando PIN de turno...</span>
              </div>
            )}
          </div>

          {/* Teclado Táctil POS */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handlePinKey(digit)}
                className="h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 border border-neutral-800 text-lg font-bold text-neutral-100 transition-all cursor-pointer font-mono"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePinKey('clear')}
              className="h-12 rounded-xl bg-neutral-900/50 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 active:scale-95 border border-neutral-800/80 text-xs font-bold uppercase transition-all cursor-pointer"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => handlePinKey('0')}
              className="h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 border border-neutral-800 text-lg font-bold text-neutral-100 transition-all cursor-pointer font-mono"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handlePinKey('back')}
              className="h-12 rounded-xl bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 active:scale-95 border border-neutral-800/80 text-xs font-bold uppercase transition-all cursor-pointer"
            >
              ⌫
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Modal de Ayuda & Soporte */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md bg-neutral-950 border border-neutral-800 text-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
              <HelpCircle className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white font-display uppercase tracking-wide">
              Soporte y Asistencia Operativa
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Guía de contacto para personal en turno de BITES Street Food.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-3 text-xs text-neutral-300">
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px] block">
                Supervisor de Turno
              </span>
              <p className="text-neutral-200">
                Para alta de nuevos colaboradores o reseteo de claves de caja, solicita al Gerente o
                Supervisor de guardia en la sucursal <strong>BOMBA BRISAS DEL ISIRO</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px] block">
                Soporte Técnico LAN / Punto de Venta
              </span>
              <p className="text-neutral-200 font-mono text-[11px]">
                Línea Directa: +58 (412) BITES-POS (248-3776)
                <br />
                Red WiFi POS: Bites-HQ-LAN
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setHelpOpen(false)}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold py-2.5 rounded-xl"
          >
            Entendido
          </Button>
        </DialogContent>
      </Dialog>

      {/* 3. Modal de Olvido de Contraseña */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md bg-neutral-950 border border-neutral-800 text-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
              <Lock className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white font-display uppercase tracking-wide">
              Restablecer Clave de Turno
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Política de seguridad de terminales de punto de venta.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 text-xs text-neutral-300 space-y-2">
            <p>
              Por políticas de control financiero y arqueo de caja en el restaurante, el restablecimiento
              de credenciales de turno se realiza de forma presencial por el Administrador General.
            </p>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
              💡 <strong>Tip:</strong> Si estás en modo entrenamiento o prueba local, puedes ingresar
              mediante el botón <strong>&quot;PIN / Huella POS&quot;</strong> usando el código PIN <code>1234</code>.
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setForgotPasswordOpen(false)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs py-2.5 rounded-xl"
          >
            Aceptar
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#10131B] flex items-center justify-center text-amber-400">
          <Loader2 className="size-8 animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}
