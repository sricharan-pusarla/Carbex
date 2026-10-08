"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { approveVerification, rejectVerification, requestCorrection } from "@/app/actions/admin-verification";
import { Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminReviewForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | "correct" | null>(null);

  const handleAction = async (action: "approve" | "reject" | "correct") => {
    if (!comments.trim() && action !== "approve") {
      alert("Admin comments are required when rejecting or requesting correction.");
      return;
    }

    setLoading(action);
    let result;

    if (action === "approve") {
      result = await approveVerification(projectId, comments);
    } else if (action === "reject") {
      result = await rejectVerification(projectId, comments);
    } else if (action === "correct") {
      result = await requestCorrection(projectId, comments);
    }

    setLoading(null);
    if (result?.success) {
      router.refresh();
    }
  };

  return (
    <Card className="mt-8 border-primary/20 shadow-md">
      <CardHeader className="bg-muted/30">
        <CardTitle>Admin Decision</CardTitle>
        <CardDescription>Provide feedback and finalize the verification status of this project.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <label className="text-sm font-semibold">Admin Comments / Feedback</label>
          <Textarea 
            placeholder="Explain your decision or list exactly what documents need to be corrected..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 pt-6 px-6 pb-6 flex flex-wrap gap-4 justify-between border-t">
        <Button 
          variant="outline" 
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => handleAction("reject")}
          disabled={!!loading}
        >
          {loading === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
          Reject Project
        </Button>

        <div className="flex gap-4">
          <Button 
            variant="outline"
            className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            onClick={() => handleAction("correct")}
            disabled={!!loading}
          >
            {loading === "correct" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            Request Correction
          </Button>

          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => handleAction("approve")}
            disabled={!!loading}
          >
            {loading === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Approve & Verify
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
