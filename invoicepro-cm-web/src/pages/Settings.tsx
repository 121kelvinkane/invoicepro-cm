import BusinessProfileCard from "../components/BusinessProfileCard";
import { useEffect, useState } from "react";
import { api, getToken } from "../lib/api";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { Upload, Crown, Check, Building2, CreditCard, User } from "lucide-react";

export default function Settings() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");
      const res = await api("/profile");
      setProfile(res.profile || {});
      setUser({ fullName: res.fullName, email: res.email, createdAt: res.createdAt });
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
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
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${apiUrl}/profile/logo`, {
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <h2 className="text-lg font-bold mb-2">{t("settings.errorTitle")}</h2>
            <p>{error}</p>
            <button
              onClick={loadProfile}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t("settings.tryAgain")}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  

  const isPro = profile.plan === "PRO";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
          <p className="text-gray-500 mt-1">{t("settings.subtitle")}</p>
        </div>

        {msg && (
          <div className={`mb-6 p-4 rounded-lg ${msgType === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {msg}
          </div>
        )}

        {/* Account Information Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card mb-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
              <User className="text-blue-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
              <p className="text-base text-gray-900 font-medium">{user?.fullName || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
              <p className="text-base text-gray-900 font-medium">{user?.email || "N/A"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
              <p className="text-base text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>
        </div>

        <BusinessProfileCard />

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Subscription Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
            <div className="flex items-center mb-6">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${isPro ? "bg-yellow-100" : "bg-gray-100"}`}>
                <Crown className={isPro ? "text-yellow-600" : "text-gray-400"} size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t("settings.subscription")}</h2>
                <p className="text-sm text-gray-500">{t("settings.upgradeText")}</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg mb-6 ${isPro ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 border border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg">{isPro ? "PRO ✨" : "FREE"}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isPro ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                  {isPro ? t("settings.active") : t("settings.current")}
                </span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={14} className="mr-2 text-green-500" />
                  {isPro ? t("settings.noWatermark") : t("settings.watermark")}
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={14} className="mr-2 text-green-500" />
                  {t("settings.customLogo")}
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check size={14} className="mr-2 text-green-500" />
                  {isPro ? t("settings.prioritySupport") : t("settings.standardSupport")}
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
              {isPro ? t("settings.downgradeToFree") : t("settings.upgradeToPro")}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
