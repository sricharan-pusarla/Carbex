"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executePurchase } from "@/app/actions/purchase";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PurchaseFormProps {
  projectId: string;
  pricePerCredit: number;
  availableCredits: number;
}

export function PurchaseForm({ projectId, pricePerCredit, availableCredits }: PurchaseFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const subtotal = quantity * pricePerCredit;

  const handlePurchase = async () => {
    if (quantity <= 0 || quantity > availableCredits) return;
    
    setIsSubmitting(true);
    setError(null);

    const result = await executePurchase(projectId, quantity);

    setIsSubmitting(false);

    if (result.success) {
      setShowConfirm(false);
      setShowSuccess(true);
    } else {
      setError(result.error || "An error occurred.");
    }
  };

  if (availableCredits === 0) {
    return (
      <div className="bg-muted/50 p-4 rounded-xl text-center border">
        <p className="font-semibold text-muted-foreground">Sold Out</p>
        <p className="text-sm text-muted-foreground">No credits are currently available for this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="quantity" className="text-sm font-medium">Quantity (tCO₂e)</label>
        <Input 
          id="quantity"
          type="number"
          min={1}
          max={availableCredits}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="text-lg h-12"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Min: 1</span>
          <span>Max: {availableCredits.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-xl border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Price per credit</span>
          <span className="font-medium">₹{pricePerCredit.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>
      </div>

      <Button 
        size="lg" 
        className="w-full text-base h-12" 
        onClick={() => setShowConfirm(true)}
        disabled={quantity <= 0 || quantity > availableCredits}
      >
        Review Order
      </Button>

      {/* Confirmation Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Review your carbon credit transaction details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 p-3 rounded-lg flex items-start gap-3 text-sm my-4">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p><strong>Demo Transaction:</strong> No real payment will be processed. This will simulate a transaction and update your demo portfolio.</p>
          </div>

          <div className="space-y-3 mb-6 bg-muted/20 p-4 rounded-xl border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-semibold">{quantity.toLocaleString()} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per credit</span>
              <span className="font-semibold">₹{pricePerCredit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="font-bold">Total Amount</span>
              <span className="font-bold text-lg">₹{subtotal.toLocaleString()}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={(open) => {
        if (!open) {
          setShowSuccess(false);
          router.push('/dashboard');
        }
      }}>
        <DialogContent className="sm:max-w-md text-center py-12">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Purchase Successful!</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              You have successfully acquired <strong>{quantity.toLocaleString()}</strong> carbon credits. 
              <br /><br />
              They have been added to your portfolio and are ready to be held or retired.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-6">
            <Button onClick={() => router.push('/dashboard')} size="lg" className="px-8">
              View Portfolio Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
