import type { AuthMeResponse } from "@/lib/api/contracts";

export function hasActiveSubscription(session: AuthMeResponse | null | undefined): boolean {
  if (!session?.authenticated) return false;
  return session.subscription.status === "active" && session.subscription.plan !== "free";
}

export function isGuest(session: AuthMeResponse | null | undefined): boolean {
  return !session?.authenticated;
}

export function getAuthenticatedRedirectPath(
  session: AuthMeResponse | null | undefined,
  nextPath: string,
): string | null {
  if (!session?.authenticated) return null;
  return getRouteAccessRedirect(session, nextPath, "paid");
}

export type RouteAccess = "public" | "authenticated" | "paid";

export function getRouteAccessRedirect(
  session: AuthMeResponse | null | undefined,
  nextPath: string,
  access: RouteAccess,
): string | null {
  if (access === "public") return null;
  if (!session?.authenticated) {
    return `/login?next=${encodeURIComponent(nextPath)}`;
  }
  if (access === "paid" && !hasActiveSubscription(session)) {
    return "/signup?step=plan";
  }
  return null;
}