import { useEffect, useRef, useState } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
}

export default function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 2000)
    const destroyTimer = setTimeout(() => setIsVisible(false), 2700)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(destroyTimer)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const nodes: Node[] = []
    const nodeCount = 35

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2,
      })
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    let frame = 0
    const render = () => {
      frame++
      ctx.fillStyle = '#0a0d14' // Clean Slate Navy Blue
      ctx.fillRect(0, 0, width, height)

      // Technical Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.03)'
      ctx.lineWidth = 1
      const size = 50
      for (let x = 0; x < width; x += size) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += size) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Draw Nodes & Connective Links
      nodes.forEach((n, idx) => {
        if (!n) return
        n.x += n.vx
        n.y += n.vy

        if (n.x < 0 || n.x > width) n.vx *= -1
        if (n.y < 0 || n.y > height) n.vy *= -1

        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(56, 189, 248, ${n.alpha})`
        ctx.fill()

        // Connections
        for (let j = idx + 1; j < nodes.length; j++) {
          const n2 = nodes[j]
          if (!n2) continue
          const dx = n.x - n2.x
          const dy = n.y - n2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(n.x, n.y)
            ctx.lineTo(n2.x, n2.y)
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 100) * 0.15})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })

      // Main Text
      const text = 'HEEJUN PORTFOLIO'
      ctx.font = '900 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.letterSpacing = '5px'
      ctx.fillStyle = '#ffffff'
      ctx.shadowBlur = 10
      ctx.shadowColor = 'rgba(56, 189, 248, 0.4)'

      const progress = Math.min(frame / 40, 1)
      const currentText = text.substring(0, Math.floor(text.length * progress))
      ctx.fillText(currentText, width / 2, height / 2)
      ctx.shadowBlur = 0

      // Sub
      ctx.font = '500 9px monospace'
      ctx.letterSpacing = '2px'
      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)'
      ctx.fillText('PROFESSIONAL RESUME CONSOLE', width / 2, height / 2 + 30)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0d14',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
