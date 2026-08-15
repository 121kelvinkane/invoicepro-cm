import { useEffect, useState } from "react";
import { api, getToken } from "../lib/api";
import Layout from "../components/Layout";
import { Upload, Crown, Check, Building2, CreditCard } from "lucide-react";

export default function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  async function loadProfile() {
    const res = await api("/profile");
    setProfile(res.profile);
  }

  useEffect(() => { loadProfile(); }, []);

  async function handleUpload(e: any) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMsg("");

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}/profile/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg("Logo uploaded successfully!");
      setMsgType("success");
      await loadProfile();
    } catch (err: any) {
      setMsg("Error: " + err.message);
      setMsgType("error");
    } finally {
      setUploading(false);
    }
  }

  async function togglePlan() {
    try {
      await api("/profile/toggle-plan", { method: "POST" });
      await loadProfile();
    } catch (err: any) {
      setMsg("Error: " + err.message);
      setMsgType("error");
    }
  }

  if (!profile) return <Layout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div></Layout>;

  const isPro = profile.plan === "PRO";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your business profile and subscription.</p>
        </div>

        {/* Message */}
        {msg && (
          <div className={`mb-6 p-4 rounded-lg ${msgType === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logo Upload Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                <Building2 className="text-primary-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Business Logo</h2>
                <p className="text-sm text-gray-500">Upload your company logo for invoices.</p>
              </div>
            </div>

            {profile.logoUrl && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-center">
                <img src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/${profile.logoUrl}`} alt="Logo" className="h-20 object-contain" />
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">Click to upload or drag and drop</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Browse files
                </label>
              </div>
              <button
                disabled={uploading || !file}
                className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {uploading ? "Uploading..." : "Upload Logo"}
              </button>
            </form>
          </div>

          {/* Subscription Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
            <div className="flex items-center mb-6">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${isPro ? "bg-yellow-100" : "bg-gray-100"}`}>
                <Crown className={isPro ? "text-yellow-600" : "text-gray-400"} size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Subscription Plan</h2>
                <p className="text-sm text-gray-500">Upgrade to unlock premium features.</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg mb-6 ${isPro ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 border border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg">{isPro ? "PRO ✨" : "FREE"}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isPro ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                  {isPro ? "Active" : "Current"}
                </span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={14} className="mr-2 text-green-500" />
                  {isPro ? "No watermarks on PDFs" : "Watermark on PDFs"}
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={14} className="mr-2 text-green-500" />
                  {isPro ? "Custom business logo" : "Custom business logo"}
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={14} className="mr-2 text-green-500" />
                  {isPro ? "Priority support" : "Standard support"}
                </li>
              </ul>
            </div>

            <button
              onClick={togglePlan}
              className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${
                isPro
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
              }`}
            >
              {isPro ? "Downgrade to Free" : "Upgrade to Pro"}
            </button>
          </div>
        </div>

        {/* Business Profile Card */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={profile.businessName || ""}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={profile.phone || ""}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profile.email || ""}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={profile.city || ""}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                readOnly
              />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">To edit your business profile, please contact support.</p>
        </div>
      </div>
    </Layout>
  );
}