import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, ShieldAlert, Wallet, TrendingUp } from "lucide-react";
import Link from "next/link";
import { DashboardCharts } from "./dashboard-charts";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function BuyerDashboard() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== Role.BUYER) {
    redirect("/login");
  }

  const buyer = { id: user.id };

  // Fetch ownerships
  const ownerships = await prisma.creditOwnership.findMany({
    where: { userId: buyer.id },
    include: { project: true }
  });

  // Fetch retirements
  const retirements = await prisma.retirement.findMany({
    where: { userId: buyer.id },
    include: { project: true }
  });

  // Fetch transactions
  const transactions = await prisma.transaction.findMany({
    where: { buyerId: buyer.id },
    include: { project: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // Calculate top-level stats
  const totalOwned = ownerships.reduce((sum, o) => sum + o.quantity, 0);
  const totalRetired = retirements.reduce((sum, r) => sum + r.quantity, 0);
  
  // Estimate portfolio value (quantity * current project price)
  const portfolioValue = ownerships.reduce((sum, o) => sum + (o.quantity * o.project.pricePerCredit), 0);

  // Group portfolio by project type for the chart
  const portfolioDistribution = ownerships.reduce((acc, curr) => {
    const type = curr.project.projectType;
    if (!acc[type]) acc[type] = 0;
    acc[type] += curr.quantity;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(portfolioDistribution).map(key => ({
    name: key,
    value: portfolioDistribution[key]
  }));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">My Portfolio</h1>
        <p className="text-muted-foreground">Manage your carbon credits, track impact, and retire certificates.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Owned</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOwned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Available to hold or retire</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Retired</CardTitle>
            <Leaf className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{totalRetired.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Permanent CO₂ removal claimed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{portfolioValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated current market value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impact Estimated</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOwned + totalRetired} <span className="text-lg font-normal text-muted-foreground">tCO₂e</span></div>
            <p className="text-xs text-muted-foreground mt-1">Total lifetime carbon impact</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="mb-10">
        <DashboardCharts distributionData={chartData} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Owned Credits Table */}
        <Card>
          <CardHeader>
            <CardTitle>Owned Credits</CardTitle>
            <CardDescription>Your active portfolio of carbon credits.</CardDescription>
          </CardHeader>
          <CardContent>
            {ownerships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
                You do not own any credits yet.<br/>
                <Link href="/marketplace"><Button variant="link" className="mt-2">Explore the Marketplace</Button></Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ownerships.map((ownership) => (
                      <TableRow key={ownership.id}>
                        <TableCell className="font-medium">
                          <Link href={`/projects/${ownership.projectId}`} className="hover:underline">
                            {ownership.project.name}
                          </Link>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{ownership.project.projectType}</Badge></TableCell>
                        <TableCell className="text-right font-bold">{ownership.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/retire/${ownership.id}`}>
                            <Button size="sm" variant="outline">Retire</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest marketplace purchases.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
                No transactions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium truncate max-w-[200px]">{tx.project.name}</TableCell>
                        <TableCell>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(tx.createdAt)}</TableCell>
                        <TableCell className="text-right font-bold">+{tx.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₹{tx.totalAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
