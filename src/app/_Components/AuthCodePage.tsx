"use client";

import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

const AuthCodePage = () => {
  const [code, setCode] = useState(["", "", "", ""]);

  // Auto-focus first input
  useEffect(() => {
    document.getElementById("code-0")?.focus();
  }, []);

  // Handle input change
  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return; // Accept only numbers
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move to next input if available
    if (value && index < 3) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  // Handle key press (Backspace support)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (code[index]) {
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      } else if (index > 0) {
        document.getElementById(`code-${index - 1}`)?.focus();
      }
    }
  };

  const handleSubmit = () => {
    alert("Entered code: " + code.join(""));
  };

  return (
<div className="min-h-screen bg-[url('')] text-white flex items-start pt-26 mx-20 my-10 relative overflow-hidden">
      <div className="absolute top-2 left-0 bg-white text-sm font-medium border rounded-4xl p-3 cursor-pointer">
<span className="text-green-600 text-2xl">
  <ArrowBigLeft />
</span>      </div>

      <div className="max-w-lg mx-20 w-full text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">
          Enter authentication code
        </h2>
        <p className="text-sm mb-6 text-white">
          Enter the 4-digit that we have sent via the <br />
          phone number <span className="text-blue-400">+82 813-8172-5977</span>
        </p>

        <div className="flex justify-center gap-4 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 rounded-full text-center text-lg bg-white text-black outline-none focus:ring-2 focus:ring-green-400"
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="bg-green-400 text-black px-6 py-2 rounded-full font-semibold hover:bg-green-300 transition"
        >
          <Link href="/auth-verf" className="no-underline">Confirm Password</Link>
        </button>

        <div className="mt-4">
          <button className="text-sm text-purple-400 hover:underline">
            Resend code
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthCodePage;
