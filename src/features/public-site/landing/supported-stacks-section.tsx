import styles from "./supported-stacks-section.module.css";

const STACKS = [
  { name: "Next.js", dot: "var(--brand)" },
  { name: "NestJS", dot: "#e0234e" },
  { name: "React", dot: "#61dafb" },
  { name: "Node.js", dot: "#68a063" },
  { name: "React Native", dot: "var(--brand)" },
  { name: "Expo", dot: "rgba(255,255,255,0.5)" },
  { name: "Kotlin", dot: "#7f52ff" },
  { name: "Go", dot: "#00acd7" },
  { name: "Python", dot: "#3572a5" },
  { name: "Rust", dot: "#ce422b" },
  { name: "Vue.js", dot: "#41b883" },
  { name: "Svelte", dot: "#ff3e00" },
];

const LOOPED_STACKS = [...STACKS, ...STACKS];

export function SupportedStacksSection() {
  return (
    <section className={styles.section} aria-label="Supported Ecosystems">
      <div className={styles.divider} />
      <p className={styles.label}>Supported stacks</p>

      <div className={styles.container}>
        <div className={styles.track}>
          {LOOPED_STACKS.map((stack, index) => {
            const isDuplicate = index >= STACKS.length;

            return (
              <div
                key={`${stack.name}-${index}`}
                className={styles.badge}
                data-stack-badge="true"
                data-stack-name={stack.name}
                aria-hidden={isDuplicate ? "true" : undefined}
              >
                <span
                  className={styles.dot}
                  style={{ background: stack.dot, boxShadow: `0 0 6px ${stack.dot}` }}
                  aria-hidden="true"
                />
                {stack.name}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.divider} />
    </section>
  );
}
