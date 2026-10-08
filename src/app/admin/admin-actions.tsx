import { Button } from "@/components/ui/button";
import { FileSearch } from "lucide-react";
import Link from "next/link";

export function AdminProjectActions({ projectId }: { projectId: string }) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <Button
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
        asChild
      >
        <Link href={`/admin/verify/${projectId}`}>
          <FileSearch className="h-3.5 w-3.5 mr-1" /> Review Documents
        </Link>
      </Button>
    </div>
  );
}
