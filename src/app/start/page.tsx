'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Check, X, Loader2, ArrowRight, ArrowLeft, Sparkles, Palette, Type, PartyPopper, Copy, ExternalLink } from 'lucide-react'

/* ─── constants ─── */
const THEME_PRESETS = [
  { name: 'Midnight', color: '#000000', bg: 'linear-gradient(135deg,#0a0a0f,#1a1a2e)' },
  { name: 'Ocean', color: '#0ea5e9', bg: 'linear-gradient(135deg,#0c4a6e,#0ea5e9)' },
  { name: 'Emerald', color: '#10b981', bg: 'linear-gradient(135deg,#064e3b,#10b981)' },
  { name: 'Sunset', color: '#f97316', bg: 'linear-gradient(135deg,#7c2d12,#f97316)' },
  { name: 'Rose', color: '#f43f5e', bg: 'linear-gradient(135deg,#881337,#f43f5e)' },
  { name: 'Violet', color: '#8b5cf6', bg: 'linear-gradient(135deg,#4c1d95,#8b5cf6)' },
]
const FONTS = ['Inter','Poppins','Outfit','Space Grotesk','DM Sans','Playfair Display']
const STEPS = ['username','account','style','done'] as const
type Step = typeof STEPS[number]

export default function StartPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('username')
  const [dir, setDir] = useState(1) // 1=forward, -1=back

  // ── username step ──
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'|'invalid'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // ── account step ──
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPw, setShowPw] = useState(false)

  // ── style step ──
  const [themeColor, setThemeColor] = useState('#10b981')
  const [fontFamily, setFontFamily] = useState('Inter')

  // ── shared ──
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [confetti, setConfetti] = useState(false)

  // read referral cookie (httpOnly so we read from cookie header on register)
  useEffect(() => {
    const c = document.cookie.split('; ').find(r => r.startsWith('fomkart_ref='))
    if (c) setReferralCode(c.split('=')[1])
  }, [])

  /* ─── username availability check ─── */
  const checkUsername = useCallback((slug: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const clean = slug.trim().toLowerCase()
    if (!clean || clean.length < 3) { setUsernameStatus(clean ? 'invalid' : 'idle'); return }
    if (!/^[a-z0-9_-]+$/.test(clean)) { setUsernameStatus('invalid'); return }
    setUsernameStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?slug=${encodeURIComponent(clean)}`)
        const json = await res.json()
        setUsernameStatus(json.available ? 'available' : 'taken')
      } catch { setUsernameStatus('invalid') }
    }, 400)
  }, [])

  const onUsernameChange = (v: string) => {
    const clean = v.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase().slice(0, 30)
    setUsername(clean)
    checkUsername(clean)
  }

  /* ─── navigation ─── */
  const go = (s: Step, direction = 1) => { setDir(direction); setError(''); setStep(s) }

  const canAdvanceUsername = usernameStatus === 'available' && username.length >= 3
  const canAdvanceAccount = email.includes('@') && password.length >= 6

  /* ─── register ─── */
  const handleRegister = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password, username,
          full_name: fullName || username,
          referralCode: referralCode || undefined,
          theme_color: themeColor,
          font_family: fontFamily,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Registration failed')

      // Auto-login
      const { supabase } = await import('@/lib/supabase')
      await supabase.auth.signInWithPassword({ email, password })

      go('done')
    } catch (e: any) { setError(e.message || 'Something went wrong') }
    finally { setLoading(false) }
  }

  /* ─── confetti on done ─── */
  useEffect(() => {
    if (step === 'done') { setConfetti(true); setTimeout(() => setConfetti(false), 4000) }
  }, [step])

  const profileUrl = `fomkart.com/creator/${username}/bio`

  /* ─── step index for progress ─── */
  const si = STEPS.indexOf(step)
  const progress = ((si + 1) / STEPS.length) * 100

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      <style>{`
        ${FONTS.map(f => `@import url('https://fonts.googleapis.com/css2?family=${f.replace(/ /g, '+')}:wght@400;500;600;700&display=swap');`).join('\n')}
      `}</style>
      {/* Animated BG orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse" style={{background:themeColor}} />
        <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full opacity-15 blur-3xl animate-pulse" style={{background:themeColor, animationDelay:'1s'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{background:themeColor}} />
      </div>

      {/* Confetti */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({length:60}).map((_,i) => (
            <div key={i} className="absolute rounded-sm" style={{
              width: Math.random()*8+4, height: Math.random()*8+4,
              background: ['#10b981','#f59e0b','#ec4899','#8b5cf6','#3b82f6','#ef4444'][i%6],
              left: `${Math.random()*100}%`, top: '-5%',
              animation: `confettiFall ${2+Math.random()*2}s linear ${Math.random()*0.5}s forwards`,
              transform: `rotate(${Math.random()*360}deg)`,
            }} />
          ))}
          <style>{`@keyframes confettiFall { to { top: 110%; opacity: 0; transform: rotate(720deg) translateX(${Math.random()>0.5?'':'-'}80px); } }`}</style>
        </div>
      )}

      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors z-10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{background:themeColor}}>F</div>
        <span className="text-lg font-semibold tracking-tight">fomkart</span>
      </Link>

      {/* Progress bar */}
      {step !== 'done' && (
        <div className="w-full max-w-md mb-8 z-10">
          <div className="flex justify-between text-xs text-white/40 mb-2">
            <span>Step {si+1} of {STEPS.length - 1}</span>
            <span>{['Choose username','Create account','Style your page'][si]}</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{width:`${progress}%`, background:themeColor}} />
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* ════════ STEP: USERNAME ════════ */}
          {step === 'username' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{background:`${themeColor}20`}}>
                  <Sparkles className="w-7 h-7" style={{color:themeColor}} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Choose your username</h1>
                <p className="text-white/50 text-sm">This will be your unique link on fomkart</p>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium select-none">fomkart.com/@</span>
                  <input
                    id="username-input"
                    value={username}
                    onChange={e => onUsernameChange(e.target.value)}
                    placeholder="yourname"
                    autoFocus
                    className="w-full pl-[8.5rem] pr-12 py-4 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 focus:ring-2 focus:ring-white/5 transition-all text-sm"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-white/40 animate-spin" />}
                    {usernameStatus === 'available' && <Check className="w-5 h-5 text-emerald-400" />}
                    {usernameStatus === 'taken' && <X className="w-5 h-5 text-red-400" />}
                    {usernameStatus === 'invalid' && <X className="w-5 h-5 text-amber-400" />}
                  </div>
                </div>
                {usernameStatus === 'taken' && (
                  <p className="text-red-400 text-xs mt-2">That username is taken. Try <button onClick={() => onUsernameChange(username + Math.floor(Math.random()*99))} className="underline">{username}{Math.floor(Math.random()*99)}</button></p>
                )}
                {usernameStatus === 'invalid' && username && (
                  <p className="text-amber-400 text-xs mt-2">3-30 chars, letters, numbers, - and _ only</p>
                )}
                {usernameStatus === 'available' && (
                  <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1"><Check className="w-3 h-3"/>Perfect! This username is available</p>
                )}
              </div>

              <button
                onClick={() => go('account')}
                disabled={!canAdvanceUsername}
                className="w-full py-4 rounded-2xl font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{background: canAdvanceUsername ? themeColor : 'rgba(255,255,255,0.1)'}}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-white/30 text-xs">
                Already have an account? <Link href="/auth/login" className="text-white/60 hover:text-white underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ════════ STEP: ACCOUNT ════════ */}
          {step === 'account' && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
                <p className="text-white/50 text-sm">as <span className="text-white/80 font-medium">@{username}</span></p>
              </div>

              <div className="space-y-3">
                <input
                  id="fullname-input"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Full name (optional)"
                  className="w-full px-4 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-all text-sm"
                />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-4 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-all text-sm"
                />
                <div className="relative">
                  <input
                    id="password-input"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password (min 6 chars)"
                    className="w-full px-4 py-3.5 pr-12 bg-white/[0.06] border border-white/[0.1] rounded-2xl text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => go('username',-1)} className="px-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white transition-all">
                  <ArrowLeft className="w-4 h-4"/>
                </button>
                <button
                  onClick={() => go('style')}
                  disabled={!canAdvanceAccount}
                  className="flex-1 py-3.5 rounded-2xl font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{background: canAdvanceAccount ? themeColor : 'rgba(255,255,255,0.1)'}}
                >
                  Continue <ArrowRight className="w-4 h-4"/>
                </button>
              </div>

              <p className="text-center text-white/25 text-[11px] leading-relaxed">
                By creating an account you agree to our <Link href="/terms" className="underline text-white/40">Terms</Link> and <Link href="/privacy" className="underline text-white/40">Privacy Policy</Link>
              </p>
            </div>
          )}

          {/* ════════ STEP: STYLE ════════ */}
          {step === 'style' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{background:`${themeColor}20`}}>
                  <Palette className="w-7 h-7" style={{color:themeColor}} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Style your page</h1>
                <p className="text-white/50 text-sm">Pick a theme color and font</p>
              </div>

              {/* Color Presets */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block font-medium">Theme Color</label>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_PRESETS.map(t => (
                    <button
                      key={t.name}
                      onClick={() => setThemeColor(t.color)}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left ${themeColor === t.color ? 'border-white/40 scale-[1.02]' : 'border-transparent hover:border-white/10'}`}
                      style={{background:t.bg}}
                    >
                      <span className="text-white text-xs font-medium">{t.name}</span>
                      {themeColor === t.color && <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-white"/>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Picker */}
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block font-medium flex items-center gap-1.5"><Type className="w-3.5 h-3.5"/>Font</label>
                <div className="grid grid-cols-2 gap-2">
                  {FONTS.map(f => (
                    <button
                      key={f}
                      onClick={() => setFontFamily(f)}
                      className={`px-4 py-3 rounded-xl border transition-all text-sm ${fontFamily === f ? 'border-white/30 bg-white/10 text-white' : 'border-white/[0.06] bg-white/[0.03] text-white/50 hover:text-white/80 hover:border-white/10'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Mini */}
              <div className="rounded-2xl overflow-hidden border border-white/[0.08]" style={{background:`${themeColor}10`}}>
                <div className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-2" style={{background:themeColor}} />
                  <p className="text-white font-semibold text-sm" style={{fontFamily}}>{fullName || username}</p>
                  <p className="text-white/40 text-xs">@{username}</p>
                  <div className="mt-3 py-2 px-4 rounded-lg text-xs font-medium text-white" style={{background:themeColor}}>
                    View My Store
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => go('account',-1)} className="px-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white transition-all">
                  <ArrowLeft className="w-4 h-4"/>
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-2xl font-semibold text-white transition-all disabled:opacity-60 hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{background:themeColor}}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Creating...</> : <>Publish my page <Sparkles className="w-4 h-4"/></>}
                </button>
              </div>
            </div>
          )}

          {/* ════════ STEP: DONE ════════ */}
          {step === 'done' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{background:`${themeColor}20`}}>
                <PartyPopper className="w-8 h-8" style={{color:themeColor}} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">You&apos;re live! 🎉</h1>
                <p className="text-white/50 text-sm">Your page is ready to share with the world</p>
              </div>

              {/* Profile Link */}
              <div className="bg-white/[0.06] border border-white/[0.1] rounded-2xl p-4 flex items-center justify-between">
                <span className="text-white/80 text-sm truncate">{profileUrl}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(`https://${profileUrl}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="ml-3 p-2 rounded-lg transition-all hover:bg-white/10"
                  style={{color:themeColor}}
                >
                  {copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/creator/${username}/bio`)}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{background:themeColor}}
                >
                  View my page <ExternalLink className="w-4 h-4"/>
                </button>
                <button
                  onClick={() => router.push(`/creator/${username}`)}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white/80 bg-white/[0.06] border border-white/[0.1] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  Go to my store
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-white/20 text-xs z-10">© {new Date().getFullYear()} fomkart. All rights reserved.</p>
    </div>
  )
}
