import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutDashboard, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { TrustScoreBadge } from "@/components/trust-score-badge";

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SellerDashboard() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== Role.SELLER) {
    redirect("/login");
  }

  const seller = { id: user.id, name: user.name, organization: user.organization };

  // Fetch projects created by this seller
  const developerName = seller.organization || seller.name;
  
  const projects = await prisma.carbonProject.findMany({
    where: { developer: developerName },
    include: { trustScore: true },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch transactions where this seller was the seller
  const sales = await prisma.transaction.findMany({
    where: { sellerId: seller.id },
    include: { project: true },
    orderBy: { createdAt: 'desc' }
  });

  // KPI Calculations
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.verificationStatus === "VERIFIED").length;
  
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const creditsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Seller Dashboard</h1>
          <p className="text-muted-foreground">Manage your carbon projects, track verifications, and monitor sales.</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/seller/add-project">
            <Plus className="mr-2 h-4 w-4" /> Add New Project
          </Link>
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From all completed sales</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Sold</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{creditsSold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total tCO₂e distributed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Verified & listed in marketplace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Audits</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProjects - activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting Carbex verification</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Projects Table */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
            <CardDescription>Track the status and scores of your submitted projects.</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-xl">
                You haven't submitted any projects yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Available Credits</TableHead>
                      <TableHead>Trust Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          <Link href={`/seller/projects/${project.id}`} className="hover:underline font-semibold text-emerald-700 dark:text-emerald-400">
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={project.verificationStatus === "VERIFIED" ? "default" : "secondary"} 
                                 className={project.verificationStatus === "VERIFIED" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                            {project.verificationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{project.availableCredits.toLocaleString()} / {project.totalCredits.toLocaleString()}</TableCell>
                        <TableCell>
                          {project.trustScore ? (
                            <TrustScoreBadge score={project.trustScore.overallScore} riskLevel={project.trustScore.riskLevel} />
                          ) : (
                            <span className="text-muted-foreground text-xs">Pending</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest marketplace transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
                No sales yet.
              </div>
            ) : (
              <div className="space-y-4">
                {sales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex justify-between items-center p-3 border rounded-lg bg-muted/20">
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{sale.project.name}</p>
                      <p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(sale.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-emerald-600">+₹{sale.totalAmount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{sale.quantity} credits</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
