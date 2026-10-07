"use client";

import { useState, useMemo } from "react";
import { CarbonProject, TrustScore } from "@prisma/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrustScoreBadge } from "@/components/trust-score-badge";
import { Search, MapPin, Factory, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import Link from "next/link";

type ProjectWithScore = CarbonProject & { trustScore: TrustScore | null };

export default function MarketplaceClient({ initialProjects }: { initialProjects: ProjectWithScore[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("score_desc");

  // Extract unique types for filters
  const projectTypes = useMemo(() => {
    const types = new Set(initialProjects.map(p => p.projectType));
    return Array.from(types).sort();
  }, [initialProjects]);

  // Filter and Sort Logic
  const filteredProjects = useMemo(() => {
    let result = initialProjects;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || 
             p.location.toLowerCase().includes(q) || 
             p.country.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== "ALL") {
      result = result.filter(p => p.projectType === typeFilter);
    }

    // Risk filter
    if (riskFilter !== "ALL") {
      result = result.filter(p => p.trustScore?.riskLevel === riskFilter);
    }

    // Sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.pricePerCredit - b.pricePerCredit;
        case "price_desc":
          return b.pricePerCredit - a.pricePerCredit;
        case "score_desc":
          return (b.trustScore?.overallScore || 0) - (a.trustScore?.overallScore || 0);
        case "available_desc":
          return b.availableCredits - a.availableCredits;
        default:
          return 0;
      }
    });

    return result;
  }, [initialProjects, search, typeFilter, riskFilter, sortBy]);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* SIDEBAR FILTERS */}
      <div className="w-full md:w-64 space-y-8 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Project Type</label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {projectTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Risk Level</label>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Risk Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Risk Levels</SelectItem>
              <SelectItem value="VERY_LOW">Very Low Risk</SelectItem>
              <SelectItem value="LOW">Low Risk</SelectItem>
              <SelectItem value="MODERATE">Moderate Risk</SelectItem>
              <SelectItem value="HIGH">High Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 space-y-6">
        
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-bold text-foreground">{filteredProjects.length}</span> projects
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score_desc">Highest Trust Score</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="available_desc">Most Credits Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Project Grid */}
        {filteredProjects.length === 0 ? (
          <div className="border border-dashed rounded-xl p-12 text-center text-muted-foreground bg-muted/10">
            No projects found matching your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="flex flex-col border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="border-b bg-muted/10 p-6 md:p-8">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1">{project.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-1.5 gap-3">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {project.country}</span>
                        <span className="flex items-center gap-1"><Factory className="h-3.5 w-3.5" /> {project.projectType}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-6 md:p-8">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Price</p>
                      <p className="text-2xl font-bold">â‚¹{project.pricePerCredit.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">/ credit</span></p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Available</p>
                      <p className="text-2xl font-bold">{project.availableCredits.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="rounded-xl bg-muted/20 border p-5 md:p-6 flex items-center justify-between">
                    <span className="text-sm font-medium">Carbex Trust Rating</span>
                    {project.trustScore ? (
                      <TrustScoreBadge score={project.trustScore.overallScore} riskLevel={project.trustScore.riskLevel} />
                    ) : (
                      <Badge variant="outline">Unrated</Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-6 md:p-8 pt-0 mt-auto">
                  
                    <Link href={`/projects/${project.id}`} className={buttonVariants({ className: "w-full" })}>
                      View Project Details
                    </Link>
                  
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
