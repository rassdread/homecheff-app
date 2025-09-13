export default function TestStyling() {
  return (
    <div className="min-h-screen bg-blue-500 p-8">
      <h1 className="text-4xl font-bold text-white mb-4">
        Test Styling
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-gray-800 text-lg">
          Als je deze tekst ziet met styling, werkt Tailwind CSS correct.
        </p>
        <button className="bg-primary-600 text-white px-4 py-2 rounded mt-4 hover:bg-primary-700">
          Test Button
        </button>
      </div>
    </div>
  );
}
