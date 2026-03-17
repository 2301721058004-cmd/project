import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { formatDateWithTimezone } from '../../utils/timezone';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';

export function DailyViolationHistory() {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dailyData, setDailyData] = useState([]);
  const [allZonesData, setAllZonesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('by-zone'); // 'by-zone' or 'all-zones'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    totalViolations: 0,
    averageDaily: 0,
    highestDay: null,
  });
  const { timezone } = useAuth();
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'

  // Fetch zones on mount
  useEffect(() => {
    fetchZones();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    if (viewMode === 'by-zone' && selectedZone) {
      fetchDayWiseViolations();
    } else if (viewMode === 'all-zones') {
      fetchAllZonesDayWise();
    }
  }, [viewMode, selectedZone, startDate, endDate, selectedDate]);

  const fetchZones = async () => {
    try {
      const response = await api.admin.getZones();
      setZones(response.zones || []);
      if (response.zones && response.zones.length > 0) {
        setSelectedZone(response.zones[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err);
      setError('Failed to load zones');
    }
  };

  const fetchDayWiseViolations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.dailySummary.getDayWiseViolations(
        selectedZone,
        startDate,
        endDate
      );
      
      const summaries = response.daily_summaries || [];
      setDailyData(summaries);

      // Calculate stats
      const total = summaries.reduce((sum, day) => sum + day.violations_count, 0);
      const average = summaries.length > 0 ? (total / summaries.length).toFixed(2) : 0;
      const highest = summaries.length > 0 
        ? summaries.reduce((max, day) => day.violations_count > max.violations_count ? day : max)
        : null;

      setStats({
        totalViolations: total,
        averageDaily: average,
        highestDay: highest,
      });
    } catch (err) {
      console.error('Failed to fetch daily violations:', err);
      setError('Failed to load daily violations');
      setDailyData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllZonesDayWise = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.dailySummary.getAllZonesDayWise(selectedDate);
      
      setAllZonesData(response.daily_summaries || []);
      setStats({
        totalViolations: response.total_violations || 0,
        averageDaily: 0,
        highestDay: null,
      });
    } catch (err) {
      console.error('Failed to fetch all zones daily violations:', err);
      setError('Failed to load daily violations for all zones');
      setAllZonesData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const prepareChartData = (data) => {
    return data.map(day => ({
      date: formatDateShort(day.date),
      fullDate: day.date,
      violations: day.violations_count,
      people: day.people_without_helmets || 0,
      frames: day.violation_frames?.length || 0
    }));
  };

  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone?.name || 'Unknown Zone';
  };

  const getSeverityColor = (count) => {
    if (count === 0) return 'bg-green-50 border-green-200';
    if (count < 5) return 'bg-yellow-50 border-yellow-200';
    if (count < 10) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getSeverityBadgeColor = (count) => {
    if (count === 0) return 'bg-green-100 text-green-800';
    if (count < 5) return 'bg-yellow-100 text-yellow-800';
    if (count < 10) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Violation History</h1>
        <p className="text-gray-500 mt-2">Track violations by day to identify patterns</p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* View Mode Toggle */}
      <Card className="p-4">
        <div className="flex gap-4">
          <button
            onClick={() => setViewMode('by-zone')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'by-zone'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            By Zone
          </button>
          <button
            onClick={() => setViewMode('all-zones')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'all-zones'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Zones
          </button>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {viewMode === 'by-zone' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {viewMode === 'all-zones' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Statistics */}
      {viewMode === 'by-zone' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium">Total Violations</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">
                {stats.totalViolations}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium">Average Daily</p>
              <p className="text-4xl font-bold text-orange-600 mt-2">
                {stats.averageDaily}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium">Highest Day</p>
              <div className="mt-2">
                {stats.highestDay ? (
                  <>
                    <p className="text-4xl font-bold text-red-600">
                      {stats.highestDay.violations_count}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(stats.highestDay.date)}
                    </p>
                  </>
                ) : (
                  <p className="text-2xl text-gray-400">—</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Chart Visualization - By Zone */}
      {viewMode === 'by-zone' && dailyData.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Violations Trend Chart</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 text-sm rounded transition-all ${
                    chartType === 'line'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 text-sm rounded transition-all ${
                    chartType === 'bar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'line' ? (
                <LineChart data={prepareChartData(dailyData)} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="date" 
                    style={{ fontSize: '12px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Violations', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                    formatter={(value) => [value, 'Violations']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="violations" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Violations"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="people" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="People Without Helmets"
                  />
                </LineChart>
              ) : (
                <BarChart data={prepareChartData(dailyData)} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="date" 
                    style={{ fontSize: '12px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Violations', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="violations" 
                    fill="#3b82f6" 
                    name="Violations"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    dataKey="people" 
                    fill="#ef4444" 
                    name="People Without Helmets"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Daily Violations List */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {viewMode === 'by-zone' 
            ? `Daily Violations - ${getZoneName(selectedZone)}`
            : `All Zones - ${formatDate(selectedDate)}`
          }
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : viewMode === 'by-zone' && dailyData.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">No violation data available</div>
          </div>
        ) : viewMode === 'all-zones' && allZonesData.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">No violations recorded for this date</div>
          </div>
        ) : (
          <div className="space-y-3">
            {viewMode === 'by-zone' ? (
              dailyData.map((day, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${getSeverityColor(day.violations_count)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {formatDate(day.date)}
                      </h3>
                      {day.violation_frames && day.violation_frames.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          {day.violation_frames.length} violation frames recorded
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getSeverityBadgeColor(day.violations_count)}`}>
                        {day.violations_count} {day.violations_count === 1 ? 'violation' : 'violations'}
                      </span>
                      {day.people_without_helmets > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          {day.people_without_helmets} people without helmets
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              allZonesData.map((zone, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${getSeverityColor(zone.violations_count)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {getZoneName(zone.zone_id)}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getSeverityBadgeColor(zone.violations_count)}`}>
                        {zone.violations_count} {zone.violations_count === 1 ? 'violation' : 'violations'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Legend */}
      <Card className="p-4 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Severity Levels</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">Safe (0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-sm text-gray-600">Low (1-4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-sm text-gray-600">Medium (5-9)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm text-gray-600">High (10+)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
