"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4 text-red-600">Er is een fout opgetreden</h2>
      <pre className="bg-gray-100 p-4 rounded text-left text-sm text-red-800 overflow-x-auto">{error.message}</pre>
      <p className="mt-4 text-gray-600">Probeer het later opnieuw of neem contact op met support.</p>
    </div>
  );
}
