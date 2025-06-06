import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  BarChart3,
} from "lucide-react";

const API_URL = "http://localhost:8080";

export default function Dashboard() {
  const [pengeluaranData, setPengeluaranData] = useState([]);
  const [pembayaranData, setPembayaranData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [dateFilter, setDateFilter] = useState("bulan_ini");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: ""
  });

  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = sessionStorage.getItem('token');
    const user = sessionStorage.getItem('user');

    if (!token || !user) {
      toast.error("Sesi login tidak valid. Silakan login kembali.");
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      setUserData(parsedUser);
      setCompanyData(parsedUser.company);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast.error("Terjadi kesalahan pada data pengguna");
      navigate('/login');
    }
  };

  // Date filter functions
  const isToday = (date) => {
    const today = new Date();
    const transDate = new Date(date);
    return today.toDateString() === transDate.toDateString();
  };

  const isThisMonth = (date) => {
    const today = new Date();
    const transDate = new Date(date);
    return today.getMonth() === transDate.getMonth() && today.getFullYear() === transDate.getFullYear();
  };

  const isThisYear = (date) => {
    const today = new Date();
    const transDate = new Date(date);
    return today.getFullYear() === transDate.getFullYear();
  };

  const isInDateRange = (date, start, end) => {
    if (!start || !end) return true;
    const transDate = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);
    return transDate >= startDate && transDate <= endDate;
  };

  const applyDateFilter = (dataToFilter) => {
    if (dateFilter === "semua") return dataToFilter;
    
    return dataToFilter.filter(item => {
      switch (dateFilter) {
        case "hari_ini":
          return isToday(item.trans_date);
        case "bulan_ini":
          return isThisMonth(item.trans_date);
        case "tahun_ini":
          return isThisYear(item.trans_date);
        case "rentang":
          return isInDateRange(item.trans_date, customDateRange.start, customDateRange.end);
        default:
          return true;
      }
    });
  };

  // Fetch data
  const fetchData = async () => {
    if (!userData) return;
    
    setLoading(true);
    try {
      const [pengeluaranResponse, pembayaranResponse] = await Promise.all([
        axios.get(`${API_URL}/bank/banktrans`),
        axios.get(`${API_URL}/income/name`)
      ]);

      const filteredPengeluaran = applyDateFilter(pengeluaranResponse.data);
      const filteredPembayaran = applyDateFilter(pembayaranResponse.data);

      setPengeluaranData(filteredPengeluaran);
      setPembayaranData(filteredPembayaran);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response && error.response.status === 401) {
        toast.error("Sesi login tidak valid. Silakan login kembali.");
        navigate('/login');
      } else {
        toast.error("Gagal memuat data dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchData();
    }
  }, [userData, dateFilter, customDateRange]);

  // Calculate statistics
  const getTotalPengeluaran = () => {
    return pengeluaranData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  };

  const getTotalPembayaran = () => {
    return pembayaranData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  };

  const getNetCashFlow = () => {
    return getTotalPembayaran() - getTotalPengeluaran();
  };

  // Prepare chart data
  const getPieChartData = () => {
    const totalPengeluaran = getTotalPengeluaran();
    const totalPembayaran = getTotalPembayaran();
    
    return [
      { name: 'Pengeluaran', value: totalPengeluaran, color: '#ef4444' },
      { name: 'Pembayaran', value: totalPembayaran, color: '#22c55e' }
    ];
  };

  const getMonthlyTrendData = () => {
    const months = {};
    
    // Process pengeluaran data
    pengeluaranData.forEach(item => {
      const date = new Date(item.trans_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      
      if (!months[monthKey]) {
        months[monthKey] = { 
          month: monthName, 
          monthKey: monthKey,
          pengeluaran: 0, 
          pembayaran: 0 
        };
      }
      
      months[monthKey].pengeluaran += parseFloat(item.amount || 0);
    });
    
    // Process pembayaran data
    pembayaranData.forEach(item => {
      const date = new Date(item.trans_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      
      if (!months[monthKey]) {
        months[monthKey] = { 
          month: monthName, 
          monthKey: monthKey,
          pengeluaran: 0, 
          pembayaran: 0 
        };
      }
      
      months[monthKey].pembayaran += parseFloat(item.amount || 0);
    });
    
    // Calculate net flow and add trend indicators
    return Object.values(months)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6)
      .map((item, index, arr) => {
        const netFlow = item.pembayaran - item.pengeluaran;
        const prevNetFlow = index > 0 ? (arr[index-1].pembayaran - arr[index-1].pengeluaran) : 0;
        const trend = index > 0 ? (netFlow > prevNetFlow ? 'up' : netFlow < prevNetFlow ? 'down' : 'stable') : 'stable';
        
        return {
          ...item,
          netFlow,
          trend,
          growth: index > 0 ? ((netFlow - prevNetFlow) / Math.abs(prevNetFlow) * 100) : 0
        };
      });
  };

  const getTopTransactions = () => {
    const allTransactions = [
      ...pengeluaranData.map(item => ({ ...item, type: 'pengeluaran' })),
      ...pembayaranData.map(item => ({ ...item, type: 'pembayaran' }))
    ];
    
    return allTransactions
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      .slice(0, 5);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "hari_ini": return "Hari Ini";
      case "bulan_ini": return "Bulan Ini";
      case "tahun_ini": return "Tahun Ini";
      case "rentang": 
        return customDateRange.start && customDateRange.end 
          ? `${customDateRange.start} s/d ${customDateRange.end}`
          : "Rentang Tanggal";
      default: return "Semua Periode";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className=" border-b border-gray-300 ">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
            
              <h1 className="font-bold text-xl">{userData?.name || 'User'} | {companyData?.name || 'Company'}</h1>
                <p className="text-gray-600 mt-1">
                Welcome to your financial dashboard
              </p>
            </div>
            
            {/* Date Filter */}
            <div className="flex items-center gap-3">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="semua">Semua Periode</option>
                <option value="hari_ini">Hari Ini</option>
                <option value="bulan_ini">Bulan Ini</option>
                <option value="tahun_ini">Tahun Ini</option>
                <option value="rentang">Rentang Tanggal</option>
              </select>
              
              {dateFilter === "rentang" && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <span className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-full">
                {getDateFilterLabel()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards - 3 metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Pembayaran */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Pembayaran</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(getTotalPembayaran())}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight size={16} className="mr-1" />
                  <span className="text-xs text-green-100">Income</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          {/* Total Pengeluaran */}
          <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Total Pengeluaran</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(getTotalPengeluaran())}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowDownRight size={16} className="mr-1" />
                  <span className="text-xs text-red-100">Expense</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <TrendingDown size={24} />
              </div>
            </div>
          </div>

          {/* Net Cash Flow */}
          <div className={`bg-gradient-to-r ${getNetCashFlow() >= 0 ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-red-600'} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Net Cash Flow</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(Math.abs(getNetCashFlow()))}
                </p>
                <div className="flex items-center mt-2">
                  {getNetCashFlow() >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                  <span className="text-xs text-blue-100">
                    {getNetCashFlow() >= 0 ? 'Surplus' : 'Deficit'}
                  </span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Activity size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
         {/* Monthly Trend - Professional Financial Chart */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600 to-purple-600" 
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}>
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg mr-3 shadow-lg">
                    <BarChart3 className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Flow Keuangan 
                    </h3>
                    <p className="text-sm text-gray-500">Analisis trend pembayaran dan pengeluaran</p>
                  </div>
                </div>
                
                {/* Trend Summary Cards */}
                <div className="flex gap-2">
                  {getMonthlyTrendData().slice(-2).map((item, index) => (
                    <div key={index} className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.trend === 'up' ? 'bg-green-100 text-green-700' :
                      item.trend === 'down' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'} 
                      {item.growth !== 0 ? `${Math.abs(item.growth).toFixed(1)}%` : 'Stabil'}
                    </div>
                  ))}
                </div>
              </div>
              
              {getMonthlyTrendData().length > 0 ? (
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart 
                    data={getMonthlyTrendData()} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    barCategoryGap="15%"
                  >
                    <defs>
                      {/* Professional Gradients */}
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="50%" stopColor="#34d399" stopOpacity={0.7}/>
                        <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                        <stop offset="50%" stopColor="#f87171" stopOpacity={0.7}/>
                        <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="netFlowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      </linearGradient>
                      
                      {/* Subtle Glow Effects */}
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#e2e8f0" 
                      opacity={0.3}
                    />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: '500' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: '500' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      tick={{ fontSize: 11, fill: '#3b82f6', fontWeight: '500' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(value), name]}
                      labelFormatter={(label) => `Bulan: ${label}`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(10px)',
                        fontSize: '12px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                    />
                    
                    {/* Income Bars - Green */}
                    <Bar 
                      yAxisId="left"
                      dataKey="pembayaran" 
                      fill="url(#incomeGradient)"
                      name="Pembayaran"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={45}
                    />
                    
                    {/* Expense Bars - Red */}
                    <Bar 
                      yAxisId="left"
                      dataKey="pengeluaran" 
                      fill="url(#expenseGradient)"
                      name="Pengeluaran"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={45}
                    />
                    
                    {/* Net Flow Area - Blue */}
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="netFlow"
                      fill="url(#netFlowGradient)"
                      stroke="transparent"
                      strokeWidth={0}
                      name="Net Cash Flow"
                      fillOpacity={0.2}
                    />
                    
                    {/* Primary Trend Line - Blue */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="netFlow"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      strokeDasharray="0"
                      dot={{ 
                        fill: '#3b82f6', 
                        strokeWidth: 2, 
                        r: 5
                      }}
                      activeDot={{ 
                        r: 7, 
                        fill: '#3b82f6',
                        stroke: '#ffffff',
                        strokeWidth: 2
                      }}
                      name="Net Cash Flow"
                      connectNulls={false}
                    />
                    
                    {/* Income Trend Line - Green */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="pembayaran"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Trend Pembayaran"
                      connectNulls={false}
                    />
                    
                    {/* Expense Trend Line - Red */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="pengeluaran"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="8 3"
                      dot={false}
                      name="Trend Pengeluaran"
                      connectNulls={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[380px] text-gray-400">
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-6 rounded-full mb-6 mx-auto w-20 h-20 flex items-center justify-center shadow-lg">
                      <BarChart3 size={36} className="text-gray-500" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-600 mb-2">Grafik Siap Ditampilkan</h4>
                    <p className="text-sm text-gray-500">Chart akan muncul setelah ada data transaksi</p>
                    <div className="mt-4 flex justify-center gap-2">
                      <div className="w-3 h-8 bg-green-200 rounded-t-md opacity-50"></div>
                      <div className="w-3 h-12 bg-blue-200 rounded-t-md opacity-60"></div>
                      <div className="w-3 h-6 bg-red-200 rounded-t-md opacity-40"></div>
                      <div className="w-3 h-10 bg-purple-200 rounded-t-md opacity-70"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Transactions Only */}
        <div className="grid grid-cols-1 gap-8">
          {/* Top Transactions */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <DollarSign className="text-purple-600 mr-3" size={24} />
              <h3 className="text-xl font-semibold text-gray-800">Transaksi Terbesar</h3>
            </div>
            {getTopTransactions().length > 0 ? (
              <div className="space-y-4">
                {getTopTransactions().map((transaction, index) => (
                  <div key={`${transaction.type}-${transaction.id}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-4 ${transaction.type === 'pembayaran' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {transaction.ref || transaction.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.type === 'pengeluaran' ? 
                            (transaction.penerima || 'N/A') : 
                            (transaction.name || 'N/A')
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-lg ${transaction.type === 'pembayaran' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(parseFloat(transaction.amount || 0))}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.trans_date).toLocaleDateString("id-ID", {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Tidak ada transaksi untuk ditampilkan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}