// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, setProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim();

      // Validation
      if (!trimmedEmail || !password) {
        setError("Vui lòng điền đầy đủ thông tin");
        return;
      }

      // Attempt sign in
      const res = await signIn(trimmedEmail, password);
      console.log("signIn result:", res);

      // Check for authentication errors
      if (res?.error) {
        const msg = res.error?.message ?? "Đăng nhập thất bại";
        setError(msg === "Invalid login credentials" ? "Email hoặc mật khẩu không chính xác" : msg);
        return;
      }

      // Verify session was created
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("Lỗi kiểm tra phiên đăng nhập. Vui lòng thử lại.");
        return;
      }

      const session = sessionData?.session;
      
      if (!session) {
        setError("Không tạo được phiên đăng nhập. Vui lòng thử lại.");
        return;
      }

      console.log("Session created:", session);

      // Fetch user profile
      const userId = session.user.id;
      const { data: profileData, error: profileErr } = await supabase
        .from("cv_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      console.log("Profile data:", profileData, "Error:", profileErr);

      // Set profile (null if not found, which is okay)
      if (profileErr && profileErr.code !== 'PGRST116') {
        // PGRST116 is "not found" - that's acceptable
        console.warn("Profile fetch error:", profileErr);
      }
      
      setProfile(profileData || null);

      // Navigate to dashboard
      navigate("/dashboard", { replace: true });

    } catch (ex: any) {
      console.error("Login exception:", ex);
      setError(ex?.message ?? "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Recruit AI</h1>
          <p className="text-gray-600">Hệ thống quản lý tuyển dụng</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Đăng nhập</h2>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Chưa có tài khoản? </span>
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">© 2025 Recruit AI. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LoginPage;