'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface LandParcel {
  id: string;
  parcel_number: string;
  location?: string | null;
  area?: number | null;
  coordinates?: Record<string, unknown> | null;
  notes?: string | null;
}

interface EditLandParcelDialogProps {
  parcel: LandParcel;
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLandParcelDialog({ parcel, onSuccess, open, onOpenChange }: EditLandParcelDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    parcel_number: parcel.parcel_number,
    location: parcel.location || '',
    area: parcel.area?.toString() || '',
    latitude: parcel.coordinates && typeof parcel.coordinates === 'object' && 'latitude' in parcel.coordinates
      ? String(parcel.coordinates.latitude)
      : '',
    longitude: parcel.coordinates && typeof parcel.coordinates === 'object' && 'longitude' in parcel.coordinates
      ? String(parcel.coordinates.longitude)
      : '',
    notes: parcel.notes || '',
  });

  useEffect(() => {
    setFormData({
      parcel_number: parcel.parcel_number,
      location: parcel.location || '',
      area: parcel.area?.toString() || '',
      latitude: parcel.coordinates && typeof parcel.coordinates === 'object' && 'latitude' in parcel.coordinates
        ? String(parcel.coordinates.latitude)
        : '',
      longitude: parcel.coordinates && typeof parcel.coordinates === 'object' && 'longitude' in parcel.coordinates
        ? String(parcel.coordinates.longitude)
        : '',
      notes: parcel.notes || '',
    });
  }, [parcel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const coordinates = formData.latitude && formData.longitude
        ? { latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) }
        : null;

      const { error } = await supabase
        .from('land_parcels')
        .update({
          parcel_number: formData.parcel_number,
          location: formData.location || null,
          area: formData.area ? parseFloat(formData.area) : null,
          coordinates: coordinates,
          notes: formData.notes || null,
        } as never)
        .eq('id', parcel.id);

      if (error) throw error;

      toast.success('Land parcel updated successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Land parcel update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update land parcel';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this land parcel? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('land_parcels')
        .delete()
        .eq('id', parcel.id);

      if (error) throw error;

      toast.success('Land parcel deleted successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Land parcel delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete land parcel';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Land Parcel</DialogTitle>
          <DialogDescription>Update land parcel information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parcel_number">Parcel Number *</Label>
            <Input
              id="parcel_number"
              placeholder="e.g., SEC 123 ALL 456"
              value={formData.parcel_number}
              onChange={(e) => setFormData({ ...formData, parcel_number: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Port Moresby, NCD"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Area (hectares)</Label>
            <Input
              id="area"
              type="number"
              step="0.01"
              placeholder="e.g., 2.5"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="-9.4438"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="147.1803"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional information about the parcel..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading} className="sm:mr-auto">
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
