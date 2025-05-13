import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import Select from "react-select";

export default function Bank() {
  const [bankOptions, setBankOptions] = useState([]);
  const [moneyOptions, setMoneyOptions] = useState([]);
  const selectRef = useRef(null);
  const [chartOptions, setChartOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedMoney, setSelectedMoney] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  const [textInput, setTextInput] = useState("");
  const [date, setDate] = useState("");
  const [ShowModal, setShowModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [keterangan, setKeterangan] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [data, setData] = useState([]);
  
  // Ambil ID dari parameter URL
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(!!id);
  const [transactionData, setTransactionData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dataFetched, setDataFetched] = useState(false); // Added flag to prevent multiple fetches

  // Fetch initial data for dropdowns
  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);

    // Ambil data bank
    fetch("http://localhost:8080/bank/name")
      .then((res) => res.json())
      .then((data) => setBankOptions(data.map((item) => ({
        value: item.id,
        label: item.bank_account_name,
      }))))
      .catch((err) => console.error("Error fetching bank data:", err));

    // Ambil data mata uang
    fetch("http://localhost:8080/bank/money")
      .then((res) => res.json())
      .then((data) => setMoneyOptions(data.map((item) => ({
        value: item.curr_code,
        label: item.curr_code,
      }))))
      .catch((err) => console.error("Error fetching money data:", err));

    // Ambil data chart of accounts
    fetch("http://localhost:8080/bank/chart")
      .then((res) => res.json())
      .then((data) => setChartOptions(data.map((item) => ({
        value: item.account_code,
        label: `${item.account_code} | ${item.account_name}`,
      }))))
      .catch((err) => console.error("Error fetching chart data:", err));
  }, []);

  // FIXED: Separated data fetching to prevent multiple fetches
  useEffect(() => {
    // Only fetch data once all options are loaded and we haven't fetched data yet
    if (id && chartOptions.length > 0 && bankOptions.length > 0 && moneyOptions.length > 0 && !dataFetched) {
      console.log("Fetching transaction details for ID:", id);
      setDataFetched(true); // Mark that we've started fetching
      
      // Fetch transaction details
      fetch(`http://localhost:8080/bank/transaction-detail/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
          return res.json();
        })
        .then((response) => {
          console.log("Transaction details response:", response);
          
          if (response && response.transaction) {
            const transaction = response.transaction;
            
            // Set main transaction data
            setTextInput(transaction.ref || "");
            setDate(transaction.trans_date ? transaction.trans_date.split("T")[0] : new Date().toISOString().split("T")[0]);
            
            // Set selected bank
            const selectedBank = bankOptions.find(bank => bank.value === transaction.bank_act);
            if (selectedBank) {
              console.log("Setting bank:", selectedBank);
              setSelected(selectedBank);
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
            if (response.details && response.details.length > 0) {
              processTransactionDetails(response.details);
            } else {
              // If details are null, try fetching GL transactions directly
              console.log("Details are null, fetching GL transactions directly");
              fetchGLTransactions(transaction.trans_no);
            }
            
            setTransactionData(transaction);
            setDataLoaded(true);
          }
        })
        .catch(err => {
          console.error("Error fetching transaction details:", err);
          alert(`Failed to load transaction: ${err.message}`);
        });
    }
  }, [id, chartOptions, bankOptions, moneyOptions, dataFetched]);

  // Function to fetch GL transactions when details are null
  const fetchGLTransactions = (transNo) => {
    if (!transNo) {
      console.error("No transaction number provided");
      return;
    }
    
    fetch(`http://localhost:8080/bank/gl-transactions/${transNo}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(glTransactions => {
        console.log("GL Transactions:", glTransactions);
        if (glTransactions && glTransactions.length > 0) {
          // Clear existing data before processing
          setData([]);
          processTransactionDetails(glTransactions);
        } else {
          console.error("No GL transactions found");
        }
      })
      .catch(err => {
        console.error("Error fetching GL transactions:", err);
      });
  };

  // Function to process transaction details
  const processTransactionDetails = (details) => {
    if (!details || details.length === 0) return;
    
    // Filter out bank account transactions if needed
    const detailsData = details
      .filter(detail => {
        // Skip entries with negative amounts (the bank account entry)
        const amount = parseFloat(detail.amount) || 0;
        return amount > 0;
      })
      .map(detail => {
        // Find chart option
        const chartOption = chartOptions.find(option => 
          option.value === detail.account
        );
        
        // Parse amount (make positive for expense)
        const amount = parseFloat(detail.amount) || 0;
        const positiveAmount = Math.abs(amount);
        
        return {
          id: detail.id || new Date().getTime() + Math.random(),
          akunBiaya: chartOption ? chartOption.label : `${detail.account}`,
          keterangan: detail.memo || "",
          jumlah: positiveAmount,
          selectedChart: chartOption || { 
            value: detail.account, 
            label: `${detail.account}` 
          }
        };
      });
    
    console.log("Processed details:", detailsData);
    setData(detailsData);
  };

  const handleAdd = () => {
    const cleanJumlah = parseFloat(parseNumber(jumlah));
    if (!selectedChart || !keterangan || !jumlah) {
      alert("Harap lengkapi semua field akun biaya, keterangan, dan jumlah!");
      return;
    }

    if (isEditing && editingId !== null) {
      setData(prev => prev.map(item => 
        item.id === editingId 
          ? { ...item, akunBiaya: selectedChart.label, keterangan, jumlah: cleanJumlah, selectedChart }
          : item
      ));
    } else {
      setData(prev => [
        ...prev,
        {
          id: new Date().getTime(),
          akunBiaya: selectedChart.label,
          keterangan,
          jumlah: cleanJumlah,
          selectedChart,
        }
      ]);
    }

    resetForm();
    setShowModal(false);
  };

  // Penanganan submit form yang ditingkatkan
  const handleSubmit = async () => {
    // Validasi agar semua field harus terisi
    if (!selected || !selectedMoney || !textInput || !date) {
      alert("Harap lengkapi semua field!");
      return;
    }

    // Pastikan ada detail biaya
    if (data.length === 0) {
      alert("Harap tambahkan minimal satu detail biaya!");
      return;
    }

    // Siapkan data untuk dikirim
    const acc = data.map(item => item.selectedChart.value); // Ambil account_code dari selectedChart
    const jumlahPerAccount = data.map(item => item.jumlah.toString());
    const keteranganArray = data.map(item => item.keterangan); // Tambahkan array keterangan
    const total = data.reduce((acc, item) => acc + item.jumlah, 0);

    const transactionData = {
      bank_act: Number(selected.value),
      curr_code: selectedMoney.value,
      account: acc,
      jumlah: jumlahPerAccount,
      keterangan: keteranganArray, // Kirim keterangan ke backend
      ref: textInput,
      trans_date: date,
      amount: total.toString(),
    };

    console.log("Sending data:", transactionData);

    try {
      let url = "http://localhost:8080/bank/Transaction";
      let method = "POST";
      
      // Jika mode edit, gunakan endpoint PUT
      if (isEditMode && id) {
        url = `http://localhost:8080/bank/Transaction/${id}`;
        method = "PUT";
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${isEditMode ? "Gagal memperbarui data transaksi" : "Gagal menyimpan data transaksi"}: ${errorText}`);
      }

      const result = await response.json();
      console.log(isEditMode ? "Data berhasil diperbarui:" : "Data berhasil disimpan:", result);
      alert(isEditMode ? "Transaksi berhasil diperbarui!" : "Transaksi berhasil dikirim!");
      navigate("/priview", { state: { transactionData } });
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Terjadi kesalahan saat mengirim data");
    }
  };

  const handleDelete = (id) => {
    // Menghapus item dengan id yang sesuai
    const newData = data.filter(item => item.id !== id);
    setData(newData);
  };

  // Fungsi untuk memformat angka ke format ribuan dengan titik
  const formatNumber = (value) => {
    return value.replace(/\D/g, '')  // Hanya angka
                .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Fungsi untuk membersihkan titik sebelum disimpan
  const parseNumber = (value) => {
    return value.replace(/\./g, '');
  };

  const handleCancel = () => {
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setSelectedChart(null);
    setKeterangan("");
    setJumlah("");
    setEditingId(null);
    setIsEditing(false);
    selectRef.current?.focus();
  };

  const total = data.reduce((acc, item) => acc + item.jumlah, 0);

  return (
    <div className="bg-blue-50 min-h-screen flex flex-col items-center pt-10 w-full">
      {/* Form Kas Keluar */}
      <div className="w-full max-w-6xl bg-white p-6 rounded-lg shadow-lg mb-6">
        <h1 className="font-bold text-xl text-center mb-6">
          {isEditMode ? "Edit Transaksi Bank" : "Kas Keluar"}
        </h1>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="w-[250px]">
            <label className="block text-lg font-medium text-gray-700 mb-2 text-left">Pilih Bank</label>
            <Select
              options={bankOptions}
              value={selected}
              onChange={setSelected}
              placeholder="-- Pilih Bank --"
              isClearable
            />
          </div>
          <div className="w-[250px]">
            <label className="block text-lg font-medium text-gray-700 mb-2 text-left">Pilih Uang</label>
            <Select
              options={moneyOptions}
              value={selectedMoney}
              onChange={setSelectedMoney}
              placeholder="-- Pilih Uang --"
              isClearable
            />
          </div>
          <div className="w-[250px] ">
            <label className="block text-lg font-medium text-gray-700 mb-2 text-left">No Referensi</label>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg h-[38px]"
              placeholder="Masukkan No Referensi"
            />
          </div>
          <div className="w-[200px]">
            <label className="block text-lg font-medium text-gray-700 mb-2 text-left">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg h-[38px]"
            />
          </div>
        </div>
      </div>
      <div className="relative">
        {/* Tombol Tambah Biaya */}
        <button
          onClick={() => setShowModal(true)}
          className="absolute right-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg"
        >
          + Tambah Biaya
        </button>

        {/* Table showing expense details */}
        <div className="w-full max-w-6xl min-w-[1152px] bg-white p-6 rounded-lg shadow-lg mt-16">
          <h2 className="text-lg font-bold mb-4">Detail Biaya</h2>

          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-left border border-gray-300 mb-4">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="p-3 border">Akun Biaya</th>
                  <th className="p-3 border">Keterangan</th>
                  <th className="p-3 border">Jumlah</th>
                  <th className="p-3 border">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr
                    key={i}
                    onClick={() => {
                      setSelectedChart(item.selectedChart);
                      setKeterangan(item.keterangan);
                      setJumlah(item.jumlah.toLocaleString('id-ID').replace(/,/g, '.'));
                      setEditingId(item.id);
                      setIsEditing(true);
                      setShowModal(true);
                    }}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <td className="p-3 border">{item.akunBiaya}</td>
                    <td className="p-3 border">{item.keterangan}</td>
                    <td className="p-3 border">{item.jumlah.toLocaleString('id-ID').replace(/,/g, '.')}</td>
                    <td className="p-3 border text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleDelete(item.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-lg font-semibold">
              Total: <span className="text-blue-700">{total.toLocaleString('id-ID').replace(/,/g, '.')}</span>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="bg-gray-500 text-white px-5 py-2 rounded hover:bg-gray-600 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
              >
                {isEditMode ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Biaya */}
      {ShowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-center">
              {isEditing ? "Edit Biaya" : "Tambah Biaya"}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}>
              <div className="mb-4">
                <label className="block text-lg font-medium text-gray-700 mb-2">Akun Biaya</label>
                <Select
                  ref={selectRef}
                  options={chartOptions}
                  value={selectedChart}
                  onChange={setSelectedChart}
                  placeholder="-- Pilih Akun --"
                  isClearable
                />
              </div>
              <div className="mb-4">
                <label className="block text-lg font-medium text-gray-700 mb-2">Keterangan</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Masukkan Keterangan"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("jumlah-input")?.focus();
                    }
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="block text-lg font-medium text-gray-700 mb-2">Jumlah</label>
                <input
                  id="jumlah-input"
                  type="text"
                  value={jumlah}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, "");
                    if (rawValue === "" || /^0+$/.test(rawValue)) {
                      setJumlah("");
                    } else {
                      const formatted = formatNumber(rawValue);
                      setJumlah(formatted);
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Masukkan Jumlah"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const rawValue = jumlah.replace(/\D/g, "");
                      if (rawValue === "" || /^0+$/.test(rawValue)) {
                        alert("Jumlah tidak boleh nol atau kosong!");
                        return;
                      }
                      handleAdd();
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
                >
                  {isEditing ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}