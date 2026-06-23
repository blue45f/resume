import { useEffect, useState } from 'react'
import styles from './IntroSplash.module.css'

export function IntroSplash() {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, 1800)

    const removeTimer = setTimeout(() => {
      setIsVisible(false)
    }, 2600)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className={`${styles.splashOverlay} ${isFading ? styles.hidden : ''}`} aria-hidden="true">
      <div className={styles.splashBg} />

      <div className={styles.splashContent}>
        {/* Floating 3D Document Card */}
        <div className={styles.document3D}>
          <div className={styles.documentCard}>
            {/* Hologram lines representing resume formatting */}
            <div className={styles.cardHeader}>
              <div className={styles.avatarPlaceholder} />
              <div className={styles.headerLines}>
                <div className={styles.lineLong} />
                <div className={styles.lineShort} />
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.bodyLine} />
              <div className={`${styles.bodyLine} ${styles.bodyLine70}`} />
              <div className={`${styles.bodyLine} ${styles.bodyLine85}`} />
              <div className={`${styles.bodyLine} ${styles.bodyLine50}`} />
            </div>
            {/* Glowing check badge */}
            <div className={styles.badge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className={styles.splashTitle}>
          이력서 <span className={styles.accentText}>공방</span>
        </h1>
        <div className={styles.splashLine} />
        <span className={styles.splashSubtitle}>RESUME GONGBANG (BETA)</span>
      </div>
    </div>
  )
}
