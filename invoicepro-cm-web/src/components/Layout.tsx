import LanguageSwitcher from "./LanguageSwitcher";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearToken } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { LayoutDashboard, FileText, Users, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/invoices", labelKey: "nav.invoices", icon: FileText },
  { to: "/customers", labelKey: "nav.customers", icon: Users },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

export default function Layout({ children }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for Desktop - STICKY! */}
      <aside className="hidden md:flex md:flex-shrink-0 sticky top-0 h-screen">
        <div className="flex flex-col w-64 bg-gray-900 text-white">
          {/* Logo - FIXED at top */}
          <div className="flex items-center h-16 px-6 border-b border-gray-800 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center mr-3">
              <FileText size={18} />
            </div>
            <span className="text-lg font-bold">InvoicePro CM</span>
          </div>

          {/* Navigation - SCROLLS INTERNALLY */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary-600 text-white shadow-glow"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <Icon size={18} className="mr-3" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          {/* Language Switcher + Logout - FIXED at bottom */}
          <div className="p-3 border-t border-gray-800 space-y-1 flex-shrink-0">
            <div className="flex items-center justify-center py-2">
              <LanguageSwitcher />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-400 rounded-lg hover:text-red-400 hover:bg-gray-800 transition-all duration-200"
            >
              <LogOut size={18} className="mr-3" />
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4 flex-shrink-0">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <span className="ml-4 text-lg font-bold text-gray-900">InvoicePro CM</span>
          </div>
          <LanguageSwitcher />
        </header>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
            <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-gray-900 text-white animate-slide-up">
              <div className="flex items-center h-16 px-6 border-b border-gray-800 flex-shrink-0">
                <span className="text-lg font-bold">InvoicePro CM</span>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
                        location.pathname === item.to
                          ? "bg-primary-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      <Icon size={18} className="mr-3" />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </nav>
              {/* ADDED: Language Switcher + Logout for mobile */}
              <div className="p-3 border-t border-gray-800 space-y-1 flex-shrink-0">
                <div className="flex items-center justify-center py-2">
                  <LanguageSwitcher />
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setSidebarOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-400 rounded-lg hover:text-red-400 hover:bg-gray-800 transition-all duration-200"
                >
                  <LogOut size={18} className="mr-3" />
                  {t("nav.logout")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8 animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
