import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../lib/api";

export default function Layout({ children }: any) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="font-bold text-lg">InvoicePro CM</div>

          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link className="hover:underline" to="/dashboard">Dashboard</Link>
            <Link className="hover:underline" to="/invoices">Invoices</Link>
            <Link className="hover:underline" to="/customers">Customers</Link>
            
            <Link className="hover:underline text-blue-600 font-bold" to="/settings">
              Settings
            </Link>
            
            <Link className="hover:underline" to="/invoices/new">Create Invoice</Link>
            
            <button
              className="text-red-600 hover:underline"
              onClick={() => {
                clearToken();
                navigate("/login");
              }}
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}