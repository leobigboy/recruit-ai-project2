"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Lưu ý: Các thư viện ngoài đã được loại bỏ và thay thế bằng logic mock đơn giản.

// -----------------------------------------------------------------------------
// INLINE SVG ICONS
// -----------------------------------------------------------------------------

// Icon cho Alert: X Circle
const IconXCircle = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);

// Icon cho Alert: Check Circle
const IconCheckCircle = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
);

// Google Icon
const IconGoogle = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

// Facebook Icon
const IconFacebook = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);


// -----------------------------------------------------------------------------
// INLINE UI COMPONENTS (Button, Input, Label, AlertMessage)
// -----------------------------------------------------------------------------

// --- Alert Message Component ---
const AlertMessage = ({
    message,
    type = "error",
    onClose,
}: {
    message?: string | null;
    type?: "error" | "success";
    onClose: () => void;
}) => {
    if (!message) return null;

    const baseStyles = "p-4 rounded-xl shadow-lg flex items-start justify-between mb-6 border";
    const variantStyles = {
        error: "bg-red-900/40 text-red-300 border-red-700",
        success: "bg-green-900/40 text-green-300 border-green-700",
    };
    const Icon = type === "error" ? IconXCircle : IconCheckCircle;

    return (
        <div className={`${baseStyles} ${variantStyles[type]}`} role="alert">
            <div className="flex items-start">
                <Icon className="w-5 h-5 mr-3 mt-0.5" />
                <p className="text-sm font-medium">{message}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-4 p-1 rounded-full hover:bg-white/10">
                <IconXCircle className="w-4 h-4" />
            </button>
        </div>
    );
};

// --- Button Component ---
const Button = ({
    children,
    variant = "default",
    className = "",
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" }) => {
    const baseStyles =
        "px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:shadow-sm";
    const variants = {
        default: "bg-white text-black hover:bg-gray-100",
        outline: "border border-gray-700 text-white hover:bg-gray-900 bg-black/10",
        ghost: "text-gray-400 hover:text-white hover:bg-gray-900",
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

// --- Input Component ---
const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
    return (
        <input
            className={`w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors ${className}`}
            {...props}
        />
    );
};

// --- Label Component ---
const Label = ({ children, className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => {
    return (
        <label className={`block text-sm font-medium text-gray-300 mb-2 ${className}`} {...props}>
            {children}
        </label>
    );
};


// -----------------------------------------------------------------------------
// MAIN LOGIN COMPONENT
// -----------------------------------------------------------------------------

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const clearError = () => setErrorMessage(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setIsLoading(true);

        try {
            // --- Demo auth (replace with real API call) ---
            await new Promise((r) => setTimeout(r, 500)); // simulate network

            if (email === "admin@example.com" && password === "admin123") {
                localStorage.setItem("isAuthenticated", "true");
                localStorage.setItem("role", "admin");
                navigate("/app", { replace: true });
            } else {
                setErrorMessage("Email hoặc mật khẩu không hợp lệ. Vui lòng thử lại. (Gợi ý: admin@example.com / admin123)");
            }
        } catch (err) {
            console.error("Login error", err);
            setErrorMessage("Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Mock Social Login Handlers ---
    const handleSocialLogin = (platform: 'Google' | 'Facebook') => {
        clearError();
        setIsLoading(true);
        console.log(`Starting mock login for ${platform}...`);

        setTimeout(() => {
            // Simulate success after a delay
            localStorage.setItem("isAuthenticated", "true");
            localStorage.setItem("role", "user");
            console.log(`${platform} login successful (Mocked).`);
            setIsLoading(false);
            navigate("/app", { replace: true });

            // To simulate failure instead, uncomment the lines below:
            // setIsLoading(false);
            // setErrorMessage(`Đăng nhập ${platform} không thành công. (Mock Failure)`);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-[Inter]">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-white mb-2">Welcome back</h1>
                    <p className="text-gray-400">Sign in to your account to continue</p>
                </div>

                {/* Login Form Card */}
                <div className="bg-black border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    
                    {/* Alert Message Display */}
                    <AlertMessage message={errorMessage} type="error" onClose={clearError} />

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

                        <Button type="submit" className="w-full text-lg bg-indigo-500 hover:bg-indigo-600 text-white" disabled={isLoading}>
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang đăng nhập...
                                </div>
                            ) : "Sign in"}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-black text-gray-500">Hoặc tiếp tục với</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Google Mock Login Button */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-3 bg-transparent text-gray-200 border-gray-700 hover:bg-gray-800"
                            onClick={() => handleSocialLogin('Google')}
                            disabled={isLoading}
                        >
                            <IconGoogle className="w-5 h-5" />
                            Continue with Google
                        </Button>

                        {/* Facebook Mock Login Button */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-3 bg-transparent bg-blue-700/20 border-blue-700 text-white hover:bg-blue-700/30"
                            onClick={() => handleSocialLogin('Facebook')}
                            disabled={isLoading}
                        >
                            <IconFacebook className="w-5 h-5 text-blue-500" />
                            Continue with Facebook
                        </Button>
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