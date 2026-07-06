"use client";

import { ClipboardEvent, KeyboardEvent, useEffect, useMemo, useRef } from "react";

type InputOTPProps = {
  autoFocus?: boolean;
  disabled?: boolean;
  id?: string;
  label?: string;
  length?: number;
  name?: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  value: string;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function clampToLength(value: string, length: number) {
  return digitsOnly(value).slice(0, length);
}

export function InputOTP({
  autoFocus = false,
  disabled = false,
  id,
  label = "Verification code",
  length = 6,
  name = "code",
  onChange,
  onComplete,
  value,
}: Readonly<InputOTPProps>) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const normalizedValue = clampToLength(value, length);
  const slots = useMemo(
    () => Array.from({ length }, (_, index) => normalizedValue[index] ?? ""),
    [length, normalizedValue],
  );

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function updateAt(index: number, nextValue: string) {
    const nextSlots = [...slots];
    nextSlots[index] = digitsOnly(nextValue).slice(-1);
    const nextCode = nextSlots.join("");
    onChange(nextCode);

    if (nextSlots[index] && index < length - 1) {
      refs.current[index + 1]?.focus();
    }

    if (nextCode.length === length) {
      onComplete?.(nextCode);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pastedCode = clampToLength(event.clipboardData.getData("text"), length);
    onChange(pastedCode);
    refs.current[Math.min(pastedCode.length, length - 1)]?.focus();

    if (pastedCode.length === length) {
      onComplete?.(pastedCode);
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !slots[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input name={name} type="hidden" value={normalizedValue} />
      <div aria-label={label} className="flex items-center gap-3" role="group">
        {slots.map((slot, index) => (
          <input
            aria-label={`${label} digit ${index + 1}`}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            className="size-12 rounded-md border border-slate-600 bg-slate-950/70 p-0 text-center font-[var(--font-dash-body)] text-xl font-semibold leading-none text-slate-50 shadow-none transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/25 disabled:cursor-not-allowed disabled:opacity-55 sm:size-14"
            disabled={disabled}
            id={index === 0 ? id : undefined}
            inputMode="numeric"
            key={index}
            maxLength={1}
            onChange={(event) => updateAt(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            pattern="[0-9]*"
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="text"
            value={slot}
          />
        ))}
      </div>
    </div>
  );
}
