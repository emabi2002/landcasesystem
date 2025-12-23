'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCaseComments, addCaseComment } from '@/lib/notification-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  case_id: string;
  user_id: string;
  comment: string;
  comment_type: 'commentary' | 'advice' | 'input' | 'general';
  is_private: boolean;
  created_at: string;
  user: {
    full_name: string;
    role: string;
    email: string;
  };
}

interface CaseCommentsSectionProps {
  caseId: string;
  caseNumber: string;
}

export function CaseCommentsSection({ caseId, caseNumber }: CaseCommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState({
    comment: '',
    comment_type: 'commentary' as 'commentary' | 'advice' | 'input' | 'general',
    is_private: false
  });

  useEffect(() => {
    loadCurrentUser();
    loadComments();
  }, [caseId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadComments = async () => {
    setLoading(true);
    const { comments: fetchedComments, error } = await getCaseComments(caseId);
    if (!error) {
      setComments(fetchedComments);
    } else {
      toast.error('Failed to load comments');
    }
    setLoading(false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!currentUserId) {
      toast.error('You must be logged in to comment');
      return;
    }

    setSubmitting(true);

    const result = await addCaseComment({
      case_id: caseId,
      user_id: currentUserId,
      comment: newComment.comment,
      comment_type: newComment.comment_type,
      is_private: newComment.is_private
    });

    if (result.success) {
      toast.success('Comment added successfully');
      setNewComment({
        comment: '',
        comment_type: 'commentary',
        is_private: false
      });
      loadComments(); // Reload comments
    } else {
      toast.error(result.error || 'Failed to add comment');
    }

    setSubmitting(false);
  };

  const getCommentTypeBadge = (type: string) => {
    const badges = {
      commentary: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Commentary' },
      advice: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Advice' },
      input: { color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Input' },
      general: { color: 'bg-slate-100 text-slate-800 border-slate-300', label: 'General' }
    };
    const badge = badges[type as keyof typeof badges] || badges.general;
    return <Badge className={`${badge.color} border`}>{badge.label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      secretary: 'bg-amber-100 text-amber-800',
      director_legal: 'bg-red-100 text-red-800',
      manager_legal: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      lawyer: 'bg-emerald-100 text-emerald-800'
    };
    const color = roleColors[role] || 'bg-slate-100 text-slate-800';
    const label = role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return <Badge className={`${color} border`}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Add New Comment */}
      <Card className="border-2 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-emerald-600" />
            Provide Your Input
          </CardTitle>
          <CardDescription>
            Add your commentary, advice, or input for case {caseNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment_type">Type of Input</Label>
            <Select
              value={newComment.comment_type}
              onValueChange={(value) => setNewComment({ ...newComment, comment_type: value as any })}
            >
              <SelectTrigger id="comment_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commentary">Commentary</SelectItem>
                <SelectItem value="advice">Advice</SelectItem>
                <SelectItem value="input">Input</SelectItem>
                <SelectItem value="general">General Comment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Comment *</Label>
            <Textarea
              id="comment"
              placeholder="Enter your commentary, advice, or input here..."
              value={newComment.comment}
              onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              {newComment.comment.length} characters
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_private"
              checked={newComment.is_private}
              onChange={(e) => setNewComment({ ...newComment, is_private: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="is_private" className="cursor-pointer text-sm">
              Private comment (visible only to case creator and administrators)
            </Label>
          </div>

          <Button
            onClick={handleSubmitComment}
            disabled={submitting || !newComment.comment.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? 'Submitting...' : 'Submit Comment'}
          </Button>
        </CardContent>
      </Card>

      {/* Comments List */}
      <Card className="border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-slate-600" />
            Comments & Input ({comments.length})
          </CardTitle>
          <CardDescription>
            All commentary, advice, and input provided by team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No comments yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Be the first to provide commentary or advice
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 border-2 rounded-lg hover:border-slate-300 transition-colors bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">
                        {comment.user.full_name}
                      </span>
                      {getRoleBadge(comment.user.role)}
                      {getCommentTypeBadge(comment.comment_type)}
                      {comment.is_private && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 border">
                          Private
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {comment.comment}
                  </p>

                  {comment.user_id === currentUserId && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-emerald-600">Your comment</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
