import * as React from 'react'
import { Download, Share, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'fitcoach_pwa_banner_dismissed'

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  )
}

function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  React.useEffect(() => {
    if (isStandaloneMode() || dismissed) return

    if (isIosDevice()) {
      setShowIosHint(true)
      return
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [dismissed])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null)
      setDismissed(true)
    }
  }

  if (dismissed || isStandaloneMode() || (!deferredPrompt && !showIosHint)) {
    return null
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-brand/40 bg-elevated/80 px-4 py-3 text-xs">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-ink">
          <Smartphone className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ink">Instalá FITCOACH en tu celular</p>
          {deferredPrompt ? (
            <p className="text-muted">Accedé en 1 toque como una app nativa.</p>
          ) : (
            <p className="flex flex-wrap items-center gap-1 text-muted">
              Tocá <Share className="inline h-3.5 w-3.5 text-brand-text" /> <strong>Compartir</strong> y luego{' '}
              <strong>“Agregar a inicio”</strong>.
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {deferredPrompt && (
          <Button size="sm" onClick={() => void handleInstallClick()} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Instalar
          </Button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso"
          className="rounded p-1.5 text-muted hover:bg-surface hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
