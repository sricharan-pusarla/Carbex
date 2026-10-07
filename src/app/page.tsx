import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, CheckCircle2, Leaf, Shield, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-background pt-20 pb-32 lg:pt-32">
        {/* Elegant Grid Background with Radial Mask */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        <div className="container relative mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
            
            {/* Hero Text */}
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-8 rounded-full border-primary/20 bg-primary/5 text-primary px-4 py-1.5 text-sm font-medium">
                MVP Demo Version
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold tracking-tighter mb-6 text-balance leading-[1.1]">
                Carbon markets <br className="hidden md:block" /> you can <span className="text-primary">trust.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 text-balance leading-relaxed max-w-lg">
                Discover, evaluate, and retire carbon credits with transparent project data and a data-driven Carbon Trust Score.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/marketplace" className={cn(buttonVariants({ size: "lg" }), "h-12 px-8 text-base gap-2 rounded-full shadow-sm hover:shadow-md transition-all")}>
                  Explore Marketplace <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#how-it-works" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-8 text-base rounded-full")}>
                  How Carbex Works
                </Link>
              </div>
            </div>

            {/* HERO DASHBOARD ELEMENT (Polished) */}
            <div className="relative mx-auto w-full max-w-lg lg:ml-auto lg:mr-0">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent blur-2xl"></div>
              <Card className="relative shadow-2xl shadow-primary/5 border-border bg-card rounded-2xl overflow-hidden">
                <CardHeader className="border-b bg-muted/10 p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight">Amazonas Reforestation</CardTitle>
                      <CardDescription className="mt-1 font-medium">Brazil â€¢ Reforestation</CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 shadow-none font-bold">VERIFIED</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-8">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Price</p>
                      <p className="text-4xl font-bold tracking-tight">â‚¹1,200 <span className="text-sm font-medium text-muted-foreground">/ tCOâ‚‚e</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trust Score</p>
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white shadow-md shadow-emerald-500/20">
                          95
                        </div>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Very Low Risk</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-muted-foreground">Verification Quality</span>
                        <span className="font-bold">98/100</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[98%] rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-muted-foreground">Additionality</span>
                        <span className="font-bold">95/100</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[95%] rounded-full" />
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full h-11 text-base font-semibold shadow-sm" variant="default">Purchase Credits</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <p className="text-center text-xs font-bold text-muted-foreground tracking-widest uppercase mb-10">
            Demo Platform Statistics
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            <div className="space-y-3">
              <h3 className="text-4xl md:text-5xl font-extrabold tracking-tighter">$24.8M</h3>
              <p className="text-sm text-muted-foreground font-medium">Credits Traded</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-4xl md:text-5xl font-extrabold tracking-tighter">1.8M</h3>
              <p className="text-sm text-muted-foreground font-medium">Credits Listed</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-4xl md:text-5xl font-extrabold tracking-tighter">324</h3>
              <p className="text-sm text-muted-foreground font-medium">Verified Projects</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary">94</h3>
              <p className="text-sm text-muted-foreground font-medium">Avg. Trust Score</p>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM / WHY CARBEX */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">The Carbon Market Problem</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Traditional carbon markets are plagued by opacity, double-counting, and projects that lack real-world additionality. Buyers often purchase credits without truly knowing the risk profile of the underlying project.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-muted/30 border-none shadow-none">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle className="text-xl">Low Quality Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">Many projects fail to prove additionality, meaning the emission reductions would have happened anyway without carbon finance.</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none shadow-none">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle className="text-xl">Opaque Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">Intermediaries capture huge margins, and buyers lack transparent data on the fair market value of specific credits.</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none shadow-none">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Double Counting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">Without transparent provenance, the same credit might be retired by multiple entities claiming the same environmental benefit.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* HOW CARBEX SOLVES IT / TRUST SCORE */}
      <section id="how-it-works" className="py-24 bg-muted/30 border-y">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-6 rounded-full border-primary/20 bg-primary/5 text-primary">The Solution</Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">The Carbon Trust Score</h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Carbex does not blindly guarantee that a credit is perfect. Instead, we provide a deterministic, transparent risk assessment engine that scores projects across 6 critical vectors.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "Verification Quality", desc: "Assessing the rigor of the standard body." },
                  { title: "Documentation", desc: "Completeness and transparency of project files." },
                  { title: "Additionality", desc: "Likelihood the project relies on carbon finance." },
                  { title: "Project History", desc: "Track record of the project developer." },
                  { title: "Provenance", desc: "Clear chain of custody from issuance to retirement." },
                  { title: "Double-Counting Risk", desc: "Analysis of national registries to prevent overlap." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="mt-0.5 bg-primary/10 p-1.5 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-background rounded-3xl shadow-xl shadow-primary/5 border border-border/50 p-8 md:p-10">
              <h3 className="text-2xl font-bold tracking-tight mb-10 text-center">Score Calculation Example</h3>
              <div className="space-y-6">
                {[
                  { label: "Verification", score: 95, weight: "25%" },
                  { label: "Documentation", score: 91, weight: "20%" },
                  { label: "Additionality", score: 87, weight: "20%" },
                  { label: "History", score: 89, weight: "15%" },
                  { label: "Provenance", score: 94, weight: "10%" },
                  { label: "Double-Counting", score: 90, weight: "10%" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="w-1/3 text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</div>
                    <div className="w-1/2 mx-4">
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary/80 rounded-full" style={{ width: `${stat.score}%` }} />
                      </div>
                    </div>
                    <div className="w-1/6 text-right flex flex-col justify-center">
                      <span className="font-bold text-sm">{stat.score}</span>
                      <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">{stat.weight} wt</span>
                    </div>
                  </div>
                ))}
                <div className="pt-8 border-t mt-8 flex justify-between items-center">
                  <div>
                    <span className="block font-bold text-lg">Overall Trust Score</span>
                    <span className="text-sm text-muted-foreground font-medium">Weighted Average</span>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
                    91
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Ready to trade with confidence?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join the most transparent carbon credit marketplace designed for serious climate action.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace" className={cn(buttonVariants({ size: "lg" }), "h-14 px-10 text-lg rounded-full")}>
              Explore Marketplace
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-14 px-10 text-lg rounded-full")}>
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
