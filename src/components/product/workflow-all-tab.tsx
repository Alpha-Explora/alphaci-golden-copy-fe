"use client";

import { motion } from "framer-motion";

import { productSharedStyles } from "@/components/product/product-shared-styles";
import { cn } from "@/lib/utils";

import type { CatalogTemplate } from "@/lib/api/contracts";

import { toSourcePath } from "./workflow-builder-utils";
import { workflowTabPanelStyles as tabPanelStyles } from "./workflow-tab-panel.styles";

interface WorkflowAllTabProps {
  allTemplates: CatalogTemplate[];
  onUseTemplate: (template: CatalogTemplate) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } }
};

export function WorkflowAllTab({ allTemplates, onUseTemplate }: Readonly<WorkflowAllTabProps>) {
  return (
    <motion.section
      className={tabPanelStyles.panel}
      id="workflow-panel-all"
      role="tabpanel"
      aria-labelledby="workflow-tab-all"
      tabIndex={0}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={tabPanelStyles.header}>
        <h2 className={tabPanelStyles.heading}>All Templates</h2>
        <p className={tabPanelStyles.headerMeta}>{allTemplates.length} templates loaded from cicd-workflow</p>
      </div>

      {allTemplates.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.65rem",
            padding: "3rem 1rem",
            textAlign: "center",
            background: "rgba(15, 23, 42, 0.4)",
            border: "1px solid var(--border-soft)",
            borderRadius: "1rem"
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "2.8rem",
              height: "2.8rem",
              borderRadius: "0.74rem",
              background: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--brand)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="4 17 10 11 4 5"/>
              <line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
          </span>
          <p className="helper-text" style={{ maxWidth: "36ch", margin: 0 }}>
            No templates loaded yet. Templates are sourced from <strong>cicd-workflow/workflow-templates</strong>.
          </p>
        </div>
      ) : null}

      <motion.div
        className={productSharedStyles.allTemplateGrid}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {allTemplates.map((template) => (
          <motion.article
            key={template.id}
            variants={cardVariants}
            className={cn(productSharedStyles.allTemplateCard, "glass-panel hud-glow-card")}
            whileHover={{
              y: -3,
              borderColor: "rgba(56, 189, 248, 0.3)",
              boxShadow: "var(--shadow-card), 0 0 24px rgba(56, 189, 248, 0.05)"
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--gx', String((e.clientX - rect.left) / rect.width));
              e.currentTarget.style.setProperty('--gy', String((e.clientY - rect.top) / rect.height));
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.removeProperty('--gx');
              e.currentTarget.style.removeProperty('--gy');
            }}
          >
            <div className={productSharedStyles.allTemplateHead}>
              <h3 className={productSharedStyles.templateTitle}>{template.name}</h3>
              <span className={productSharedStyles.templateStackBadge}>{template.stack}</span>
            </div>
            
            <p className={productSharedStyles.templateCardDescription}>
              {template.description}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", padding: "0.6rem 0.75rem", background: "rgba(0,0,0,0.15)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Workflow:</span>
                <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "20ch" }}>
                  {toSourcePath(template.workflowPath)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Properties:</span>
                <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "20ch" }}>
                  {toSourcePath(template.propertiesPath)}
                </span>
              </div>
            </div>

            <div className={productSharedStyles.templateTagRow}>
              {template.categories.slice(0, 4).map((category) => (
                <span key={`${template.id}-${category}`} className={productSharedStyles.templateTag}>
                  {category}
                </span>
              ))}
            </div>

            <div className={productSharedStyles.templateActionRow}>
              <button
                className="ghost-button"
                type="button"
                onClick={() => onUseTemplate(template)}
                style={{
                  width: "100%",
                  padding: "0.5rem 1rem",
                  fontSize: "0.82rem",
                  minHeight: "2.2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(56, 189, 248, 0.2)",
                  color: "var(--brand)",
                  background: "rgba(56, 189, 248, 0.04)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--brand-light)";
                  e.currentTarget.style.borderColor = "var(--brand)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(56, 189, 248, 0.04)";
                  e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.2)";
                  e.currentTarget.style.color = "var(--brand)";
                }}
              >
                Use in Create Project
              </button>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  );
}
