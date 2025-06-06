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
import TabelProduk from "./Produk/TabelProdukKeluar";
import ProdukKeluar from "./Produk/Stok_Keluar";
import ProdukMasuk from "./Produk/Stok_masuk";
import Previewout from "./Produk/previewout";
import Previewin from "./Produk/Previewin";
import MasterDashboard from "./Master/DashboardMaster";
import TabelPenjualan from "./Sales/Tabel_Penjualan";
import Sales from "./Sales/Sales_Invoice";
import SalesOrder from "./Sales/Sales_Order";
import PreviewInvoice from "./Sales/PreviewInvoice";
import PreviewOrder from "./Sales/Previeworder";

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
          <Route path="laporanBuku" element={<LaporanBukuBesar/>}/>

          <Route path="produk" element={<TabelProduk/>}/>
          <Route path="StokKeluar" element={<ProdukKeluar />} />
          <Route path="StokKeluar/:id" element={<ProdukKeluar />} />
          <Route path="StokMasuk" element={<ProdukMasuk />} />
          <Route path="StokMasuk/:id" element={<ProdukMasuk />} />

          <Route path="sales" element={<TabelPenjualan/>}/>
          <Route path="SalesInvoice" element={<Sales />} />
          <Route path="SalesInvoice/:id" element={<Sales />} />
          <Route path="SalesOrder" element={<SalesOrder />} />
          <Route path="SalesOrder/:id" element={<SalesOrder />} />

          <Route path="previewout" element={<Previewout />} />
          <Route path="previewin" element={<Previewin />} />
          <Route path="previewinvoice" element={<PreviewInvoice />} />
          <Route path="previeworder" element={<PreviewOrder />} />


          <Route path="master" element={<MasterDashboard/>}/>

        </Route>
      </Route>
    </Routes>
  );
}

export default App;
