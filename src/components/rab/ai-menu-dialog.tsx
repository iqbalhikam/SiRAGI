"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  X,
  Loader2,
  AlertCircle,
  KeyRound,
  Cpu,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { MenuInput, SatuanBahan } from "@/types/rab";

interface AiMenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPopulateMenus: (menus: MenuInput[]) => void;
}

const AVAILABLE_MODELS = [
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    tag: "Terbaru & Cepat",
    desc: "Model generasi 3.5 paling mutakhir, sangat cepat, dan efisien",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    tag: "Stabil",
    desc: "Cerdas, seimbang, & efisien untuk perancangan menu harian",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    tag: "Penalaran Tinggi",
    desc: "Analisis nutrisi dan perhitungan bahan lebih mendalam",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    tag: "Ringan",
    desc: "Model cepat generasi sebelumnya",
  },
];

const PROMPT_PRESETS = [
  "Buatkan RAB menu gizi balita tinggi protein untuk 1 hari (3 kali makan + 1 selingan sehat).",
  "RAB menu makanan lansia rendah garam, lembut, dan kaya kalsium untuk 50 porsi.",
  "Menu makan siang karyawan sehat 4 sehat 5 sempurna dengan budget hemat namun bergizi.",
  "RAB menu pemulihan gizi buruk / stunting dengan protein hewani ganda.",
];

export function AiMenuDialog({
  isOpen,
  onClose,
  onPopulateMenus,
}: AiMenuDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash-lite");
  const [customModel, setCustomModel] = useState("");
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved API key from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("siragi_gemini_api_key");
      if (savedKey) {
        setApiKey(savedKey);
        setShowApiKeyInput(true);
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (!prompt.trim()) {
      setError("Silakan tulis instruksi menu gizi yang diinginkan.");
      return;
    }

    setLoading(true);
    setError(null);

    const modelToUse = useCustomModel && customModel.trim() ? customModel.trim() : selectedModel;

    try {
      // Save API key to localStorage if user provided one
      if (apiKey.trim()) {
        localStorage.setItem("siragi_gemini_api_key", apiKey.trim());
      }

      const res = await fetch("/api/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: modelToUse,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menghasilkan rancangan menu dengan AI.");
      }

      const generatedList = data.menuList || [];
      if (!Array.isArray(generatedList) || generatedList.length === 0) {
        throw new Error("AI tidak menghasilkan daftar menu yang valid.");
      }

      // Map response to MenuInput structure with unique IDs
      const mappedMenus: MenuInput[] = generatedList.map((item: any, mIdx: number) => ({
        id: `m-ai-${Date.now()}-${mIdx + 1}`,
        namaMenu: item.namaMenu || `Menu #${mIdx + 1}`,
        bahanList: Array.isArray(item.bahan)
          ? item.bahan.map((b: any, bIdx: number) => ({
              id: `b-ai-${Date.now()}-${mIdx + 1}-${bIdx + 1}`,
              uraianBahan: b.uraian || "",
              kuantitas: typeof b.kuantitas === "number" ? b.kuantitas : Number(b.kuantitas) || 1,
              satuan: (b.satuan as SatuanBahan) || "kg",
              keterangan: b.keterangan || "",
            }))
          : [],
      }));

      // Populate form
      onPopulateMenus(mappedMenus);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memproses AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-indigo-500/25">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Asisten AI Perancang Menu Gizi
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                  Gemini API
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ketik kebutuhan menu & target gizi, AI akan menyusun daftar menu dan rincian bahan secara instan.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="mt-5 space-y-5">
          {/* Prompt Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Instruksi / Prompt Perancangan Menu
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Contoh: Buatkan RAB menu gizi balita tinggi protein untuk 1 hari (3 kali makan + 1 snack sehat)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />

            {/* Presets Chips */}
            <div className="mt-2.5">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Rekomendasi Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(preset)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-purple-300 hover:bg-purple-50/60 hover:text-purple-700 transition text-left"
                  >
                    {preset.length > 45 ? preset.substring(0, 45) + "..." : preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Model Selector */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Cpu className="h-4 w-4 text-purple-600" />
                Pilih Model Gemini
              </label>

              <button
                type="button"
                onClick={() => setUseCustomModel(!useCustomModel)}
                className="text-[11px] font-medium text-purple-600 hover:underline"
              >
                {useCustomModel ? "Pilih dari daftar" : "Ketik model kustom"}
              </button>
            </div>

            {!useCustomModel ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_MODELS.map((m) => (
                  <label
                    key={m.id}
                    className={`relative flex cursor-pointer flex-col rounded-lg border p-3 text-left transition ${
                      selectedModel === m.id
                        ? "border-purple-500 bg-white ring-2 ring-purple-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="geminiModel"
                      value={m.id}
                      checked={selectedModel === m.id}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {m.name}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          selectedModel === m.id
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {m.tag}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {m.desc}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="Misal: gemini-2.5-flash-thinking, gemini-1.5-pro-latest"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}
          </div>

          {/* Optional Gemini API Key Section */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                Gemini API Key (Opsional)
              </span>
              <button
                type="button"
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="text-[11px] font-semibold text-slate-600 hover:text-purple-600"
              >
                {showApiKeyInput ? "Sembunyikan" : "Input API Key Mandiri"}
              </button>
            </div>

            {showApiKeyInput && (
              <div className="mt-2.5 space-y-1.5">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-mono placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <p className="text-[10px] text-slate-500">
                  Kosongkan jika Anda sudah menyetel <code className="bg-slate-200 px-1 rounded">GEMINI_API_KEY</code> di berkas <code className="bg-slate-200 px-1 rounded">.env.local</code>.
                </p>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Gagal Merancang Menu</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/25 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Gemini Sedang Merancang Menu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate & Isi Formulir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
