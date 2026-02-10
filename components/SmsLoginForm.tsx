"use client";
import React, { useState } from "react";
import { useTranslation } from '@/hooks/useTranslation';

export default function SmsLoginForm() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"input" | "code" | "success">("input");
  const [error, setError] = useState<string | null>(null);

  function handleSend() {
    if (!phone.match(/^\+31[0-9]{9}$/)) {
      setError(t('admin.smsInvalidPhone'));
      return;
    }
    setStep("code");
    setError(null);
  }

  function handleVerify() {
    if (code === "123456") {
      setStep("success");
      setError(null);
    } else {
      setError(t('admin.smsInvalidCode'));
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl border" style={{ borderColor: "var(--accent)" }}>
  <h2 className="text-xl font-bold mb-4 text-primary font-montserrat">SMS Login</h2>
      {step === "input" && (
        <>
          <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+31612345678" className="mb-4 px-3 py-2 border rounded w-full" />
          <button className="px-4 py-2 rounded text-white w-full bg-primary font-montserrat" onClick={handleSend}>
            Verstuur SMS
          </button>
        </>
      )}
      {step === "code" && (
        <>
          <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Verificatiecode" className="mb-4 px-3 py-2 border rounded w-full" />
          <button className="px-4 py-2 rounded text-white w-full bg-primary font-montserrat" onClick={handleVerify}>
            Verifiëren
          </button>
        </>
      )}
      {step === "success" && (
        <div className="mt-2 text-green-600">Succesvol ingelogd via SMS!</div>
      )}
      {error && <div className="mt-2 text-red-600">{error}</div>}
    </div>
  );
}
