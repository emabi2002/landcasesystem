const loadCases = async () => {
  try {
    const batchSize = 1000;
    let from = 0;
    let allCases: CaseRow[] = [];

    while (true) {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) throw error;

      const batch = (data as CaseRow[]) ?? [];
      allCases = allCases.concat(batch);

      if (batch.length < batchSize) break;
      from += batchSize;
    }

    setCases(allCases);
  } catch (error) {
    console.error('Error loading cases:', error);
    toast.error('Failed to load cases');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};