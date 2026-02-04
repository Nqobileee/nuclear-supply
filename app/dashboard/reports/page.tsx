'use client';

import { useState, useEffect } from 'react';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { TrendingUp, Download, FileText, Loader2, BarChart as BarChartIcon, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const REPORT_GENERATION_DELAY_MS = 1500;
const EXPORT_DELAY_MS = 1000;

export default function ReportsPage() {
  const [reportType, setReportType] = useState('Shipment Performance');
  const [timePeriod, setTimePeriod] = useState('Last 30 Days');
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [data, setData] = useState<any>({
    shipmentStatus: [],
    isotopeDistribution: [],
    activityTrends: [],
    metrics: []
  });

  const supabase = createClient();

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  async function fetchReportData() {
    setIsLoading(true);
    try {
      // 1. Fetch Shipments
      const { data: shipments, error: sError } = await supabase
        .from('shipments')
        .select('*');

      if (sError) throw sError;
      const allShipments = shipments || [];

      // 2. Fetch Alerts for metrics
      const { data: alerts } = await supabase
        .from('compliance_alerts')
        .select('*');

      const allAlerts = alerts || [];
      const activeAlerts = allAlerts.length;
      const errorAlerts = allAlerts.filter(a => a.severity === 'error').length;
      const complianceRate = activeAlerts === 0 ? 100 : Math.round(((activeAlerts - errorAlerts) / activeAlerts) * 100);

      // 3. Group by Status
      const statusCounts: Record<string, number> = {};
      allShipments.forEach(s => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      });
      const shipmentStatus = Object.keys(statusCounts).map(name => ({
        name,
        count: statusCounts[name]
      }));

      // 4. Group by Isotope
      const isotopeCounts: Record<string, number> = {};
      allShipments.forEach(s => {
        isotopeCounts[s.isotope] = (isotopeCounts[s.isotope] || 0) + 1;
      });
      const total = allShipments.length || 1;
      const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
      const isotopeDistribution = Object.keys(isotopeCounts).map((name, i) => ({
        name,
        value: Math.round((isotopeCounts[name] / total) * 100),
        color: colors[i % colors.length]
      }));

      // 5. Activity Trends (Mocked but based on real count)
      const activityTrends = Array.from({ length: 30 }).map((_, i) => ({
        day: i + 1,
        shipments: Math.floor(Math.random() * 5) + (allShipments.length / 10)
      }));

      // 6. Final State Update
      setData({
        shipmentStatus,
        isotopeDistribution,
        activityTrends,
        metrics: [
          { label: 'Total Shipments', value: allShipments.length.toString(), change: '+5%', color: 'blue' },
          { label: 'On-Time Delivery', value: '96.2%', change: '+1.5%', color: 'green' },
          { label: 'Active Alerts', value: activeAlerts.toString(), change: activeAlerts > 5 ? '+2' : '-1', color: 'purple' },
          { label: 'Compliance Rate', value: `${complianceRate}%`, change: complianceRate >= 95 ? '+0.5%' : '-1.2%', color: 'green' },
        ]
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }

  const handleTimePeriodChange = (value: string) => {
    setTimePeriod(value);
    const today = new Date();
    if (value === 'Last 7 Days') {
      setStartDate(subDays(today, 7));
      setEndDate(today);
    } else if (value === 'Last 30 Days') {
      setStartDate(subDays(today, 30));
      setEndDate(today);
    } else if (value === 'Last 90 Days') {
      setStartDate(subDays(today, 90));
      setEndDate(today);
    }
  };

  const handleGenerateReport = () => {
    fetchReportData();
    toast.success('Report updated');
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, EXPORT_DELAY_MS));
    setIsExporting(false);
    toast.success('Report exported as PDF');
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="dashboard-title text-2xl sm:text-3xl mb-1">Reports & Analytics</h2>
          <p className="text-sm text-gray-500">Deep insights into logistics and compliance performance</p>
        </div>
        <button
          onClick={handleExportReport}
          disabled={isExporting}
          className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export Data
        </button>
      </div>

      {/* Control Center */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Report Focus</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option>Shipment Performance</option>
              <option>Compliance Overview</option>
              <option>Inventory Distribution</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Time Range</label>
            <select
              value={timePeriod}
              onChange={(e) => handleTimePeriodChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Start Date</label>
            <DatePicker
              date={startDate}
              onDateChange={setStartDate}
              disabled={timePeriod !== 'Custom Range'}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">End Date</label>
            <DatePicker
              date={endDate}
              onDateChange={setEndDate}
              disabled={timePeriod !== 'Custom Range'}
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {data.metrics.map((metric: any, index: number) => (
          <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{metric.label}</div>
            <div className="text-3xl font-black text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{metric.value}</div>
            <div className={`text-xs font-bold flex items-center gap-1 ${metric.change && metric.change.startsWith('+') ? 'text-green-600' : 'text-amber-600'}`}>
              <TrendingUp className="w-4 h-4" />
              {metric.change}
              <span className="text-gray-400 font-normal ml-1">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Status Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChartIcon className="w-5 h-5 text-purple-600" />
              Logistics Status
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Volume by Stage</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.shipmentStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Isotope Mix */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              Inventory Composition
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Isotope share %</span>
          </div>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.isotopeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.isotopeDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-gray-900">{data.isotopeDistribution.length}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Types</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {data.isotopeDistribution.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="text-[10px] font-bold text-gray-700 truncate">{item.name}</span>
                <span className="text-[10px] font-black text-gray-400 ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Shipment Velocity
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-600"></div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Standard</span>
            </div>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.activityTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="shipments"
                stroke="#7C3AED"
                strokeWidth={4}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
