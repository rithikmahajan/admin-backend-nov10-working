import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchFilters,
  selectAvailableFilters,
  selectFilterLoading 
} from '../store/slices/filtersSlice';

const FilterTest = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectAvailableFilters);
  const filtersLoading = useSelector(selectFilterLoading);

  useEffect(() => {
    console.log('🔍 FilterTest: Fetching filters...');
    dispatch(fetchFilters())
      .unwrap()
      .then((data) => {
        console.log('✅ FilterTest: Successfully fetched filters:', data);
      })
      .catch((error) => {
        console.error('❌ FilterTest: Failed to fetch filters:', error);
      });
  }, [dispatch]);

  useEffect(() => {
    console.log('🔍 FilterTest: Filters state changed:', {
      filters,
      filtersLoading,
      filtersLength: filters?.length,
    });
  }, [filters, filtersLoading]);

  if (filtersLoading) {
    return <div className="p-4">Loading filters...</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Filter Test Component</h3>
      
      <div className="mb-3">
        <strong>Filter Count:</strong> {filters?.length || 0}
      </div>

      {filters && filters.length > 0 ? (
        <div className="space-y-3">
          {filters.map((filter) => (
            <div key={filter._id} className="p-3 bg-gray-50 rounded">
              <div className="font-medium capitalize">{filter.key}</div>
              <div className="text-sm text-gray-600">
                Values: {filter.values?.length || 0}
              </div>
              {filter.values && filter.values.length > 0 && (
                <div className="mt-2">
                  {filter.values.map((value) => (
                    <span 
                      key={value._id} 
                      className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2 mb-1 capitalize"
                    >
                      {value.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">No filters found</div>
      )}
    </div>
  );
};

export default FilterTest;
