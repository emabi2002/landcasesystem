'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Case = {
  id: string;
  case_number: string;
  title: string;
  status: string;
  region: string;
};

type Recommendation = {
  recommendation_id: string;
  title: string;
  recommendation_text: string;
  risk_rating: string;
  priority: string;
  region: string;
  parcel_ref: string;
  full_data?: Record<string, unknown>;
};

type LinkRecommendationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: Recommendation;
  onLinked: () => void;
};

export function LinkRecommendationDialog({
  open,
  onOpenChange,
  recommendation,
  onLinked,
}: LinkRecommendationDialogProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [linkType, setLinkType] = useState('supporting_reference');
  const [linkContext, setLinkContext] = useState('');
  const [createSnapshot, setCreateSnapshot] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCases();
    }
  }, [open]);

  const fetchCases = async () => {
    setLoadingCases(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, title, status, region')
        .in('status', ['Open', 'In Progress', 'Pending'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoadingCases(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCaseId) {
      toast.error('Please select a case');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/compliance/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          legal_case_id: selectedCaseId,
          recommendation_id: recommendation.recommendation_id,
          link_type: linkType,
          link_context: linkContext,
          create_snapshot: createSnapshot,
          recommendation_data: createSnapshot ? recommendation : null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Recommendation linked successfully');
        onLinked();
        resetForm();
      } else {
        toast.error(result.error || 'Failed to link recommendation');
      }
    } catch (error) {
      console.error('Error linking recommendation:', error);
      toast.error('An error occurred while linking');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCaseId('');
    setLinkType('supporting_reference');
    setLinkContext('');
    setCreateSnapshot(true);
  };

  // Filter cases by matching region if possible
  const filteredCases = recommendation.region
    ? cases.filter(c => c.region === recommendation.region).concat(
        cases.filter(c => c.region !== recommendation.region)
      )
    : cases;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link Recommendation to Legal Case</DialogTitle>
          <DialogDescription>
            Connect this compliance recommendation to an active legal case
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recommendation Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Recommendation Details</h4>
            <p className="text-sm font-medium text-[#4A4284] mb-2">{recommendation.title}</p>
            <p className="text-xs text-gray-600 line-clamp-3 mb-3">{recommendation.recommendation_text}</p>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-orange-500 text-white">{recommendation.priority}</Badge>
              <Badge className="bg-red-500 text-white">{recommendation.risk_rating}</Badge>
              {recommendation.region && <Badge variant="outline">{recommendation.region}</Badge>}
            </div>
          </div>

          {/* Select Case */}
          <div className="space-y-2">
            <Label htmlFor="case">Select Legal Case *</Label>
            {loadingCases ? (
              <div className="flex items-center justify-center p-4 border rounded">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading cases...</span>
              </div>
            ) : (
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a case to link..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredCases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.case_number}</span>
                        <span className="text-gray-600">- {c.title}</span>
                        {c.region === recommendation.region && (
                          <Badge variant="outline" className="ml-2 text-xs">Same Region</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filteredCases.length === 0 && !loadingCases && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No active cases found. Create a new case first.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Link Type */}
          <div className="space-y-2">
            <Label htmlFor="linkType">Link Type *</Label>
            <Select value={linkType} onValueChange={setLinkType} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adopted_as_basis">
                  <div>
                    <div className="font-medium">Adopted as Basis</div>
                    <div className="text-xs text-gray-500">This recommendation is the primary reason for the legal action</div>
                  </div>
                </SelectItem>
                <SelectItem value="supporting_reference">
                  <div>
                    <div className="font-medium">Supporting Reference</div>
                    <div className="text-xs text-gray-500">This recommendation supports the case with additional evidence</div>
                  </div>
                </SelectItem>
                <SelectItem value="information_only">
                  <div>
                    <div className="font-medium">Information Only</div>
                    <div className="text-xs text-gray-500">For reference and background information</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Link Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Link Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="Explain why this recommendation is being linked to the case..."
              value={linkContext}
              onChange={(e) => setLinkContext(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Provide context about how this recommendation relates to the case
            </p>
          </div>

          {/* Snapshot Option */}
          <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="snapshot"
              checked={createSnapshot}
              onChange={(e) => setCreateSnapshot(e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="snapshot" className="font-medium cursor-pointer">
                Create immutable snapshot
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                Recommended: Captures the current state of the recommendation for evidentiary record
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedCaseId}
              className="bg-[#EF5A5A] hover:bg-[#EF5A5A]/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link to Case
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
