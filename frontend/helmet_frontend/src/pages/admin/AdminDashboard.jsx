import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { useSound } from '../../hooks/useSound';
import { useAuth } from '../../context/AuthContext';
import { formatDateWithTimezone } from '../../utils/timezone';
import { AlertTriangle } from 'lucide-react';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    total_detections: 0,
    total_violations: 0,
    total_zones: 0,
    total_supervisors: 0,
    total_cameras: 0,
    compliance_rate: 0,
    detection_success_rate: 0,
  });
  const [chartData, setChartData] = useState({
    violation_ratio: [],
    zone_stats: [],
  });
  const [recentViolations, setRecentViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { playAlert } = useSound();
  const { timezone } = useAuth();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.admin.getDashboardStats();

      const prevViolations = recentViolations.length;
      const newViolations = statsRes.recent_violations || [];

      if (newViolations.length > prevViolations && prevViolations > 0) {
        playAlert();
      }

      setStats(statsRes.stats || {
        total_detections: 0,
        total_violations: 0,
        total_zones: 0,
        total_supervisors: 0,
        total_cameras: 0,
        compliance_rate: 0,
        detection_success_rate: 0,
      });

      setChartData(statsRes.chart_data || {
        violation_ratio: [],
        zone_stats: [],
      });

      setRecentViolations(newViolations);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64 bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            <h1 className="text-4xl font-black text-gray-800 tracking-tight">
              Dashboard <span className="text-orange-500">Overview</span>
            </h1>
          </div>
          <p className="text-gray-500 font-medium ml-4">
            Real-time neural safety intelligence
          </p>
        </div>

        {error && <Alert type="error" message={error} className="mb-8" />}

        {/* Key Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Violations */}
          <div className="glass-card-premium rounded-3xl p-6 hover:translate-y-[-5px] transition-all duration-500 group shine-effect cursor-default">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                ⚠️
              </div>
              <div className="h-1.5 w-12 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full w-1/3 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              </div>
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">No Helmet (Violators)</p>
            <p className="text-3xl font-black text-gray-800 tracking-tight">
              {stats.total_violations.toLocaleString()}
            </p>
          </div>

          {/* Active Zones */}
          <div className="glass-card-premium rounded-3xl p-6 hover:translate-y-[-5px] transition-all duration-500 group shine-effect cursor-default">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                📍
              </div>
              <div className="h-1.5 w-12 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-3/4 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Active Zones</p>
            <p className="text-3xl font-black text-gray-800 tracking-tight">
              {stats.total_zones}
            </p>
          </div>

          {/* Supervisors */}
          <div className="glass-card-premium rounded-3xl p-6 hover:translate-y-[-5px] transition-all duration-500 group shine-effect cursor-default">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                👥
              </div>
              <div className="h-1.5 w-12 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-1/2 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              </div>
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Supervisors</p>
            <p className="text-3xl font-black text-gray-800 tracking-tight">
              {stats.total_supervisors}
            </p>
          </div>
        </div>

        {/* Secondary Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Compliance Rate */}
          <div className="glass-card-premium rounded-3xl p-8 shine-effect">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-500/20 rounded-2xl">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Helmet Usage Rate</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-black text-emerald-600">{stats.compliance_rate}%</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase">Overall Safety</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-lg shadow-emerald-200 transition-all duration-1000"
                    style={{ width: `${stats.compliance_rate}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">System recorded {stats.total_detections - stats.total_violations} helmet wearers</p>
            </div>
          </div>

          {/* Active Cameras */}
          <div className="glass-card-premium rounded-3xl p-8 shine-effect">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500/20 rounded-2xl">
                <span className="text-2xl">📹</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Active Cameras</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-4xl font-black text-purple-600 mb-2">{stats.total_cameras}</p>
                <p className="text-xs text-gray-500">Monitoring across {stats.total_zones} zone(s)</p>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Avg per zone:</span>
                  <span className="font-black text-gray-800">
                    {stats.total_zones > 0 ? (stats.total_cameras / stats.total_zones).toFixed(1) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graph Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Violation vs Safe Pie Chart */}
          <div className="glass-card-premium rounded-3xl p-8 shine-effect">
            <h3 className="text-lg font-bold text-gray-800 mb-8 flex items-center gap-3">
              <span className="text-2xl">📊</span> People Breakdown
            </h3>
            {chartData.violation_ratio && chartData.violation_ratio.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.violation_ratio.map(entry => {
                      const { fill, ...rest } = entry;
                      return rest;
                    })}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.violation_ratio.map((entry, index) => {
                      const isViolation = entry.name && (entry.name.toLowerCase().includes('violation') || entry.name.toLowerCase().includes('violat') || entry.name.toLowerCase().includes('no helmet'));
                      return <Cell key={`cell-${index}`} fill={isViolation ? '#f97316' : '#9ca3af'} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                <p>No data available</p>
              </div>
            )}
          </div>

          {/* Zone-wise Statistics Bar Chart */}
          <div className="glass-card-premium rounded-3xl p-8 shine-effect">
            <h3 className="text-lg font-bold text-gray-800 mb-8 flex items-center gap-3">
              <span className="text-2xl">📈</span> Zone Performance
            </h3>
            {chartData.zone_stats && chartData.zone_stats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.zone_stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                    formatter={(value) => value.toLocaleString()}
                  />
                  <Legend />
                  <Bar dataKey="violations" fill="#f97316" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="detections" fill="#9ca3af" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                <p>No zone data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Violations */}
        <div className="glass-card-premium rounded-[2.5rem] p-8 shine-effect overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <AlertTriangle size={120} className="text-orange-500" />
          </div>

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-200">
                <AlertTriangle className="text-white w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Recent Violations</h2>
            </div>
          </div>

          {recentViolations.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/30 rounded-3xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-100/50">
                <span className="text-4xl text-emerald-500">✓</span>
              </div>
              <p className="text-gray-800 font-bold text-lg mb-1">System Compliant</p>
              <p className="text-gray-500 text-sm">No recent safety violations detected</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              {recentViolations.map((violation, index) => (
                <div
                  key={violation.id}
                  className="bg-white/80 rounded-[2rem] overflow-hidden border border-orange-100/50 hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-500 group"
                >
                  {/* Image Section */}
                  <div className="relative h-56 overflow-hidden">
                    {violation.annotated_image_path ? (
                      <img
                        src={api.detection.getImageUrl(violation.annotated_image_path)}
                        alt="Violation detection"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 italic">
                        Missing frame data
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg uppercase tracking-tighter shadow-lg">
                        Critical Incident
                      </span>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {formatDateWithTimezone(violation.timestamp, timezone, 'datetime')}
                      </p>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-1">Human Violations</p>
                        <p className="text-4xl font-black text-orange-600 tracking-tighter leading-none">
                          {violation.violations_count}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Node Reference</p>
                        <p className="text-[10px] font-mono bg-gray-50 px-2 py-1 rounded-md text-gray-600 border border-gray-100">
                          ID_{violation.id.substring(0, 6)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
