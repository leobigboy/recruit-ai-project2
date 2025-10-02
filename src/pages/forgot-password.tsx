"use client"

import type React from "react"
import { useState } from "react"

// Inline Button Component
const Button = ({
  children,
  variant = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" }) => {
  const baseStyles =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  const variants = {
    default: "bg-white text-black hover:bg-gray-100",
    outline: "border border-gray-700 text-white hover:bg-gray-900",
    ghost: "text-gray-400 hover:text-white hover:bg-gray-900",
  }

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

// Inline Input Component
const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className={`w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors ${className}`}
      {...props}
    />
  )
}

// Inline Label Component
const Label = ({ children, className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => {
  return (
    <label className={`block text-sm font-medium text-gray-300 mb-2 ${className}`} {...props}>
      {children}
    </label>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Add your password reset logic here
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 1000)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-gray-400">We've sent a password reset link to</p>
            <p className="text-white font-medium mt-1">{email}</p>
          </div>

          {/* Info Card */}
          <div className="bg-black border border-gray-800 rounded-2xl p-8">
            <div className="space-y-4 text-sm text-gray-400">
              <p>
                Click the link in the email to reset your password. If you don't see the email, check your spam folder.
              </p>
              <p>The link will expire in 24 hours for security reasons.</p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-4">Didn't receive the email?</p>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => setIsSubmitted(false)}>
                Try another email
              </Button>
            </div>
          </div>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <a
              href="/login"
              className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Reset password</h1>
          <p className="text-gray-400">Enter your email and we'll send you a link to reset your password</p>
        </div>

        {/* Forgot Password Form Card */}
        <div className="bg-black border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
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

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-400 text-center">
              Remember your password?{" "}
              <a href="/login" className="text-white hover:underline font-medium">
                Sign in
              </a>
            </p>
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <a href="/support" className="text-gray-400 hover:text-white transition-colors">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
