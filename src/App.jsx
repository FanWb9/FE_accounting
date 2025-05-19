import { Routes, Route } from "react-router-dom";
import TabelBankKeluar from "./Bank/TabelBankKeluar";
import Bank from "./Bank/Bank_keluar";
import Priview from "./Bank/Priview";
import Layout from "./Layout";
import Login from "./Page/Login";
import BankMasuk from "./Bank/Bank_Masuk";

function App() {
  return (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
        <Route index element={<TabelBankKeluar />} /> 
        <Route path="create" element={<Bank />} />
        <Route path="/create/:id" element={<Bank />} />
        <Route path="income" element={<BankMasuk />} /> 
        <Route path="income/:id" element={<BankMasuk />} /> 
        <Route path="priview" element={<Priview />} />
      </Route>
    </Routes>
  );
}

export default App;
