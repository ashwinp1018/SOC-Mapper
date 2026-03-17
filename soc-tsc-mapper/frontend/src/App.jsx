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
    <div className="bg-gray-50 min-h-screen text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
            SOC <span className="text-yellow-500">TSC Mapper</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Seamlessly map your Audit Controls to Trust Services Criteria using intelligent semantic search.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
              <span className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3 text-sm">1</span>
              Control Description
            </h2>
            <ControlInput onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
              <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mr-3 text-sm">2</span>
              Matching TSC Criteria
            </h2>
            {isLoading && (
              <div className="text-gray-500 text-center py-16 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-yellow-500 mb-4"></div>
                <p className="font-medium animate-pulse">Analyzing control semantics...</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
                <p className="font-semibold mb-1 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                  Analysis Error
                </p>
                <p>{error}</p>
              </div>
            )}
            {!isLoading && !error && results.length > 0 && (
              <ResultsTable results={results} control={lastControl} />
            )}
            {!isLoading && !error && results.length === 0 && (
              <div className="text-gray-400 text-center py-20 flex flex-col items-center justify-center">
                <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <p className="text-gray-500 font-medium">Submit a control description to begin mapping.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}