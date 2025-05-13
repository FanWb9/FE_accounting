import { Routes, Route } from "react-router-dom";
import TabelBankKeluar from "./Bank/TabelBankKeluar";
import Bank from "./Bank/Bank_keluar";
import Priview from "./Bank/Priview";
import Layout from "./Layout";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<TabelBankKeluar />} /> {/* path="/" */}
        <Route path="create" element={<Bank />} />
         <Route path="/create/:id" element={<Bank />} />
        <Route path="priview" element={<Priview />} />
      </Route>
    </Routes>
  );
}

export default App;
