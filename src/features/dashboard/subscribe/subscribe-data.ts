export const planLimits = {
  free: {
    projects: "3",
    releaseLanes: "Starter credits included",
    targets: "5 release targets",
    env: "25 environment keys",
    prs: "5 workflow PRs",
  },
  pro: {
    projects: "50",
    releaseLanes: "Included until finalized",
    targets: "100 deployment targets",
    env: "500 environment keys",
    prs: "100 workflow PRs",
  },
};

export const compareRows = [
  ["Projects", planLimits.free.projects, planLimits.pro.projects, "Custom"],
  ["Release lane credits", planLimits.free.releaseLanes, planLimits.pro.releaseLanes, "Custom"],
  ["Release targets", "5", "100", "Custom"],
  ["Environment keys", "25", "500", "Custom"],
  ["Workflow PRs", "5", "100", "Custom"],
] as const;
