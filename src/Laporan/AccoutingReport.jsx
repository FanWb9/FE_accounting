import React from 'react';
import { BarChart2, FileText, Calculator, DollarSign, Users, TrendingUp, Eye, BookOpen } from 'lucide-react';

export default function AccountingReports() {
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
      route: '/laporan-buku',
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
    // Navigasi langsung ke route
    window.location.href = route;
  };

  const availableReports = reportCategories.filter(cat => cat.available).length;
  const totalReports = reportCategories.length;

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
      </div>
    </div>
  );
}