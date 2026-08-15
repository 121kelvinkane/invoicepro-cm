import { Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./lib/api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceDetails from "./pages/InvoiceDetails";
import PublicInvoice from "./pages/PublicInvoice";
import Settings from "./pages/Settings";

function Private({ children }: any) {
  return getToken() ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={getToken() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
      <Route path="/customers" element={<Private><Customers /></Private>} />
      <Route path="/invoices" element={<Private><Invoices /></Private>} />
      <Route path="/invoices/new" element={<Private><CreateInvoice /></Private>} />
      <Route path="/invoices/:id/edit" element={<Private><CreateInvoice /></Private>} />
      <Route path="/invoices/:id" element={<Private><InvoiceDetails /></Private>} />
      
      <Route path="/settings" element={<Private><Settings /></Private>} />

      <Route path="/i/:token" element={<PublicInvoice />} />
    </Routes>
  );
}