"use client";

import { useActionState, useState, Suspense, useEffect } from "react";
import { loginAction } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, AlertCircle, Loader2, CheckCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const defaultEmail = searchParams.get("email") || "";
  const oauthError = searchParams.get("error");
  const oauthCode = searchParams.get("code");
  const [emailInput, setEmailInput] = useState(defaultEmail);
  const [isExchangingCode, setIsExchangingCode] = useState(() => Boolean(oauthCode));

  // Supabase mengirim ?code= ke /masuk alih-alih ke /api/auth/callback.
  // Exchange code harus dilakukan di browser yang sama karena PKCE verifier
  // ada di localStorage milik createBrowserClient (bukan cookies server).
  useEffect(() => {
    if (!oauthCode) return;

    const exchangeCode = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(oauthCode);

        if (error) {
          console.error("[masuk] Exchange error:", error.message);
          window.location.replace("/masuk?error=" + encodeURIComponent(error.message));
          return;
        }

        console.log("[masuk] Exchange berhasil, user:", data.user?.email);

        // Cek profil user
        const { data: profil } = await supabase
          .from("profil")
          .select("peran")
          .eq("id", data.user!.id)
          .single();

        console.log("[masuk] Profil:", profil);

        if (!profil) {
          window.location.replace("/pilih-peran");
          return;
        }

        const peran = profil.peran;
        const targetPath = peran === "guru" ? "/guru" : "/";

        window.location.replace(targetPath);
      } catch (err: any) {
        console.error("[masuk] Exchange catch:", err);
        window.location.replace("/masuk?error=" + encodeURIComponent("Terjadi kesalahan autentikasi."));
      }
    };

    exchangeCode();
  }, [oauthCode]);



  const handleSocialLogin = async (provider: "google" | "github") => {
    if (provider === "google") {
      setIsGoogleLoading(true);
    } else {
      setIsGitHubLoading(true);
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error(`Gagal memulai autentikasi ${provider}:`, err);
      setIsGoogleLoading(false);
      setIsGitHubLoading(false);
    }
  };

  const isAnyLoading = isPending || isGoogleLoading || isGitHubLoading;

  // Tampilkan loading screen saat sedang memproses OAuth code
  if (isExchangingCode) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 w-full max-w-[400px] mt-6 flex flex-col items-center justify-center gap-4 min-h-[200px]">
        <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">Memverifikasi akun...</p>
          <p className="text-xs text-slate-400 mt-1">Sebentar lagi Anda akan diarahkan ke dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 w-full max-w-[400px] mt-6 space-y-5">
      {/* Notifikasi baru daftar */}
      {justRegistered && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0 text-green-500" />
          <span>Pendaftaran berhasil! Silakan masuk dengan akun Anda.</span>
        </div>
      )}

      {/* Notifikasi akun belum terdaftar -> Wajib daftar untuk membuat profil */}
      {state?.notRegistered && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-amber-900">Akun Belum Terdaftar</p>
              <p className="text-amber-800 leading-relaxed text-xs">
                Email <strong>{state.email}</strong> belum memiliki akun di sistem. Anda harus mendaftar terlebih dahulu yang berfungsi untuk membuat dan menyesuaikan data profil Anda.
              </p>
            </div>
          </div>
          <Link
            href={`/daftar?email=${encodeURIComponent(state.email || emailInput || "")}`}
            className="block w-full text-center py-2.5 px-3 rounded-xl bg-[#0B1A2E] hover:bg-slate-800 text-white font-bold transition text-xs shadow-md"
          >
            Daftar Sekarang (Lengkapi Data Profil) →
          </Link>
        </div>
      )}

      {/* Notifikasi profil belum lengkap */}
      {state?.incompleteProfile && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-amber-900">Profil Belum Lengkap</p>
              <p className="text-amber-800 leading-relaxed text-xs">
                Akun ditemukan, namun data profil resmi belum dibuat. Silakan lengkapi formulir pendaftaran untuk membentuk profil Anda.
              </p>
            </div>
          </div>
          <Link
            href={`/daftar?email=${encodeURIComponent(state.email || emailInput || "")}`}
            className="block w-full text-center py-2.5 px-3 rounded-xl bg-[#0B1A2E] hover:bg-slate-800 text-white font-bold transition text-xs shadow-md"
          >
            Lengkapi Profil Sekarang →
          </Link>
        </div>
      )}

      {/* Error umum (misal kata sandi salah) */}
      {state?.error && !state?.notRegistered && !state?.incompleteProfile && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{state.error}</span>
        </div>
      )}

      {oauthError && !state?.error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{oauthError}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Alamat Email
          </label>
          <div className="relative flex items-center">
            <Mail className="w-5 h-5 text-slate-400 absolute left-4" />
            <input
              type="email"
              name="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              disabled={isAnyLoading}
              placeholder="siswa@universitas.edu"
              className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 focus:border-slate-300 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400/80 focus:outline-none transition-all duration-200 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Kata Sandi
            </label>
            <Link
              href="#"
              className="text-xs font-semibold text-[#0B1A2E] hover:underline"
            >
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative flex items-center">
            <Lock className="w-5 h-5 text-slate-400 absolute left-4" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              disabled={isAnyLoading}
              placeholder="••••••••"
              className="w-full pl-12 pr-12 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 focus:border-slate-300 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400/80 focus:outline-none transition-all duration-200 disabled:opacity-60"
            />
            <button
              type="button"
              disabled={isAnyLoading}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              {showPassword ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Keep me signed in */}
        <div className="flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="keep-signed-in"
            name="keep_signed_in"
            disabled={isAnyLoading}
            className="w-4.5 h-4.5 rounded border-slate-300 text-[#0B1A2E] focus:ring-[#0B1A2E] bg-white cursor-pointer disabled:opacity-50"
          />
          <label
            htmlFor="keep-signed-in"
            className="text-xs text-slate-500 font-medium select-none cursor-pointer"
          >
            Tetap masuk
          </label>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isAnyLoading}
          className="w-full mt-2 py-3.5 bg-[#0B1A2E] hover:bg-[#12253F] text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(11,26,46,0.1)] hover:shadow-[0_6px_20px_rgba(11,26,46,0.15)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>Masuk</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Or Continue With Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-100"></div>
        <span className="flex-shrink mx-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          atau lanjutkan dengan
        </span>
        <div className="flex-grow border-t border-slate-100"></div>
      </div>

      {/* Social Logins */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isAnyLoading}
          onClick={() => handleSocialLogin("google")}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.53 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.89 3.02C6.2 7.74 8.87 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.97 3.7-8.62z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.78c-.25-.74-.39-1.53-.39-2.36s.14-1.62.39-2.36L1.39 7.04C.5 8.84 0 10.86 0 13s.5 4.16 1.39 5.96l3.89-3.18z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.11.75-2.53 1.2-4.23 1.2-3.13 0-5.8-2.7-6.72-5.54l-3.89 3.02C3.37 20.33 7.35 23 12 23z"
              />
            </svg>
          )}
          <span>Google</span>
        </button>
        <button
          type="button"
          disabled={isAnyLoading}
          onClick={() => handleSocialLogin("github")}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#24292F] hover:bg-[#1C2024] rounded-xl text-xs font-semibold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGitHubLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          )}
          <span>GitHub</span>
        </button>
      </div>
    </div>
  );
}

export default function MasukPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-3">
          <img src="/logo.png" alt="Thinksy Logo" className="w-full h-full object-contain" />
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl font-bold text-[#0B1A2E] tracking-tight font-sans mb-1 text-center">
          Thinksy
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-slate-500 max-w-[280px] text-center leading-relaxed mb-2">
          Akses materi pembelajaran dan pantau kemajuan Anda.
        </p>

        {/* Form component */}
        <Suspense fallback={
          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 w-full max-w-[400px] mt-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#0B1A2E]" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <p className="text-xs text-slate-500 font-medium text-center mt-6">
          Belum punya akun?
          <Link
            href="/daftar"
            className="text-[#0B1A2E] font-semibold hover:underline ml-1"
          >
            Registrasi
          </Link>
        </p>
      </div>
    </div>
  );
}
