import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="font-mono text-4xl font-black text-primary">404</p>
      <h1 className="text-lg font-extrabold">الصفحة غير موجودة</h1>
      <Button asChild className="mt-1">
        <Link href="/">الرجوع للتقدم</Link>
      </Button>
    </div>
  );
}
