import { Routes, Route, Navigate } from "react-router-dom";
import TabelBankKeluar from "./Bank/TabelBankKeluar";
import Bank from "./Bank/Bank_keluar";
import Priview from "./Bank/Priview";
import Layout from "./Layout";
import Login from "./Page/Login";
import BankMasuk from "./Bank/Bank_Masuk";
import Register from "./Page/Register";
import Verify from "./Page/Verif";
import ProtectedRoute from "./ProtectedRouted";

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
          <Route path="create/:id" element={<Bank />} />
          <Route path="income" element={<BankMasuk />} />
          <Route path="income/:id" element={<BankMasuk />} />
          <Route path="priview" element={<Priview />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
