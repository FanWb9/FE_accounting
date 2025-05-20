import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trash2, Edit, ArrowUpDown, Search, TrendingDown, TrendingUp, Calendar, LogOut } from "lucide-react";

const API_URL = "http://localhost:8080";

export default function TabelBankKeluar() {
  const [data, setData] = useState([]);
  const [allData, setAllData] = useState([]); // Store all data for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [sortDirection, setSortDirection] = useState("desc");
  const [transactionType, setTransactionType] = useState("pengeluaran");
  const [totals, setTotals] = useState({ pengeluaran: 0, pembayaran: 0 });
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

  const fetchData = () => {
    const endpoint = transactionType === "pengeluaran" 
      ? `${API_URL}/bank/banktrans` 
      : `${API_URL}/income/name`;
    
    // Token is already set in axios defaults in checkAuth
    axios
      .get(endpoint)
      .then((response) => {
        const sortedData = [...response.data].sort((a, b) => {
          if (sortDirection === "asc") {
            return a.trans_no - b.trans_no;
          } else {
            return b.trans_no - a.trans_no;
          }
        });
        
        setAllData(sortedData); // Store all data
        
        // Apply date filter
        const filteredData = applyDateFilter(sortedData);
        setData(filteredData);

        // Calculate total for current transaction type with date filter
        const total = filteredData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        setTotals(prev => ({
          ...prev,
          [transactionType]: total
        }));
      })
      .catch((error) => {
        console.error(`Error fetching ${transactionType} data:`, error);
        if (error.response && error.response.status === 401) {
          toast.error("Sesi login tidak valid. Silakan login kembali.");
          navigate('/login');
        } else {
          toast.error(`Gagal memuat data ${transactionType}`);
        }
      });
  };

  // Fetch totals for both transaction types with date filter
  const fetchAllTotals = () => {
    if (!axios.defaults.headers.common['Authorization']) {
      return; // Don't fetch if not authenticated
    }
    
    // Fetch pengeluaran total
    axios.get(`${API_URL}/bank/banktrans`)
      .then((response) => {
        const filteredData = applyDateFilter(response.data);
        const pengeluaranTotal = filteredData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        setTotals(prev => ({ ...prev, pengeluaran: pengeluaranTotal }));
      })
      .catch((error) => {
        console.error("Error fetching pengeluaran total:", error);
        if (error.response && error.response.status === 401) {
          toast.error("Sesi login tidak valid. Silakan login kembali.");
          navigate('/login');
        }
      });

    // Fetch pembayaran total
    axios.get(`${API_URL}/income/name`)
      .then((response) => {
        const filteredData = applyDateFilter(response.data);
        const pembayaranTotal = filteredData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        setTotals(prev => ({ ...prev, pembayaran: pembayaranTotal }));
      })
      .catch((error) => {
        console.error("Error fetching pembayaran total:", error);
        if (error.response && error.response.status === 401) {
          toast.error("Sesi login tidak valid. Silakan login kembali.");
          navigate('/login');
        }
      });
  };

  useEffect(() => {
    if (userData) {
      fetchAllTotals();
    }
  }, [dateFilter, customDateRange, userData]);

  useEffect(() => {
    if (userData) {
      fetchData();
      setCurrentPage(1);
    }
  }, [sortDirection, transactionType, dateFilter, customDateRange, userData]);

  // Update data when date filter changes
  useEffect(() => {
    if (allData.length > 0) {
      const filteredData = applyDateFilter(allData);
      setData(filteredData);
      
      // Recalculate totals
      const total = filteredData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      setTotals(prev => ({
        ...prev,
        [transactionType]: total
      }));
    }
  }, [dateFilter, customDateRange, allData, transactionType]);

  const handleSort = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (!selectedId) return;
    setIsDeleting(true);
    
    const endpoint = transactionType === "pengeluaran" 
      ? `${API_URL}/bank/Transaction/${selectedId}` 
      : `${API_URL}/income/incomes/${selectedId}`;
    
    axios
      .delete(endpoint)
      .then(() => {
        toast.success("Item berhasil dihapus");
        fetchData();
        fetchAllTotals(); // Refresh totals after deletion
      })
      .catch((error) => {
        console.error("Error deleting item:", error);
        if (error.response && error.response.status === 401) {
          toast.error("Sesi login tidak valid. Silakan login kembali.");
          navigate('/login');
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
    const ref = item.ref?.toLowerCase() || "";
    const bank = item.category?.bank_account_name?.toLowerCase() || "";
    const name = item.name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    
    if (transactionType === "pengeluaran") {
      return ref.includes(query) || bank.includes(query);
    } else {
      return ref.includes(query) || name.includes(query);
    }
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

  const handleRowClick = (id) => {
    const route = transactionType === "pengeluaran" ? "/create" : "/income";
    navigate(`${route}/${id}`);
  };

  const handleEdit = (e, id) => {
    e.stopPropagation();
    const route = transactionType === "pengeluaran" ? "/create" : "/income";
    navigate(`${route}/${id}`);
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
    if (!showAll) {
      setCurrentPage(1);
    }
  };

  const handleTransactionTypeChange = (type) => {
    setTransactionType(type);
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
            No Bukti
            <ArrowUpDown size={16} className="ml-1" />
            <span className="ml-1 text-xs text-gray-500">
              {sortDirection === "asc" ? "(A-Z)" : "(Z-A)"}
            </span>
          </div>
        </th>
        <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Bank Account</th>
        <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Tanggal</th>
        <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">NoCek</th>
        <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Penerima</th>
        <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Jumlah</th>
        <th className="text-center px-6 py-3 text-sm font-medium text-gray-700">Aksi</th>
      </tr>
    );
  };

  const renderTableRows = () => {
    if (displayedData.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="text-center py-4 text-gray-500">
            Tidak ada data ditemukan.
          </td>
        </tr>
      );
    }

    return displayedData.map((item) => (
      <tr
        key={item.id}
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => handleRowClick(item.id)}
      >
        <td className="px-6 py-3 text-left">{item.ref}</td>
        <td className="px-6 py-3 text-left">
          {item.category?.bank_account_name || "-"}
        </td>
        <td className="px-6 py-3 text-left">
          {new Date(item.trans_date).toLocaleDateString("id-ID")}
        </td>
        <td className="px-6 py-3 text-left">{item.nocek}</td>
        <td className="px-6 py-3 text-left">{item.penerima}</td>
        <td className="px-6 py-3 text-green-600 font-semibold text-left">
          Rp {parseFloat(item.amount).toLocaleString("id-ID")}
        </td>
        <td className="px-6 py-3 text-center">
          <div className="flex justify-center space-x-2">
            <button
              onClick={(e) => handleEdit(e, item.id)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={(e) => handleDelete(e, item.id)}
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

  const getCreatePath = () => {
    return transactionType === "pengeluaran" ? "/create" : "/income"; 
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header with title and user info */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Transaksi Bank</h1>
          
          
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
        
        {/* Total Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Pengeluaran Card */}
          <div 
            className={`bg-gradient-to-r from-red-50 to-red-100 border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
              transactionType === "pengeluaran" ? "ring-2 ring-red-300 shadow-md" : ""
            }`}
            onClick={() => handleTransactionTypeChange("pengeluaran")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-800">
                  Rp {totals.pengeluaran.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-red-500">
                  {getDateFilterLabel()} • Klik untuk melihat detail
                </p>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <TrendingDown size={24} className="text-red-600" />
              </div>
            </div>
          </div>

          {/* Pembayaran Card */}
          <div 
            className={`bg-gradient-to-r from-green-50 to-green-100 border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
              transactionType === "pembayaran" ? "ring-2 ring-green-300 shadow-md" : ""
            }`}
            onClick={() => handleTransactionTypeChange("pembayaran")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Pembayaran</p>
                <p className="text-2xl font-bold text-green-800">
                  Rp {totals.pembayaran.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-green-500">
                  {getDateFilterLabel()} • Klik untuk melihat detail
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab-style filter */}
        <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => handleTransactionTypeChange("pengeluaran")}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
              transactionType === "pengeluaran"
                ? "bg-white text-red-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => handleTransactionTypeChange("pembayaran")}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
              transactionType === "pembayaran"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pembayaran
          </button>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3">
          <button
            onClick={() => navigate(getCreatePath())}
            className={`px-4 py-2 text-white rounded-lg transition-colors shadow-sm ${
              transactionType === "pengeluaran" 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            + Tambah {transactionType === "pengeluaran" ? "Pengeluaran" : "Pembayaran"}
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
            placeholder={transactionType === "pengeluaran" ? "Cari ref atau nama bank..." : "Cari ref atau nama..."}
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
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          transactionType === "pengeluaran" 
            ? "bg-red-100 text-red-800" 
            : "bg-green-100 text-green-800"
        }`}>
          Menampilkan: {transactionType === "pengeluaran" ? "Pengeluaran" : "Pembayaran"} • {getDateFilterLabel()}
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
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
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