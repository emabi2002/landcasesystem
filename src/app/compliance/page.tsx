'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, AlertTriangle, Link as LinkIcon, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { LinkRecommendationDialog } from '@/components/compliance/LinkRecommendationDialog';

type Recommendation = {
  recommendation_id: string;
  title: string;
  recommendation_text: string;
  risk_rating: string;
  priority: string;
  status: string;
  org_unit_name: string;
  region: string;
  target_date: string;
  published_at: string;
  parcel_ref: string;
  tags: string[];
  owner_name: string;
};

export default function CompliancePage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const regions = ['All Regions', 'NCD', 'Madang Province', 'Eastern Highlands', 'Western Province', 'Morobe Province'];
  const priorities = ['All Priorities', 'Low', 'Medium', 'High', 'Urgent'];
  const riskRatings = ['All Risk Levels', 'Low', 'Medium', 'High', 'Critical'];

  useEffect(() => {
    fetchRecommendations();
  }, [regionFilter, priorityFilter, riskFilter, searchTerm]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (regionFilter && regionFilter !== 'All Regions') {
        params.append('region', regionFilter);
      }
      if (priorityFilter && priorityFilter !== 'All Priorities') {
        params.append('priority', priorityFilter);
      }
      if (riskFilter && riskFilter !== 'All Risk Levels') {
        params.append('risk_rating', riskFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/compliance/recommendations?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setRecommendations(result.data || []);
      } else {
        toast.error('Failed to load recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Error loading recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // In production, this would call the compliance system API
      // For now, we'll just refresh the data
      await fetchRecommendations();
      toast.success('Recommendations synced successfully');
    } catch (error) {
      toast.error('Failed to sync recommendations');
    } finally {
      setSyncing(false);
    }
  };

  const handleLinkClick = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setLinkDialogOpen(true);
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-blue-600 text-white';
      case 'low':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#4A4284]">Compliance Recommendations</h1>
          <p className="text-gray-600 mt-2">
            Published compliance recommendations available for linking to legal cases
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          Sync Recommendations
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4A4284]">{recommendations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {recommendations.filter(r => r.priority === 'High' || r.priority === 'Urgent').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Critical Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {recommendations.filter(r => r.risk_rating === 'Critical').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Regions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4A4284]">
              {new Set(recommendations.map(r => r.region).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search recommendations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                {riskRatings.map((risk) => (
                  <SelectItem key={risk} value={risk}>
                    {risk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-[#4A4284]" />
                <span className="ml-2">Loading recommendations...</span>
              </div>
            </CardContent>
          </Card>
        ) : recommendations.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No published recommendations found</p>
                <p className="text-sm mt-2">Try adjusting your filters or syncing with the compliance system</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          recommendations.map((rec) => (
            <Card key={rec.recommendation_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-[#4A4284] mb-2">{rec.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{rec.recommendation_text}</CardDescription>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleLinkClick(rec)}>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Link to Case
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Risk Rating</p>
                    <Badge className={getRiskBadgeColor(rec.risk_rating)}>
                      {rec.risk_rating}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Priority</p>
                    <Badge className={getPriorityBadgeColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Region</p>
                    <p className="text-sm font-medium">{rec.region || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Organization</p>
                    <p className="text-sm font-medium">{rec.org_unit_name || 'N/A'}</p>
                  </div>
                </div>
                {rec.parcel_ref && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500">Land Parcel Reference</p>
                    <p className="text-sm font-medium">{rec.parcel_ref}</p>
                  </div>
                )}
                {rec.tags && rec.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rec.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Published: {new Date(rec.published_at).toLocaleDateString()}
                    {rec.target_date && ` • Target: ${new Date(rec.target_date).toLocaleDateString()}`}
                  </div>
                  {rec.owner_name && (
                    <div className="text-xs text-gray-500">
                      Owner: {rec.owner_name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Link Dialog */}
      {selectedRecommendation && (
        <LinkRecommendationDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          recommendation={selectedRecommendation}
          onLinked={() => {
            setLinkDialogOpen(false);
            toast.success('Recommendation linked to case successfully');
          }}
        />
      )}
    </div>
  );
}
