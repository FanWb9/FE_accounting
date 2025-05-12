import React, { useEffect, useState,useRef } from "react";
import Select from "react-select";
import { Trash2 } from 'lucide-react';

export default function Bank() {
  const [bankOptions, setBankOptions] = useState([]);
  const [moneyOptions, setMoneyOptions] = useState([]);
  const selectRef = useRef(null);
  const [chartOptions, setChartOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedMoney, setSelectedMoney] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [date, setDate] = useState("");
  const keteranganRef = useRef(null);
  const [ShowModal, setShowModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [keterangan, setKeterangan] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);

    fetch("http://localhost:8080/bank/name")
      .then((res) => res.json())
      .then((data) => setBankOptions(data.map((item) => ({
        value: item.id,
        label: item.bank_account_name,
      }))))
      .catch((err) => console.error("Error fetching bank data:", err));

    fetch("http://localhost:8080/bank/money")
      .then((res) => res.json())
      .then((data) => setMoneyOptions(data.map((item) => ({
        value: item.curr_code,
        label: item.curr_code,
      }))))
      .catch((err) => console.error("Error fetching money data:", err));

    fetch("http://localhost:8080/bank/chart")
      .then((res) => res.json())
      .then((data) => setChartOptions(data.map((item) => ({
        value: item.account_code,
        label: `${item.account_code} | ${item.account_name}`,
      }))))
      .catch((err) => console.error("Error fetching chart data:", err));
  }, []);

   const handleAdd = () => {
  const cleanJumlah = parseFloat(parseNumber(jumlah));
  if (!selectedChart || !keterangan || !jumlah) return;

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
};

const handleSubmit = async () => {
  // Validasi agar semua field harus terisi
  if (!selected || !selectedMoney || !textInput || !date) {
    alert("Harap lengkapi semua field!");
    return;
  }

  const acc = data.map(item => item.akunBiaya.split('|')[0].trim()); // Ini array of string
  
  const jumlahPerAccount = data.map(item => item.jumlah.toString());


  try {
    const response = await fetch("http://localhost:8080/bank/Transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      bank_act: Number(selected.value),
      curr_code: selectedMoney.value,
      account: acc,
      jumlah: jumlahPerAccount,
      ref: textInput,
      trans_date: date,
      amount: total.toString(), 
      }),

    });

    if (!response.ok) {
      throw new Error("Gagal menyimpan data transaksi");
    }

    const result = await response.json();
    console.log("Data berhasil disimpan:", result);
    alert("Transaksi berhasil dikirim!");
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan saat mengirim data");
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
        <h1 className="font-bold text-xl text-center mb-6">Kas Keluar</h1>
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
            className="absolute right-6  bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg"
          >
            + Tambah Biaya
          </button>

          {/* Tabel Detail Biaya */}
          <div className="w-full max-w-6xl min-w-[1152px] bg-white p-6 rounded-lg shadow-lg mt-16">
            <h2 className="text-lg font-bold mb-4">Detail Biaya</h2>

            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border border-gray-300 mb-4">
                  <thead className="sticky top-0 bg-gray-100 z-10">
                    <tr>
                      <th className="p-3 border">Akun Biaya</th>
                      <th className="p-3 border">Keterangan</th>
                      <th className="p-3 border">Jumlah</th>
                      <th className="p-3 border text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => (
                      <tr
                        key={i}
                        onClick={() => {
                          setSelectedChart(item.selectedChart);
                          setKeterangan(item.keterangan);
                          setJumlah(item.jumlah.toLocaleString('id-ID'));
                          setEditingId(item.id);
                          setIsEditing(true);
                          setShowModal(true);
                        }}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        <td className="p-3 border">{item.akunBiaya}</td>
                        <td className="p-3 border">{item.keterangan}</td>
                        <td className="p-3 border">{item.jumlah.toLocaleString('id-ID')}</td>
                        <td className="p-3 border text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // agar tidak trigger edit saat klik delete
                              handleDelete(item.id);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-lg font-semibold">
                Total: <span className="text-blue-700">{total.toLocaleString('id-ID')}</span>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>

        </div>


      {/* Modal Tambah Biaya */}
      {ShowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-center">Tambah Biaya</h2>
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
                        document.getElementById("jumlah-input")?.focus(); // Fokus ke input jumlah
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
                        const rawValue = e.target.value.replace(/\D/g, ""); // Ambil hanya angka
                        if (rawValue === "" || /^0+$/.test(rawValue)) {
                          setJumlah(""); // Reset jika hanya nol atau kosong
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
                          const rawValue = jumlah.replace(/\D/g, ""); // Ambil angka saja
                          if (rawValue === "" || /^0+$/.test(rawValue)) {
                            alert("Jumlah tidak boleh nol atau kosong!");
                            return;
                          }
                          handleAdd(); // Submit jika valid
                        }
                      }}
                    />
                  </div>



              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
   
    </div>
  );
}
