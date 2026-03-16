import { useState } from "react";
import ControlInput from "./components/ControlInput";
import ResultsTable from "./components/ResultsTable";
import { callMatch } from "./api/match";

export default function App() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastControl, setLastControl] = useState(null);

  const handleSubmit = async (control, alpha) => {
    console.log("[APP] Submit triggered");
    setIsLoading(true);
    setError(null);
    try {
      const data = await callMatch(control, alpha);
      setResults(data.results || []);
      setLastControl(control);
    } catch (err) {
      console.error("[APP ERROR]", err);
      setError(err.message || "An error occurred while analyzing the control.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">SOC TSC Mapper</h1>
          <p className="text-gray-400">Audit Control → Trust Services Criteria</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Control Description</h2>
            <ControlInput onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Matching TSC Criteria</h2>
            {isLoading && (
              <div className="text-gray-400 text-center py-8">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-8 w-8 border border-gray-700 border-t-blue-500 mb-2"></div>
                  <p>Analyzing control...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
                <p className="font-medium">Error:</p>
                <p>{error}</p>
              </div>
            )}
            {!isLoading && !error && results.length > 0 && (
              <ResultsTable results={results} control={lastControl} />
            )}
            {!isLoading && !error && results.length === 0 && (
              <div className="text-gray-500 text-center py-12">
                <p>Submit a control description to see matching criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}