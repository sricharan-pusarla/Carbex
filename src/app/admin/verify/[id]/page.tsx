import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, AlertTriangle, CheckCircle2, ShieldAlert, FileCheck, Layers } from "lucide-react";
import Link from "next/link";
import { getRequiredDocuments, isConsolidatedDoc, CONSOLIDATED_DOC_LABEL } from "@/lib/document-requirements";
import { TrustScoreBadge } from "@/components/trust-score-badge";
import { AdminReviewForm } from "./admin-review-form";

export default async function AdminVerificationPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) {
    redirect("/login");
  }

  const project = await prisma.carbonProject.findUnique({
    where: { id: params.id },
    include: {
      documents: true,
      verification: true,
      trustScore: true
    }
  });

  if (!project) {
    return <div className="p-12 text-center text-muted-foreground">Project not found.</div>;
  }

  // Parse engine findings
  let engineFindings: any = null;
  if (project.verification?.findings) {
    try {
      engineFindings = JSON.parse(project.verification.findings);
    } catch (e) {
      console.error("Failed to parse findings");
    }
  }

  const requiredDocsDef = getRequiredDocuments(project.projectType);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge className="bg-red-500/10 text-red-600 border-red-200">Admin Review</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {project.projectType} • {project.location}, {project.country} • Developer: {project.developer}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Documentation</CardTitle>
              <CardDescription>
                Review submitted project files and automated AI verification findings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                  No documents found for this project submission.
                </div>
              ) : (
                <div className="space-y-4">
                  {project.documents.map((doc) => {
                    const isConsolidated = isConsolidatedDoc(doc.documentType);
                    const docDef = requiredDocsDef.find((d) => d.id === doc.documentType);
                    const docName = isConsolidated 
                      ? CONSOLIDATED_DOC_LABEL 
                      : (docDef ? docDef.name : doc.documentType);
                    const findings = engineFindings?.documentVerification?.[doc.documentType];

                    return (
                      <div 
                        key={doc.id} 
                        className={`border rounded-lg p-5 flex flex-col space-y-4 ${
                          isConsolidated 
                            ? "border-emerald-500/30 bg-emerald-500/5 shadow-sm" 
                            : "bg-muted/10"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-lg shrink-0 ${
                              isConsolidated 
                                ? "bg-emerald-500/10 text-emerald-600" 
                                : "bg-blue-500/10 text-blue-600"
                            }`}>
                              {isConsolidated ? (
                                <Layers className="w-5 h-5" />
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-base text-foreground">{docName}</p>
                                {isConsolidated ? (
                                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-2 py-0">
                                    CONSOLIDATED PDF
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    LEGACY FORMAT
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {doc.originalFileName} • {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <Button variant="default" size="sm" asChild className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Link href={`/api/documents/${doc.id}`} target="_blank">
                              <ExternalLink className="w-4 h-4 mr-2" /> View / Download PDF
                            </Link>
                          </Button>
                        </div>

                        {/* If consolidated PDF, show the expected sections checklist for this project type */}
                        {isConsolidated && (
                          <div className="bg-background/90 border border-emerald-500/20 rounded-md p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <FileCheck className="w-4 h-4 text-emerald-600" />
                                Expected Dossier Sections for: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{project.projectType}</span>
                              </p>
                              <span className="text-[11px] text-muted-foreground">Admin Checklist</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Please verify that the uploaded single PDF includes all required sections below:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {requiredDocsDef.map((req) => (
                                <div 
                                  key={req.id} 
                                  className="flex items-center justify-between bg-muted/30 border rounded px-2.5 py-1.5 text-xs"
                                >
                                  <span className="font-medium truncate mr-2">{req.name}</span>
                                  {req.isRequired ? (
                                    <Badge variant="default" className="bg-emerald-600/90 text-[10px] px-1.5 py-0 shrink-0">
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
                        )}

                        {findings && (
                          <div className={`p-3 rounded-md text-sm border ${
                            findings.status === 'PASSED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' :
                            findings.status === 'FLAGGED' ? 'bg-orange-500/10 border-orange-500/20 text-orange-800 dark:text-orange-300' :
                            'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              {findings.status === 'PASSED' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-orange-600" />}
                              <span className="font-semibold">AI Scan Status: {findings.status} ({findings.confidence}% confidence)</span>
                            </div>
                            <p className="opacity-90 font-medium mt-1 text-xs">Engine Audit Notes:</p>
                            <p className="opacity-90 text-xs mt-0.5">{findings.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
                Project Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Overall AI Risk Assessment</p>
                {project.verification?.riskLevel ? (
                   <Badge variant="outline" className={`text-sm px-3 py-1 ${
                    project.verification.riskLevel === 'LOW' ? 'text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' :
                    project.verification.riskLevel === 'MODERATE' ? 'text-orange-500 border-orange-500 bg-orange-50 dark:bg-orange-950/30' :
                    'text-red-500 border-red-500 bg-red-50 dark:bg-red-950/30'
                  }`}>
                    {project.verification.riskLevel} RISK
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Not Analyzed</span>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-semibold text-muted-foreground mb-3">Projected Trust Score</p>
                {project.trustScore ? (
                  <TrustScoreBadge 
                    score={project.trustScore.overallScore} 
                    riskLevel={project.trustScore.riskLevel} 
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">No score generated</span>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  This score includes penalties applied automatically if documents were flagged by the dummy engine.
                </p>
              </div>

              <div className="pt-4 border-t">
                 <p className="text-sm font-semibold text-muted-foreground mb-2">Project Details</p>
                 <div className="space-y-2 text-sm">
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Credits:</span>
                     <span className="font-medium">{project.totalCredits.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Price/Credit:</span>
                     <span className="font-medium">₹{project.pricePerCredit.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Methodology:</span>
                     <span className="font-medium truncate max-w-[150px]">{project.methodology}</span>
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {project.verificationStatus === "PENDING" && (
        <AdminReviewForm projectId={project.id} />
      )}
    </div>
  );
}
