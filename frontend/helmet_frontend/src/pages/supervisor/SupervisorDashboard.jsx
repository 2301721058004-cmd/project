import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { formatDateWithTimezone } from '../../utils/timezone';
import { Activity, Search, MapPin, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export function SupervisorDashboard() {
  const { user, timezone } = useAuth();
  const [stats, setStats] = useState({
    assigned_zones: 0,
    today_detections: 0,
    today_violations: 0
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await api.supervisor.getDashboard();
      setStats({
        assigned_zones: data.zones ? data.zones.length : 0,
        today_detections: data.stats ? data.stats.total_detections : 0,
        today_violations: data.stats ? data.stats.total_violations : 0
      });

      if (data.recent_detections) {
        // Reverse array to show oldest to newest on graph (left to right)
        const sortedData = [...data.recent_detections].reverse().map(d => ({
          time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          totalPeople: d.people_count || 0,
          violations: d.violations_count || 0,
          safePeople: (d.people_count || 0) - (d.violations_count || 0)
        }));
        setChartData(sortedData);
      }

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen mesh-gradient-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-orange-600 font-bold animate-pulse">Syncing Safety Stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen mesh-gradient-bg bg-grid-pattern overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="scanning-line" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-200/30 rounded-full blur-[140px] animate-pulse-soft" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-300/20 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[40%] left-[5%] w-32 h-32 bg-orange-100/40 rounded-full blur-[60px] animate-float" />

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-8 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
              <h1 className="text-4xl font-black text-gray-800 tracking-tight">
                Supervisor <span className="text-orange-500">Node</span>
              </h1>
            </div>
            <p className="text-gray-500 font-medium ml-4">Monitoring {stats.assigned_zones} active safety zones</p>
          </div>

          <div className="glass-card-premium px-6 py-3 rounded-2xl flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Status</p>
            </div>
            <p className="text-xs font-bold text-emerald-600 uppercase">Operational</p>
          </div>
        </div>

        {error && <Alert type="error" message={error} className="mb-8" />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { label: 'Assigned Zones', value: stats.assigned_zones, icon: '📍', sub: 'Active Monitoring' },
            { label: 'Today\'s Detections', value: stats.today_detections, icon: '🔍', sub: 'Neural Scans' },
            { label: 'Violations Detected', value: stats.today_violations, icon: '⚠️', sub: 'Immediate Actions' },
          ].map((stat, i) => (
            <div
              key={i}
              className="glass-card-premium rounded-[2.5rem] p-8 hover:translate-y-[-8px] transition-all duration-500 group shine-effect cursor-default"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xl shadow-orange-100/50 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
                {stat.icon}
              </div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</p>
              <p className="text-4xl font-black text-gray-800 tracking-tighter mb-1">{stat.value}</p>
              <p className="text-[10px] font-bold text-orange-400 tracking-wide uppercase">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="glass-card-premium rounded-[3rem] p-10 shine-effect relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Activity size={150} className="text-orange-500" />
          </div>

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-2xl shadow-xl shadow-orange-200">
                <Activity className="text-white w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Neural Safety Demographics</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-1.5 bg-orange-50 border border-orange-100 rounded-full">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Auto-Syncing Base
                </span>
              </div>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="text-center py-24 bg-gray-50/20 rounded-[2.5rem] border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-50">
                <Search className="text-orange-300 w-8 h-8" />
              </div>
              <p className="text-gray-800 font-bold text-xl mb-1">Awaiting Data Aggregation...</p>
              <p className="text-gray-400 text-sm">Initializing neural detection nodes in your assigned zones</p>
            </div>
          ) : (
            <div className="relative z-10 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }}
                    iconType="circle"
                  />
                  <Bar dataKey="safePeople" name="Safe Compliant" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="violations" name="Violators" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}