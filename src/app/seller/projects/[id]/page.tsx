import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { getRequiredDocuments } from "@/lib/document-requirements";

export default async function SellerProjectPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.SELLER) {
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

  // Authorization check
  const developerName = user.organization || user.name;
  if (project.developer !== developerName) {
    return <div className="p-12 text-center text-red-500">Access Denied.</div>;
  }

  // Parse engine findings
  let engineFindings = null;
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
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">Verification Status Hub</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/seller">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Documents</CardTitle>
              <CardDescription>Documents currently under review for this project.</CardDescription>
            </CardHeader>
            <CardContent>
              {project.documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                  No documents found.
                </div>
              ) : (
                <div className="space-y-4">
                  {project.documents.map(doc => {
                    const docDef = requiredDocsDef.find(d => d.id === doc.documentType);
                    const docName = docDef ? docDef.name : doc.documentType;
                    const findings = engineFindings?.documentVerification?.[doc.documentType];
                    
                    return (
                      <div key={doc.id} className="border rounded-lg p-4 flex flex-col space-y-3 bg-muted/10">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/10 p-2 rounded-md">
                              <FileText className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{docName}</p>
                              <p className="text-xs text-muted-foreground">{doc.originalFileName}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{doc.status}</Badge>
                        </div>
                        
                        {findings && (
                          <div className={`mt-2 p-3 rounded-md text-sm border ${
                            findings.status === 'PASSED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                            findings.status === 'FLAGGED' ? 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400' :
                            'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              {findings.status === 'PASSED' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                              <span className="font-semibold">AI Scan: {findings.status} ({findings.confidence}% confidence)</span>
                            </div>
                            <p className="opacity-90">{findings.notes}</p>
                          </div>
                        )}

                        <div className="flex justify-end mt-2">
                           <Button variant="ghost" size="sm" asChild>
                             <Link href={`/api/documents/${doc.id}`} target="_blank">
                               <ExternalLink className="w-4 h-4 mr-2" /> View File
                             </Link>
                           </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Overall Project Status</p>
                <Badge className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700">{project.verificationStatus}</Badge>
              </div>
              
              {project.verification && (
                <>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Document Review Phase</p>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {project.verification.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  {project.verification.riskLevel && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">AI Risk Assessment</p>
                      <Badge variant="outline" className={`text-sm px-3 py-1 ${
                        project.verification.riskLevel === 'LOW' ? 'text-emerald-500 border-emerald-500' :
                        project.verification.riskLevel === 'MODERATE' ? 'text-orange-500 border-orange-500' :
                        'text-red-500 border-red-500'
                      }`}>
                        {project.verification.riskLevel} RISK
                      </Badge>
                    </div>
                  )}

                  {project.verification.adminComments && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md">
                      <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-1">ADMIN FEEDBACK:</p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">{project.verification.adminComments}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
