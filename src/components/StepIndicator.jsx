import styles from './StepIndicator.module.css'

// Accepts a dynamic `steps` array so phases can extend it without touching this component
export default function StepIndicator({ current, steps }) {
  return (
    <nav className={styles.nav} aria-label="Progress">
      {steps.map((label, index) => {
        const step = index + 1
        const isDone   = step < current
        const isActive = step === current
        return (
          <div key={label} className={styles.stepWrapper}>
            <div className={`${styles.step} ${isActive ? styles.active : ''} ${isDone ? styles.done : ''}`}>
              <div className={styles.bubble} aria-hidden="true">
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 6 5 9 10 3" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span className={styles.label}>{label}</span>
            </div>
            {index < steps.length - 1 && <div className={styles.line} aria-hidden="true" />}
          </div>
        )
      })}
    </nav>
  )
}
