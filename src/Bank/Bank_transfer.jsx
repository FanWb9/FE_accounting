import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import Select from "react-select";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";

export default function BankTransfer() {
  const [bankOptions, setBankOptions] = useState([]);
  const [cabangOptions, setCabangOptions] = useState([]);
  const [bankFrom, setBankFrom] = useState(null);
  const [bankTo, setBankTo] = useState(null);
  const [proyekFrom, setProyekFrom] = useState(null);
  const [proyekTo, setProyekTo] = useState(null);
  const [amount, setAmount] = useState("");
  const [transDate, setTransDate] = useState("");
  const [ref, setRef] = useState("");
  const [ket, setKet] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(!!id);

  const API_URL = "http://localhost:8080";

  // Fetch initial data for dropdowns
  useEffect(() => {
    setTransDate(new Date().toISOString().split("T")[0]);
    setIsLoading(true);

    Promise.all([
      axios.get(`${API_URL}/bank/name`),
      axios.get(`${API_URL}/jurnal/Cabang`)
    ]).then(([bankRes, cabangRes]) => {
      // Process bank data
      setBankOptions(bankRes.data.map((item) => ({
        value: item.id,
        label: item.bank_account_name,
      })));

      // Process cabang/proyek data
      setCabangOptions(cabangRes.data.map((item) => ({
        value: item.dep_code,
        label: item.dep_name,
      })));

      setIsLoading(false);
    }).catch((err) => {
      console.error("Error fetching initial data:", err);
      toast.error("Gagal memuat data. Silakan coba lagi.");
      setIsLoading(false);
    });
  }, []);

  // Format number with dots as thousand separator
  const formatNumber = (value, hasDecimal = false) => {
    if (!hasDecimal) {
      return value.replace(/\D/g, '')
                  .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } else {
      const parts = value.split(',');
      const integerPart = parts[0].replace(/\D/g, '')
                             .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      if (parts.length > 1) {
        const decimalPart = parts[1].replace(/\D/g, '').substring(0, 2);
        return integerPart + ',' + decimalPart;
      }
      
      return integerPart;
    }
  };

  // Parse formatted number to float
  const parseFormattedNumber = (value) => {
    if (value.includes(',')) {
      return parseFloat(value.replace(/\./g, "").replace(",", "."));
    } else {
      return parseFloat(value.replace(/\./g, ""));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!bankFrom || !bankTo || !proyekFrom || !proyekTo || !amount || !transDate) {
      toast.warning("Harap lengkapi semua field yang wajib diisi!");
      return;
    }

    if (bankFrom.value === bankTo.value) {
      toast.warning("Bank asal dan bank tujuan tidak boleh sama!");
      return;
    }

    const numericAmount = parseFormattedNumber(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.warning("Jumlah transfer harus lebih dari 0!");
      return;
    }

    // Prepare data to be sent
    const transferData = {
      bank_from: bankFrom.value,
      bank_to: bankTo.value,
      proyek_from: proyekFrom.value,
      proyek_to: proyekTo.value,
      amount: numericAmount,
      trans_date: transDate,
      ref: ref,
      ket: ket
    };

    console.log("Sending transfer data:", transferData);
    setIsSaving(true);

    try {
      let url = `${API_URL}/transfer/bank-transfer`;
      let method = "post";

      // If in edit mode, use PUT endpoint
      if (isEditMode && id) {
        url = `${API_URL}/transfer-update/${id}`;
        method = "put";
      }

      const response = await axios[method](url, transferData);
      console.log(isEditMode ? "Transfer berhasil diperbarui:" : "Transfer berhasil:", response.data);
      toast.success(isEditMode ? "Transfer berhasil diperbarui!" : "Transfer berhasil diproses!");

      // Navigate after a short delay to show the success message
      setTimeout(() => {
        setIsSaving(false);
        navigate("/bank-transactions");
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      setIsSaving(false);

      if (error.response) {
        if (error.response.status === 400) {
          console.error("400 Error details:", error.response.data);
          
          if (error.response.data?.error === "Reference number already exists for this type") {
            toast.error("Nomor referensi sudah digunakan! Harap gunakan nomor referensi yang berbeda.");
          } else if (error.response.data?.error?.includes("tidak ditemukan")) {
            toast.error(error.response.data.error);
          } else {
            toast.error("Terjadi kesalahan pada input data. Silakan periksa kembali.");
          }
        } else {
          toast.error("Terjadi kesalahan saat memproses transfer. Silakan coba lagi.");
        }
      } else {
        toast.error("Koneksi terputus. Silakan periksa koneksi internet Anda.");
      }
    }
  };

  // Reset form
  const handleReset = () => {
    setBankFrom(null);
    setBankTo(null);
    setProyekFrom(null);
    setProyekTo(null);
    setAmount("");
    setRef("");
    setKet("");
    setTransDate(new Date().toISOString().split("T")[0]);
  };

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
        <p className="mt-4 text-xl font-medium text-blue-600">Memproses Transfer...</p>
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
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h1 className="text-2xl font-bold text-center flex items-center justify-center">
            <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
            {isEditMode ? "Edit Transfer Bank" : "Transfer Antar Bank"}
          </h1>
        </div>
        
        {/* Form Content */}
        <div className="p-8">
          {/* Transfer From Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                1
              </div>
              Dari (Pengirim)
            </h2>
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Bank Asal <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={bankOptions}
                    value={bankFrom}
                    onChange={setBankFrom}
                    placeholder="-- Pilih Bank Asal --"
                    isClearable
                    isDisabled={isLoading}
                    className="text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Proyek/Cabang Asal <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={cabangOptions}
                    value={proyekFrom}
                    onChange={setProyekFrom}
                    placeholder="-- Pilih Proyek/Cabang Asal --"
                    isClearable
                    isDisabled={isLoading}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transfer To Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                2
              </div>
              Ke (Penerima)
            </h2>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Bank Tujuan <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={bankOptions}
                    value={bankTo}
                    onChange={setBankTo}
                    placeholder="-- Pilih Bank Tujuan --"
                    isClearable
                    isDisabled={isLoading}
                    className="text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Proyek/Cabang Tujuan <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={cabangOptions}
                    value={proyekTo}
                    onChange={setProyekTo}
                    placeholder="-- Pilih Proyek/Cabang Tujuan --"
                    isClearable
                    isDisabled={isLoading}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Details Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                3
              </div>
              Detail Transfer
            </h2>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Jumlah Transfer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const hasDecimal = inputValue.includes(',');
                      
                      if (hasDecimal) {
                        const commaCount = (inputValue.match(/,/g) || []).length;
                        if (commaCount > 1) return;
                        
                        const formatted = formatNumber(inputValue, true);
                        setAmount(formatted);
                      } else {
                        const rawValue = inputValue.replace(/\D/g, "");
                        if (rawValue === "" || /^0+$/.test(rawValue)) {
                          setAmount("");
                        } else {
                          const formatted = formatNumber(rawValue);
                          setAmount(formatted);
                        }
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan jumlah (contoh: 1.000.000,00)"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Tanggal Transfer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={transDate}
                    onChange={(e) => setTransDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">No Referensi</label>
                  <input
                    type="text"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan nomor referensi (opsional)"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Keterangan</label>
                  <textarea
                    value={ket}
                    onChange={(e) => setKet(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan keterangan transfer (opsional)"
                    rows="3"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate("/pengeluaran")}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                disabled={isLoading || isSaving}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Kembali
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                disabled={isLoading || isSaving}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Reset
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors flex items-center font-semibold"
              disabled={isLoading || isSaving}
            >
              {isSaving && <ClipLoader color="#ffffff" size={16} className="mr-2" />}
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
              {isEditMode ? "Update Transfer" : "Proses Transfer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}