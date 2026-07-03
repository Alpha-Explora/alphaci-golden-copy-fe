import type { ReactNode } from "react";

import { LockIcon, PencilIcon } from "./settings-icons";
import styles from "./settings-page.module.css";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface HoverFieldProps {
  editable?: boolean;
  label: string;
  value: string;
}

interface SettingsSectionProps {
  children: ReactNode;
  danger?: boolean;
  icon: ReactNode;
  index?: number;
  title: string;
}

export function HoverField({ label, value, editable = false }: Readonly<HoverFieldProps>) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        <span className={styles.fieldLabel}>{label}</span>
        <span className={styles.fieldIcon} aria-hidden="true">
          {editable ? <PencilIcon /> : <LockIcon />}
        </span>
      </div>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  );
}

export function SettingsSection({
  icon,
  title,
  children,
  index = 0,
  danger = false,
}: Readonly<SettingsSectionProps>) {
  return (
    <div
      className={cx(styles.card, danger && styles.cardDanger)}
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      <div
        aria-hidden="true"
        className={cx(styles.cardAccent, danger && styles.cardAccentDanger)}
      />
      <div className={cx(styles.cardHeader, danger && styles.cardHeaderDanger)}>
        <span className={cx(styles.cardIcon, danger && styles.cardIconDanger)}>
          {icon}
        </span>
        <span className={cx(styles.cardTitle, danger && styles.cardTitleDanger)}>
          {title}
        </span>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}
