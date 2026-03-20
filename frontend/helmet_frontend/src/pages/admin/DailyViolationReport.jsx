import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { formatDateWithTimezone } from '../../utils/timezone';
import { Calendar, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export function DailyViolationReport() {
  const { timezone } = useAuth();
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({
    totalViolations: 0,
    averagePerDay: 0,
    maxViolationsDay: 0,
    daysWithViolations: 0
  });

  useEffect(() => {
    fetchZones();
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedZone && startDate && endDate) {
      fetchDailyViolations();
    }
  }, [selectedZone, startDate, endDate]);

  const fetchZones = async () => {
    try {
      const response = await api.admin.getZones();
      const zonesData = Array.isArray(response.zones) ? response.zones : [];
      setZones(zonesData);
      if (zonesData.length > 0) {
        setSelectedZone(zonesData[0].id);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load zones');
      setLoading(false);
    }
  };

  const fetchDailyViolations = async () => {
    try {
      setLoading(true);
      const response = await api.dailySummary.getDayWiseViolations(selectedZone, startDate, endDate);
      const summaries = response.daily_summaries || [];

      // Format data for charts
      const chartData = summaries.map(summary => ({
        date: new Date(summary.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: summary.date,
        violations: summary.violations_count || 0,
        timestamp: new Date(summary.date).getTime()
      })).sort((a, b) => a.timestamp - b.timestamp);

      setDailyData(chartData);

      // Calculate statistics
      const totalViolations = chartData.reduce((sum, day) => sum + day.violations, 0);
      const daysWithViolations = chartData.filter(day => day.violations > 0).length;
      const maxViolationsDay = Math.max(...chartData.map(day => day.violations), 0);
      const averagePerDay = chartData.length > 0 ? (totalViolations / chartData.length).toFixed(2) : 0;

      setStats({
        totalViolations,
        averagePerDay,
        maxViolationsDay,
        daysWithViolations
      });
      setError('');
    } catch (err) {
      setError('Failed to load daily violations');
      setDailyData([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && zones.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
      </div>
    );
  }

  const selectedZoneData = zones.find(z => z.id === selectedZone);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1.5 h-8 bg-orange-500 rounded-full" />
          <h1 className="text-4xl font-black text-gray-800">Daily Violation Report</h1>
        </div>
        <p className="text-gray-600 ml-4">Day-wise breakdown of helmet safety violations</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-8" />}

      {/* Filters */}
      <Card className="mb-8 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Zone Selection */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Zone</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="">-- Select Zone --</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          {/* Quick Select */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Quick Select</label>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(end.toISOString().split('T')[0]);
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-semibold"
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Violations</p>
              <p className="text-3xl font-bold text-red-600">{stats.totalViolations}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average per Day</p>
              <p className="text-3xl font-bold text-orange-600">{stats.averagePerDay}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Peak Violations</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.maxViolationsDay}</p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Days with Violations</p>
              <p className="text-3xl font-bold text-blue-600">{stats.daysWithViolations}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {dailyData.length > 0 ? (
        <>
          {/* Bar Chart */}
          <Card title="Daily Violations - Bar Chart" className="mb-8 shadow-md">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Violations', angle: -90, position: 'insideLeft', offset: 10 }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                  formatter={(value) => [`${value} violations`, 'Violations']}
                />
                <Bar 
                  dataKey="violations" 
                  fill="#f97316" 
                  radius={[8, 8, 0, 0]}
                  name="Violations"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Line Chart */}
          <Card title="Violations Trend - Line Chart" className="mb-8 shadow-md">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis 
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Violations', angle: -90, position: 'insideLeft', offset: 10 }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                  formatter={(value) => [`${value} violations`, 'Violations']}
                />
                <Line 
                  type="monotone" 
                  dataKey="violations" 
                  stroke="#f97316" 
                  dot={{ fill: '#f97316', r: 5 }}
                  activeDot={{ r: 7 }}
                  strokeWidth={2}
                  name="Violations"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Table */}
          <Card title="Daily Violation Details" className="shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-6 py-3 text-left font-bold text-gray-700">Date</th>
                    <th className="px-6 py-3 text-center font-bold text-gray-700">Violations Count</th>
                    <th className="px-6 py-3 text-center font-bold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((day, index) => (
                    <tr 
                      key={index}
                      className={`border-b ${day.violations > 0 ? 'bg-red-50 hover:bg-red-100' : 'bg-green-50 hover:bg-green-100'} transition`}
                    >
                      <td className="px-6 py-4 font-semibold text-gray-800">{day.date}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-4 py-2 rounded-full font-bold ${
                          day.violations > 0 
                            ? 'bg-red-200 text-red-700' 
                            : 'bg-green-200 text-green-700'
                        }`}>
                          {day.violations}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {day.violations > 0 ? (
                          <span className="text-red-600 font-semibold">⚠️ Violations</span>
                        ) : (
                          <span className="text-green-600 font-semibold">✅ Safe</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-gray-600 text-lg mb-2">No data available</p>
            <p className="text-gray-400">Select a zone and date range to view violations</p>
          </div>
        </Card>
      )}
    </div>
  );
}
