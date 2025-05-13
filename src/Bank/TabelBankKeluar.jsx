import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TabelBankKeluar() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/bank/banktrans")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((resData) => setData(resData))
      .catch((err) => console.error("Error:", err));
  }, []);

  const filteredData = data.filter((item) => {
    const ref = item.ref?.toLowerCase() || "";
    const bank = item.category?.bank_account_name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return ref.includes(query) || bank.includes(query);
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

 const handleRowClick = (id) => {
  navigate(`/create/${id}`); // Kirim ID ke URL
};


  return (
    <div className="p-6 max-w-7xl mx-auto bg-blue-50">
      <h1 className="text-2xl font-bold mb-6">Transaksi Bank</h1>

      {/* Tombol Create dan Search Bar */}
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={() => navigate("/create")} // Navigasi ke halaman create
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
        >
          + Create
        </button>
        <input
          type="text"
          placeholder="Cari ref atau nama bank..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[250px]"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">No Bukti</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Bank Account</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Tanggal</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  Tidak ada data ditemukan.
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(item.id)} // Tombol klik untuk setiap row
                >
                  <td className="px-6 py-3 text-left">{item.ref}</td>
                  <td className="px-6 py-3 text-left">{item.category?.bank_account_name || "-"}</td>
                  <td className="px-6 py-3 text-left">
                    {new Date(item.trans_date).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-3 text-green-600 font-semibold text-left">
                    Rp {parseFloat(item.amount).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination kanan bawah */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-4">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => changePage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
