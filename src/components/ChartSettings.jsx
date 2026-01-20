import { useState, useEffect } from 'react';
import { Settings, Calendar, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChartSettings({ userId, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chartStartDate, setChartStartDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (userId && isOpen) {
      loadCurrentSettings();
    }
  }, [userId, isOpen]);

  const loadCurrentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('chart_start_date')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.chart_start_date) {
        setChartStartDate(data.chart_start_date);
      }
    } catch (error) {
      console.error('Error loading chart settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // First check if user_goals record exists
      const { data: existingGoals, error: fetchError } = await supabase
        .from('user_goals')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existingGoals) {
        // Update existing record
        const { error } = await supabase
          .from('user_goals')
          .update({ chart_start_date: chartStartDate || null })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_goals')
          .insert({ 
            user_id: userId, 
            chart_start_date: chartStartDate || null 
          });

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Chart settings saved successfully!' });
      
      // Notify parent component to refresh charts
      if (onUpdate) {
        onUpdate();
      }

      // Close modal after 1.5 seconds
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 1500);
    } catch (error) {
      console.error('Error saving chart settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setChartStartDate('');
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
        title="Chart Settings"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Chart Settings</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">Chart Settings</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Chart Start Date
                </label>
                <input
                  type="date"
                  value={chartStartDate}
                  onChange={(e) => setChartStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Charts will only show data from this date onwards. Leave empty to show all available data.
                </p>
              </div>

              {chartStartDate && (
                <button
                  onClick={handleClear}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear date (show all data)
                </button>
              )}

              {/* Message */}
              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
