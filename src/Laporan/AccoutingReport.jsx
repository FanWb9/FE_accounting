import React from 'react';
import { BarChart2, FileText, Calculator, DollarSign, Users, TrendingUp, Eye } from 'lucide-react';

export default function AccountingReports() {
  const reportCategories = [
    {
      id: 'jurnal',
      name: 'Jurnal Umum',
      icon: FileText,
      description: 'Catatan transaksi harian perusahaan',
      color: 'bg-blue-500',
      route: '/laporan-jurnal'
    },
    {
      id: 'neraca',
      name: 'Neraca',
      icon: Calculator,
      description: 'Laporan posisi keuangan',
      color: 'bg-green-500',
      route: '/laporan-neraca'
    },
    {
      id: 'laba-rugi',
      name: 'Laba Rugi',
      icon: TrendingUp,
      description: 'Laporan pendapatan dan beban',
      color: 'bg-purple-500',
      route: '/laporan-laba-rugi'
    },
    {
      id: 'kas',
      name: 'Arus Kas',
      icon: DollarSign,
      description: 'Laporan pergerakan kas',
      color: 'bg-orange-500',
      route: '/laporan-kas'
    },
    {
      id: 'gaji',
      name: 'Laporan Gaji',
      icon: Users,
      description: 'Laporan penggajian karyawan',
      color: 'bg-red-500',
      route: '/laporan-gaji'
    },
    {
      id: 'produksi',
      name: 'Laporan Produksi',
      icon: BarChart2,
      description: 'Laporan hasil produksi',
      color: 'bg-indigo-500',
      route: '/laporan-produksi'
    }
  ];

  const handleNavigateToReport = (route, name) => {
    // Untuk sekarang hanya jurnal yang working, yang lain coming soon
    if (route === '/laporan-jurnal') {
      // Di React Router nanti pakai: navigate(route)
      window.location.href = route;
    } else {
      alert(`Laporan ${name} akan segera tersedia`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Accounting</h1>
          <p className="text-gray-600">Kelola dan lihat berbagai laporan keuangan perusahaan</p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reportCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-gray-200 hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${category.color} text-white mr-4`}>
                      <IconComponent size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    onClick={() => handleNavigateToReport(category.route, category.name)}
                  >
                    <Eye size={16} />
                    Lihat Laporan
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Informasi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <h3 className="font-semibold text-green-800">Laporan Tersedia</h3>
              <p className="text-green-600 text-sm">Jurnal Umum sudah dapat diakses dengan filter lengkap</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-semibold text-yellow-800">Coming Soon</h3>
              <p className="text-yellow-600 text-sm">Laporan lainnya sedang dalam pengembangan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}