import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import Select from "react-select";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";

export default function JurnalSystem() {
  const [journalTypeOptions, setJournalTypeOptions] = useState([]);
  const [cabangOptions, setCabangOptions] = useState([]);
  const [chartOptions, setChartOptions] = useState([]);
  const [selectedJournalType, setSelectedJournalType] = useState(null);
  const [selectedCabang, setSelectedCabang] = useState(null);
  const [selectedChart, setSelectedChart] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  const [noRef, setNoRef] = useState("");
  const [date, setDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [keterangan, setKeterangan] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [debitType, setDebitType] = useState(true); // true = debit, false = credit
  const [debitData, setDebitData] = useState([]);
  const [creditData, setCreditData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const selectRef = useRef(null);
  const [repeatMode, setRepeatMode] = useState(false);
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(!!id);
  const [dataFetched, setDataFetched] = useState(false);

  const API_URL = "http://localhost:8080";

  // Fetch initial data
  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
    setIsLoading(true);

    Promise.all([
      axios.get(`${API_URL}/jurnal/name`),
      axios.get(`${API_URL}/jurnal/Cabang`),
      axios.get(`${API_URL}/bank/chart`)
    ]).then(([journalRes, cabangRes, chartRes]) => {
      setJournalTypeOptions(journalRes.data.map((item) => ({
        value: item.kode,
        label: ` ${item.nama}`,
      })));

      setCabangOptions(cabangRes.data.map((item) => ({
        value: item.dep_code,
        label: item.dep_name,
      })));

      setChartOptions(chartRes.data.map((item) => ({
        value: item.account_code,
        label: `${item.account_code} | ${item.account_name}`,
      })));

      setIsLoading(false);
    }).catch((err) => {
      console.error("Error fetching initial data:", err);
      toast.error("Gagal memuat data. Silakan coba lagi.");
      setIsLoading(false);
    });
  }, []);

  // Fetch journal data if in edit mode
  useEffect(() => {
    if (id && chartOptions.length > 0 && journalTypeOptions.length > 0 && cabangOptions.length > 0 && !dataFetched) {
      setDataFetched(true);
      setIsLoading(true);
      
      axios.get(`${API_URL}/jurnal/detail/${id}`)
        .then((response) => {
          if (response.data) {
            const { journal, debits, credits } = response.data;
            setNoRef(journal.reference || "");
            setDate(journal.trans_date ? journal.trans_date.split("T")[0] : new Date().toISOString().split("T")[0]);
            
            const selectedJournal = journalTypeOptions.find(item => item.value === journal.kodej);
            if (selectedJournal) setSelectedJournalType(selectedJournal);
            
            const selectedCabangItem = cabangOptions.find(item => item.value === journal.proyek);
            if (selectedCabangItem) setSelectedCabang(selectedCabangItem);
            
            // Process debits
            const processedDebits = debits.map(debit => ({
              id: debit.id || new Date().getTime() + Math.random(),
              akun: chartOptions.find(option => option.value === debit.account)?.label || debit.account,
              keterangan: debit.memo || "",
              jumlah: parseFloat(debit.amount),
              selectedChart: chartOptions.find(option => option.value === debit.account)
            }));
            
            // Process credits
            const processedCredits = credits.map(credit => ({
              id: credit.id || new Date().getTime() + Math.random(),
              akun: chartOptions.find(option => option.value === credit.account)?.label || credit.account,
              keterangan: credit.memo || "",
              jumlah: parseFloat(credit.amount),
              selectedChart: chartOptions.find(option => option.value === credit.account)
            }));
            
            setDebitData(processedDebits);
            setCreditData(processedCredits);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching journal details:", err);
          toast.error("Gagal memuat data jurnal");
          setIsLoading(false);
        });
    }
  }, [id, chartOptions, journalTypeOptions, cabangOptions, dataFetched]);

  // Add journal entry
  const handleAdd = () => {
    let cleanJumlah;
    if (jumlah.includes(',')) {
      cleanJumlah = parseFloat(jumlah.replace(/\./g, "").replace(",", "."));
    } else {
      cleanJumlah = parseFloat(parseNumber(jumlah));
    }

    if (!selectedChart || !jumlah) {
      toast.warning("Harap lengkapi akun dan jumlah!");
      return;
    }

    const newEntry = {
      id: isEditing ? editingId : new Date().getTime(),
      akun: selectedChart.label,
      keterangan,
      jumlah: cleanJumlah,
      selectedChart,
    };

    if (isEditing && editingId !== null) {
      if (debitType) {
        setDebitData(prev => prev.map(item => 
          item.id === editingId ? newEntry : item
        ));
      } else {
        setCreditData(prev => prev.map(item => 
          item.id === editingId ? newEntry : item
        ));
      }
      toast.success("Data berhasil diperbarui");
    } else {
      if (debitType) {
        setDebitData(prev => [...prev, newEntry]);
        toast.success("Data debit berhasil ditambahkan");
      } else {
        setCreditData(prev => [...prev, newEntry]);
        toast.success("Data kredit berhasil ditambahkan");
      }
    }

    resetForm();
  };

  // Submit form
  const handleSubmit = async () => {
    if (!selectedJournalType || !selectedCabang || !noRef || !date) {
      toast.warning("Harap lengkapi semua field!");
      return;
    }

    if (debitData.length === 0 || creditData.length === 0) {
      toast.warning("Harap tambahkan minimal satu entry debit dan kredit!");
      return;
    }

    const totalDebit = debitData.reduce((acc, item) => acc + item.jumlah, 0);
    const totalCredit = creditData.reduce((acc, item) => acc + item.jumlah, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast.error(`Debit dan Kredit harus balance! Debit: ${totalDebit.toFixed(2)}, Kredit: ${totalCredit.toFixed(2)}`);
      return;
    }

    const transactionData = {
      kodej: selectedJournalType.value,
      proyek: selectedCabang.value,
      trans_date: date,
      no_ref: noRef,
      debit_accounts: debitData.map(item => item.selectedChart.value),
      debit_amounts: debitData.map(item => item.jumlah.toString()),
      debit_memos: debitData.map(item => item.keterangan),
      credit_accounts: creditData.map(item => item.selectedChart.value),
      credit_amounts: creditData.map(item => item.jumlah.toString()),
      credit_memos: creditData.map(item => item.keterangan),
    };

    setIsSaving(true);

    try {
      let url = `${API_URL}/jurnal/transaction`;
      let method = "post";

      if (isEditMode && id) {
        url = `${API_URL}/jurnal/transaction/${id}`;
        method = "put";
      }

      const response = await axios[method](url, transactionData);
      toast.success(isEditMode ? "Jurnal berhasil diperbarui!" : "Jurnal berhasil disimpan!");
     setTimeout(() => {
  setIsSaving(false);
  if (repeatMode) {
    // Reset hanya amount, pertahankan akun dan keterangan
    const resetDebitData = debitData.map(item => ({
      ...item,
      jumlah: 0 // Reset amount ke 0
    }));
    
    const resetCreditData = creditData.map(item => ({
      ...item,
      jumlah: 0 // Reset amount ke 0
    }));
    
    // Reset hanya nomor referensi
    setNoRef("");
    setDebitData(resetDebitData);
    setCreditData(resetCreditData);
    
    // Simpan data yang mau dipertahankan ke sessionStorage
    sessionStorage.setItem('repeatModeData', JSON.stringify({
      selectedJournalType,
      selectedCabang,
      date,
      debitData: resetDebitData, // Simpan data debit dengan amount 0
      creditData: resetCreditData, // Simpan data credit dengan amount 0
      repeatMode: true
    }));
    
    navigate("/jurnal-priview", { 
      state: { 
        transactionData: transactionData,
        repeatMode: true
      }
    });
  } else {
    // Reset semua data untuk mode normal
    setSelectedJournalType(null);
    setSelectedCabang(null);
    setNoRef("");
    setDate(new Date().toISOString().split("T")[0]);
    setDebitData([]);
    setCreditData([]);
    navigate("/jurnal-priview", { state: { transactionData: transactionData }});
  }
}, 1500);
    } catch (error) {
      console.error("Error:", error);
      setIsSaving(false);
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
          toast.error("Terjadi kesalahan saat menyimpan jurnal");
      }
     
    }
  };
 useEffect(() => {
  // Check jika ada data repeat mode yang disimpan
  const repeatData = sessionStorage.getItem('repeatModeData');
  if (repeatData) {
    const data = JSON.parse(repeatData);
    if (data.repeatMode) {
      // Restore data yang disimpan
      setSelectedJournalType(data.selectedJournalType);
      setSelectedCabang(data.selectedCabang);
      setDate(data.date);
      setDebitData(data.debitData || []); // Restore debit data dengan amount 0
      setCreditData(data.creditData || []); // Restore credit data dengan amount 0
      setRepeatMode(true);
    }
    // Clear session storage setelah digunakan
    sessionStorage.removeItem('repeatModeData');
  }
}, []); // Hanya run sekali saat component mount

  // Delete entry
  const handleDelete = (id, isDebit) => {
    if (isDebit) {
      setDebitData(prev => prev.filter(item => item.id !== id));
    } else {
      setCreditData(prev => prev.filter(item => item.id !== id));
    }
    toast.info("Item berhasil dihapus");
  };

  // Format number
  const formatNumber = (value, hasDecimal = false) => {
    if (!hasDecimal) {
      return value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } else {
      const parts = value.split(',');
      const integerPart = parts[0].replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      if (parts.length > 1) {
        const decimalPart = parts[1].replace(/\D/g, '').substring(0, 2);
        return integerPart + ',' + decimalPart;
      }
      
      return integerPart;
    }
  };

  const parseNumber = (value) => {
    return value.replace(/\./g, '');
  };

 const handleCancel = () => {
  // Clear repeat mode data jika ada
  sessionStorage.removeItem('repeatModeData');
  resetForm();
  setShowModal(false);
};
  const resetForm = () => {
    setSelectedChart(null);
    setKeterangan("");
    setJumlah("");
    setEditingId(null);
    setIsEditing(false);
    setDebitType(true);
    selectRef.current?.focus();
  };

  // Calculate totals
  const totalDebit = debitData.reduce((acc, item) => acc + item.jumlah, 0);
  const totalCredit = creditData.reduce((acc, item) => acc + item.jumlah, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // Filter data
  const filteredDebitData = debitData.filter(item => 
    item.akun.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.keterangan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCreditData = creditData.filter(item => 
    item.akun.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.keterangan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center">
        <ClipLoader color="#3B82F6" size={50} />
        <p className="mt-4 text-lg font-medium">Memuat data...</p>
      </div>
    </div>
  );

  const SavingOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
        <ClipLoader color="#3B82F6" size={60} />
        <p className="mt-4 text-xl font-medium text-blue-600">Menyimpan Jurnal...</p>
        <p className="mt-2 text-gray-600">Mohon tunggu sebentar</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
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
      
      {isLoading && <LoadingOverlay />}
      {isSaving && <SavingOverlay />}
      
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white p-6 text-black">
          <h1 className="text-2xl font-bold text-center">
            {isEditMode ? "Edit Jurnal" : "Jurnal Umum"}
          </h1>
        </div>
        
        {/* Form Content */}
        <div className="p-6">
          {/* Upper Form Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Jenis Jurnal</label>
              <Select
                options={journalTypeOptions}
                value={selectedJournalType}
                onChange={setSelectedJournalType}
                placeholder="-- Pilih Jenis Jurnal --"
                isClearable
                className="text-sm"
                isDisabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Cabang</label>
              <Select
                options={cabangOptions}
                value={selectedCabang}
                onChange={setSelectedCabang}
                placeholder="-- Pilih Cabang --"
                isClearable
                className="text-sm"
                isDisabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">No Ref</label>
              <input
                type="text"
                value={noRef}
                onChange={(e) => setNoRef(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Masukkan No Referensi"
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
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Tambah Entry
            </button>
          </div>
          
          {/* Balance Status */}
          <div className={`mb-4 p-4 rounded-lg ${isBalanced ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
            <div className="flex justify-between items-center">
              <span className={`font-medium ${isBalanced ? 'text-green-800' : 'text-red-800'}`}>
                Status Balance: {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
              </span>
              <div className="text-sm">
                <span className="mr-4">Total Debit: {totalDebit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
                <span>Total Kredit: {totalCredit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          {/* Repeat Mode Checkbox */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={repeatMode}
                onChange={(e) => setRepeatMode(e.target.checked)}
                className="mr-3 w-4 h-4 text-blue-600"
              />
              <span className="text-blue-800 font-medium">Mode Repeat</span>
              <span className="ml-2 text-sm text-blue-600">
                (Data form akan tersimpan untuk entry selanjutnya)
              </span>
            </label>
          </div>
          {/* Debit Credit Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Debit Table */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-green-700 flex items-center">
                <span className="bg-green-300 px-3 py-1 rounded-lg mr-2">DEBIT</span>
                Total: {totalDebit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
              </h2>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm divide-y divide-gray-200">
                    <thead className="bg-green-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Akun</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Keterangan</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Jumlah</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredDebitData.length > 0 ? (
                        filteredDebitData.map((item, i) => (
                          <tr
                            key={i}
                            onClick={() => {
                              setSelectedChart(item.selectedChart);
                              setKeterangan(item.keterangan);
                              setJumlah(item.jumlah.toLocaleString('id-ID').replace(/,/g, '.'));
                              setEditingId(item.id);
                              setIsEditing(true);
                              setDebitType(true);
                              setShowModal(true);
                            }}
                            className="cursor-pointer hover:bg-green-50 transition-colors"
                          >
                            <td className="px-4 py-3">{item.akun}</td>
                            <td className="px-4 py-3">{item.keterangan}</td>
                            <td className="px-4 py-3 text-right font-medium">
                              {item.jumlah.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); 
                                  handleDelete(item.id, true);
                                }}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                            Belum ada data debit
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Credit Table */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-blue-700 flex items-center">
                <span className="bg-blue-300 px-3 py-1 rounded-lg mr-2">KREDIT</span>
                Total: {totalCredit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
              </h2>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm divide-y divide-gray-200">
                    <thead className="bg-blue-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Akun</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Keterangan</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Jumlah</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredCreditData.length > 0 ? (
                        filteredCreditData.map((item, i) => (
                          <tr
                            key={i}
                            onClick={() => {
                              setSelectedChart(item.selectedChart);
                              setKeterangan(item.keterangan);
                              setJumlah(item.jumlah.toLocaleString('id-ID').replace(/,/g, '.'));
                              setEditingId(item.id);
                              setIsEditing(true);
                              setDebitType(false);
                              setShowModal(true);
                            }}
                            className="cursor-pointer hover:bg-blue-50 transition-colors"
                          >
                            <td className="px-4 py-3">{item.akun}</td>
                            <td className="px-4 py-3">{item.keterangan}</td>
                            <td className="px-4 py-3 text-right font-medium">
                              {item.jumlah.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); 
                                  handleDelete(item.id, false);
                                }}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                            Belum ada data kredit
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer with Buttons */}
          <div className="flex justify-end items-center pt-4 border-t border-gray-200">
            <div className="flex space-x-4">
              <button
                type="button"
                
                  onClick={() => {
                  sessionStorage.removeItem('repeatModeData');
                  navigate("/Tabeljurnal");
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                disabled={isLoading || isSaving}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center ${
                  isBalanced ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
                disabled={isLoading || isSaving || !isBalanced}
              >
                {isSaving && <ClipLoader color="#ffffff" size={16} className="mr-2" />}
                {isEditMode ? "Update" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Entry */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? "Edit Entry" : "Tambah Entry Jurnal"}
              </h2>
              <button 
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}>
              {/* Debit/Credit Selection */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Jenis Entry</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={debitType}
                      onChange={() => setDebitType(true)}
                      className="mr-2"
                    />
                    <span className="text-green-700 font-medium">Debit</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!debitType}
                      onChange={() => setDebitType(false)}
                      className="mr-2"
                    />
                    <span className="text-blue-700 font-medium">Kredit</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Akun</label>
                <Select
                  ref={selectRef}
                  options={chartOptions}
                  value={selectedChart}
                  onChange={setSelectedChart}
                  placeholder="-- Pilih Akun --"
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
                <label className="block text-gray-700 font-medium mb-2">Jumlah</label>
                <input
                  id="jumlah-input"
                  type="text"
                  value={jumlah}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    
                    const hasDecimal = inputValue.includes(',');
                    
                    if (hasDecimal) {
                      const commaCount = (inputValue.match(/,/g) || []).length;
                      if (commaCount > 1) return;
                      
                      const formatted = formatNumber(inputValue, true);
                      setJumlah(formatted);
                    } else {
                      const rawValue = inputValue.replace(/\D/g, "");
                      if (rawValue === "" || /^0+$/.test(rawValue)) {
                        setJumlah("");
                      } else {
                        const formatted = formatNumber(rawValue);
                        setJumlah(formatted);
                      }
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Masukkan Jumlah (contoh: 15.000,50)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      
                      let numericValue;
                      if (jumlah.includes(',')) {
                        numericValue = parseFloat(jumlah.replace(/\./g, "").replace(",", "."));
                      } else {
                        numericValue = parseFloat(jumlah.replace(/\./g, ""));
                      }
                      
                      if (isNaN(numericValue) || numericValue === 0) {
                        toast.warning("Jumlah tidak boleh nol atau kosong!");
                        return;
                      }
                      
                      handleAdd();
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
                  className={`w-1/2 py-2 rounded-lg transition-colors ${
                    debitType 
                      ? 'bg-green-600 hover:bg-green-500 text-white' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isEditing ? "Simpan" : `Tambah ${debitType ? 'Debit' : 'Kredit'}`}
                </button>
              </div>
              
              <div className="text-center mt-4 text-sm text-gray-500">
                <p>Tekan Enter di jumlah untuk menambahkan secara cepat</p>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded text-xs ${debitType ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    Mode: {debitType ? 'DEBIT' : 'KREDIT'}
                  </span>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}