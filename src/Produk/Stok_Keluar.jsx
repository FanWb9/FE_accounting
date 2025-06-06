import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import Select from "react-select";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";

export default function StokKeluar() {
  const [lokasiOptions, setlokasiOptions] = useState([]);
  const [moneyOptions, setMoneyOptions] = useState([]);
  const selectRef = useRef(null);
  const [barangOptions, setbarangOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedMoney, setSelectedMoney] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  const [textInput, setTextInput] = useState("");
  const [date, setDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [keterangan, setKeterangan] = useState("");
  const [qty, setQty] = useState("");
  const [standardcost, setStandardcost] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get ID from URL parameter
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(!!id);
  const [transactionData, setTransactionData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  //const [checkNumber, setCheckNumber] = useState("");
  //const [recipient, setRecipient] = useState("");
  const [memo, setMemo] = useState("");

  // const [showInfoLain, setShowInfoLain] = useState(false);
  // const [noCek, setNoCek] = useState("");
  // const [penerima, setPenerima] = useState("");
  // const [keteranganTambahan, setKeteranganTambahan] = useState("");

  const API_URL = "http://localhost:8080";

  // Fetch initial data for dropdowns
  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
    setIsLoading(true);

    // Use Promise.all to fetch all data in parallel
    Promise.all([
      axios.get(`${API_URL}/produk/name`),
      axios.get(`${API_URL}/produk/money`),
      axios.get(`${API_URL}/produk/barang`)
    ]).then(([lokasiRes, moneyRes, barangRes]) => {
      // Process lokasi gudang data
      setlokasiOptions(lokasiRes.data.map((item) => ({
        value: item.loc_code,
        label: `${item.loc_code} | ${item.location_name}`,
      })));

      // Process currency data
      setMoneyOptions(moneyRes.data.map((item) => ({
        value: item.curr_code,
        label: item.curr_code,
      })));

      // Process chart of accounts data
      setbarangOptions(barangRes.data.map((item) => ({
        value: item.stock_id,
        label: `${item.stock_id} | ${item.description}`,
      })));

      setIsLoading(false);
    }).catch((err) => {
      console.error("Error fetching initial data:", err);
      toast.error("Gagal memuat data. Silakan coba lagi.");
      setIsLoading(false);
    });
  }, []);

  // Fetch transaction data if in edit mode
  useEffect(() => {
    // Only fetch data once all options are loaded and we haven't fetched data yet
    if (id && barangOptions.length > 0 && lokasiOptions.length > 0 && !dataFetched) {
      console.log("Fetching transaction details for ID:", id);
      setDataFetched(true); // Mark that we've started fetching
      setIsLoading(true);
      
      // Fetch transaction details
      axios.get(`${API_URL}/produk/transaction-detail/${id}`)
        .then((response) => {
          console.log("Transaction details response:", response.data);
          
          if (response.data && response.data.transaction) {
            const transaction = response.data.transaction;
            
            // Set main transaction data
            setTextInput(transaction.ref || "");
            setDate(transaction.trans_date ? transaction.trans_date.split("T")[0] : new Date().toISOString().split("T")[0]);

            // Set check information fields that were missing
            //setCheckNumber(transaction.nocek || "");
            //setRecipient(transaction.penerima || "");
            setMemo(transaction.ket || "");
            
            // Set selected gudang
            const selectedGudang = lokasiOptions.find(location => location.value === transaction.location);
            if (selectedGudang) {
              console.log("Setting gudang:", selectedGudang);
              setSelected(selectedGudang);
            }
            
            // Set selected currency
            const selectedCurrency = moneyOptions.find(curr => curr.value === transaction.curr_code);
            if (selectedCurrency) {
              setSelectedMoney(selectedCurrency);
            } else if (moneyOptions.length > 0) {
              // Default to first currency if not found
              setSelectedMoney(moneyOptions[1]);
            }
            
            // Clear existing data before processing details
            setData([]);
            
            // Process transaction details
            if (response.data.details && response.data.details.length > 0) {
              processTransactionDetails(response.data.details);
            } else {
              // If details are null, try fetching item transactions directly
              console.log("Details are null, fetching item transactions directly");
              fetchGLTransactions(transaction.trans_no);
            }
            
            setTransactionData(transaction);
            setDataLoaded(true);
            setIsLoading(false);
          }
        })
        .catch(err => {
          console.error("Error fetching transaction details:", err);
          toast.error(`Gagal memuat data transaksi: ${err.response?.data || err.message}`);
          setIsLoading(false);
        });
    }
  }, [id, barangOptions, lokasiOptions, moneyOptions, dataFetched]);

  // Function to fetch GL transactions when details are null
  const fetchGLTransactions = (transNo) => {
    if (!transNo) {
      console.error("No transaction number provided");
      return;
    }
    
    setIsLoading(true);
    axios.get(`${API_URL}/produk/produk-transactions/${transNo}`)
      .then(response => {
        console.log("GL Transactions:", response.data);
        if (response.data && response.data.length > 0) {
          // Clear existing data before processing
          setData([]);
          processTransactionDetails(response.data);
        } else {
          console.error("No GL transactions found");
          toast.info("Tidak ada transaksi  ditemukan");
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching GL transactions:", err);
        toast.error(`Gagal memuat data transaksi GL: ${err.response?.data || err.message}`);
        setIsLoading(false);
      });
  };

  // Function to process transaction details
  const processTransactionDetails = (details) => {
    if (!details || details.length === 0) return;
    
    // Filter out keluar transactions if needed
    const detailsData = details
      .filter(detail => {
        // Skip entries with negative amounts (the keluar entry)
        const qty = parseFloat(detail.qty) || 0;
        return qty != 0;
      })
      .map(detail => {
        // Find chart option
        const chartOption = barangOptions.find(option => 
          option.value === detail.stock_id
        );
        
        // Parse amount (make positive for expense)
        const qty = parseFloat(detail.qty) || 0;
        const standardcost = parseFloat(detail.standard_cost) || 0;
        const jumlah = parseFloat(detail.jumlah) || 0;
        //const positiveJumlah = Math.abs(jumlah);
        
        return {
          id: detail.trans_id || new Date().getTime() + Math.random(),
          akunbarang: chartOption ? chartOption.label : `${detail.stock_id}`,
          keterangan: detail.keterangan || "",
          qty: Math.abs(qty),
          standardcost: standardcost,
          jumlah: jumlah,
          selectedChart: chartOption || { 
            value: detail.stock_id, 
            label: `${detail.stock_id}` 
          }
        };
      });
    
    console.log("Processed details:", detailsData);
    setData(detailsData);
  };

  // Add expense item
  const handleAdd = () => {

    let cleanQty;
    if (qty.includes(',')) {
      // Convert from "19.891,09" format to floating point number
      cleanQty = parseFloat(qty.replace(/\./g, "").replace(",", "."));
    } else {
      // Just remove dots for integers
      cleanQty = parseFloat(parseNumber(qty));
    }

    let cleanStandardcost;
    if (standardcost.includes(',')) {
      // Convert from "19.891,09" format to floating point number
      cleanStandardcost = parseFloat(standardcost.replace(/\./g, "").replace(",", "."));
    } else {
      // Just remove dots for integers
      cleanStandardcost = parseFloat(parseNumber(standardcost));
    }
      
    let cleanJumlah;
    cleanJumlah = jumlah;
    //if (jumlah.includes(',')) {
        // Convert from "19.891,09" format to floating point number
    //    cleanJumlah = parseFloat(jumlah.replace(/\./g, "").replace(",", "."));
    //} else {
        // Just remove dots for integers
    //    cleanJumlah = parseFloat(parseNumber(jumlah));
    //}

    if (!selectedChart || !jumlah) { //|| !keterangan 
      toast.warning("Harap lengkapi semua field barang dan kwantitas!");
      return;
    }

    if (isEditing && editingId !== null) {
      setData(prev => prev.map(item => 
        item.id === editingId 
          ? { ...item, akunbarang: selectedChart.label, keterangan, qty: cleanQty, standardcost: cleanStandardcost, jumlah: cleanJumlah, selectedChart }
          : item
      ));
      toast.success("Data barang berhasil diperbarui");
    } else {
      setData(prev => [
        ...prev,
        {
          id: new Date().getTime(),
          akunbarang: selectedChart.label,
          keterangan,
          qty: cleanQty,
          standardcost: cleanStandardcost,
          jumlah: cleanJumlah,
          selectedChart,
        }
      ]);
      toast.success("Data barang berhasil ditambahkan");
    }

    // Reset form but keep modal open
    resetForm();
  };

   // Toggle additional info section
  const toggleAdditionalInfo = () => {
    setShowAdditionalInfo(!showAdditionalInfo);
  };

  // Submit form
 const handleSubmit = async () => {
  // Validation
  if (!selected || !selectedMoney || !textInput || !date) {
    toast.warning("Harap lengkapi semua field!");
    return;
  }
  
  // Ensure there are expense details
  if (data.length === 0) {
    toast.warning("Harap tambahkan minimal satu detail barang!");
    return;
  }
  
  // Prepare data to be sent
  const acc = data.map(item => item.selectedChart.value);
  const qtyPerBarang = data.map(item => item.qty.toString());
  const standardcostPerBarang = data.map(item => item.standardcost.toString());
  const jumlahPerBarang = data.map(item => item.jumlah.toString());
  const keteranganArray = data.map(item => item.keterangan);
  const total = data.reduce((acc, item) => acc + item.jumlah, 0);
  
  const transactionData = {
    location: selected.value,
    curr_code: selectedMoney.value,
    stock_id: acc,
    qty: qtyPerBarang,
    standard_cost: standardcostPerBarang,
    jumlah: jumlahPerBarang,
    keterangan: keteranganArray,
    ref: textInput,
    trans_date: date,
    amount: total.toString(),
    ket: memo
    
  };
  
  console.log("Sending data:", transactionData);
  setIsSaving(true);
  
  try {
    let url = `${API_URL}/produk/Transaction`;
    let method = "post";
    
    // If in edit mode, use PUT endpoint
    if (isEditMode && id) {
      url = `${API_URL}/produk/Transaction/${id}`;
      method = "put";
    }
    
    const response = await axios[method](url, transactionData);
    console.log(isEditMode ? "Data berhasil diperbarui:" : "Data berhasil disimpan:", response.data);
    toast.success(isEditMode ? "Transaksi berhasil diperbarui!" : "Transaksi berhasil dikirim!");
    
    // Navigate after a short delay to show the success message
    setTimeout(() => {
      setIsSaving(false);
      navigate("/previewout", { state: { transactionData } });
    }, 1500);
  } catch (error) {
    console.error("Error:", error);
    setIsSaving(false);
    
    // Improved error handling - don't show raw 400 errors to user
    if (error.response) {
      // Handle specific known error cases with user-friendly messages
      if (error.response.status === 400) {
        // For 400 errors, provide generic user-friendly message
        // Log the actual error for debugging but don't show to user
        console.error("400 Error details:", error.response.data);
        
        // Check for specific known error patterns
        if (error.response.data?.error === "Reference number already exists for this type") {
          toast.error("Nomor referensi sudah digunakan! Harap gunakan nomor referensi yang berbeda.");
        } else {
          // Generic message for other 400 errors
          toast.error("Terjadi kesalahan pada input data. Silakan periksa kembali.");
        }
      } else {
        // For non-400 errors, can show more specific messages if needed
        toast.error("Terjadi kesalahan saat mengirim data. Silakan coba lagi.");
      }
    } else {
      // Network errors or other issues
      toast.error("Koneksi terputus. Silakan periksa koneksi internet Anda.");
    }
  }
};

  // Delete expense item
  const handleDelete = (id) => {
    const newData = data.filter(item => item.id !== id);
    setData(newData);
    toast.info("Item berhasil dihapus");
  };

  // Format number to thousands with dots
  const formatNumber = (value, hasDecimal = false) => {
  if (!hasDecimal) {
    // Original function for integers only
    return value.replace(/\D/g, '')  // Only numbers
                .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  } else {
    // For values with decimal point
    const parts = value.split(',');
    const integerPart = parts[0].replace(/\D/g, '')  // Only numbers for integer part
                           .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // If there's a decimal part, append it
    if (parts.length > 1) {
      // Limit decimal to 2 digits
      const decimalPart = parts[1].replace(/\D/g, '').substring(0, 2);
      return integerPart + ',' + decimalPart;
    }
    
    return integerPart;
  }
};

  // Clean dots before saving
  const parseNumber = (value) => {
    return value.replace(/\./g, '');
  };

  // Cancel and reset form
  const handleCancel = () => {
    resetForm();
    setShowModal(false);
  };

  // Reset form fields
  const resetForm = () => {
    setSelectedChart(null);
    setKeterangan("");
    setQty("");
    setStandardcost("");
    setJumlah("");
    setEditingId(null);
    setIsEditing(false);
    selectRef.current?.focus();
  };

  // Calculate total
  const total = data.reduce((acc, item) => acc + item.jumlah, 0);

  // Filter data based on search term
  const filteredData = data.filter(item => 
    item.akunbarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.keterangan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading overlay component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center">
        <ClipLoader color="#3B82F6" size={50} />
        <p className="mt-4 text-lg font-medium">Memuat data...</p>
      </div>
    </div>
  );

  // Saving overlay component
  const SavingOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
        <ClipLoader color="#3B82F6" size={60} />
        <p className="mt-4 text-xl font-medium text-blue-600">Menyimpan Transaksi...</p>
        <p className="mt-2 text-gray-600">Mohon tunggu sebentar</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}
      
      {/* Saving Overlay */}
      {isSaving && <SavingOverlay />}
      
      {/* Main Container */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white p-6 text-black">
          <h1 className="text-2xl font-bold text-center">
            {isEditMode ? "Edit Transaksi Stok Keluar" : "Stok Keluar"}
          </h1>
        </div>
        
        {/* Form Content */}
        <div className="p-6">
          {/* Upper Form Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Pilih Gudang</label>
              <Select
                options={lokasiOptions}
                value={selected}
                onChange={setSelected}
                placeholder="-- Pilih Gudang --"
                isClearable
                className="text-sm"
                isDisabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Mata Uang</label>
              <Select
                options={moneyOptions}
                value={selectedMoney}
                onChange={setSelectedMoney}
                placeholder="-- Mata Uang --"
                isClearable
                className="text-sm"
                isDisabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">No Referensi</label>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Masukkan No Referensi"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Search and Action Buttons */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari akun atau keterangan..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors shadow-md ml-4"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Tambah Barang
            </button>
          </div>
          
          {/* Detail Barang Table */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Detail Barang</h2>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Barang</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Keterangan</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Qty</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Harga</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Jumlah</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredData.length > 0 ? (
                      filteredData.map((item, i) => (
                        <tr
                          key={i}
                          onClick={() => {
                            setSelectedChart(item.selectedChart);
                            setKeterangan(item.keterangan);
                            setQty(item.qty.toLocaleString('id-ID').replace(/,/g, '.'));
                            setStandardcost(item.standardcost.toLocaleString('id-ID').replace(/,/g, '.'));
                            setJumlah(item.jumlah.toLocaleString('id-ID').replace(/,/g, '.'));
                            setEditingId(item.id);
                            setIsEditing(true);
                            setShowModal(true);
                          }}
                          className="cursor-pointer hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-4 py-3">{item.akunbarang}</td>
                          <td className="px-4 py-3">{item.keterangan}</td>

                          <td className="px-4 py-3 text-right font-medium">
                              {item.qty.toLocaleString('id-ID', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).replace(/\./g, 'X').replace(/,/g, '.').replace(/X/g, ',')}
                          </td>

                          <td className="px-4 py-3 text-right font-medium">
                              {item.standardcost.toLocaleString('id-ID', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).replace(/\./g, 'X').replace(/,/g, '.').replace(/X/g, ',')}
                          </td>

                          <td className="px-4 py-3 text-right font-medium">
                              {item.jumlah.toLocaleString('id-ID', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).replace(/\./g, 'X').replace(/,/g, '.').replace(/X/g, ',')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); 
                                handleDelete(item.id);
                              }}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                              disabled={isLoading}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          {searchTerm ? "Tidak ada data yang cocok dengan pencarian" : "Belum ada data barang. Klik 'Tambah Barang' untuk menambahkan."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Additional Information Section (collapsible) */}
          <div className="mb-6">
            <button 
              onClick={toggleAdditionalInfo}
              className="flex items-center justify-between w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
            >
              <span className="flex items-center text-gray-700 font-semibold">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Informasi Tambahan
              </span>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform ${showAdditionalInfo ? 'rotate-180' : 'rotate-0'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {/* Collapsible content */}
            <div 
              className={`transition-all duration-300 overflow-hidden bg-white rounded-lg border border-gray-200 mt-2 ${
                showAdditionalInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 border-0'
              }`}
            >
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-2">Keterangan</label>
                      <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-500"
                        placeholder="Masukkan keterangan"
                        rows="3"
                        disabled={isLoading}
                      />
                    </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer with Total and Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-gray-200">
           <div className="text-xl font-bold text-white mb-4 md:mb-0 bg-green-600 px-4 py-2 rounded-lg">
              Total: {total.toLocaleString('id-ID', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).replace(/\./g, 'X').replace(/,/g, '.').replace(/X/g, ',')}
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate("/produk")}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                disabled={isLoading || isSaving}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                disabled={isLoading || isSaving}
              >
                {isSaving && <ClipLoader color="#ffffff" size={16} className="mr-2" />}
                {isEditMode ? "Update" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Barang */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? "Edit Barang" : "Tambah Barang"}
              </h2>
              <button 
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
              // Do not close modal to allow continuous entry
            }}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Barang</label>
                <Select
                  ref={selectRef}
                  options={barangOptions}
                  value={selectedChart}
                  onChange={setSelectedChart}
                  placeholder="-- Pilih Barang --"
                  isClearable
                  className="text-sm"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Keterangan</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Masukkan Keterangan"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("jumlah-input")?.focus();
                    }
                  }}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Kwantitas</label>
                <input
                  id="qty-input"
                  type="text"
                  value={qty}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    
                    // Check if input contains a comma (decimal separator)
                    const hasDecimal = inputValue.includes(',');
                    
                    if (hasDecimal) {
                      // Allow only one comma
                      const commaCount = (inputValue.match(/,/g) || []).length;
                      if (commaCount > 1) return;
                      
                      // Process as decimal number
                      const formatted = formatNumber(inputValue, true);
                      var harga=document.getElementById("standardcost-input")?.value.replace(/\D/g, "") * inputValue;
                      setQty(formatted);
                      setJumlah(harga);
                    } else {
                      // Process as integer (original logic)
                      const rawValue = inputValue.replace(/\D/g, "");
                      if (rawValue === "" || /^0+$/.test(rawValue)) {
                        setQty("");
                      } else {
                        const formatted = formatNumber(rawValue);
                        var harga=document.getElementById("standardcost-input")?.value.replace(/\D/g, "") * rawValue;
                        //let numjumlah = parseFloat(harga);
                        //var jumlah = formatNumber(numjumlah);
                        setQty(formatted);
                        setJumlah(harga);
                      }
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Masukkan Kwantitas (contoh: 15.000,50)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      
                      // Extract numeric value (handling both with/without decimal)
                      let numericValue;
                      if (qty.includes(',')) {
                        // Convert from "15.000,50" format to numeric value
                        numericValue = parseFloat(qty.replace(/\./g, "").replace(",", "."));
                      } else {
                        numericValue = parseFloat(qty.replace(/\./g, ""));
                      }
                      
                      if (isNaN(numericValue) || numericValue === 0) {
                        toast.warning("Kwantitas tidak boleh nol atau kosong!");
                        return;
                      }
                      
                      // Add data but don't close modal
                      handleAdd();
                      // Reset form for next entry but keep modal open
                      resetForm();
                    }
                  }}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Harga</label>
                <input
                  id="standardcost-input"
                  type="text"
                  value={standardcost}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    
                    // Check if input contains a comma (decimal separator)
                    const hasDecimal = inputValue.includes(',');
                    
                    if (hasDecimal) {
                      // Allow only one comma
                      const commaCount = (inputValue.match(/,/g) || []).length;
                      if (commaCount > 1) return;
                      
                      // Process as decimal number
                      const formatted = formatNumber(inputValue, true);
                      setStandardcost(formatted);

                      var jumlah=document.getElementById("qty-input")?.value.replace(/\D/g, "") * inputValue;
                      setJumlah(jumlah);

                    } else {
                      // Process as integer (original logic)
                      const rawValue = inputValue.replace(/\D/g, "");
                      if (rawValue === "" || /^0+$/.test(rawValue)) {
                        setStandardcost("");
                      } else {
                        const formatted = formatNumber(rawValue);
                        setStandardcost(formatted);

                        var jumlah=document.getElementById("qty-input")?.value.replace(/\D/g, "") * rawValue;
                        setJumlah(jumlah);

                      }
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Masukkan Harga (contoh: 15.000,50)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      
                      // Extract numeric value (handling both with/without decimal)
                      let numericValue;
                      if (standardcost.includes(',')) {
                        // Convert from "15.000,50" format to numeric value
                        numericValue = parseFloat(standardcost.replace(/\./g, "").replace(",", "."));
                      } else {
                        numericValue = parseFloat(standardcost.replace(/\./g, ""));
                      }
                      
                      if (isNaN(numericValue) || numericValue === 0) {
                        toast.warning("Harga tidak boleh nol atau kosong!");
                        return;
                      }
                      
                      // Add data but don't close modal
                      handleAdd();
                      // Reset form for next entry but keep modal open
                      resetForm();
                    }
                  }}
                />
              </div>

             <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Jumlah</label>
                <input
                  id="jumlah-input"
                  type="text"
                  value={jumlah}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    
                    // Check if input contains a comma (decimal separator)
                    const hasDecimal = inputValue.includes(',');
                    
                    if (hasDecimal) {
                      // Allow only one comma
                      const commaCount = (inputValue.match(/,/g) || []).length;
                      if (commaCount > 1) return;
                      
                      // Process as decimal number
                      const formatted = formatNumber(inputValue, true);
                      setJumlah(formatted);

                      var jumlah=document.getElementById("qty-input")?.value.replace(/\D/g, "") * document.getElementById("standardcost-input")?.value.replace(/\D/g, "");
                      setJumlah(jumlah);

                    } else {
                      // Process as integer (original logic)
                      const rawValue = inputValue.replace(/\D/g, "");
                      if (rawValue === "" || /^0+$/.test(rawValue)) {
                        setJumlah("");
                      } else {
                        const formatted = formatNumber(rawValue);
                        setJumlah(formatted);

                        var jumlah=document.getElementById("qty-input")?.value.replace(/\D/g, "") * document.getElementById("standardcost-input")?.value.replace(/\D/g, "");
                        setJumlah(jumlah);
                      }
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Masukkan Jumlah (contoh: 15.000,50)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      
                      // Extract numeric value (handling both with/without decimal)
                      let numericValue;
                      if (jumlah.includes(',')) {
                        // Convert from "15.000,50" format to numeric value
                        numericValue = parseFloat(jumlah.replace(/\./g, "").replace(",", "."));
                      } else {
                        numericValue = parseFloat(jumlah.replace(/\./g, ""));
                      }
                      
                      if (isNaN(numericValue) || numericValue === 0) {
                        toast.warning("Jumlah tidak boleh nol atau kosong!");
                        return;
                      }
                      
                      // Add data but don't close modal
                      handleAdd();
                      // Reset form for next entry but keep modal open
                      resetForm();
                    }
                  }}
                />
              </div>

              <div className="flex justify-between gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-1/2 bg-gray-500 hover:bg-gray-400 text-white py-2 rounded-lg transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  id="submit-button"
                  className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors"
                >
                  {isEditing ? "Simpan" : "Tambahkan"}
                </button>
              </div>
              
              <div className="text-center mt-4 text-sm text-gray-500">
                <p>Tekan Enter di kwantitas untuk menambahkan secara cepat</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}