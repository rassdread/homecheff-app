"use client";
import React from "react";

interface SellerVerificationButtonProps {
  verified: boolean;
  onVerify?: () => void;
}

export default function SellerVerificationButton({ verified, onVerify }: SellerVerificationButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded font-semibold text-white ${verified ? "bg-success" : "bg-error"}`}
      style={{ background: verified ? "var(--success)" : "var(--error)" }}
      onClick={onVerify}
      disabled={verified}
    >
      {verified ? "Geverifieerd" : "Verifieer verkoper"}
    </button>
  );
}
