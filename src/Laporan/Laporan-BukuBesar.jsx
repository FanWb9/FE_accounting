import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { FileText, Download, Eye, Printer, Search, Filter, RefreshCw, BookOpen, Calendar } from 'lucide-react';
import Select from 'react-select';

export default function LaporanBukuBesar() {
  const [showPDFView, setShowPDFView] = useState(false);
  const [bukuBesarData, setBukuBesarData] = useState([]);
  const [accountList, setAccountList] = useState([]);
  const navigate = useNavigate();
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartOptions, setChartOptions] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    accountCode: '',
    accountName: ''
  });

  // API Base URL
  const API_BASE = 'http://localhost:8080';

  // Fetch buku besar data
 // Fix untuk fetchBukuBesar function
const fetchBukuBesar = async () => {
  setLoading(true);
  
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}/bukubesar/all`, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Buku Besar data fetched successfully:', data);
    
    // FIX: Pastikan data selalu array
    const safeData = Array.isArray(data) ? data : [];
    setBukuBesarData(safeData);
    setFilteredData(safeData);
    
  } catch (error) {
    console.error('Error fetching buku besar:', error);
    // FIX: Set ke array kosong jika error
    setBukuBesarData([]);
    setFilteredData([]);
    
    if (error.message === 'UNAUTHORIZED' || error.message.includes('401')) {
      alert("Sesi login tidak valid. Silakan login kembali.");
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    } else {
      alert('Gagal memuat data buku besar: ' + error.message);
    }
  }
  setLoading(false);
};

// Fix untuk applyFilters function
const applyFilters = () => {
  // FIX: Pastikan bukuBesarData adalah array sebelum di-spread
  if (!Array.isArray(bukuBesarData)) {
    console.warn('bukuBesarData is not an array:', bukuBesarData);
    setFilteredData([]);
    return;
  }
  
  let filtered = [...bukuBesarData];
  
  // Jika ada filter tanggal, hitung opening balance dan filter transaksi
  if (filters.startDate || filters.endDate) {
    filtered = filtered.map(account => {
      // Pastikan account.transactions adalah array
      const transactions = Array.isArray(account.transactions) ? account.transactions : [];
      
      // Sort transactions by date
      const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(a.tran_date) - new Date(b.tran_date)
      );
      
      // Calculate opening balance hanya jika ada startDate
      const openingBalance = filters.startDate 
        ? calculateOpeningBalance(sortedTransactions, filters.startDate)
        : 0;
      
      // Filter transactions by date
      const filteredTransactions = sortedTransactions.filter(trans => {
        const transDate = new Date(trans.tran_date);
        let includeTransaction = true;
        
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          startDate.setHours(0, 0, 0, 0);
          includeTransaction = includeTransaction && transDate >= startDate;
        }
        
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          includeTransaction = includeTransaction && transDate <= endDate;
        }
        
        return includeTransaction;
      });
      
      return {
        ...account,
        transactions: filteredTransactions,
        opening_balance: openingBalance
      };
    }).filter(account => 
      account.transactions.length > 0 || 
      (account.opening_balance !== undefined && account.opening_balance !== 0)
    );
  } else {
    // Jika tidak ada filter tanggal, set opening_balance ke 0 untuk semua akun
    filtered = filtered.map(account => ({
      ...account,
      opening_balance: 0
    }));
  }
  
  // Filter berdasarkan kode akun
  if (filters.accountCode) {
    filtered = filtered.filter(account => 
      account.account_code && account.account_code.toLowerCase().includes(filters.accountCode.toLowerCase())
    );
  }
  
  // Filter berdasarkan nama akun
  if (filters.accountName) {
    filtered = filtered.filter(account => 
      account.account_name && account.account_name.toLowerCase().includes(filters.accountName.toLowerCase())
    );
  }
  
  setFilteredData(filtered);
};

// Fix untuk calculateOpeningBalance function
const calculateOpeningBalance = (transactions, startDate) => {
  // FIX: Tambahkan null safety
  if (!startDate || !Array.isArray(transactions) || transactions.length === 0) {
    return 0;
  }
  
  const filterDate = new Date(startDate);
  filterDate.setHours(0, 0, 0, 0);
  
  let openingBalance = 0;
  
  // Sort transactions by date first
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.tran_date) - new Date(b.tran_date)
  );
  
  sortedTransactions.forEach(trans => {
    const transDate = new Date(trans.tran_date);
    transDate.setHours(0, 0, 0, 0);
    
    if (transDate < filterDate) {
      const amount = parseFloat(trans.amount) || 0;
      openingBalance += amount;
    }
  });
  
  return openingBalance;
};


  
  const fetchChartOfAccounts = async () => {
  try {
    const response = await fetch(`${API_BASE}/bank/chart`, {
      headers: { /* header yang sama seperti fetchBukuBesar */ }
    });
    const data = await response.json();
    
    const options = data.map(account => ({
      value: account.account_code,
      label: `${account.account_code} - ${account.account_name}`
    }));
    
    setChartOptions(options);
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
  }
  };
 
  // Filter data berdasarkan kriteria
  // const applyFilters = () => {
  //   let filtered = [...bukuBesarData];
    
  //   // Dalam applyFilters function, ubah bagian ini:
  //   if (filters.startDate || filters.endDate) {
  //     filtered = filtered.map(account => {
  //       // Calculate opening balance
  //       const openingBalance = calculateOpeningBalance(account.transactions, filters.startDate);
        
  //       // Filter transactions by date
  //       const filteredTransactions = account.transactions.filter(trans => {
  //         const transDate = new Date(trans.tran_date);
  //         let includeTransaction = true;
          
  //         if (filters.startDate) {
  //           includeTransaction = includeTransaction && transDate >= new Date(filters.startDate);
  //         }
          
  //         if (filters.endDate) {
  //           includeTransaction = includeTransaction && transDate <= new Date(filters.endDate);
  //         }
          
  //         return includeTransaction;
  //       });
        
  //       return {
  //         ...account,
  //         transactions: filteredTransactions,
  //         opening_balance: openingBalance
  //       };
  //     }).filter(account => account.transactions.length > 0 || account.opening_balance !== 0);
  //   }
    
  //   if (filters.accountCode) {
  //     filtered = filtered.filter(account => 
  //       account.account_code.toLowerCase().includes(filters.accountCode.toLowerCase())
  //     );
  //   }
    
  //   if (filters.accountName) {
  //     filtered = filtered.filter(account => 
  //       account.account_name.toLowerCase().includes(filters.accountName.toLowerCase())
  //     );
  //   }
    
  //   setFilteredData(filtered);
  // };

  // Reset filters
   const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      accountCode: '',
      accountName: ''
    });
    setSelectedChart(null); // Reset selected chart
    const resetData = bukuBesarData.map(account => ({
      ...account,
      opening_balance: 0
    }));
    setFilteredData(resetData);
  };

   useEffect(() => {
    fetchBukuBesar();
     fetchChartOfAccounts();
  }, []);

  // Apply filters saat filters berubah
  useEffect(() => {
    applyFilters();
  }, [filters, bukuBesarData]);

  // Recalculate running balance untuk setiap akun
 
  const calculateRunningBalance = (transactions, openingBalance = 0) => {
    let runningBalance = openingBalance || 0; // Pastikan tidak NaN
    return transactions.map(trans => {
      const amount = parseFloat(trans.amount) || 0;
      runningBalance += amount;
      return {
        ...trans,
        running_balance: runningBalance
      };
    });
  };

  
//  const calculateOpeningBalance = (transactions, startDate) => {
//   if (!startDate || transactions.length === 0) return 0;
  
//   const filterDate = new Date(startDate);
//   // Set ke awal hari untuk comparison yang tepat
//   filterDate.setHours(0, 0, 0, 0);
  
//   let openingBalance = 0;
  
//   transactions.forEach(trans => {
//     const transDate = new Date(trans.tran_date);
//     transDate.setHours(0, 0, 0, 0);
    
//     if (transDate < filterDate) {
//       openingBalance += parseFloat(trans.amount);
//     }
//   });
  
//   return openingBalance;
// };

  const generateBukuBesarPDF = () => {
    const processedData = filteredData.map(account => ({
      ...account,
      transactions: calculateRunningBalance(account.transactions, account.opening_balance || 0)
    }));

    return {
      title: 'LAPORAN BUKU BESAR',
      dateRange: filters.startDate || filters.endDate ? 
        `${filters.startDate || 'Awal'} s/d ${filters.endDate || 'Akhir'}` : 
        'Semua Periode',
      accounts: processedData,
      totalAccounts: processedData.length
    };
  };

  // const calculateOpeningBalance = (transactions, startDate) => {
  //   // Jika tidak ada startDate atau tidak ada transaksi, return 0
  //   if (!startDate || !transactions || transactions.length === 0) {
  //     return 0;
  //   }
    
  //   const filterDate = new Date(startDate);
  //   filterDate.setHours(0, 0, 0, 0);
    
  //   let openingBalance = 0;
    
  //   // Sort transactions by date first
  //   const sortedTransactions = [...transactions].sort((a, b) => 
  //     new Date(a.tran_date) - new Date(b.tran_date)
  //   );
    
  //   sortedTransactions.forEach(trans => {
  //     const transDate = new Date(trans.tran_date);
  //     transDate.setHours(0, 0, 0, 0);
      
  //     if (transDate < filterDate) {
  //       const amount = parseFloat(trans.amount) || 0;
  //       openingBalance += amount;
  //     }
  //   });
    
  //   return openingBalance;
  // };

  //  const applyFilters = () => {
  //   let filtered = [...bukuBesarData];
    
  //   // Jika ada filter tanggal, hitung opening balance dan filter transaksi
  //   if (filters.startDate || filters.endDate) {
  //     filtered = filtered.map(account => {
  //       // Sort transactions by date
  //       const sortedTransactions = [...account.transactions].sort((a, b) => 
  //         new Date(a.tran_date) - new Date(b.tran_date)
  //       );
        
  //       // Calculate opening balance hanya jika ada startDate
  //       const openingBalance = filters.startDate 
  //         ? calculateOpeningBalance(sortedTransactions, filters.startDate)
  //         : 0;
        
  //       // Filter transactions by date
  //       const filteredTransactions = sortedTransactions.filter(trans => {
  //         const transDate = new Date(trans.tran_date);
  //         let includeTransaction = true;
          
  //         if (filters.startDate) {
  //           const startDate = new Date(filters.startDate);
  //           startDate.setHours(0, 0, 0, 0);
  //           includeTransaction = includeTransaction && transDate >= startDate;
  //         }
          
  //         if (filters.endDate) {
  //           const endDate = new Date(filters.endDate);
  //           endDate.setHours(23, 59, 59, 999);
  //           includeTransaction = includeTransaction && transDate <= endDate;
  //         }
          
  //         return includeTransaction;
  //       });
        
  //       return {
  //         ...account,
  //         transactions: filteredTransactions,
  //         opening_balance: openingBalance // Selalu ada nilai, tidak akan NaN
  //       };
  //     }).filter(account => 
  //       // Tampilkan akun jika ada transaksi ATAU ada opening balance
  //       account.transactions.length > 0 || 
  //       (account.opening_balance !== undefined && account.opening_balance !== 0)
  //     );
  //   } else {
  //     // Jika tidak ada filter tanggal, set opening_balance ke 0 untuk semua akun
  //     filtered = filtered.map(account => ({
  //       ...account,
  //       opening_balance: 0
  //     }));
  //   }
    
  //   // Filter berdasarkan kode akun
  //   if (filters.accountCode) {
  //     filtered = filtered.filter(account => 
  //       account.account_code.toLowerCase().includes(filters.accountCode.toLowerCase())
  //     );
  //   }
    
  //   // Filter berdasarkan nama akun
  //   if (filters.accountName) {
  //     filtered = filtered.filter(account => 
  //       account.account_name.toLowerCase().includes(filters.accountName.toLowerCase())
  //     );
  //   }
    
  //   setFilteredData(filtered);
  // };

// Bagian yang perlu diperbaiki dalam fungsi downloadPDF()

const downloadPDF = async () => {
  setDownloadingPDF(true);
  
  try {
    const doc = new window.jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm', 
      format: 'a4'
    });
    
    const data = generateBukuBesarPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = margin;
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, pageWidth / 2, currentY + 8, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${data.dateRange}`, pageWidth / 2, currentY + 16, { align: 'center' });
    doc.text(`Total Akun: ${data.totalAccounts}`, pageWidth / 2, currentY + 22, { align: 'center' });
    
    currentY += 35;
    
    // Loop untuk setiap akun
    data.accounts.forEach((account, accountIndex) => {
      // Check jika perlu halaman baru untuk header akun
      if (currentY > pageHeight - 120) {
        doc.addPage();
        currentY = margin;
      }
      
      // Header Akun
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${account.account_code} - ${account.account_name}`, margin, currentY);
      currentY += 8;
      
      // PERBAIKAN: Konsisten dengan preview - tampilkan opening balance jika ada filter startDate DAN balance tidak 0
      let startingBalance = account.opening_balance || 0;
      
      // Tampilkan Opening Balance jika ada startDate DAN balance tidak 0
      if (filters.startDate && startingBalance !== 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        // Background untuk opening balance
        doc.setFillColor(255, 248, 220);
        doc.rect(margin, currentY - 2, pageWidth - (2 * margin), 10, 'F');
        doc.setDrawColor(255, 140, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, currentY - 2, pageWidth - (2 * margin), 10, 'S');
        
        // Text untuk opening balance
        doc.setTextColor(204, 85, 0);
        doc.text('SALDO AWAL (OPENING BALANCE):', margin + 2, currentY + 3);
        doc.text(`Rp ${Math.abs(startingBalance).toLocaleString('id-ID')}${startingBalance < 0 ? ' (CR)' : ' (DR)'}`, 
                 pageWidth - margin - 2, currentY + 3, { align: 'right' });
        
        // Add date info
        doc.setFontSize(7);
        doc.setTextColor(102, 102, 102);
        doc.text(`Per tanggal: ${new Date(filters.startDate).toLocaleDateString('id-ID')}`, 
                 margin + 2, currentY + 7);
        
        currentY += 14;
        
        // Reset color
        doc.setTextColor(0, 0, 0);
      }
      
      // Header tabel
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      const colPositions = {
        date: margin,
        ref: margin + 20,
        memo: margin + 35,
        debit: margin + 85,
        credit: margin + 115,
        balance: margin + 145
      };

      const colWidths = {
        date: 18,
        ref: 13,
        memo: 48,
        debit: 28,
        credit: 28,
        balance: 35
      };
      
      // Header dengan background
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, currentY - 2, pageWidth - (2 * margin), 7, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(margin, currentY - 2, pageWidth - (2 * margin), 7, 'S');
      
      // Header text
      doc.text('Tanggal', colPositions.date + 1, currentY + 2);
      doc.text('Ref', colPositions.ref + 1, currentY + 2);
      doc.text('Keterangan', colPositions.memo + 1, currentY + 2);
      doc.text('Debit', colPositions.debit + colWidths.debit - 2, currentY + 2, { align: 'right' });
      doc.text('Kredit', colPositions.credit + colWidths.credit - 2, currentY + 2, { align: 'right' });
      doc.text('Saldo', colPositions.balance + colWidths.balance - 2, currentY + 2, { align: 'right' });
      
      currentY += 7;
      
      // Garis pemisah header
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 2;
      
      // Data transaksi dengan running balance yang benar
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      
      // Hitung running balance dengan benar menggunakan opening balance
      let runningBalance = startingBalance;
      const processedTransactions = account.transactions.map(trans => {
        const amount = parseFloat(trans.amount) || 0;
        runningBalance += amount;
        return {
          ...trans,
          running_balance: runningBalance
        };
      });
      
      processedTransactions.forEach((trans, transIndex) => {
        // Check jika perlu halaman baru
        if (currentY > pageHeight - 25) {
          doc.addPage();
          currentY = margin + 10;
          
          // Repeat header akun di halaman baru
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`${account.account_code} - ${account.account_name} (Lanjutan)`, margin, currentY);
          currentY += 10;
          
          // PERBAIKAN: Repeat opening balance info di halaman baru jika ada
        if (filters.startDate) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(102, 102, 102);
            doc.text(`Saldo Awal: Rp ${Math.abs(startingBalance).toLocaleString('id-ID')}${startingBalance < 0 ? ' (CR)' : ' (DR)'} per ${new Date(filters.startDate).toLocaleDateString('id-ID')}`, 
                     margin, currentY);
            currentY += 5;
            doc.setTextColor(0, 0, 0);
          }
          
          // Repeat header kolom
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(220, 220, 220);
          doc.rect(margin, currentY - 2, pageWidth - (2 * margin), 7, 'F');
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.rect(margin, currentY - 2, pageWidth - (2 * margin), 7, 'S');
          
          doc.text('Tanggal', colPositions.date + 1, currentY + 2);
          doc.text('Ref', colPositions.ref + 1, currentY + 2);
          doc.text('Keterangan', colPositions.memo + 1, currentY + 2);
          doc.text('Debit', colPositions.debit + colWidths.debit - 2, currentY + 2, { align: 'right' });
          doc.text('Kredit', colPositions.credit + colWidths.credit - 2, currentY + 2, { align: 'right' });
          doc.text('Saldo', colPositions.balance + colWidths.balance - 2, currentY + 2, { align: 'right' });
          
          currentY += 7;
          doc.setLineWidth(0.5);
          doc.line(margin, currentY, pageWidth - margin, currentY);
          currentY += 2;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
        }
        
        const amount = parseFloat(trans.amount) || 0;
        const debitAmount = amount > 0 ? amount : 0;
        const creditAmount = amount < 0 ? Math.abs(amount) : 0;
        
        // Zebra striping
        if (transIndex % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(margin, currentY - 1, pageWidth - (2 * margin), 5, 'F');
        }
        
        // Data row
        doc.setTextColor(0, 0, 0);
        
        // Tanggal
        const dateStr = new Date(trans.tran_date).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        doc.text(dateStr, colPositions.date + 1, currentY + 2);
        
        // Reference
        const refStr = (trans.reference || '').toString().substring(0, 8);
        doc.text(refStr, colPositions.ref + 1, currentY + 2);
        
        // Memo
        const memo = trans.memo || '';
        const truncatedMemo = memo.length > 30 ? memo.substring(0, 27) + '...' : memo;
        doc.text(truncatedMemo, colPositions.memo + 1, currentY + 2);
        
        // Debit
        if (debitAmount > 0) {
          doc.text(debitAmount.toLocaleString('id-ID'), 
                  colPositions.debit + colWidths.debit - 2, currentY + 2, { align: 'right' });
        } else {
          doc.text('-', colPositions.debit + colWidths.debit - 2, currentY + 2, { align: 'right' });
        }
        
        // Credit
        if (creditAmount > 0) {
          doc.text(creditAmount.toLocaleString('id-ID'), 
                  colPositions.credit + colWidths.credit - 2, currentY + 2, { align: 'right' });
        } else {
          doc.text('-', colPositions.credit + colWidths.credit - 2, currentY + 2, { align: 'right' });
        }
        
        // Running balance
        const balanceStr = trans.running_balance.toLocaleString('id-ID');
        doc.text(balanceStr, colPositions.balance + colWidths.balance - 2, currentY + 2, { align: 'right' });
        
        currentY += 5;
        
        // Thin line between rows
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.1);
        doc.line(margin, currentY, pageWidth - margin, currentY);
      });
      
      // Ending Balance Section
      currentY += 3;
      doc.setLineWidth(0.8);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      
      // Calculate ending balance yang benar
      const endingBalance = processedTransactions.length > 0 
        ? processedTransactions[processedTransactions.length - 1].running_balance
        : startingBalance;
      
      // Background untuk ending balance
      doc.setFillColor(240, 255, 240);
      doc.rect(margin, currentY - 3, pageWidth - (2 * margin), 8, 'F');
      doc.setDrawColor(0, 150, 0);
      doc.setLineWidth(0.5);
      doc.rect(margin, currentY - 3, pageWidth - (2 * margin), 8, 'S');
      doc.setLineWidth(0.2);
      
      doc.text('Ending Balance:', margin + 2, currentY + 2);
      doc.text(`Rp ${endingBalance.toLocaleString('id-ID')}`, 
               pageWidth - margin - 2, currentY + 2, { align: 'right' });
      
      currentY += 15; // Space antar akun
    });
    
    // Footer di setiap halaman
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      
      // Footer line
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      doc.text(
        `Dicetak: ${new Date().toLocaleString('id-ID')}`, 
        margin, 
        pageHeight - 8
      );
      
      doc.text(
        `Halaman ${i} dari ${totalPages}`, 
        pageWidth - margin, 
        pageHeight - 8,
        { align: 'right' }
      );
      
      doc.text(
        'Generated by Accounting System', 
        pageWidth / 2, 
        pageHeight - 8,
        { align: 'center' }
      );
    }
    
    const filename = `Laporan_BukuBesar_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    console.log('PDF Buku Besar berhasil dibuat dan didownload');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Gagal membuat PDF: ' + error.message);
  } finally {
    setDownloadingPDF(false);
  }
};
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
            <BookOpen size={20} />
            Preview Laporan Buku Besar
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
          <div className="max-w-5xl mx-auto bg-white border border-gray-300 p-8 shadow-lg rounded-lg">
            {/* Header Laporan */}
            <div className="text-center mb-8 border-b pb-4">
              <h1 className="text-3xl font-bold mb-2 text-gray-800">{data.title}</h1>
              <p className="text-gray-600 text-lg">Periode: {data.dateRange}</p>
              <p className="text-gray-600">Total Akun: {data.totalAccounts}</p>
            </div>

            {/* Buku Besar per Akun */}
            <div className="space-y-8">
              {data.accounts.map((account, accountIndex) => {
                const processedTransactions = calculateRunningBalance(account.transactions, account.opening_balance || 0)
                
                return (
                  <div key={accountIndex} className="border border-gray-300 rounded-lg overflow-hidden">
                    {/* Header Akun */}
                    <div className="bg-blue-600 text-white p-4">
                      <h3 className="text-lg font-bold">
                        {account.account_code} - {account.account_name}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        Total Transaksi: {account.transactions.length}
                      </p>
                    </div>
                   
                    {account.opening_balance !== 0 && (
                      <div className="bg-yellow-50 border-l-4 border-l-yellow-500 p-3 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700">
                              Saldo Awal (Opening Balance)
                            </div>
                            <div className="text-xs text-gray-500">
                              Per {filters.startDate ? new Date(filters.startDate).toLocaleDateString('id-ID') : 'Periode Awal'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              account.opening_balance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Rp {Math.abs(account.opening_balance).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Format seperti buku tabungan */}
                    <div className="bg-white">
                      {processedTransactions.map((trans, transIndex) => {
                        const amount = parseFloat(trans.amount);
                        const isDebit = amount > 0;
                        const absAmount = Math.abs(amount);
                        
                        return (
                          <div key={transIndex} 
                               className={`border-b border-gray-200 p-3 hover:bg-gray-50 ${
                                 isDebit ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                               }`}>
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="font-medium text-gray-700">
                                    {new Date(trans.tran_date).toLocaleDateString('id-ID')}
                                  </span>
                                  <span className="text-gray-600">
                                    {trans.reference || 'N/A'}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    isDebit 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {isDebit ? 'DEBIT' : 'KREDIT'}
                                  </span>
                                </div>
                                <div className="text-gray-600 text-sm mt-1">
                                  {trans.memo || 'Tidak ada keterangan'}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  isDebit ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {isDebit ? '+' : '-'} Rp {absAmount.toLocaleString('id-ID')}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Saldo: <span className="font-medium">
                                    Rp {trans.running_balance.toLocaleString('id-ID')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Final Balance */}
                      <div className="bg-gray-100 p-4 text-center">
                        <div className="text-lg font-bold text-gray-800">
                          Saldo Akhir: Rp {processedTransactions.length > 0 
                            ? processedTransactions[processedTransactions.length - 1].running_balance.toLocaleString('id-ID')
                            : '0'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t text-sm text-gray-600">
              <div className="flex justify-between">
                <div>
                  <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
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
      {/* Header - selalu tampil */}
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
              <BookOpen size={32} className="text-blue-500" />
              Laporan Buku Besar
            </h1>
            <p className="text-gray-600">Laporan rincian transaksi per akun dengan running balance</p>
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
                onClick={fetchBukuBesar}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Kode Akun</label>
              <input
                type="text"
                placeholder="Cari kode akun..."
                value={filters.accountCode}
                onChange={(e) => setFilters({...filters, accountCode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Akun</label>
              <Select
                options={chartOptions}
                value={selectedChart}
                onChange={(selected) => {
                  setSelectedChart(selected);
                  setFilters({
                    ...filters, 
                    accountCode: selected ? selected.value : '',
                    accountName: selected ? selected.label.split(' - ')[1] : ''
                  });
                }}
                placeholder="-- Pilih Akun --"
                isClearable
                className="text-sm"
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
              Preview Laporan ({filteredData.length} akun)
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ringkasan Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="text-3xl font-bold text-blue-600">{filteredData.length}</div>
              <div className="text-sm text-gray-600">Total Akun</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="text-2xl font-bold text-green-600">
                {filteredData.reduce((sum, account) => sum + account.transactions.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Transaksi</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <div className="text-2xl font-bold text-purple-600">
                {accountList.length}
              </div>
              <div className="text-sm text-gray-600">Total Chart of Accounts</div>
            </div>
          </div>
        </div>

        {/* Data Preview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Preview Data Buku Besar</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Memuat data buku besar...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Tidak ada data buku besar ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredData.slice(0, 5).map((account, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 p-3 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">
                        {account.account_code} - {account.account_name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {account.transactions.length} transaksi
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-sm text-gray-600">
                      Transaksi terakhir: {account.transactions.length > 0 
                        ? new Date(account.transactions[0].tran_date).toLocaleDateString('id-ID')
                        : 'Tidak ada'}
                    </div>
                  </div>
                </div>
              ))}
              {filteredData.length > 10 && (
                <div className="text-center py-2 text-gray-500">
                  ... dan {filteredData.length - 5} akun lainnya
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
     {showPDFView && filteredData && <PDFViewer data={generateBukuBesarPDF()} />}
    </div>
  );
}