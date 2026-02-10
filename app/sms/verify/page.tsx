export default function SmsVerifyPage() {
  return (
    <main className="min-h-screen bg-[#F6F8FA]">
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold text-[#006D52]">SMS verificatie</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-xl bg-white p-6 border border-gray-200">
          Hier kun je een SMS-code invoeren voor verificatie.
        </div>
      </section>
    </main>
  );
}
