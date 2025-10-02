"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login';
import { jwtDecode } from 'jwt-decode'; // Use named export

// --- Inline Button Component ---
const Button = ({
  children,
  variant = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" }) => {
  const baseStyles =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-white text-black hover:bg-gray-100",
    outline: "border border-gray-700 text-white hover:bg-gray-900",
    ghost: "text-gray-400 hover:text-white hover:bg-gray-900",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Inline Input Component ---
const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className={`w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors ${className}`}
      {...props}
    />
  );
};

// --- Inline Label Component ---
const Label = ({ children, className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => {
  return (
    <label className={`block text-sm font-medium text-gray-300 mb-2 ${className}`} {...props}>
      {children}
    </label>
  );
};

// --- Main Login Component ---
export default function LoginPageWrapper() {
  // Wrap with GoogleOAuthProvider
  const clientId = "392471570421-4lb57egpqahi7v2ifvvdkptica5cmqo7.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginPage />
    </GoogleOAuthProvider>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // --- Demo auth (replace with real API call) ---
      await new Promise((r) => setTimeout(r, 500)); // simulate network

      if (email === "admin@example.com" && password === "admin123") {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("role", "admin");
        navigate("/app", { replace: true });
      } else {
        alert("Invalid email or password");
      }
    } catch (err) {
      console.error("Login error", err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Google Login Handler ---
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // tokenResponse type from the library doesn't include "credential" so cast to any
        const resp: any = tokenResponse as any;

        // Prefer JWT-like fields if available (credential or id_token)
        const jwt = resp.credential ?? resp.id_token;

        if (jwt) {
          // decode JWT to get user info
          const userInfo: any = jwtDecode(jwt);
          console.log("Google User Info:", userInfo);

          // Save auth state (in production, send token to backend for verification)
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("role", "user");
          localStorage.setItem("email", userInfo.email || "");
          navigate("/app", { replace: true });
        } else if (resp.access_token) {
          // If we only have an access token, fetch user info from Google's userinfo endpoint
          const r = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${resp.access_token}`);
          if (!r.ok) throw new Error("Failed to fetch Google user info");
          const userInfo = await r.json();
          console.log("Google User Info (from API):", userInfo);

          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("role", "user");
          localStorage.setItem("email", userInfo.email || "");
          navigate("/app", { replace: true });
        } else {
          console.error("No usable token returned from Google:", tokenResponse);
        }
      } catch (err) {
        console.error("JWT decode / Google userinfo error:", err);
      }
    },
    onError: (error) => {
      console.error('Google Login Error:', error);
      alert("Google login failed. Please try again.");
    },
    flow: 'implicit', // client-side flow
  });

  // --- Facebook Login Handler ---
  const handleFacebookResponse = (response: any) => {
    if (response.accessToken) {
      console.log('Facebook User Info:', response);

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("role", "user");
      navigate("/app", { replace: true });
    } else {
      console.error('Facebook Login Error:', response);
      alert("Facebook login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to your account to continue</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-black border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password" className="mb-0">Password</Label>
                <a href="/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-3 bg-transparent"
              onClick={() => googleLogin()}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <FacebookLogin
              appId="YOUR_FACEBOOK_APP_ID"
              autoLoad={false}
              fields="name,email,picture"
              callback={handleFacebookResponse}
              cssClass="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-gray-700 text-white hover:bg-gray-900 flex items-center justify-center gap-3 bg-transparent"
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>}
              textButton="Continue with Facebook"
            />
          </div>
        </div>

        <p className="text-center text-gray-400 mt-6">
          Don't have an account?{" "}
          <a href="/signup" className="text-white hover:underline font-medium">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
