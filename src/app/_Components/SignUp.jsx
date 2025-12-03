"use client";

import React, { useState, useEffect } from "react";
import { FaEyeSlash, FaPhoneAlt } from "react-icons/fa";
import { MdOutlineVisibility } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { signInWithRedirect, getRedirectResult, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../api/firebase";
import { useRouter } from "next/navigation";
import LoadingOverlay from "./LoadingOverlay";
import { toast } from "sonner";

const SignUpForm = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const idToken = await result.user.getIdToken();
          
          const res = await fetch("https://sbackend.duckdns.org/api/auth/google-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ idToken }),
          });

          const data = await res.json();
          
          if (!res.ok) {
            throw new Error(data.error || "Google signup failed");
          }

          toast.success("Account created successfully!");
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Redirect result error:", err);
        toast.error(err.message || "Google signup failed");
        setLoading(false);
      }
    };

    handleRedirectResult();
  }, [router]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    
    if (!password) {
      toast.error("Please enter a password");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://sbackend.duckdns.org/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Signup failed");
      }

      toast.success(data.message || "Account created! Please check your email.");
      
      setTimeout(() => {
        router.push("/signin");
      }, 1500);
      
    } catch (err) {
      console.error("Signup error:", err);
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const res = await fetch("https://sbackend.duckdns.org/api/SSauth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Google signup failed");
      }

      toast.success("Account created successfully!");
      router.push("/dashboard");
      
    } catch (err) {
      console.error("Google signup error:", err);
      
      if (err.code === 'auth/popup-blocked') {
        toast.error("Popup was blocked. Please allow popups for this site.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        toast.error("Sign-up cancelled");
      } else {
        toast.error(err.message || "Google signup failed");
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen from-[#0C1E1D] to-[#10211F] text-white relative">
      {loading && <LoadingOverlay />}

      <div className="w-full max-w-md p-8 mx-auto">
        <h2 className="text-3xl font-bold text-[#93F5AE] mb-4">Sign up</h2>

        <form onSubmit={handleSignUp} className="space-y-3">
          <div className="relative w-full">
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
              className="peer w-full px-4 pt-6 pb-1 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none"
            />
            <label
              htmlFor="name"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400"
            >
              Your Name
            </label>
          </div>

          <div className="relative w-full">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="peer w-full px-4 pt-6 pb-1 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none"
            />
            <label
              htmlFor="email"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400"
            >
              Email
            </label>
          </div>

          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="peer w-full px-4 pt-6 pb-2 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none pr-10"
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-5 text-gray-400 hover:text-white"
            >
              {showPassword ? (
                <MdOutlineVisibility />
              ) : (
                <FaEyeSlash />
              )}
            </button>
          </div>

          <div className="relative w-full">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
              className="peer w-full px-4 pt-6 pb-2 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none pr-10"
            />
            <label
              htmlFor="confirm-password"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400"
            >
              Confirm Password
            </label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-5 text-gray-400 hover:text-white"
            >
              {showConfirmPassword ? (
                <MdOutlineVisibility />
              ) : (
                <FaEyeSlash />
              )}
            </button>
          </div>

          <div className="relative w-full">
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="peer w-full px-4 pt-6 pb-2 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none pr-10"
            />
            <label
              htmlFor="phone"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400"
            >
              Phone Number (Optional)
            </label>
            <FaPhoneAlt className="absolute right-4 top-5 text-gray-400" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-[#93F5AE] text-black font-semibold hover:bg-[#7ce49e] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="w-full text-center text-sm text-white">or</div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full py-2 flex items-center justify-center bg-white text-black rounded-md hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FcGoogle className="mr-2 text-lg" />
            Continue with Google
          </button>

          <p className="w-full text-sm text-white text-center">
            Already have an account?{" "}
            <Link href="/signin" className="text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUpForm;