"use client";

import { useState } from "react";
import { submitProject } from "@/app/actions/seller";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRequiredDocuments } from "@/lib/document-requirements";
import { Badge } from "@/components/ui/badge";

export function AddProjectForm() {
  const router = useRouter();
  const [projectType, setProjectType] = useState("Renewable Energy");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const requiredDocs = getRequiredDocuments(projectType);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await submitProject(formData);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "An error occurred");
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card className="border-emerald-500/20 shadow-lg text-center py-12">
        <CardContent>
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Project Submitted!</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Your project has been successfully submitted to the Carbex registry. Our automated Trust Score Engine has generated its initial audit profile. It is currently pending Admin verification.
          </p>
          <Link href="/seller">
            <Button size="lg">Return to Seller Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>All fields are required for the automated audit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Project Name</label>
            <Input name="name" required placeholder="e.g., Amazon Rainforest Conservation" minLength={5} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Description</label>
            <Textarea name="description" required placeholder="Describe the environmental impact and methodology..." minLength={20} className="h-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Project Type</label>
              <Select name="projectType" required value={projectType} onValueChange={setProjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Renewable Energy">Renewable Energy</SelectItem>
                  <SelectItem value="Reforestation">Reforestation</SelectItem>
                  <SelectItem value="Direct Air Capture">Direct Air Capture</SelectItem>
                  <SelectItem value="Methane Capture">Methane Capture</SelectItem>
                  <SelectItem value="Blue Carbon">Blue Carbon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Verification Standard</label>
              <Select name="verificationStandard" required defaultValue="Verra (VCS)">
                <SelectTrigger>
                  <SelectValue placeholder="Select standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Verra (VCS)">Verra (VCS)</SelectItem>
                  <SelectItem value="Gold Standard">Gold Standard</SelectItem>
                  <SelectItem value="American Carbon Registry">American Carbon Registry</SelectItem>
                  <SelectItem value="Climate Action Reserve">Climate Action Reserve</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="bg-muted/30 border rounded-lg p-5">
            <h3 className="font-semibold mb-1">Required Documentation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The following documents will be required in the next step based on the selected project type ({projectType}).
            </p>
            <div className="space-y-3">
              {requiredDocs.map((doc, idx) => (
                <div key={doc.id} className="flex items-center gap-3 bg-background border p-3 rounded-md shadow-sm">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm flex items-center gap-2">
                      {doc.name}
                      {doc.isRequired ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-[10px] px-1.5 py-0">REQUIRED</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">OPTIONAL</Badge>
                      )}
                    </p>
                  </div>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Location / Region</label>
              <Input name="location" required placeholder="e.g., Amazonas" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Country</label>
              <Input name="country" required placeholder="e.g., Brazil" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Methodology Name/Code</label>
            <Input name="methodology" required placeholder="e.g., VM0015 Methodology for Avoided Unplanned Deforestation" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Total Credits Issued</label>
              <Input name="totalCredits" type="number" required min={1} placeholder="e.g., 50000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Price Per Credit (₹)</label>
              <Input name="pricePerCredit" type="number" required min={1} placeholder="e.g., 850" />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 pt-6 px-6 pb-6 flex justify-between border-t">
          <Button variant="ghost" type="button" asChild>
            <Link href="/seller">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Project for Audit
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
