import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { supabase } from '../lib/supabase';

const DailyMacrosChart = ({ userId, timeRange = '7' }) => {
  const [macrosData, setMacrosData] = useState([]);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartStartDate, setChartStartDate] = useState(null);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, timeRange]);

  const loadData = async () => {
    const goalsData = await loadGoals();
    const startDate = goalsData?.chart_start_date || null;
    await loadMacrosData(startDate);
  };

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('target_calories, protein_goal_g, carbs_goal_g, fat_goal_g, chart_start_date')
        .eq('user_id', userId)
        .single();

      if (data) {
        setGoals(data);
        
        // Set chart start date if available
        if (data.chart_start_date) {
          console.log('📅 Macros - Chart start date loaded from DB:', data.chart_start_date);
          setChartStartDate(data.chart_start_date);
        } else {
          console.log('📅 Macros - No chart start date set');
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error loading goals:', error);
      return null;
    }
  };

  const loadMacrosData = async (chartStartDateParam = chartStartDate) => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      // Apply chart_start_date filter if set
      console.log('📊 Macros - chartStartDate param:', chartStartDateParam);
      console.log('📊 Macros - calculated startDate:', startDate.toISOString());
      
      const effectiveStartDate = chartStartDateParam && new Date(chartStartDateParam) > startDate 
        ? new Date(chartStartDateParam) 
        : startDate;
      
      console.log('📊 Macros - effectiveStartDate:', effectiveStartDate.toISOString());

      // Load meals from database
      const { data: meals, error } = await supabase
        .from('meals')
        .select('meal_date, calories, protein_g, carbs_g, fat_g')
        .eq('user_id', userId)
        .gte('meal_date', effectiveStartDate.toISOString().split('T')[0])
        .lte('meal_date', endDate.toISOString().split('T')[0])
        .order('meal_date', { ascending: true });

      if (error) {
        console.error('Error loading meals:', error);
        setMacrosData([]);
        return;
      }

      if (!meals || meals.length === 0) {
        setMacrosData([]);
        return;
      }

      // Group by date and sum macros
      const groupedData = {};
      meals.forEach(meal => {
        const date = meal.meal_date;
        if (!groupedData[date]) {
          groupedData[date] = {
            date,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          };
        }
        groupedData[date].calories += meal.calories || 0;
        groupedData[date].protein += meal.protein_g || 0;
        groupedData[date].carbs += meal.carbs_g || 0;
        groupedData[date].fat += meal.fat_g || 0;
      });

      // Convert to array and format dates
      const formattedData = Object.values(groupedData).map(item => {
        // Parse date as UTC to prevent timezone shifts
        const date = new Date(item.date + 'T00:00:00Z');
        
        return {
          ...item,
          dateLabel: date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            timeZone: 'UTC'
          }),
          // Round to 1 decimal place
          calories: parseFloat(item.calories.toFixed(1)),
          protein: parseFloat(item.protein.toFixed(1)),
          carbs: parseFloat(item.carbs.toFixed(1)),
          fat: parseFloat(item.fat.toFixed(1))
        };
      });

      setMacrosData(formattedData);
    } catch (error) {
      console.error('Error loading macros data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip to show all macros with proper formatting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}{entry.name.includes('Calories') ? '' : 'g'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (macrosData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Macros</h3>
        <div className="text-center py-12">
          <p className="text-gray-600">No nutrition data yet</p>
          <p className="text-sm text-gray-500 mt-2">Start logging meals to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Daily Macros</h3>
        <p className="text-sm text-gray-600">Calories, Protein, Carbs & Fat Tracking</p>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={macrosData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dateLabel" />
          <YAxis label={{ value: 'Amount', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Goal reference lines */}
          {goals?.target_calories && (
            <ReferenceLine 
              y={goals.target_calories} 
              stroke="#3b82f6" 
              strokeDasharray="5 5" 
              label={{ value: `Cal Goal: ${goals.target_calories}`, position: 'right', fill: '#3b82f6', fontSize: 11 }}
            />
          )}
          
          {/* Line charts for each macro */}
          <Line 
            type="monotone" 
            dataKey="calories" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            name="Calories"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="protein" 
            stroke="#ef4444" 
            strokeWidth={2} 
            name="Protein (g)"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="carbs" 
            stroke="#fbbf24" 
            strokeWidth={2} 
            name="Carbs (g)"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="fat" 
            stroke="#10b981" 
            strokeWidth={2} 
            name="Fat (g)"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Goals Reference */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 mb-2">Daily Goals:</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {goals?.target_calories && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">Calories: {goals.target_calories}</span>
            </div>
          )}
          {goals?.protein_goal_g && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Protein: {goals.protein_goal_g}g</span>
            </div>
          )}
          {goals?.carbs_goal_g && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-700">Carbs: {goals.carbs_goal_g}g</span>
            </div>
          )}
          {goals?.fat_goal_g && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Fat: {goals.fat_goal_g}g</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyMacrosChart;
