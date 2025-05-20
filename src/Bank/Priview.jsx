import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Priview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState(null);
  const data = state?.transactionData;
    const handleDownloadExcel = () => {
      const wb = XLSX.utils.book_new();

      const wsData = [
        ["PT IRFAN"],
        ["Jl. Alam No. 123, Jakarta, Indonesia"],
        [],
        ["BUKTI TRANSAKSI BANK"],
        [`Tanggal Transaksi:`, data.trans_date],
        [`No Bukti:`, data.ref],
        [],
        ["DETAIL AKUN BIAYA"],
        ["No", "Akun", "Jumlah"],
        ...data.account.map((akun, idx) => [
          idx + 1,
          akun,
          data.jumlah[idx]
        ]),
        [],
        ["", "Total Jumlah", data.amount],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

      // Membuat file buffer Excel
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      // Membuat Blob dan menyimpan file
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      // Menyimpan file dengan nama yang
      saveAs(blob, `Transaksi-${data.ref}.xlsx`);
    };


  useEffect(() => {
    if (!data) {
      navigate("/");
      return;
    }

    const doc = new jsPDF();
    let y = 20;
    const marginLeft = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PT IRFAN", marginLeft, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Jl. Alam No. 123, Jakarta, Indonesia", marginLeft, (y += 6));

    doc.setLineWidth(0.1);
    doc.line(marginLeft, (y += 6), 190, y);

    doc.setFontSize(18);
    doc.setTextColor(40, 53, 147);
    doc.setFont("helvetica", "bold");
    doc.text("BUKTI TRANSAKSI BANK", 105, (y += 14), { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    y += 10;
    doc.text(`Tanggal Transaksi : ${data.trans_date}`, marginLeft, (y += 8));
    doc.text(`No Bukti         : ${data.ref}`, marginLeft, (y += 6));

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 33, 33);
    doc.text("Detail Akun Biaya", marginLeft, (y += 12));

    autoTable(doc, {
      startY: y + 3,
      head: [['No', 'Akun', 'Jumlah']],
      body: data.account.map((akun, idx) => [
        idx + 1,
        akun,
        `Rp ${new Intl.NumberFormat('id-ID').format(data.jumlah[idx])}`,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [40, 53, 147],
        textColor: [255, 255, 255],
        fontSize: 11,
      },
      bodyStyles: {
        fontSize: 11,
      },
      styles: {
        cellPadding: 3,
      },
      margin: { left: marginLeft, right: marginLeft },
      didDrawPage: (data) => {
        y = data.cursor.y;
      }
    });

    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Jumlah: Rp ${new Intl.NumberFormat('id-ID').format(data.amount)}`, marginLeft, y);

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    doc.text("Terima kasih telah melakukan transaksi dengan kami.", 105, 285, { align: "center" });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [data, navigate]);

  if (!pdfUrl) return <div>Loading...</div>;

  return (
        <div className="flex w-full h-screen">
      {/* Kiri: PDF Preview */}
      <div className="flex-grow bg-gray-100">
        <iframe
          src={pdfUrl}
          title="PDF Preview"
          className="w-full h-full border-none"
        />
      </div>

      {/* Kanan: Sidebar Tombol */}
      <div className="w-48 bg-white shadow-lg p-4 flex flex-col gap-2">
      
        <button
      onClick={handleDownloadExcel}
      className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
    >
      Unduh XLS
    </button>
     <button
      onClick={() => navigate("/create")}
      className="bg-sky-500 text-white py-2 px-4 rounded hover:bg-sky-600 "
    >
      New Create 
    </button>
    <button
      onClick={() => navigate("/pengeluaran")}
      className="bg-red-500 text-white py-2 rounded hover:bg-red-600 "
    >
      Kembali
    </button>
  </div>
</div>

  );
}
