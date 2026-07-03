import { ButtonLink } from "@/components/ui/button";

import { ExternalLinkIcon, GithubIcon } from "./settings-icons";
import styles from "./settings-page.module.css";
import { SettingsSection } from "./settings-section";

export function SettingsConnectionsSection() {
  return (
    <SettingsSection icon={<GithubIcon />} title="GitHub Connection" index={0}>
      <div className={styles.splitRow}>
        <div className={styles.textStack}>
          <div className={styles.inlineRow}>
            <span className="dash-status-active" />
            <span className={styles.primaryText}>
              GitHub App connected
            </span>
          </div>
          <p className={styles.secondaryText}>
            Manage your GitHub App connection from the Create Project page.
          </p>
        </div>
        <ButtonLink
          href="/workflows"
          size="sm"
          variant="ghost"
          trailingIcon={<ExternalLinkIcon size={11} />}
        >
          Manage
        </ButtonLink>
      </div>
    </SettingsSection>
  );
}
