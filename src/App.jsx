import { Routes, Route, Navigate } from "react-router-dom";
import TabelBankKeluar from "./Bank/TabelBankKeluar";
import Bank from "./Bank/Bank_keluar";
import Priview from "./Bank/Priview";
import JurnalPreview from "./Jurnal/JurnalPriview";
import Layout from "./Layout";
import Login from "./Page/Login";
import BankMasuk from "./Bank/Bank_Masuk";
import Register from "./Page/Register";
import JurnalSystem from "./Jurnal/CreateJurnal";
import Verify from "./Page/Verif";
import TabelJurnal from "./Jurnal/TabelJurnal";
import AccountingReports from "./Laporan/AccoutingReport";
import ProtectedRoute from "./ProtectedRouted";
import Dashboard from "./Page/Dashboard";
import PriviewBankMasuk from "./Bank/Priview_Bankmasuk";
import BankTransfer from "./Bank/Bank_transfer";
import LaporanBukuBesar from "./Laporan/Laporan-BukuBesar";
import LaporanJurnal from "./Laporan/Jurnal-Laporan";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />
     
     
     
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route path="pengeluaran" element={<TabelBankKeluar />} />
          <Route path="create" element={<Bank />} />
          <Route path="Dashboard" element={<Dashboard/>}/>
          <Route path="create/:id" element={<Bank />} />
          <Route path="income" element={<BankMasuk />} />
          <Route path="income/:id" element={<BankMasuk />} />
          <Route path="Jurnal" element={<JurnalSystem/>}/>
          <Route path="Jurnal/:id" element={<JurnalSystem/>}/>
          <Route path="TabelJurnal" element={<TabelJurnal />} />
          <Route path="priview" element={<Priview />} />
          <Route path="priview-bank" element={<PriviewBankMasuk />} />
          <Route path="jurnal-priview"element={<JurnalPreview/>}/>
          <Route path="laporan"element={<AccountingReports/>}/>
          <Route path="Laporan-jurnal" element={<LaporanJurnal/>}/>
          <Route path="bank-transfer" element={<BankTransfer />} />
          <Route path="bank-transfer/:id" element={<BankTransfer />} />
          <Route path="Laporan-buku" element={<LaporanBukuBesar/>}/>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
