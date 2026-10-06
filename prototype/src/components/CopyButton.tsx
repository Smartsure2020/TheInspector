"use client";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonVariant } from "@/components/ui/primitives";
import { LiveRegion } from "@/components/ui/Overlay";

export function CopyButton({
  text, label, variant = "secondary", className = "",
}: { text: string; label: string; variant?: ButtonVariant; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), 2500);
  };

  return (
    <>
      <Button
        variant={state === "copied" ? "accent" : variant}
        icon={state === "copied" ? "check" : state === "failed" ? "alert" : "copy"}
        onClick={copy}
        className={className}
      >
        {state === "copied" ? "Copied" : state === "failed" ? "Couldn’t copy — select the text instead" : label}
      </Button>
      <LiveRegion message={state === "copied" ? `${label}: copied to your clipboard` : state === "failed" ? "Copy failed. Select the text and copy it manually." : ""} />
    </>
  );
}
