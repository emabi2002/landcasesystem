'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Link as LinkIcon, Unlink, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

type LinkedRecommendation = {
  id: string;
  recommendation_id: string;
  link_type: string;
  link_status: string;
  link_context: string;
  link_notes: string;
  recommendation_title: string;
  recommendation_priority: string;
  recommendation_risk_rating: string;
  recommendation_region: string;
  recommendation_parcel_ref: string;
  linked_at: string;
  created_at: string;
};

type LinkedRecommendationsProps = {
  caseId: string;
};

export function LinkedRecommendations({ caseId }: LinkedRecommendationsProps) {
  const [links, setLinks] = useState<LinkedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<LinkedRecommendation | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    fetchLinkedRecommendations();
  }, [caseId]);

  const fetchLinkedRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recommendation_links')
        .select('*')
        .eq('legal_case_id', caseId)
        .eq('link_status', 'linked')
        .order('linked_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching linked recommendations:', error);
      toast.error('Failed to load linked recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!selectedLink) return;

    setUnlinking(true);
    try {
      const response = await fetch(`/api/compliance/link?link_id=${selectedLink.id}&reason=User+requested+unlink`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Recommendation unlinked successfully');
        fetchLinkedRecommendations();
        setUnlinkDialogOpen(false);
        setSelectedLink(null);
      } else {
        toast.error(result.error || 'Failed to unlink recommendation');
      }
    } catch (error) {
      console.error('Error unlinking recommendation:', error);
      toast.error('An error occurred while unlinking');
    } finally {
      setUnlinking(false);
    }
  };

  const getLinkTypeBadge = (type: string) => {
    switch (type) {
      case 'adopted_as_basis':
        return <Badge className="bg-purple-600 text-white">Primary Basis</Badge>;
      case 'supporting_reference':
        return <Badge className="bg-blue-600 text-white">Supporting</Badge>;
      case 'information_only':
        return <Badge variant="outline">Info Only</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#4A4284]" />
            <span className="ml-2">Loading linked recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Linked Compliance Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No compliance recommendations linked to this case</p>
            <p className="text-sm mt-2">
              Visit the Compliance module to link published recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Linked Compliance Recommendations ({links.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#4A4284] mb-2">
                      {link.recommendation_title || 'Untitled Recommendation'}
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {getLinkTypeBadge(link.link_type)}
                      {link.recommendation_risk_rating && (
                        <Badge className={getRiskBadgeColor(link.recommendation_risk_rating)}>
                          {link.recommendation_risk_rating} Risk
                        </Badge>
                      )}
                      {link.recommendation_priority && (
                        <Badge variant="outline">{link.recommendation_priority} Priority</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setSelectedLink(link);
                      setUnlinkDialogOpen(true);
                    }}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Unlink
                  </Button>
                </div>

                {link.link_context && (
                  <div className="bg-gray-50 p-3 rounded mb-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Link Context:</p>
                    <p className="text-sm text-gray-700">{link.link_context}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                  {link.recommendation_region && (
                    <div>
                      <span className="font-semibold">Region:</span> {link.recommendation_region}
                    </div>
                  )}
                  {link.recommendation_parcel_ref && (
                    <div>
                      <span className="font-semibold">Parcel:</span> {link.recommendation_parcel_ref}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Linked:</span>{' '}
                    {format(new Date(link.linked_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Recommendation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the link between this recommendation and the case. The recommendation
              snapshot will be preserved for audit purposes. This action can be reversed by re-linking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlinking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlink}
              disabled={unlinking}
              className="bg-red-600 hover:bg-red-700"
            >
              {unlinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
