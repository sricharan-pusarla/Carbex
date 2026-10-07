import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustScoreBadge } from "@/components/trust-score-badge";
import { ArrowLeft, Calendar, Factory, FileText, Globe, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { PurchaseForm } from "./purchase-form";

// Force dynamic rendering for real-time db queries
export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await prisma.carbonProject.findUnique({
    where: { id: params.id },
    include: { trustScore: true },
  });

  if (!project) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(date);
  };

  const trustScore = project.trustScore;

  const scoreFactors = trustScore ? [
    { label: "Verification Quality", score: trustScore.verificationScore, weight: "25%", desc: "Assesses the rigor of the standard body." },
    { label: "Documentation", score: trustScore.documentationScore, weight: "20%", desc: "Completeness and transparency of project files." },
    { label: "Additionality", score: trustScore.additionalityScore, weight: "20%", desc: "Likelihood the project relies on carbon finance." },
    { label: "Project History", score: trustScore.historyScore, weight: "15%", desc: "Track record of the project developer." },
    { label: "Provenance", score: trustScore.provenanceScore, weight: "10%", desc: "Clear chain of custody from issuance to retirement." },
    { label: "Double-Counting Risk", score: trustScore.doubleCountingScore, weight: "10%", desc: "Analysis of national registries to prevent overlap." },
  ] : [];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Back navigation */}
      <Link href="/marketplace" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{project.projectType}</Badge>
            <Badge variant="outline" className="border-border">
              {project.verificationStatus === "VERIFIED" ? (
                <span className="flex items-center text-emerald-600 dark:text-emerald-500"><ShieldCheck className="mr-1 h-3 w-3" /> Verified</span>
              ) : project.verificationStatus}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{project.name}</h1>
          <div className="flex flex-wrap items-center text-muted-foreground gap-4 text-sm md:text-base">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {project.location}, {project.country}</span>
            <span className="hidden md:inline text-border">•</span>
            <span className="flex items-center gap-1.5"><Factory className="h-4 w-4" /> {project.developer}</span>
          </div>
        </div>
        
        {/* Trust Score Badge prominent placement */}
        {trustScore && (
          <div className="shrink-0 bg-muted/30 border rounded-2xl p-4 flex flex-col items-center justify-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Carbon Trust Score</p>
            <TrustScoreBadge score={trustScore.overallScore} riskLevel={trustScore.riskLevel} />
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Details) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Project Overview</h2>
            <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              <p>{project.description}</p>
            </div>
          </section>

          {/* Key Details Grid */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Key Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg"><FileText className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Methodology</p>
                    <p className="font-semibold">{project.methodology}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg"><ShieldCheck className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Standard</p>
                    <p className="font-semibold">{project.verificationStandard}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg"><Calendar className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="font-semibold">{formatDate(project.projectStartDate)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg"><Globe className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="font-semibold">{project.location}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Credits Summary */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Credit Availability</h2>
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x border-border/50">
                  <div className="flex-1 p-6 text-center">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Credits Issued</p>
                    <p className="text-3xl font-bold">{project.totalCredits.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 p-6 text-center bg-muted/10">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Available for Purchase</p>
                    <p className="text-3xl font-bold text-primary">{project.availableCredits.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          
          {/* Purchase Card */}
          <Card className="border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>Securely retire credits or hold in your portfolio.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <PurchaseForm 
                projectId={project.id} 
                pricePerCredit={project.pricePerCredit} 
                availableCredits={project.availableCredits} 
              />
            </CardContent>
          </Card>

          {/* Trust Score Breakdown */}
          {trustScore && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  Trust Score Breakdown
                </CardTitle>
                <CardDescription>
                  Data-driven evaluation of project risk.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Explanation */}
                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-sm text-emerald-800 dark:text-emerald-200">
                  <strong>Analysis:</strong> {trustScore.explanation}
                </div>
                
                <div className="space-y-5">
                  {scoreFactors.map((factor, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-sm font-bold block">{factor.label}</span>
                          <span className="text-xs text-muted-foreground">{factor.desc}</span>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <span className="font-bold">{factor.score}</span><span className="text-muted-foreground text-xs">/100</span>
                        </div>
                      </div>
                      <Progress value={factor.score} className="h-1.5" />
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground text-center">
                    <Link href="/methodology" className="underline hover:text-primary transition-colors">
                      How is this score calculated?
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
