'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, X, FolderOpen, Map, Ruler, Navigation } from 'lucide-react';

interface LandParcel {
  id: string;
  parcel_number: string;
  location: string | null;
  area_sqm: number | null;
  coordinates: string | null;
  title_details: string | null;
  notes: string | null;
  case_id: string;
  created_at: string;
  cases?: {
    case_number: string;
    title: string | null;
  };
}

export default function LandParcelsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [parcels, setParcels] = useState<LandParcel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuth();
    loadParcels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  };

  const loadParcels = async () => {
    try {
      const { data, error } = await supabase
        .from('land_parcels')
        .select('*, cases(case_number, title)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setParcels(data || []);
    } catch (error) {
      console.error('Error loading land parcels:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParcels = parcels.filter(parcel => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      parcel.parcel_number.toLowerCase().includes(query) ||
      parcel.location?.toLowerCase().includes(query) ||
      parcel.cases?.case_number.toLowerCase().includes(query) ||
      parcel.title_details?.toLowerCase().includes(query)
    );
  });

  const formatArea = (sqm: number | null) => {
    if (!sqm) return 'Unknown';
    const hectares = sqm / 10000;
    if (hectares >= 1) return `${hectares.toFixed(2)} ha`;
    return `${sqm.toLocaleString()} m²`;
  };

  const locationCounts = parcels.reduce((acc, parcel) => {
    const loc = parcel.location || 'Unknown';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalArea = parcels.reduce((sum, p) => sum + (p.area_sqm || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading land parcels...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Land Parcels</h1>
          <p className="text-slate-600 mt-1">View and manage land parcels and GIS information</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Parcels</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#4A4284' }}>{parcels.length}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#F3F2F7' }}>
                  <MapPin className="h-5 w-5" style={{ color: '#4A4284' }} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Area</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{formatArea(totalArea)}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <Ruler className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Locations</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{Object.keys(locationCounts).length}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Map className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">With GPS</p>
                  <p className="text-2xl font-bold mt-1 text-orange-600">
                    {parcels.filter(p => p.coordinates).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50">
                  <Navigation className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by parcel number, location, case number, or title details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setSearchQuery('')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-slate-600 mt-3">
                Showing {filteredParcels.length} of {parcels.length} parcels
              </p>
            )}
          </CardContent>
        </Card>

        {/* Parcels Grid */}
        {filteredParcels.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {parcels.length === 0 ? 'No land parcels yet' : 'No matching parcels'}
              </h3>
              <p className="text-slate-600">
                {parcels.length === 0 ? 'Link land parcels from case pages' : 'Try different search terms'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredParcels.map((parcel) => (
              <Card key={parcel.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-50">
                      <MapPin className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 mb-1">{parcel.parcel_number}</h3>
                      {parcel.location && (
                        <p className="text-sm text-slate-600 mb-2">{parcel.location}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {parcel.area_sqm && (
                          <Badge variant="outline" className="text-xs">
                            <Ruler className="h-3 w-3 mr-1" />
                            {formatArea(parcel.area_sqm)}
                          </Badge>
                        )}
                        {parcel.coordinates && (
                          <Badge variant="outline" className="text-xs">
                            <Navigation className="h-3 w-3 mr-1" />
                            GPS
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          <span className="truncate">{parcel.cases?.case_number || 'Unknown'}</span>
                        </div>
                        {parcel.title_details && (
                          <div className="text-xs text-slate-500 truncate">
                            Title: {parcel.title_details}
                          </div>
                        )}
                        {parcel.coordinates && (
                          <div className="text-xs text-slate-500 truncate">
                            {parcel.coordinates}
                          </div>
                        )}
                      </div>
                      {parcel.notes && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{parcel.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/cases/${parcel.case_id}?tab=land`)}>
                      <FolderOpen className="h-4 w-4 mr-1" />
                      View Case
                    </Button>
                    {parcel.coordinates && (
                      <Button size="sm" className="flex-1 text-white hover:opacity-90" style={{ background: '#10B981' }}>
                        <Map className="h-4 w-4 mr-1" />
                        View Map
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
