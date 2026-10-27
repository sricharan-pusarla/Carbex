"use client";

import { useState, useRef } from "react";
import { submitProject } from "@/app/actions/seller";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, FileText, Upload, Trash2, Eye, AlertCircle, Info, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRequiredDocuments, validatePdfFileMeta, MAX_PDF_SIZE_MB } from "@/lib/document-requirements";
import { Badge } from "@/components/ui/badge";

export function AddProjectForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projectType, setProjectType] = useState("Renewable Energy");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Consolidated PDF upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const requiredDocs = getRequiredDocuments(projectType);

  const handleFileSelection = (file: File | null) => {
    if (!file) return;

    // Validate using central helper
    const validation = validatePdfFileMeta(file.name, file.size, file.type);
    if (!validation.valid) {
      setFileError(validation.error || "Invalid PDF file selected.");
      return;
    }

    setFileError(null);
    setError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError("Please select and upload your consolidated project PDF document before submitting.");
      return;
    }

    const validation = validatePdfFileMeta(selectedFile.name, selectedFile.size, selectedFile.type);
    if (!validation.valid) {
      setError(validation.error || "The selected file is invalid.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formElement = event.currentTarget;
      const formData = new FormData(formElement);
      formData.set("consolidated_document", selectedFile);

      const result = await submitProject(formData);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "An error occurred while submitting the project.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during submission.");
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
          <h2 className="text-2xl font-bold mb-2">Project Dossier Submitted!</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Your project details and consolidated verification dossier have been securely submitted to the Carbex registry. The project is pending Administrator verification before credits can be listed.
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
          <CardDescription>Provide project metadata and upload your consolidated verification dossier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Project Name</label>
            <Input name="name" required placeholder="e.g., Amazon Rainforest Conservation" minLength={5} disabled={isSubmitting} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Description</label>
            <Textarea name="description" required placeholder="Describe the environmental impact, additionality, and methodology..." minLength={20} className="h-32" disabled={isSubmitting} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Project Type</label>
              <Select name="projectType" required value={projectType} onValueChange={setProjectType} disabled={isSubmitting}>
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
              <Select name="verificationStandard" required defaultValue="Verra (VCS)" disabled={isSubmitting}>
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

          {/* SINGLE CONSOLIDATED PDF UPLOAD SECTION */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span>Upload Consolidated Project Documents (PDF) <span className="text-red-500">*</span></span>
                <span className="text-xs font-normal text-muted-foreground">PDF only • Max {MAX_PDF_SIZE_MB}MB</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a single PDF containing all required verification reports, certificates, and legal documentation.
              </p>
            </div>

            {/* Hidden native file input */}
            <input 
              ref={fileInputRef}
              type="file" 
              name="consolidated_document_input"
              className="hidden" 
              accept=".pdf,application/pdf"
              disabled={isSubmitting}
              onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
            />

            {!selectedFile ? (
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center ${
                  isDragging 
                    ? "border-emerald-500 bg-emerald-500/10" 
                    : "border-border hover:border-emerald-500/50 hover:bg-muted/40"
                } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Click to select or drag and drop your consolidated PDF
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Single consolidated PDF document up to {MAX_PDF_SIZE_MB} MB
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 pointer-events-none"
                  disabled={isSubmitting}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Select PDF File
                </Button>
              </div>
            ) : (
              <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)} • <span className="text-emerald-600 font-medium">Ready for upload</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-xs" 
                    title="Preview PDF in new tab"
                    onClick={() => {
                      const url = URL.createObjectURL(selectedFile);
                      window.open(url, "_blank");
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>

                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-xs"
                    disabled={isSubmitting}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Replace
                  </Button>

                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10"
                    disabled={isSubmitting}
                    onClick={removeFile}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {fileError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-500/10 p-2.5 rounded-md border border-red-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* INSTRUCTIONS AND REQUIREMENTS BOX */}
            <div className="border border-blue-500/20 bg-blue-500/5 rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-md shrink-0">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    PDF Upload Instructions & Requirements
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please ensure your single PDF meets all quality and verification criteria before submission.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-foreground/90 pl-1">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p><strong>Consolidate into one file:</strong> Combine all documents required for carbon credit project verification into one comprehensive PDF.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p><strong>Include all mandatory documents:</strong> Ensure every document listed in the checklist below is included in the file.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p><strong>Logical ordering & clarity:</strong> Arrange documents in a logical sequence. Ensure all pages are complete, readable, properly oriented, and not cropped.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p><strong>Signatures & evidence:</strong> Include official signatures, stamps, issuance dates, and supporting audit evidence where required.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p><strong>Security restrictions:</strong> Do not upload password-protected, encrypted, or corrupted PDFs. Files must be valid and readable.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p><strong>Authorization & completeness:</strong> Upload only documents that you are legally authorized to submit. Missing sections may result in immediate rejection or verification delays.</p>
                </div>
              </div>

              {/* DYNAMIC DOCUMENT CHECKLIST */}
              <div className="pt-3 border-t border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Required Sections Checklist for: <span className="text-blue-600 dark:text-blue-400">{projectType}</span>
                  </p>
                  <span className="text-[11px] text-muted-foreground">PDF must contain:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {requiredDocs.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="bg-background/80 border rounded p-2 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium truncate mr-2">{doc.name}</span>
                      {doc.isRequired ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-[10px] px-1.5 py-0 shrink-0">
                          REQUIRED
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground shrink-0">
                          OPTIONAL
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Location / Region</label>
              <Input name="location" required placeholder="e.g., Amazonas" disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Country</label>
              <Input name="country" required placeholder="e.g., Brazil" disabled={isSubmitting} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Methodology Name/Code</label>
            <Input name="methodology" required placeholder="e.g., VM0015 Methodology for Avoided Unplanned Deforestation" disabled={isSubmitting} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Total Credits Issued</label>
              <Input name="totalCredits" type="number" required min={1} placeholder="e.g., 50000" disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Price Per Credit (₹)</label>
              <Input name="pricePerCredit" type="number" required min={1} placeholder="e.g., 850" disabled={isSubmitting} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-md text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 pt-6 px-6 pb-6 flex justify-between border-t">
          <Button variant="ghost" type="button" asChild disabled={isSubmitting}>
            <Link href="/seller">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[180px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Dossier...
              </>
            ) : (
              "Submit Project for Verification"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
