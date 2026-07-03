import styles from "./activity-strip.module.css";

const RECENT_ACTIVITY = [
  { repo: "payments-api", action: "Production release approved", time: "2m ago" },
  { repo: "auth-service", action: "Tests passed (142/142)", time: "8m ago" },
  { repo: "frontend", action: "Release lane healthy", time: "15m ago" },
  { repo: "worker", action: "Lint + security check", time: "23m ago" },
];

export function ActivityStrip() {
  return (
    <section className={styles.section} data-activity-strip="true" aria-label="Recent activity">
      <div className={styles.header}>
        <p className={styles.path}>activity/recent.log</p>
        <span className={styles.liveDot} aria-hidden="true" />
        <span className={styles.liveLabel}>live</span>
      </div>

      <div className={styles.list}>
        {RECENT_ACTIVITY.map((item) => (
          <div key={item.repo} className={styles.item} data-activity-item="true">
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.repo}>{item.repo}</span>
            <span className={styles.action}>{item.action}</span>
            <span className={styles.time}>{item.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
