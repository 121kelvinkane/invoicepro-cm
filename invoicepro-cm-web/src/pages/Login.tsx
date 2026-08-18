import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken } from "../lib/api";
import { FileText, Mail, Lock, ArrowRight, Eye, EyeOff, CreditCard, WifiOff, User, Check } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function doLogin(loginEmail: string, loginPassword: string) {
    setLoading(true);
    setError("");
    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      setToken(res.token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    await doLogin(email, password);
  }

  async function handleDemo() {
    await doLogin("demo@invoicepro.cm", "Demo1234");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12">
        <div className="max-w-md">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center mr-4">
              <FileText size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">InvoicePro CM</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Professional invoicing for Cameroon
          </h1>
          <p className="text-gray-300 text-lg mb-8">
            Create beautiful invoices, accept Mobile Money payments, and get paid faster. Built specifically for Cameroonian freelancers and businesses.
          </p>
          <div className="space-y-4">
            <div className="flex items-center text-gray-300">
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-primary-400"><Check size={16} /></span>
              </div>
              Accept MTN & Orange Money payments
            </div>
            <div className="flex items-center text-gray-300">
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-primary-400"><Check size={16} /></span>
              </div>
              Generate professional PDF invoices
            </div>
            <div className="flex items-center text-gray-300">
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-primary-400"><Check size={16} /></span>
              </div>
              Track payments and send reminders
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
            <div className="text-center mb-8">
              <div className="lg:hidden flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                  <FileText size={24} className="text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-2">Sign in to manage your invoices</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="you@example.com"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center mt-6"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </button>

              {/* Demo Account Button */}
              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                className="w-full py-3 mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 flex items-center justify-center"
              >
                <User size={18} className="mr-2" />
                Try Demo Account
              </button>
            </form>

            {/* Trust Badges */}
            <div className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-6">
              <span className="flex items-center"><Lock size={14} className="mr-1" /> Secure</span>
              <span className="flex items-center"><CreditCard size={14} className="mr-1" /> MoMo Ready</span>
              <span className="flex items-center"><WifiOff size={14} className="mr-1" /> Offline Support</span>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-500">
                Don't have an account?{" "}
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Forgot password?</Link>
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
