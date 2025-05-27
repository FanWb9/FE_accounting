import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trash2, Edit, ArrowUpDown, Search, BookOpen, FileText, Calendar } from "lucide-react";

const API_URL = "http://localhost:8080";

export default function TabelJurnal() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]); // Store all data for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [sortDirection, setSortDirection] = useState("desc");
  const [viewType, setViewType] = useState("jurnal"); // "jurnal" or "buku_besar"
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  
  // Date filter states
  const [dateFilter, setDateFilter] = useState("semua"); // "hari_ini", "bulan_ini", "tahun_ini", "rentang", "semua"
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: ""
  });

  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Get authentication data from sessionStorage
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

      // Set up Axios default header for all future requests
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
          return isToday(item.tran_date || item.trans_date || item.date);
        case "bulan_ini":
          return isThisMonth(item.tran_date || item.trans_date || item.date);
        case "tahun_ini":
          return isThisYear(item.tran_date || item.trans_date || item.date);
        case "rentang":
          return isInDateRange(item.tran_date || item.trans_date || item.date, customDateRange.start, customDateRange.end);
        default:
          return true;
      }
    });
  };

  const fetchData = () => {
    const endpoint = `${API_URL}/jurnal/Table`;
    
    // Token is already set in axios defaults in checkAuth
    axios
      .get(endpoint)
      .then((response) => {
        const sortedData = [...response.data].sort((a, b) => {
          if (sortDirection === "asc") {
            return (a.trans_no || a.no_jurnal || 0) - (b.trans_no || b.no_jurnal || 0);
          } else {
            return (b.trans_no || b.no_jurnal || 0) - (a.trans_no || a.no_jurnal || 0);
          }
        });
        
        setAllData(sortedData); // Store all data
        
        // Apply date filter
        const filteredData = applyDateFilter(sortedData);
        setData(filteredData);
      })
      .catch((error) => {
        console.error(`Error fetching jurnal data:`, error);
        if (error.response && error.response.status === 401) {
          toast.error("Sesi login tidak valid. Silakan login kembali.");
          navigate('/login');
        } else {
          toast.error(`Gagal memuat data jurnal`);
        }
      });
  };

  useEffect(() => {
    if (userData) {
      fetchData();
      setCurrentPage(1);
    }
  }, [sortDirection, viewType, dateFilter, customDateRange, userData]);

  // Update data when date filter changes
  useEffect(() => {
    if (allData.length > 0) {
      const filteredData = applyDateFilter(allData);
      setData(filteredData);
    }
  }, [dateFilter, customDateRange, allData]);

  const handleSort = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  // FIXED: Use trans_no instead of id for delete
  const handleDelete = (e, item) => {
    e.stopPropagation();
    // Use trans_no instead of id since your backend expects trans_no
    const transNo = item.trans_no || item.no_jurnal || item.reference;
    setSelectedId(transNo);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (!selectedId) return;
    setIsDeleting(true);
    
    const endpoint = `${API_URL}/jurnal/transaction/${selectedId}`;
    
    axios
      .delete(endpoint)
      .then(() => {
        toast.success("Item berhasil dihapus");
        fetchData();
      })
      .catch((error) => {
        console.error("Error deleting item:", error);
        if (error.response && error.response.status === 401) {
          toast.error("Sesi login tidak valid. Silakan login kembali.");
          navigate('/login');
        } else if (error.response && error.response.status === 404) {
          toast.error("Data tidak ditemukan atau sudah dihapus");
        } else {
          toast.error("Gagal menghapus item");
        }
      })
      .finally(() => {
        setIsDeleting(false);
        setShowModal(false);
        setSelectedId(null);
      });
  };

  const filteredData = data.filter((item) => {
    const reference = (item.reference || "").toString().toLowerCase();
    const jurnalName = (item.kodej_data?.nama || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return reference.includes(query) || jurnalName.includes(query);
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const displayedData = showAll 
    ? filteredData 
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // FIXED: Use trans_no for navigation too if needed
  const handleRowClick = (item) => {
    // Use id for navigation if that's what your route expects
    // Or use trans_no if your route expects trans_no
    navigate(`/jurnal/${item.id}`);
  };

  // FIXED: Use trans_no for edit too if needed
  const handleEdit = (e, item) => {
    e.stopPropagation();
    // Use id for navigation if that's what your route expects
    navigate(`/jurnal/${item.id}`);
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
    if (!showAll) {
      setCurrentPage(1);
    }
  };

  const handleViewTypeChange = (type) => {
    setViewType(type);
    setSearchQuery(""); // Clear search when switching tabs
  };

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    setCurrentPage(1);
    if (filter !== "rentang") {
      setCustomDateRange({ start: "", end: "" });
    }
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "hari_ini":
        return "Hari Ini";
      case "bulan_ini":
        return "Bulan Ini";
      case "tahun_ini":
        return "Tahun Ini";
      case "rentang":
        return customDateRange.start && customDateRange.end 
          ? `${customDateRange.start} s/d ${customDateRange.end}`
          : "Rentang Tanggal";
      default:
        return "Semua Periode";
    }
  };

  const renderTableHeaders = () => {
    return (
      <tr>
        <th 
          className="text-left px-6 py-3 text-sm font-medium text-gray-700 cursor-pointer"
          onClick={handleSort}
        >
          <div className="flex items-center">
            Reference
            <ArrowUpDown size={16} className="ml-1" />
            <span className="ml-1 text-xs text-gray-500">
              {sortDirection === "asc" ? "(A-Z)" : "(Z-A)"}
            </span>
          </div>
        </th>
        <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Tanggal</th>
        <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Jenis Jurnal</th>
        <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Jumlah</th>
        <th className="text-center px-6 py-3 text-sm font-medium text-gray-700">Aksi</th>
      </tr>
    );
  };

  const renderTableRows = () => {
    if (displayedData.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="text-center py-4 text-gray-500">
            Tidak ada data ditemukan.
          </td>
        </tr>
      );
    }

    return displayedData.map((item) => (
      <tr
        key={item.id}
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => handleRowClick(item)}
      >
        <td className="px-6 py-3 text-left font-medium text-gray-900">
          {item.reference || item.trans_no || item.no_jurnal || "-"}
        </td>
        <td className="px-6 py-3 text-left">
          {new Date(item.tran_date || item.trans_date || item.date).toLocaleDateString("id-ID")}
        </td>
        <td className="px-6 py-3 text-left">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {item.kodej_data?.nama || "-"}
          </span>
        </td>
        <td className="px-6 py-3 text-right font-semibold text-green-600">
          {item.amount ? `Rp ${parseFloat(item.amount).toLocaleString("id-ID")}` : "-"}
        </td>
        <td className="px-6 py-3 text-center">
          <div className="flex justify-center space-x-2">
            <button
              onClick={(e) => handleEdit(e, item)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={(e) => handleDelete(e, item)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Delete"
              disabled={isDeleting}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header with title */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Jurnal Transaksi</h1>
        </div>
        
        {/* Date Filter Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Calendar size={16} className="mr-2" />
            Filter Periode
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { value: "semua", label: "Semua" },
              { value: "hari_ini", label: "Hari Ini" },
              { value: "bulan_ini", label: "Bulan Ini" },
              { value: "tahun_ini", label: "Tahun Ini" },
              { value: "rentang", label: "Rentang Tanggal" }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => handleDateFilterChange(option.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateFilter === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Inputs */}
          {dateFilter === "rentang" && (
            <div className="flex gap-3 items-center">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Current Filter Display */}
          <div className="mt-3">
            <span className="text-xs text-gray-600">Periode aktif: </span>
            <span className="text-xs font-medium text-blue-600">{getDateFilterLabel()}</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/jurnal")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
          >
            + Tambah Jurnal
          </button>
          <button
            onClick={toggleShowAll}
            className={`px-4 py-2 rounded-lg transition-colors shadow-sm ${
              showAll 
                ? "bg-gray-800 text-white hover:bg-gray-700" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {showAll ? "Tampilkan Per Halaman" : "Tampilkan Semua"}
          </button>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari reference atau jenis jurnal..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
          />
        </div>
      </div>

      {/* Current view indicator */}
      <div className="mb-4">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          Menampilkan: Jurnal Transaksi • {getDateFilterLabel()}
        </div>
      </div>

      {/* Table */}
      <div className={`overflow-x-auto shadow-sm rounded-lg border border-gray-200 ${showAll ? "max-h-96 overflow-y-auto" : ""}`}>
        <table className="min-w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {renderTableHeaders()}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {renderTableRows()}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!showAll && totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => changePage(i + 1)}
                className={`px-3 py-1 rounded transition-colors ${
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
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Show all info */}
      {showAll && (
        <div className="mt-4 text-sm text-gray-500">
          Menampilkan semua {filteredData.length} data ({getDateFilterLabel()})
        </div>
      )}

      {/* Delete confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Konfirmasi Hapus</h2>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus entry jurnal dengan nomor transaksi <strong>{selectedId}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}