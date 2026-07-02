import { PublicNav } from "@/components/layout/public-shell";

type PublicSiteNavActive = "features" | "guide" | "pricing";

interface PublicSiteNavProps {
  active?: PublicSiteNavActive;
  fixed?: boolean;
  showActions?: boolean;
}

export function PublicSiteNav(props: Readonly<PublicSiteNavProps>) {
  return <PublicNav {...props} />;
}
