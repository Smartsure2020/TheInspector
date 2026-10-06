"use client";
import { Button } from "@/components/ui/primitives";

export function PrintButton() {
  return (
    <Button
      variant="primary"
      icon="print"
      onClick={() => window.print()}
      title="Opens your browser's print dialog — choose “Save as PDF”"
    >
      Print / save as PDF
    </Button>
  );
}
