import fs from "fs";
import path from "path";

describe("subscribe payment route", () => {
  const routePath = path.join(process.cwd(), "src/app/subscribe/page.tsx");
  const successRoutePath = path.join(
    process.cwd(),
    "src/app/subscribe/success/page.tsx",
  );
  const pagePath = path.join(
    process.cwd(),
    "src/features/dashboard/subscribe/subscribe-page.tsx",
  );
  const successPagePath = path.join(
    process.cwd(),
    "src/features/dashboard/subscribe/payment-success-page.tsx",
  );
  const stylesPath = path.join(
    process.cwd(),
    "src/features/dashboard/subscribe/subscribe-page.styles.ts",
  );
  const controlsPath = path.join(
    process.cwd(),
    "src/features/dashboard/subscribe/checkout-form-controls.tsx",
  );
  const globalStylesPath = path.join(process.cwd(), "src/app/globals.css");
  const paymentSuccessStylesPath = path.join(
    process.cwd(),
    "src/styles/payment-success.css",
  );

  it("keeps the standalone subscribe app route", () => {
    expect(fs.existsSync(routePath)).toBe(true);
    expect(fs.readFileSync(routePath, "utf8")).toContain(
      "@/features/dashboard/subscribe/subscribe-page",
    );
  });

  it("routes confirmed payments through the post-payment success page before onboarding", () => {
    const source = fs.readFileSync(pagePath, "utf8");

    expect(fs.existsSync(successRoutePath)).toBe(true);
    expect(fs.readFileSync(successRoutePath, "utf8")).toContain(
      "@/features/dashboard/subscribe/payment-success-page",
    );
    expect(source).toContain('router.replace(`/subscribe/success?${');
    expect(source).toContain('router.push(`/subscribe/success?${');
    expect(source).not.toContain('router.replace("/settings?billing=success")');
    expect(source).not.toContain('router.push("/settings?billing=success")');
  });

  it("keeps the reusable dark payment success screen", () => {
    expect(fs.existsSync(successPagePath)).toBe(true);
    const source = fs.readFileSync(successPagePath, "utf8");

    expect(source).toContain("UsageCreditCard");
    expect(source).toContain("DashboardShell");
    expect(source).toContain("DashboardPageContent");
    expect(source).toContain("AppNav");
    expect(source).toContain("WorkspaceProvider");
    expect(source).toContain("useAuthSession");
    expect(source).toContain('href="/onboarding"');
    expect(source).toContain("Get started");
    expect(source).toContain("Your Starter plan is active");
    expect(source).toContain("payment-success-card-pop");
    expect(source).toContain("payment-success-copy-pop");
    expect(source).toContain("payment-success-action-pop");
    expect(source).not.toContain('href="/home"');
  });

  it("keeps the payment success card bottom-pop animation accessible", () => {
    const globalStyles = fs.readFileSync(globalStylesPath, "utf8");
    const paymentSuccessStyles = fs.readFileSync(paymentSuccessStylesPath, "utf8");

    expect(globalStyles).toContain('../styles/payment-success.css');
    expect(paymentSuccessStyles).toContain("payment-success-card-pop");
    expect(paymentSuccessStyles).toContain("@keyframes paymentSuccessCardPop");
    expect(paymentSuccessStyles).toContain("@keyframes paymentSuccessDetailPop");
    expect(paymentSuccessStyles).toContain("prefers-reduced-motion: reduce");
  });

  it("keeps the custom payment form while tokenizing through PayMongo", () => {
    const source = fs.readFileSync(pagePath, "utf8");
    const controls = fs.readFileSync(controlsPath, "utf8");

    expect(source).toContain("Save payment details");
    expect(source).toContain("Billing name");
    expect(source).toContain("Summary");
    expect(source).toContain("createSubscriptionPaymentIntent");
    expect(source).toContain("getPaymentIntentStatus");
    expect(source).toContain("https://api.paymongo.com/v1/payment_methods");
    expect(source).toContain("/attach");
    expect(source).toContain("NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY");
    expect(source).toContain("PaymentInputShell");
    expect(source).toContain("Card number");
    expect(source).toContain("maxLength={3}");
    expect(source).toContain("setSecurityCode(onlyDigits(event.target.value, 3))");
    expect(source).toContain("Your card number is invalid.");
    expect(source).toContain("Card details are encrypted and never stored by AlphaCI.");
    expect(source).toContain("<dt>Subscription</dt>");
    expect(source).toContain('href="/signup?step=plan"');
    expect(source).toContain('{"\\u20B1"}300');
    expect(source).toContain("CheckoutField");
    expect(source).not.toContain("Payment checkout is unavailable in this environment.");
    expect(controls).toContain("brandVisa");
    expect(controls).toContain("brandMastercard");
    expect(controls).not.toContain("brandAmex");
    expect(controls).not.toContain("brandJcb");
    expect(source).not.toContain("Prorated subscription");
    expect(source).not.toContain("Bill as company");
    expect(source).not.toContain("PublicSubscribePage");
  });

  it("keeps the left payment form independently scrollable", () => {
    const styles = fs.readFileSync(stylesPath, "utf8");

    expect(styles).toContain("grid-cols-[minmax(520px,1fr)_minmax(430px,1fr)]");
    expect(styles).toContain("formPanel:");
    expect(styles).toContain("overflow-y-auto");
    expect(styles).toContain("selectControl:");
    expect(styles).toContain("cardBrands:");
    expect(styles).toContain("bg-[var(--bg-base)]");
  });
});
