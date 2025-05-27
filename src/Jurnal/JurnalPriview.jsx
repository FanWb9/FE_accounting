import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function JurnalPreview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState(null);
  
  // Fix: Coba ambil data dari berbagai kemungkinan struktur state
  const data = state?.transactionData || state || null;

  // Debug: Log untuk melihat struktur state yang diterima
  useEffect(() => {
    console.log("Full state received:", state);
    console.log("Data extracted:", data);
  }, [state, data]);

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // Header data
    const wsData = [
      ["PT IRFAN"],
      ["Jl. Alam No. 123, Jakarta, Indonesia"],
      [],
      ["JURNAL UMUM"],
      [`Kode Jurnal:`, data.kodej],
      [`Proyek:`, data.proyek],
      [`Tanggal Transaksi:`, data.trans_date],
      [`No Referensi:`, data.no_ref],
      [],
      ["DETAIL JURNAL"],
      ["No", "Akun", "Keterangan", "Debit", "Kredit"],
    ];

    // Add debit entries
    data.debit_accounts.forEach((account, idx) => {
      wsData.push([
        idx + 1,
        account,
        data.debit_memos[idx],
        data.debit_amounts[idx],
        ""
      ]);
    });

    // Add credit entries
    data.credit_accounts.forEach((account, idx) => {
      wsData.push([
        data.debit_accounts.length + idx + 1,
        account,
        data.credit_memos[idx],
        "",
        data.credit_amounts[idx]
      ]);
    });

    // Calculate totals
    const totalDebit = data.debit_amounts.reduce((sum, amount) => sum + parseFloat(amount), 0);
    const totalCredit = data.credit_amounts.reduce((sum, amount) => sum + parseFloat(amount), 0);

    wsData.push([]);
    wsData.push(["", "", "TOTAL", totalDebit.toString(), totalCredit.toString()]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
      { width: 5 },   // No
      { width: 25 },  // Akun
      { width: 30 },  // Keterangan
      { width: 15 },  // Debit
      { width: 15 }   // Kredit
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Jurnal");

    // Create Excel buffer
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // Create Blob and save file
    const blob = new Blob([excelBuffer], { 
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
    });
    
    saveAs(blob, `Jurnal-${data.no_ref}.xlsx`);
  };

  useEffect(() => {
    // Fix: Cek data dengan lebih detail
    if (!data || !data.kodej || !data.debit_accounts || !data.credit_accounts) {
      console.error("Data tidak lengkap atau tidak ada:", data);
      navigate("/");
      return;
    }

    const doc = new jsPDF();
    let y = 20;
    const marginLeft = 20;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PT IRFAN", marginLeft, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Jl. Alam No. 123, Jakarta, Indonesia", marginLeft, (y += 6));

    // Line separator
    doc.setLineWidth(0.1);
    doc.line(marginLeft, (y += 6), 190, y);

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 53, 147);
    doc.setFont("helvetica", "bold");
    doc.text("JURNAL UMUM", 105, (y += 14), { align: "center" });

    // Transaction details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    y += 10;
    // doc.text(`Kode Jurnal      : ${data.kodej}`, marginLeft, (y += 8));
    // doc.text(`Proyek           : ${data.proyek}`, marginLeft, (y += 6));
    doc.text(`Tanggal Transaksi: ${data.trans_date}`, marginLeft, (y += 6));
    doc.text(`No Referensi     : ${data.no_ref}`, marginLeft, (y += 6));

    // Detail section header
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 33, 33);
    doc.text("Detail Jurnal", marginLeft, (y += 12));

    // Prepare table data
    const tableData = [];
    
    // Add debit entries
    data.debit_accounts.forEach((account, idx) => {
      tableData.push([
        idx + 1,
        account,
        data.debit_memos[idx],
        `Rp ${new Intl.NumberFormat('id-ID').format(parseFloat(data.debit_amounts[idx]))}`,
        ""
      ]);
    });

    // Add credit entries
    data.credit_accounts.forEach((account, idx) => {
      tableData.push([
        data.debit_accounts.length + idx + 1,
        account,
        data.credit_memos[idx],
        "",
        `Rp ${new Intl.NumberFormat('id-ID').format(parseFloat(data.credit_amounts[idx]))}`
      ]);
    });

    // Calculate totals
    const totalDebit = data.debit_amounts.reduce((sum, amount) => sum + parseFloat(amount), 0);
    const totalCredit = data.credit_amounts.reduce((sum, amount) => sum + parseFloat(amount), 0);

    // Create table
    autoTable(doc, {
      startY: y + 3,
      head: [['No', 'Akun', 'Keterangan', 'Debit', 'Kredit']],
      body: tableData,
      foot: [['', '', 'TOTAL', 
        `Rp ${new Intl.NumberFormat('id-ID').format(totalDebit)}`,
        `Rp ${new Intl.NumberFormat('id-ID').format(totalCredit)}`
      ]],
      theme: 'grid',
      headStyles: {
        fillColor: [40, 53, 147],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
      },
      styles: {
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 15 }, // No
        1: { cellWidth: 45 }, // Akun
        2: { cellWidth: 55 }, // Keterangan
        3: { cellWidth: 35 }, // Debit
        4: { cellWidth: 35 }  // Kredit
      },
      margin: { left: marginLeft, right: marginLeft },
      didDrawPage: (data) => {
        y = data.cursor.y;
      }
    });

    // Footer note
    y += 15;
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    doc.text("Dokumen ini dibuat secara otomatis oleh sistem.", 105, y, { align: "center" });

    // // Balance check note
    // if (totalDebit === totalCredit) {
    //   doc.setTextColor(0, 150, 0);
    //   doc.text("✓ Jurnal seimbang (Debit = Kredit)", 105, y + 8, { align: "center" });
    // } else {
    //   doc.setTextColor(200, 0, 0);
    //   doc.text("⚠ Jurnal tidak seimbang!", 105, y + 8, { align: "center" });
    // }

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [data, navigate]);

  // Loading state dengan pesan yang lebih informatif
  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading PDF Preview...</p>
          {!data && <p className="text-red-500 mt-2">Data tidak ditemukan. Akan redirect...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen">
      {/* Left: PDF Preview */}
      <div className="flex-grow bg-gray-100">
        <iframe
          src={pdfUrl}
          title="PDF Preview"
          className="w-full h-full border-none"
        />
      </div>

      {/* Right: Sidebar Buttons */}
      <div className="w-48 bg-white shadow-lg p-4 flex flex-col gap-2">
        <button
          onClick={handleDownloadExcel}
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Unduh Excel
        </button>
        
        <button
          onClick={() => {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `Jurnal-${data.no_ref}.pdf`;
            link.click();
          }}
          className="bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          Unduh PDF
        </button>
        
        <button
          onClick={() => navigate("/Jurnal")}
          className="bg-sky-500 text-white py-2 px-4 rounded hover:bg-sky-600"
        >
          Buat Baru
        </button>
        
        <button
          onClick={() => navigate("/Tabeljurnal")}
          className="bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}