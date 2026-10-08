import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Leaf, Download, Share2 } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function CertificatePage({ params }: { params: { id: string } }) {
  const retirement = await prisma.retirement.findUnique({
    where: { id: params.id },
    include: { 
      project: true,
      user: true
    }
  });

  if (!retirement) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
        <div className="flex gap-3">
          <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
        </div>
      </div>

      <Card className="relative overflow-hidden border-2 border-emerald-500/20 shadow-2xl">
        {/* Certificate Background Pattern */}
        <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#10b981_10px,#10b981_20px)] pointer-events-none"></div>
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Leaf className="w-64 h-64 text-emerald-500" />
        </div>

        <CardContent className="relative p-12 md:p-20 flex flex-col items-center text-center bg-white dark:bg-card">
          <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 mb-8 px-4 py-1 text-xs font-bold tracking-widest uppercase">
            Official Record
          </Badge>

          <h1 className="text-4xl md:text-5xl font-serif text-emerald-900 dark:text-emerald-400 mb-12 tracking-tight">
            Certificate of Carbon Retirement
          </h1>

          <p className="text-lg text-muted-foreground mb-4">This certifies that</p>
          <p className="text-3xl font-bold mb-12 border-b-2 border-emerald-500/30 pb-2 px-12">
            {retirement.user.organization || retirement.user.name}
          </p>

          <p className="text-lg text-muted-foreground mb-4">has permanently retired</p>
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className="text-5xl font-extrabold text-emerald-600 dark:text-emerald-400">{retirement.quantity.toLocaleString()}</span>
            <span className="text-2xl font-medium text-muted-foreground mt-3">tCO₂e</span>
          </div>

          <p className="text-lg text-muted-foreground mb-6">of verified carbon credits originating from</p>
          <div className="bg-muted/30 p-6 rounded-2xl border border-border w-full max-w-2xl mb-16">
            <p className="text-2xl font-bold mb-2">{retirement.project.name}</p>
            <p className="text-muted-foreground">{retirement.project.location}, {retirement.project.country}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Badge variant="outline">{retirement.project.projectType}</Badge>
              <Badge variant="outline">{retirement.project.verificationStandard}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full border-t border-border pt-12 text-sm">
            <div>
              <p className="text-muted-foreground uppercase tracking-wider font-semibold mb-1">Certificate ID</p>
              <p className="font-mono font-medium">{retirement.certificateId}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wider font-semibold mb-1">Date of Retirement</p>
              <p className="font-medium">{new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(retirement.retiredAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase tracking-wider font-semibold mb-1">Registry Status</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">PERMANENTLY RETIRED</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
