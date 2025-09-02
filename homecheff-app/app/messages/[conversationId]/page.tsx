
// @ts-ignore
import type { PageProps } from ".next/types/routes";
import { notFound } from "next/navigation";

export default async function MessageDetailPage(props: PageProps<"/messages/[conversationId]">) {
  const params = await props.params;
  if (!params.conversationId) return notFound();
  return (
    <main className="min-h-screen bg-[#F6F8FA]">
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold text-[#006D52]">Bericht detail</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-xl bg-white p-6 border border-gray-200">
          Hier komt het detail van het gesprek <b>{params.conversationId}</b>.
        </div>
      </section>
    </main>
  );
}
