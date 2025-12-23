'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddLandParcelDialogProps {
  caseId: string;
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AddLandParcelDialog({ caseId, onSuccess, open: controlledOpen, onOpenChange, trigger }: AddLandParcelDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    parcel_number: '',
    location: '',
    area_sqm: '',
    coordinates: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert coordinates string to JSON if provided
      let coordinatesJson = null;
      if (formData.coordinates) {
        const coords = formData.coordinates.split(',').map(c => c.trim());
        if (coords.length === 2) {
          coordinatesJson = {
            latitude: parseFloat(coords[0]),
            longitude: parseFloat(coords[1])
          };
        }
      }

      const { error } = await supabase
        .from('land_parcels')
        .insert([
          {
            case_id: caseId,
            parcel_number: formData.parcel_number,
            location: formData.location || null,
            area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null,
            coordinates: coordinatesJson,
            survey_plan_url: null,
            notes: formData.notes || null,
          } as never,
        ]);

      if (error) throw error;

      toast.success('Land parcel added successfully!');
      setOpen(false);
      setFormData({
        parcel_number: '',
        location: '',
        area_sqm: '',
        coordinates: '',
        notes: '',
      });
      onSuccess();
    } catch (error) {
      console.error('Land parcel error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add land parcel';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOpen && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2 text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
              <Plus className="h-4 w-4" />
              Add Land Parcel
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Land Parcel</DialogTitle>
          <DialogDescription>Link a land parcel or property to this case</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parcel_number">Parcel Number *</Label>
            <Input
              id="parcel_number"
              placeholder="e.g., SEC 123 ALL 45, NCD"
              value={formData.parcel_number}
              onChange={(e) => setFormData({ ...formData, parcel_number: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location / Description</Label>
            <Input
              id="location"
              placeholder="e.g., Hohola, Port Moresby"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area_sqm">Area (sq meters)</Label>
            <Input
              id="area_sqm"
              type="number"
              step="0.01"
              placeholder="e.g., 1200.50"
              value={formData.area_sqm}
              onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinates">GPS Coordinates</Label>
            <Input
              id="coordinates"
              placeholder="e.g., -9.4438, 147.1803"
              value={formData.coordinates}
              onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
            />
            <p className="text-xs text-slate-500">Format: Latitude, Longitude</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (including Title Details)</Label>
            <Textarea
              id="notes"
              placeholder="E.g., State Lease 123-456, any additional information about this parcel..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
              {loading ? 'Adding...' : 'Add Parcel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
