import type { ReactNode } from "react";

interface ArabicTextProps {
  children: ReactNode;
  className?: string;
}

export default function ArabicText({ children, className }: ArabicTextProps) {
  return (
    <span dir="rtl" lang="ar" className={["arabic", className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
