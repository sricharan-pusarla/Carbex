"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveProject, rejectProject } from "@/app/actions/admin";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminProjectActions({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    const result = await approveProject(projectId);
    setLoading(null);
    if (result.success) router.refresh();
  };

  const handleReject = async () => {
    setLoading("reject");
    const result = await rejectProject(projectId);
    setLoading(null);
    if (result.success) router.refresh();
  };

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button
        size="sm"
        variant="outline"
        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={handleReject}
        disabled={!!loading}
      >
        {loading === "reject" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <><XCircle className="h-3.5 w-3.5 mr-1" /> Reject</>
        )}
      </Button>
      <Button
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={handleApprove}
        disabled={!!loading}
      >
        {loading === "approve" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve & List</>
        )}
      </Button>
    </div>
  );
}
