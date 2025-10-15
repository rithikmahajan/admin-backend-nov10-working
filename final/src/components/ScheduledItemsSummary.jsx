import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { apiCall } from '../api/utils';
import { itemAPI } from '../api/endpoints';

const ScheduledItemsSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const result = await apiCall(itemAPI.getScheduledItemsSummary);
      if (result.success) {
        setSummary(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch scheduled items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchSummary, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Scheduled Items Summary
        </h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Total Scheduled</p>
                <p className="text-2xl font-bold text-blue-900">{summary.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{summary.overdue}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Upcoming</p>
                <p className="text-2xl font-bold text-green-900">{summary.upcoming}</p>
              </div>
            </div>
          </div>
        </div>

        {summary.overdue > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Overdue Items (Need Immediate Action)
            </h4>
            <div className="space-y-2">
              {summary.overdueItems.slice(0, 5).map((item) => (
                <div key={item.itemId} className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">ID: {item.itemId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600 font-medium">
                        {item.scheduledDate} at {item.scheduledTime}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.upcoming > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Next Upcoming Items
            </h4>
            <div className="space-y-2">
              {summary.upcomingItems.slice(0, 5).map((item) => (
                <div key={item.itemId} className="bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">ID: {item.itemId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-600 font-medium">
                        {item.scheduledDate} at {item.scheduledTime}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.total === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Items</h3>
            <p className="text-gray-600">All your products are either in draft or published state.</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={fetchSummary}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Clock className="w-4 h-4" />
            Refresh Status
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Updates automatically every 5 minutes. Overdue items will be published automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScheduledItemsSummary;
