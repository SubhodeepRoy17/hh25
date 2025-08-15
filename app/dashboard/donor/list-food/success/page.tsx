import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <CheckCircle2 className="h-16 w-16 text-emerald-500" />
      <h1 className="text-3xl font-bold">Listing Published Successfully!</h1>
      <p className="text-gray-300 max-w-md">
        Your food listing is now visible to potential receivers. You can manage it
        from your dashboard.
      </p>
      <div className="flex gap-3 mt-6">
        <Button asChild variant="outline" className="border-emerald-500/40">
          <Link href="/dashboard/donor">Go to Dashboard</Link>
        </Button>
        <Button asChild className="bg-emerald-500 hover:bg-emerald-600">
          <Link href="/dashboard/donor">View My Listings</Link>
        </Button>
      </div>
    </div>
  );
}