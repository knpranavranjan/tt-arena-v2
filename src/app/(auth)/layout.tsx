import Link from "next/link";
import { Table2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-4 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Table2 className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
        TT Tournament Management
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
