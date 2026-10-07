"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeRetirement } from "@/app/actions/retire";
import { Loader2, ShieldAlert, Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RetireClientProps {
  ownershipId: string;
  projectName: string;
  maxQuantity: number;
}

export function RetireClient({ ownershipId, projectName, maxQuantity }: RetireClientProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number>(maxQuantity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetire = async () => {
    if (quantity <= 0 || quantity > maxQuantity) return;
    
    setIsSubmitting(true);
    setError(null);

    const result = await executeRetirement(ownershipId, quantity);

    if (result.success && result.retirementId) {
      router.push(`/retire/certificate/${result.retirementId}`);
    } else {
      setIsSubmitting(false);
      setError(result.error || "An error occurred.");
    }
  };

  return (
    <Card className="border-emerald-500/20 shadow-lg shadow-emerald-500/5">
      <CardHeader className="bg-emerald-500/5 pb-6 border-b border-emerald-500/10">
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
          <Leaf className="h-8 w-8 text-emerald-500" />
        </div>
        <CardTitle className="text-center text-2xl">Confirm Retirement</CardTitle>
        <CardDescription className="text-center">
          You are about to retire credits from <strong>{projectName}</strong>.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-8 space-y-6">
        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 p-4 rounded-xl flex items-start gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <p>
            <strong>Warning:</strong> Retirement is a permanent action. 
            Once retired, these credits can never be sold, transferred, or used again. 
            A public certificate will be generated to prove your climate action.
          </p>
        </div>

        <div className="space-y-3">
          <label htmlFor="quantity" className="text-sm font-semibold">Amount to Retire (tCO₂e)</label>
          <Input 
            id="quantity"
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="text-lg h-14"
          />
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Minimum: 1</span>
            <span>Available to retire: {maxQuantity.toLocaleString()}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md">{error}</p>}
      </CardContent>
      
      <CardFooter className="flex gap-4 pt-4 pb-8 px-6">
        <Button variant="outline" asChild className="w-1/3 h-12" disabled={isSubmitting}>
          <Link href="/dashboard">Cancel</Link>
        </Button>
        <Button 
          className="w-2/3 h-12 bg-emerald-600 hover:bg-emerald-700 text-white" 
          onClick={handleRetire}
          disabled={isSubmitting || quantity <= 0 || quantity > maxQuantity}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Permanently Retire Credits
        </Button>
      </CardFooter>
    </Card>
  );
}
