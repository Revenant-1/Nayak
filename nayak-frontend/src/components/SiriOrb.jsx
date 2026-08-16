import { useEffect, useRef } from 'react'

/**
 * SiriOrb
 * -------
 * A canvas-driven glowing sphere, styled after the reference macOS/iOS
 * Siri icon: a dark glass sphere crossed by bright, additive-blended
 * ribbons of light that sweep and re-cross each other.
 *
 * The animation loop runs once (mounted for the component's lifetime).
 * Props are read through refs each frame so changing `state` retunes the
 * palette/speed live instead of restarting the animation and popping.
 *
 * Props:
 *  - state: 'sleeping' | 'listening' | 'processing'
 *  - level: 0..1 optional live mic amplitude (from useNayak). When
 *           omitted, an internal simulated amplitude is used so the orb
 *           still feels alive without microphone access.
 *  - size:  diameter in CSS pixels (default 220)
 */
export default function SiriOrb({ state = 'sleeping', level = 0, size = 220 }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(state)
  const levelRef = useRef(level)
  const rafRef = useRef(null)
  // shrink visually when sleeping so chat gets more space
  const effectiveSize = state === 'sleeping' ? Math.max(64, Math.round(size * 0.45)) : size

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    levelRef.current = level
  }, [level])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      canvas.width = effectiveSize * dpr
      canvas.height = effectiveSize * dpr
      canvas.style.width = `${effectiveSize}px`
      canvas.style.height = `${effectiveSize}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const R = effectiveSize / 2

    // Palette + motion tuning per state. Colors are drawn from the same
    // family across states so transitions never feel like a hard cut —
    // only saturation, speed, and amplitude change.
    const PALETTES = {
      sleeping: {
        sphereFrom: '#0B1230',
        sphereTo: '#050710',
        ribbons: ['#2DD4E8', '#3E63FF'],
        coreAlpha: 0.55,
        speed: 0.18,
        amp: 0.16,
        blur: 14,
      },
      listening: {
        sphereFrom: '#1A1440',
        sphereTo: '#070714',
        ribbons: ['#EC4899', '#8B5CF6', '#2DD4E8', '#14C9A5'],
        coreAlpha: 1,
        speed: 1.05,
        amp: 0.62,
        blur: 22,
      },
      processing: {
        sphereFrom: '#141238',
        sphereTo: '#06060F',
        ribbons: ['#8B5CF6', '#2DD4E8', '#EC4899'],
        coreAlpha: 0.85,
        speed: 0.5,
        amp: 0.38,
        blur: 18,
      },
    }

    let angle = 0
    let t = 0
    let raf

    const draw = () => {
      const pal = PALETTES[stateRef.current] || PALETTES.sleeping
      const liveLevel = levelRef.current || 0
      t += 0.016
      angle += 0.016 * pal.speed

      // Breathing pulse: continuous ambient motion, boosted by real mic level.
      const breathe = 0.5 + 0.5 * Math.sin(t * (stateRef.current === 'processing' ? 1.6 : 2.2))
      const amp = pal.amp * (0.6 + 0.4 * breathe) + liveLevel * 0.5

      ctx.clearRect(0, 0, effectiveSize, effectiveSize)

      // --- Sphere base -------------------------------------------------
      ctx.save()
      ctx.beginPath()
      ctx.arc(R, R, R - 1.5, 0, Math.PI * 2)
      ctx.clip()

      const sphereGrad = ctx.createRadialGradient(
        R * 0.72, R * 0.62, R * 0.05,
        R, R, R,
      )
      sphereGrad.addColorStop(0, pal.sphereFrom)
      sphereGrad.addColorStop(1, pal.sphereTo)
      ctx.fillStyle = sphereGrad
      ctx.fillRect(0, 0, size, size)

      // --- Ribbons (additive glow) --------------------------------------
      ctx.globalCompositeOperation = 'lighter'
      const ribbonCount = pal.ribbons.length
      for (let i = 0; i < ribbonCount; i++) {
        const phase = angle * (1 + i * 0.22) + i * ((Math.PI * 2) / ribbonCount)
        const a1 = phase
        const a2 = phase + Math.PI * (0.75 + 0.15 * Math.sin(t * 0.6 + i))
        const rad = R * (0.92 - i * 0.04)

        const x1 = R + Math.cos(a1) * rad
        const y1 = R + Math.sin(a1) * rad * 0.62
        const x2 = R + Math.cos(a2) * rad
        const y2 = R + Math.sin(a2) * rad * 0.62
        const cx = R + Math.cos(phase * 1.4) * rad * amp
        const cy = R + Math.sin(phase * 1.7) * rad * amp * 0.5

        const grad = ctx.createLinearGradient(x1, y1, x2, y2)
        grad.addColorStop(0, pal.ribbons[i % ribbonCount] + '00')
        grad.addColorStop(0.5, pal.ribbons[i % ribbonCount])
        grad.addColorStop(1, pal.ribbons[(i + 1) % ribbonCount] + '00')

        ctx.strokeStyle = grad
        ctx.lineWidth = effectiveSize * (0.018 + 0.01 * breathe)
        ctx.lineCap = 'round'
        ctx.shadowColor = pal.ribbons[i % ribbonCount]
        ctx.shadowBlur = pal.blur
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.quadraticCurveTo(cx, cy, x2, y2)
        ctx.stroke()
      }

      // --- Bright core flare where ribbons cross ------------------------
      const coreR = effectiveSize * (0.05 + 0.045 * breathe + liveLevel * 0.05)
      const coreGrad = ctx.createRadialGradient(R, R, 0, R, R, coreR * 3)
      coreGrad.addColorStop(0, `rgba(255,255,255,${pal.coreAlpha})`)
      coreGrad.addColorStop(0.35, `rgba(255,255,255,${pal.coreAlpha * 0.35})`)
      coreGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = coreGrad
      ctx.shadowBlur = 0
      ctx.beginPath()
      ctx.arc(R, R, coreR * 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalCompositeOperation = 'source-over'

      // --- Glass highlight (top-left sheen), gives the sphere depth ----
      const sheen = ctx.createRadialGradient(
        R * 0.68, R * 0.5, 0,
        R * 0.68, R * 0.5, R * 0.9,
      )
      sheen.addColorStop(0, 'rgba(255,255,255,0.10)')
      sheen.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = sheen
      ctx.fillRect(0, 0, effectiveSize, effectiveSize)

      // --- Rim light -----------------------------------------------------
      ctx.beginPath()
      ctx.arc(R, R, R - 1, 0, Math.PI * 2)
      ctx.lineWidth = 1.5
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'
      ctx.stroke()

      ctx.restore()

      raf = requestAnimationFrame(draw)
      rafRef.current = raf
    }

      raf = requestAnimationFrame(draw)
    rafRef.current = raf

      return () => cancelAnimationFrame(rafRef.current)
      // Intentionally excludes `state`/`level` — they're mirrored into refs
      // above so the loop keeps running without a restart.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveSize])

  const ringColor =
    state === 'listening' ? '#EC4899' : state === 'processing' ? '#2DD4E8' : '#3E63FF'

  return (
    <div className="relative flex items-center justify-center transition-all" style={{ width: effectiveSize * 1.55, height: effectiveSize * 1.55 }}>
      {/* Ambient halo behind the sphere, tinted per state */}
      <div
        className="absolute rounded-full blur-3xl transition-colors duration-700 animate-breathe"
        style={{
          width: effectiveSize * 1.15,
          height: effectiveSize * 1.15,
          backgroundColor: ringColor,
          opacity: 0.22,
        }}
      />

      {/* HUD reticle ring — the UI's signature motif, echoing the orb's own radial lines */}
      <svg
        viewBox="0 0 100 100"
        className="absolute animate-spin-slow"
        style={{ width: effectiveSize * 1.42, height: effectiveSize * 1.42 }}
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke={ringColor}
          strokeOpacity="0.35"
          strokeWidth="0.4"
          strokeDasharray="1 3"
        />
      </svg>
      <svg
        viewBox="0 0 100 100"
        className="absolute animate-spin-slow-reverse"
        style={{ width: effectiveSize * 1.28, height: effectiveSize * 1.28 }}
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke={ringColor}
          strokeOpacity="0.5"
          strokeWidth="0.6"
          strokeDasharray="0.2 6"
          strokeLinecap="round"
        />
      </svg>

      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Assistant state: ${state}`}
        className="relative rounded-full shadow-[0_0_60px_-10px_rgba(139,92,246,0.35)]"
      />
    </div>
  )
}
