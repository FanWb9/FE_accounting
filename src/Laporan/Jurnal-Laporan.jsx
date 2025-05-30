import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { FileText, Download, Eye, Printer, Search, Filter, RefreshCw, ArrowLeft, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function LaporanJurnal() {
  const [showPDFView, setShowPDFView] = useState(false);
  const [journalData, setJournalData] = useState([]);
  const navigate = useNavigate();
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    reference: '',
    kodej: ''
  });

  // API Base URL - sesuaikan dengan environment Anda
  const API_BASE = 'http://localhost:8080';

  // Fetch all journals dari API
  const fetchJournals = async () => {
    setLoading(true);
    
    try {
      const endpoint = `${API_BASE}/jurnal/all`;
      
      // Get token from localStorage or wherever you store it
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        // or headers['Authorization'] = token; // tergantung format yang dibutuhkan API
      }
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers,
        credentials: 'include' // Include cookies if needed
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Journals fetched successfully:', data.length, 'records');
      setJournalData(data);
      setFilteredData(data);
      
    } catch (error) {
      console.error('Error fetching journals:', error);
      setJournalData([]);
      setFilteredData([]);
      
      if (error.message === 'UNAUTHORIZED' || error.message.includes('401')) {
        alert("Sesi login tidak valid. Silakan login kembali.");
        // Clear invalid token
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        // Redirect to login
        window.location.href = '/login';
      } else {
        alert('Gagal memuat data jurnal: ' + error.message);
      }
    }
    setLoading(false);
  };

  // Filter data berdasarkan kriteria
  const applyFilters = () => {
    let filtered = [...journalData];
    
    if (filters.startDate) {
      filtered = filtered.filter(item => 
        new Date(item.journal.tran_date) >= new Date(filters.startDate)
      );
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(item => 
        new Date(item.journal.tran_date) <= new Date(filters.endDate)
      );
    }
    
    if (filters.reference) {
      filtered = filtered.filter(item => 
        item.journal.reference.toLowerCase().includes(filters.reference.toLowerCase())
      );
    }
    
    if (filters.kodej) {
      filtered = filtered.filter(item => 
        item.journal.kodej.toLowerCase().includes(filters.kodej.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      reference: '',
      kodej: ''
    });
    setFilteredData(journalData);
  };

  // Load data saat component mount
  useEffect(() => {
    fetchJournals();
  }, []);

  // Apply filters saat filters berubah
  useEffect(() => {
    applyFilters();
  }, [filters, journalData]);

  // Generate PDF data
  const generateJournalPDF = () => {
    const allEntries = [];
    let totalDebit = 0;
    let totalCredit = 0;

    // Compile all journal entries from filtered data
    filteredData.forEach(journalItem => {
      // Add debit entries
      if (journalItem.debits && journalItem.debits.length > 0) {
        journalItem.debits.forEach(debit => {
          allEntries.push({
            date: new Date(journalItem.journal.tran_date).toLocaleDateString('id-ID'),
            reference: journalItem.journal.reference,
            account: debit.account_code && debit.account_name 
            ? `${debit.account_code} - ${debit.account_name}`
            : debit.account || 'N/A',
            description: debit.memo || 'Transaksi Debit',
            debit: parseFloat(debit.amount),
            credit: 0
          });
          totalDebit += parseFloat(debit.amount);
        });
      }

      // Add credit entries
      if (journalItem.credits && journalItem.credits.length > 0) {
        journalItem.credits.forEach(credit => {
          allEntries.push({
            date: new Date(journalItem.journal.tran_date).toLocaleDateString('id-ID'),
            reference: journalItem.journal.reference,
                  account: credit.account_code && credit.account_name 
        ? `${credit.account_code} - ${credit.account_name}`
        : credit.account || 'N/A',
            description: credit.memo || 'Transaksi Credit',
            debit: 0,
            credit: parseFloat(credit.amount)
          });
          totalCredit += parseFloat(credit.amount);
        });
      }
    });

    return {
      title: 'LAPORAN JURNAL UMUM',
      dateRange: filters.startDate || filters.endDate ? 
        `${filters.startDate || 'Awal'} s/d ${filters.endDate || 'Akhir'}` : 
        'Semua Periode',
      entries: allEntries,
      totalDebit,
      totalCredit,
      totalEntries: filteredData.length
    };
  };

    const downloadPDF = async () => {
      setDownloadingPDF(true);
      
      try {
        const doc = new window.jspdf.jsPDF({
          orientation: 'landscape',
          unit: 'mm', 
          format: 'a4'
        });
        
        const data = generateJournalPDF();
        
        // Set margins - lebih kecil untuk memaksimalkan ruang
        const margin = 10;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Calculate table width - gunakan hampir seluruh lebar halaman
        const tableWidth = pageWidth - (margin * 2); // 277mm - 20mm = 257mm
        const startX = margin + 6; // Geser ke kanan 6mm
        
        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(data.title, pageWidth / 2, margin + 10, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Periode: ${data.dateRange}`, pageWidth / 2, margin + 20, { align: 'center' });
        doc.text(`Total Jurnal: ${data.totalEntries} transaksi`, pageWidth / 2, margin + 28, { align: 'center' });
        
        // Prepare table data
        const tableHeaders = [
          'Tanggal', 'Referensi', 'Akun', 'Keterangan', 'Debit (Rp)', 'Kredit (Rp)'
        ];
        
        const tableData = data.entries.map(entry => [
          entry.date,
          entry.reference,
          // Sesuaikan limit karakter dengan lebar kolom baru
          entry.account.length > 28 ? entry.account.substring(0, 35) + '...' : entry.account,
          entry.description.length > 32 ? entry.description.substring(0, 32) + '...' : entry.description,
          entry.debit > 0 ? entry.debit.toLocaleString('id-ID') : '-',
          entry.credit > 0 ? entry.credit.toLocaleString('id-ID') : '-'
        ]);
        
        // Add total row
        tableData.push([
          { content: 'TOTAL', colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } },
          { content: data.totalDebit.toLocaleString('id-ID'), styles: { fontStyle: 'bold' } },
          { content: data.totalCredit.toLocaleString('id-ID'), styles: { fontStyle: 'bold' } }
        ]);
        
        // Create table using autoTable
        doc.autoTable({
          head: [tableHeaders],
          body: tableData,
          startY: margin + 40,
          margin: { 
            left: startX,
            right: margin
          },
          tableWidth: tableWidth,
          showHead: 'everyPage', // Header muncul di setiap halaman
          styles: {
            fontSize: 9, // Naikkan font size karena ruang lebih besar
            cellPadding: 3,
            overflow: 'linebreak'
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 10
          },
          columnStyles: {
            0: { cellWidth: 28 }, // Tanggal 
            1: { cellWidth: 32 }, // Referensi 
            2: { cellWidth: 60 }, // Akun 
            3: { cellWidth: 65 }, // Keterangan 
            4: { cellWidth: 40, halign: 'right' }, // Debit 
            5: { cellWidth: 40, halign: 'right' }  // Kredit 
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          bodyStyles: {
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          didDrawPage: function(data) {
            // Header di setiap halaman (kecuali halaman pertama)
            const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
            
            if (currentPage > 1) {
              doc.setFontSize(16);
              doc.setFont('helvetica', 'bold');
              doc.text('Laporan Jurnal Umum (Lanjutan)', pageWidth / 2, margin + 8, { align: 'center' });
              
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              doc.text(`Periode: ${data.settings.period || 'N/A'}`, pageWidth / 2, margin + 16, { align: 'center' });
            }
            
            // Footer di bagian paling bawah setiap halaman
            const pageNumber = doc.internal.getNumberOfPages();
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            
            // Left footer - tanggal cetak
            doc.text(
              `Dicetak: ${new Date().toLocaleString('id-ID')}`, 
              margin, 
              pageHeight - 5  // 5mm dari bawah kertas
            );
            
            // Center footer - Balance status
            const balanceStatus = data.totalDebit === data.totalCredit ? 'Balanced ✓' : 'Not Balanced ✗';
            doc.text(
              `Status: ${balanceStatus}`, 
              pageWidth / 2, 
              pageHeight - 5,  // 5mm dari bawah kertas
              { align: 'center' }
            );
            
            // Right footer - Page number
            doc.text(
              `Halaman ${currentPage} dari ${pageNumber}`, 
              pageWidth - margin, 
              pageHeight - 5,  // 5mm dari bawah kertas
              { align: 'right' }
            );
          }
        });
        
        // Generate filename with current date
        const filename = `Laporan_Jurnal_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Save the PDF
        doc.save(filename);
        
        console.log('PDF berhasil dibuat dan didownload');
        
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Gagal membuat PDF: ' + error.message);
      } finally {
        setDownloadingPDF(false);
      }
    };
  // Calculate totals
  const calculateTotals = () => {
    const totalDebit = filteredData.reduce((sum, item) => {
      if (item.debits && item.debits.length > 0) {
        return sum + item.debits.reduce((debitSum, debit) => debitSum + parseFloat(debit.amount || 0), 0);
      }
      return sum;
    }, 0);
    
    const totalCredit = filteredData.reduce((sum, item) => {
      if (item.credits && item.credits.length > 0) {
        return sum + item.credits.reduce((creditSum, credit) => creditSum + parseFloat(credit.amount || 0), 0);
      }
      return sum;
    }, 0);
    
    return { totalDebit, totalCredit };
  };

  const { totalDebit, totalCredit } = calculateTotals();

  // Print function
  const printPDF = () => {
    window.print();
  };

  // PDF Viewer Component
  const PDFViewer = ({ data }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[95vh] flex flex-col">
        {/* PDF Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText size={20} />
            Preview Laporan Jurnal
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={downloadPDF}
              disabled={downloadingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <Download size={16} className={downloadingPDF ? 'animate-spin' : ''} />
              {downloadingPDF ? 'Membuat PDF...' : 'Download PDF'}
            </button>
            <button 
              onClick={printPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              <Printer size={16} /> Print
            </button>
            <button 
              onClick={() => setShowPDFView(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          <div className="max-w-4xl mx-auto bg-white border border-gray-300 p-8 shadow-lg rounded-lg">
            {/* Header Laporan */}
            <div className="text-center mb-8 border-b pb-4">
              <h1 className="text-3xl font-bold mb-2 text-gray-800">{data.title}</h1>
              <p className="text-gray-600 text-lg">Periode: {data.dateRange}</p>
              <p className="text-gray-600">Total Jurnal: {data.totalEntries} transaksi</p>
            </div>

            {/* Tabel Jurnal */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-3 text-left font-semibold">Tanggal</th>
                    <th className="border border-gray-300 px-3 py-3 text-left font-semibold">Referensi</th>
                    <th className="border border-gray-300 px-3 py-3 text-left font-semibold">Akun</th>
                    <th className="border border-gray-300 px-3 py-3 text-left font-semibold">Keterangan</th>
                    <th className="border border-gray-300 px-3 py-3 text-right font-semibold">Debit</th>
                    <th className="border border-gray-300 px-3 py-3 text-right font-semibold">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2">{entry.date}</td>
                      <td className="border border-gray-300 px-3 py-2">{entry.reference}</td>
                      <td className="border border-gray-300 px-3 py-2">{entry.account}</td>
                      <td className="border border-gray-300 px-3 py-2">{entry.description}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        {entry.debit > 0 ? `Rp ${entry.debit.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        {entry.credit > 0 ? `Rp ${entry.credit.toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-200 font-bold">
                    <td className="border border-gray-300 px-3 py-3" colSpan={4}>
                      <strong>TOTAL</strong>
                    </td>
                    <td className="border border-gray-300 px-3 py-3 text-right">
                      <strong>Rp {data.totalDebit.toLocaleString('id-ID')}</strong>
                    </td>
                    <td className="border border-gray-300 px-3 py-3 text-right">
                      <strong>Rp {data.totalCredit.toLocaleString('id-ID')}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t text-sm text-gray-600">
              <div className="flex justify-between">
                <div>
                  <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
                  <p>Status: <span className={data.totalDebit === data.totalCredit ? 
                    'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {data.totalDebit === data.totalCredit ? 'Balanced ✓' : 'Not Balanced ✗'}
                  </span></p>
                </div>
                <div className="text-right">
                  <p>Halaman 1 dari 1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate("/laporan")}
              className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
               Kembali
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText size={32} className="text-blue-500" />
                Laporan Jurnal Umum
              </h1>
              <p className="text-gray-600">Kelola dan lihat laporan jurnal transaksi perusahaan</p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Filter size={20} />
              Filter Laporan
            </h2>
            <div className="flex gap-2">
              <button
                onClick={downloadPDF}
                disabled={filteredData.length === 0 || downloadingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <Download size={16} className={downloadingPDF ? 'animate-spin' : ''} />
                {downloadingPDF ? 'Membuat PDF...' : 'Download PDF'}
              </button>
              <button
                onClick={fetchJournals}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh Data
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Referensi</label>
              <input
                type="text"
                placeholder="Cari referensi..."
                value={filters.reference}
                onChange={(e) => setFilters({...filters, reference: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kode Jurnal</label>
              <input
                type="text"
                placeholder="Cari kode..."
                value={filters.kodej}
                onChange={(e) => setFilters({...filters, kodej: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <RefreshCw size={16} />
              Reset Filter
            </button>
            
            <button
              onClick={() => setShowPDFView(true)}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
            >
              <Eye size={16} />
              Preview Laporan ({filteredData.length} jurnal)
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ringkasan Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="text-3xl font-bold text-blue-600">{filteredData.length}</div>
              <div className="text-sm text-gray-600">Total Jurnal</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="text-2xl font-bold text-green-600">
                Rp {totalDebit.toLocaleString('id-ID')}
              </div>
              <div className="text-sm text-gray-600">Total Debit</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <div className="text-2xl font-bold text-purple-600">
                Rp {totalCredit.toLocaleString('id-ID')}
              </div>
              <div className="text-sm text-gray-600">Total Kredit</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
              <div className="text-2xl font-bold text-orange-600">
                {totalDebit === totalCredit ? '✓ Balanced' : '✗ Unbalanced'}
              </div>
              <div className="text-sm text-gray-600">Status Jurnal</div>
            </div>
          </div>
        </div>

        {/* Data Table Preview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Data Jurnal</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Memuat data jurnal...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Tidak ada data jurnal ditemukan</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredData.slice(0, 10).map((journal, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-700">
                        {journal.journal?.reference || 'N/A'} - {journal.journal?.kodej || 'N/A'}
                      </span>
                      <div className="text-sm text-gray-500">
                        Debit: {journal.debits?.length || 0} | Kredit: {journal.credits?.length || 0}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(journal.journal?.tran_date).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))}
              {filteredData.length > 10 && (
                <div className="text-center py-2 text-gray-500">
                  ... dan {filteredData.length - 10} jurnal lainnya
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {showPDFView && <PDFViewer data={generateJournalPDF()} />}
    </div>
  );
}