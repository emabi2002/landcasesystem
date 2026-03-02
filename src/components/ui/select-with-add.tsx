'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';

interface LookupItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  display_order: number;
}

interface SelectWithAddProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  tableName: 'matter_types' | 'case_categories' | 'hearing_types' | 'order_types' | 'lease_types' | 'divisions' | 'regions' | 'lawyers' | 'sol_gen_officers' | 'case_statuses' | 'priority_levels' | 'action_officers';
  label?: string;
  required?: boolean;
  disabled?: boolean;
  useCodeAsValue?: boolean; // If true, uses 'code' field as value instead of 'name'
}

export function SelectWithAdd({
  value,
  onValueChange,
  placeholder = 'Select an option',
  tableName,
  label,
  required = false,
  disabled = false,
  useCodeAsValue = false,
}: SelectWithAddProps) {
  const [items, setItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Load items from the lookup table
  useEffect(() => {
    loadItems();
    checkAdminStatus();
  }, [tableName]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error(`Error loading ${tableName}:`, error);
        // If table doesn't exist, use empty array
        setItems([]);
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Check if user is admin from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        const role = (profile as { role?: string }).role;
        setIsAdmin(role === 'admin' || role === 'administrator' || role === 'manager_legal_services');
      } else {
        // Default to admin if no profile (for development)
        setIsAdmin(true);
      }
    } catch (error) {
      // Default to admin for development
      setIsAdmin(true);
    }
  };

  const handleAddNewItem = async () => {
    if (!newItemName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    // Check if item already exists
    const exists = items.some(
      (item) => item.name.toLowerCase() === newItemName.trim().toLowerCase()
    );
    if (exists) {
      toast.error('This item already exists');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const newItem = {
        name: newItemName.trim(),
        description: newItemDescription.trim() || null,
        code: newItemName.trim().toLowerCase().replace(/\s+/g, '_'),
        is_active: true,
        display_order: items.length + 1,
        created_by: user?.id || null,
      };

      const { data, error } = await (supabase as any)
        .from(tableName)
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;

      toast.success(`"${newItemName}" added successfully!`);

      // Update local items list
      setItems([...items, data]);

      // Select the new item
      onValueChange(useCodeAsValue ? data.code : data.name);

      // Reset and close dialog
      setNewItemName('');
      setNewItemDescription('');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error adding new item:', error);
      toast.error('Failed to add new item');
    } finally {
      setSaving(false);
    }
  };

  const getTableLabel = () => {
    switch (tableName) {
      case 'matter_types':
        return 'Matter Type';
      case 'case_categories':
        return 'Case Category';
      case 'hearing_types':
        return 'Hearing Type';
      case 'order_types':
        return 'Order Type';
      case 'lease_types':
        return 'Lease Type';
      case 'divisions':
        return 'Division';
      case 'regions':
        return 'Region';
      case 'lawyers':
        return 'Lawyer/Firm';
      case 'sol_gen_officers':
        return 'Sol Gen Officer';
      case 'case_statuses':
        return 'Case Status';
      case 'priority_levels':
        return 'Priority Level';
      case 'action_officers':
        return 'Action Officer';
      default:
        return 'Item';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
          <SelectTrigger className="flex-1">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder={placeholder} />
            )}
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem
                key={item.id}
                value={useCodeAsValue ? (item.code || item.name) : item.name}
              >
                {item.name}
              </SelectItem>
            ))}
            {items.length === 0 && !loading && (
              <div className="px-2 py-4 text-center text-sm text-slate-500">
                No options available
              </div>
            )}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setDialogOpen(true)}
            title={`Add new ${getTableLabel().toLowerCase()}`}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Add New Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {getTableLabel()}</DialogTitle>
            <DialogDescription>
              Create a new option for the {getTableLabel().toLowerCase()} dropdown.
              This will be available for all users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-item-name">Name *</Label>
              <Input
                id="new-item-name"
                placeholder={`Enter ${getTableLabel().toLowerCase()} name`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-item-description">Description (optional)</Label>
              <Input
                id="new-item-description"
                placeholder="Brief description..."
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setNewItemName('');
                setNewItemDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNewItem}
              disabled={saving || !newItemName.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {getTableLabel()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
