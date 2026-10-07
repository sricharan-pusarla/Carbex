"use client";

import { useState } from "react";
import { Search, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { getRecommendations } from "../actions/recommender";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RecommenderPage() {
  const [query, setQuery] = useState("I need 500 tonnes of credits for my company and prefer renewable energy projects in India.");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const recs = await getRecommendations(query);
      setResults(recs);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 text-emerald-700 rounded-full mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find the right carbon credits</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tell our deterministic recommendation engine what you're looking for, and we'll match you with the most credible projects that fit your criteria.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-12">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-gray-400 h-6 w-6" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-14 pr-32 py-5 text-lg rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. I want 1000 credits from reforestation projects..."
            />
            <Button 
              type="submit" 
              className="absolute right-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-3"
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Recommend"}
            </Button>
          </div>
        </form>

        {hasSearched && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {results.length > 0 ? "Recommended Projects" : "No exact matches found."}
            </h2>
            
            {results.map((rec, i) => (
              <div key={rec.project.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
                <div className="md:w-1/3 h-48 md:h-auto bg-gray-200 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={rec.project.image} alt={rec.project.name} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                
                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{rec.project.name}</h3>
                      <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold border border-emerald-100 flex items-center">
                        Score: {rec.project.trustScore?.overallScore || 'N/A'}
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">
                      {rec.project.location}, {rec.project.country} • {rec.project.projectType}
                    </p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Recommended because:</p>
                      <ul className="space-y-1">
                        {rec.reasons.map((r: string, idx: number) => (
                          <li key={idx} className="flex items-center text-sm text-emerald-700">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-gray-900 font-bold">₹{rec.project.pricePerCredit} <span className="text-gray-500 text-sm font-normal">/ tCO₂e</span></p>
                      <p className="text-gray-500 text-sm">{rec.project.availableCredits.toLocaleString()} available</p>
                    </div>
                    <Link href={`/projects/${rec.project.id}`}>
                      <Button variant="outline" className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                        View Details <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
