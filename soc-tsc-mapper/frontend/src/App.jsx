import { useState } from "react";
import ControlInput from "./components/ControlInput";
import ResultsTable from "./components/ResultsTable";
import BulkInput from "./components/BulkInput";
import BulkResultsTable from "./components/BulkResultsTable";
import { callMatch, callMatchBulk } from "./api/match";

function parseControls(text) {
  const byBlankLine = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  if (byBlankLine.length > 1) return byBlankLine;
  const byNumber = text.split(/\n(?=\d+[.:])/).map(s => s.replace(/^\d+[.:]\s*/, '').trim()).filter(Boolean);
  if (byNumber.length > 1) return byNumber;
  return [text.trim()].filter(Boolean);
}

export default function App() {
  const [mode, setMode] = useState("single");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastControl, setLastControl] = useState(null);
  const [bulkResults, setBulkResults] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState(null);

  const handleSubmit = async (control, alpha) => {
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

  const handleBulkSubmit = async (text, alpha) => {
    setIsBulkLoading(true);
    setBulkError(null);
    try {
      const controls = parseControls(text);
      if (controls.length === 0) throw new Error("No controls detected.");
      const data = await callMatchBulk(controls, alpha);
      setBulkResults(data.results || []);
    } catch (err) {
      console.error("[APP ERROR]", err);
      setBulkError(err.message || "An error occurred while analyzing controls.");
      setBulkResults([]);
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-gray-800 font-sans pb-16 selection:bg-yellow-200">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-yellow-100 rounded-3xl mb-4 shadow-sm border border-yellow-200/50">
             <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-gray-900">
            SOC <span className="text-[#b3a200]">TSC Mapper</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">
            Seamlessly map your Audit Controls to Trust Services Criteria securely.
          </p>
        </header>

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-gray-200/60 border border-gray-200/80 rounded-2xl p-1.5 shadow-inner">
            <button
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'single' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
              onClick={() => setMode('single')}
            >
              Single Control
            </button>
            <button
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'bulk' ? 'bg-[#FFE600] text-gray-900 shadow-sm ring-1 ring-yellow-500/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
              onClick={() => setMode('bulk')}
            >
              Bulk Analysis
            </button>
          </div>
        </div>

        {mode === 'single' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr] gap-6 items-start">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 ring-1 ring-black/5 sticky top-6">
              <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
                <span className="w-8 h-8 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center mr-3 text-sm font-extrabold shadow-sm border border-yellow-200/50">1</span>
                Control Details
              </h2>
              <ControlInput onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
            
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 ring-1 ring-black/5 min-h-[500px] flex flex-col">
              <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
                <span className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center mr-3 text-sm font-extrabold shadow-sm border border-gray-200/50">2</span>
                Matching Criteria Result
              </h2>
              
              {isLoading ? (
                <div className="text-gray-500 text-center py-20 flex flex-col items-center justify-center flex-grow">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-yellow-400 mb-5"></div>
                  <p className="font-semibold tracking-wide uppercase text-xs">Analyzing control semantics...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-red-700 text-sm shadow-inner mt-2">
                  <p className="font-bold mb-2 flex items-center text-base">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                    Analysis Error
                  </p>
                  <p className="text-red-600 font-medium leading-relaxed">{error}</p>
                </div>
              ) : results.length > 0 ? (
                <ResultsTable results={results} control={lastControl} />
              ) : (
                <div className="text-gray-400 text-center py-24 flex flex-col items-center justify-center flex-grow">
                  <div className="bg-gray-50 p-6 rounded-full mb-5 shadow-sm border border-gray-100">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <p className="text-gray-500 font-semibold tracking-wide">Submit a control description to map criteria.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 ring-1 ring-black/5 max-w-4xl mx-auto w-full mb-8">
              <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900 border-b border-gray-100 pb-5">
                <span className="w-8 h-8 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center mr-3 text-sm font-extrabold shadow-sm border border-yellow-200/50">1</span>
                Bulk Control Input
              </h2>
              <BulkInput onSubmit={handleBulkSubmit} isLoading={isBulkLoading} />
            </div>
            
            <div className="bg-[#FAFAFA] rounded-3xl pt-2 pb-6 md:p-4 w-full flex-grow">
              {isBulkLoading ? (
                <div className="text-gray-500 text-center py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 shadow-sm ring-1 ring-black/5 min-h-[400px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-yellow-400 mb-6"></div>
                  <p className="font-bold tracking-widest uppercase text-xs text-gray-400">Processing Bulk Analysis...</p>
                </div>
              ) : bulkError ? (
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm ring-1 ring-black/5">
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-red-700 text-sm shadow-inner">
                    <p className="font-bold mb-2 flex items-center text-base">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                      Analysis Error
                    </p>
                    <p className="text-red-600 font-medium leading-relaxed">{bulkError}</p>
                  </div>
                </div>
              ) : bulkResults.length > 0 ? (
                <div className="w-full">
                   <BulkResultsTable results={bulkResults} />
                </div>
              ) : (
                <div className="text-gray-400 text-center py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 shadow-sm ring-1 ring-black/5 min-h-[400px]">
                  <div className="bg-gray-50 p-6 rounded-full mb-5 shadow-sm border border-gray-100">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  </div>
                  <p className="text-gray-500 font-semibold tracking-wide">Submit multiple controls to populate the grid.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}