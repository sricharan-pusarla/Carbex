import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Clock, XCircle, BarChart3, Users, Layers } from "lucide-react";
import { TrustScoreBadge } from "@/components/trust-score-badge";
import { AdminProjectActions } from "./admin-actions";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [
    totalProjects,
    pendingProjects,
    totalUsers,
    totalTransactions,
    pendingList,
    recentTransactions
  ] = await Promise.all([
    prisma.carbonProject.count(),
    prisma.carbonProject.count({ where: { verificationStatus: "PENDING" } }),
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.carbonProject.findMany({
      where: { verificationStatus: "PENDING" },
      include: { trustScore: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.transaction.findMany({
      include: { project: true, buyer: true },
      orderBy: { createdAt: 'desc' },
      take: 8
    })
  ]);

  const totalRevenue = await prisma.transaction.aggregate({
    _sum: { totalAmount: true }
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground ml-14">Platform management, project verification, and analytics.</p>
        </div>
        <Badge className="bg-red-500/10 text-red-600 border-red-200 text-sm px-3 py-1">
          Admin Access Only
        </Badge>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">In the registry</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{pendingProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{(totalRevenue._sum.totalAmount || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total transactions value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered on platform</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Projects for Verification */}
      <div className="mb-10">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <CardTitle>Projects Awaiting Verification</CardTitle>
                <CardDescription>Review each project's Trust Score and approve or reject it for the marketplace.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pendingList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-xl">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-emerald-500 opacity-50" />
                All projects are up to date — no pending approvals!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Price / Credit</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingList.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-semibold">{project.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{project.projectType}</Badge>
                        </TableCell>
                        <TableCell>{project.country}</TableCell>
                        <TableCell>{project.totalCredits.toLocaleString()}</TableCell>
                        <TableCell>₹{project.pricePerCredit.toLocaleString()}</TableCell>
                        <TableCell>
                          {project.trustScore ? (
                            <TrustScoreBadge
                              score={project.trustScore.overallScore}
                              riskLevel={project.trustScore.riskLevel}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">Not scored</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <AdminProjectActions projectId={project.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Platform Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Transactions</CardTitle>
          <CardDescription>Latest purchases across the whole marketplace.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
              No transactions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium max-w-[180px] truncate">{tx.project.name}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.buyer.name}</TableCell>
                      <TableCell>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(tx.createdAt)}</TableCell>
                      <TableCell className="text-right font-semibold">{tx.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold">₹{tx.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
