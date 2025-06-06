import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { BarChart2, FileText, Calculator, DollarSign, Users, TrendingUp, Eye, BookOpen } from 'lucide-react';

export default function AccountingReports() {
  const navigate = useNavigate(); // Initialize navigate hook

  const reportCategories = [
    {
      id: 'jurnal',
      name: 'Jurnal Umum',
      icon: FileText,
      description: 'Catatan transaksi harian perusahaan',
      color: 'bg-blue-500',
      route: '/laporan-jurnal',
      available: true
    },
    {
      id: 'buku-besar',
      name: 'Buku Besar',
      icon: BookOpen,
      description: 'Ringkasan saldo setiap akun',
      color: 'bg-emerald-500',
      route: '/laporanBuku',
      available: true
    },
    {
      id: 'neraca',
      name: 'Neraca',
      icon: Calculator,
      description: 'Laporan posisi keuangan',
      color: 'bg-green-500',
      route: '/laporan-neraca',
      available: true
    },
    {
      id: 'laba-rugi',
      name: 'Laba Rugi',
      icon: TrendingUp,
      description: 'Laporan pendapatan dan beban',
      color: 'bg-purple-500',
      route: '/laporan-laba-rugi',
      available: true
    },
    {
      id: 'kas',
      name: 'Arus Kas',
      icon: DollarSign,
      description: 'Laporan pergerakan kas',
      color: 'bg-orange-500',
      route: '/laporan-kas',
      available: true
    },
    {
      id: 'gaji',
      name: 'Laporan Gaji',
      icon: Users,
      description: 'Laporan penggajian karyawan',
      color: 'bg-red-500',
      route: '/laporan-gaji',
      available: false
    },
    {
      id: 'produksi',
      name: 'Laporan Produksi',
      icon: BarChart2,
      description: 'Laporan hasil produksi',
      color: 'bg-indigo-500',
      route: '/laporan-produksi',
      available: false
    }
  ];

  const handleNavigateToReport = (route, name) => {
    // Gunakan navigate hook instead of window.location.href
    navigate(route);
  };

  const availableReports = reportCategories.filter(cat => cat.available).length;
  const totalReports = reportCategories.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Laporan Accounting
          </h1>
          <p className="text-gray-600">
            Kelola dan lihat berbagai laporan keuangan perusahaan
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.id}
                className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 ${
                  !category.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:transform hover:scale-105'
                }`}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />

                  </div>
                   <h3 className="text-lg font-semibold text-gray-900 mb-2 pl-3 pt-3">
                    {category.name}
                  </h3>
                </div>
                
                <div className="mb-4 ">
                 
                  <p className="text-gray-600 text-sm">
                    {category.description}
                  </p>
                </div>
                
                <button
                  disabled={!category.available}
                  onClick={() => handleNavigateToReport(category.route, category.name)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                    category.available
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {category.available ? 'Lihat Laporan' : 'Segera Hadir'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}