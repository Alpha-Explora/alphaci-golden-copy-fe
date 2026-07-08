import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import styles from "./subscribe-page.styles";

interface CheckoutFieldProps {
  children: ReactNode;
  description?: string;
  error?: string | null;
  htmlFor?: string;
  label: string;
}

export function CheckoutField({ children, description, error, htmlFor, label }: Readonly<CheckoutFieldProps>) {
  return (
    <label className={styles.field} data-invalid={error ? "true" : undefined} htmlFor={htmlFor}>
      <span>{label}</span>
      {description ? <em>{description}</em> : null}
      {children}
      {error ? <em className={styles.fieldError} id={htmlFor ? `${htmlFor}-error` : undefined}>{error}</em> : null}
    </label>
  );
}

type CheckoutInputProps = InputHTMLAttributes<HTMLInputElement>;

export function CheckoutInput(props: Readonly<CheckoutInputProps>) {
  return <input className={styles.checkoutInput} {...props} />;
}

interface CheckoutSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export function CheckoutSelect({ children, ...props }: Readonly<CheckoutSelectProps>) {
  return (
    <span className={styles.selectControl}>
      <select {...props}>{children}</select>
      <ChevronDownIcon />
    </span>
  );
}

interface PaymentInputShellProps {
  children: ReactNode;
  suffix: ReactNode;
  variant: "card" | "cvc";
}

export function PaymentInputShell({ children, suffix, variant }: Readonly<PaymentInputShellProps>) {
  return (
    <span className={variant === "card" ? styles.cardNumberControl : styles.cvcControl}>
      {children}
      {suffix}
    </span>
  );
}

export function CardBrandMarks() {
  return (
    <span className={styles.cardBrands} aria-label="Visa and Mastercard accepted">
      <svg className={styles.brandVisa} width="38" height="24" viewBox="0 0 38 24" role="img" aria-label="Visa">
        <rect width="38" height="24" rx="3" />
        <path d="M14.1 15.7h-2.2l1.4-7.4h2.2l-1.4 7.4Zm-4.1-7.4L7.9 13.4l-.2-1.1c-.4-1.2-1.6-2.5-3-3.2l1.9 6.6h2.4l3.5-7.4H10Zm9.1 7.6c-1 0-1.9-.2-2.5-.5l.3-1.7.3.1c.7.3 1.2.4 2.1.4.6 0 1.2-.2 1.2-.7 0-.3-.2-.5-1-.8-.8-.4-1.9-1-1.9-2.1 0-1.5 1.3-2.5 3.3-2.5.9 0 1.5.2 2 .4l-.3 1.6-.2-.1c-.4-.2-.9-.3-1.6-.3-.8 0-1.1.3-1.1.6 0 .4.4.6 1.2 1 .9.4 1.8 1 1.8 2.1 0 1.7-1.4 2.5-3.6 2.5Zm8.2-.2-.2-1.1h-2.7l-.4 1.1h-2.3l3.2-7.4h2.7l1.7 7.4h-2Zm-.5-2.7-.6-2.8-1.1 2.8h1.7Z" />
      </svg>
      <svg className={styles.brandMastercard} width="38" height="24" viewBox="0 0 38 24" role="img" aria-label="Mastercard">
        <rect width="38" height="24" rx="3" />
        <circle cx="15.2" cy="12" r="6.2" />
        <circle cx="22.8" cy="12" r="6.2" />
        <path d="M19 7.3a7 7 0 0 1 0 9.4 7 7 0 0 1 0-9.4Z" />
      </svg>
    </span>
  );
}

export function CvcIcon() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" aria-hidden="true">
      <rect x="1" y="2" width="22" height="14" rx="2" />
      <path d="M1 6h22" />
      <path d="M15 11h4" />
    </svg>
  );
}

export function SecureShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 19 6.1v5.3c0 4.4-2.8 8.3-7 9.6-4.2-1.3-7-5.2-7-9.6V6.1L12 3Z" />
      <path d="m8.6 12.1 2.1 2.1 4.7-5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}
