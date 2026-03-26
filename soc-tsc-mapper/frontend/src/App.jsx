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

// Icons for Sidebar & Metrics
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);
const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
);
const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
);
const ChartIcon = () => (
  <svg className="absolute -bottom-4 -right-4 w-32 h-32 text-[#FFE600] opacity-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
);
const TargetIcon = () => (
  <svg className="absolute -bottom-4 -right-4 w-32 h-32 text-[#FFE600] opacity-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
);
const TagIcon = () => (
  <svg className="absolute -bottom-4 -right-4 w-32 h-32 text-[#FFE600] opacity-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
);

export default function App() {
  const [mode, setMode] = useState("single");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastControl, setLastControl] = useState(null);
  const [bulkResults, setBulkResults] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState(null);

  // Stats State
  const [sessionControlsAnalyzed, setSessionControlsAnalyzed] = useState(0);
  const [sessionScoresSum, setSessionScoresSum] = useState(0);
  const [sessionFamilyCounts, setSessionFamilyCounts] = useState({});

  const handleSubmit = async (control, alpha) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await callMatch(control, alpha);
      const newResults = data.results || [];
      setResults(newResults);
      setLastControl(control);
      
      // Update stats
      setSessionControlsAnalyzed(prev => prev + 1);
      if (newResults.length > 0) {
        setSessionScoresSum(prev => prev + newResults[0].score);
        const crit = newResults[0].criterion || "";
        const match = crit.match(/^(CC[1-9]|A|C|PI|P)/);
        if (match) {
          const family = match[1];
          setSessionFamilyCounts(prev => ({
            ...prev,
            [family]: (prev[family] || 0) + 1
          }));
        }
      }
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

  // Compute Stats
  const avgTopScore = sessionControlsAnalyzed > 0 ? (sessionScoresSum / sessionControlsAnalyzed).toFixed(4) : "0.0000";
  let topFamily = "-";
  let maxCount = 0;
  Object.entries(sessionFamilyCounts).forEach(([fam, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topFamily = fam;
    }
  });

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex h-screen bg-[#F4F5F7] text-[#374151] font-sans overflow-hidden selection:bg-[#FFE600] selection:text-[#111827]">
      
      {/* Sidebar */}
      <aside className="w-[220px] bg-[#FFFFFF] border-r-[4px] border-[#FFE600] flex flex-col flex-shrink-0 z-20">
        <div className="p-6">
          <h1 className="text-[28px] font-[900] text-black tracking-tight cursor-default select-none leading-none">EY</h1>
          <p className="text-[10px] font-[500] text-[#9CA3AF] uppercase tracking-[0.15em] mt-[2px]">SOC TSC MAPPER</p>
          <div className="border-b-[2px] border-[#FFE600] w-full my-4"></div>
        </div>
        
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <button
            onClick={() => setMode('single')}
            className={`w-full flex items-center px-4 py-[10px] text-[14px] transition-colors duration-150 ${
              mode === 'single' 
                ? 'bg-[#FFE600] text-black font-[700]' 
                : 'text-[#6B7280] font-[500] hover:bg-[#F9F9F9] hover:text-black border-l-[3px] border-transparent hover:border-black'
            }`}
          >
            <span className={`mr-3 ${mode === 'single' ? 'text-black' : 'text-[#9CA3AF]'}`}><SearchIcon /></span>
            Single Analysis
          </button>
          
          <button
            onClick={() => setMode('bulk')}
            className={`w-full flex items-center px-4 py-[10px] text-[14px] transition-colors duration-150 ${
              mode === 'bulk' 
                ? 'bg-[#FFE600] text-black font-[700]' 
                : 'text-[#6B7280] font-[500] hover:bg-[#F9F9F9] hover:text-black border-l-[3px] border-transparent hover:border-black'
            }`}
          >
            <span className={`mr-3 ${mode === 'bulk' ? 'text-black' : 'text-[#9CA3AF]'}`}><ListIcon /></span>
            Bulk Analysis
          </button>

          <div className="my-6 pt-5">
            <span className="px-4 text-[10px] uppercase text-[#9CA3AF] tracking-[0.12em] font-[700] mb-2 block">TOOLS</span>
            <button disabled className="w-full flex items-center px-4 py-[10px] text-[14px] text-[#9CA3AF] font-[500] cursor-not-allowed group border-l-[3px] border-transparent">
               <span className="mr-3 text-[#D1D5DB]"><ClockIcon /></span>
               History
               <span className="ml-auto text-[9px] bg-[#F4F5F7] text-[#9CA3AF] px-1.5 py-0.5 font-[700] uppercase tracking-wider border border-[#E5E7EB]">Soon</span>
            </button>
            <button disabled className="w-full flex items-center px-4 py-[10px] text-[14px] text-[#9CA3AF] font-[500] cursor-not-allowed group mt-1 border-l-[3px] border-transparent">
               <span className="mr-3 text-[#D1D5DB]"><SettingsIcon /></span>
               Settings
            </button>
          </div>
        </nav>

        <div className="p-4 border-t-[2px] border-[#FFE600]">
           <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-[#E5E7EB] flex-shrink-0"></div>
             <div className="overflow-hidden">
               <p className="text-[14px] font-[700] text-black truncate">Auditor</p>
               <p className="text-[12px] text-[#6B7280] truncate">EY Internal</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-[72px] bg-[#FFFFFF] border-b-[2px] border-[#FFE600] flex items-center justify-between px-8 flex-shrink-0 z-10">
          <div className="flex flex-col justify-center">
            <h2 className="text-[20px] font-[700] text-black">
              {mode === 'single' ? 'Single Analysis' : 'Bulk Control Analysis'}
            </h2>
            <p className="text-[12px] text-[#9CA3AF] font-[500] mt-0.5 tracking-wide">
              EY / SOC TSC Mapper / {mode === 'single' ? 'Single Analysis' : 'Bulk Control Analysis'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-[#FFFFFF] text-[#6B7280] text-[12px] font-[600] border border-[#E5E7EB]">
              EY Internal Tool
            </span>
            <span className="text-[13px] font-[500] text-[#6B7280] tracking-wide">{currentDate}</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1280px] mx-auto min-w-[700px] hidden-scrollbar">
            
            {mode === 'single' && (
              <div className="space-y-[24px]">
                
                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
                  
                  <div className="bg-[#FFFFFF] p-5 border border-[#E5E7EB] border-t-[4px] border-t-[#FFE600] border-l-[4px] border-l-transparent hover:border-l-[#FFE600] transition-colors duration-200 min-h-[120px] relative overflow-hidden flex flex-col justify-between group">
                    <div className="relative z-10">
                      <p className="text-[11px] font-[500] text-[#9CA3AF] uppercase tracking-[0.1em] mb-1 group-hover:text-black transition-colors">Controls Analyzed</p>
                      <p className="text-[36px] font-[800] text-[#111827] leading-tight">{sessionControlsAnalyzed}</p>
                    </div>
                    <ChartIcon />
                    <div className="relative z-10 mt-3 flex items-center pt-3 border-t border-[#F3F4F6]">
                      <span className="w-1.5 h-1.5 bg-[#10B981] mr-2"></span>
                      <span className="text-[11px] text-[#6B7280] font-[500] uppercase tracking-wider">Session active</span>
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF] p-5 border border-[#E5E7EB] border-t-[4px] border-t-[#FFE600] border-l-[4px] border-l-transparent hover:border-l-[#FFE600] transition-colors duration-200 min-h-[120px] relative overflow-hidden flex flex-col justify-between group">
                    <div className="relative z-10">
                      <p className="text-[11px] font-[500] text-[#9CA3AF] uppercase tracking-[0.1em] mb-1 group-hover:text-black transition-colors">Avg Top Score</p>
                      <p className="text-[36px] font-[800] text-[#111827] leading-tight">{avgTopScore}</p>
                    </div>
                    <TargetIcon />
                    <div className="relative z-10 mt-3 flex items-center pt-3 border-t border-[#F3F4F6]">
                      <span className="w-1.5 h-1.5 bg-[#9CA3AF] mr-2"></span>
                      <span className="text-[11px] text-[#6B7280] font-[500] uppercase tracking-wider">Across {sessionControlsAnalyzed} queries</span>
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF] p-5 border border-[#E5E7EB] border-t-[4px] border-t-[#FFE600] border-l-[4px] border-l-transparent hover:border-l-[#FFE600] transition-colors duration-200 min-h-[120px] relative overflow-hidden flex flex-col justify-between group">
                    <div className="relative z-10">
                      <p className="text-[11px] font-[500] text-[#9CA3AF] uppercase tracking-[0.1em] mb-1 group-hover:text-black transition-colors">Top Family</p>
                      <p className="text-[36px] font-[800] text-[#111827] leading-tight">{topFamily}</p>
                    </div>
                    <TagIcon />
                    <div className="relative z-10 mt-3 flex items-center pt-3 border-t border-[#F3F4F6]">
                      <span className="w-1.5 h-1.5 bg-[#FFE600] mr-2"></span>
                      <span className="text-[11px] text-[#6B7280] font-[500] uppercase tracking-wider">
                        {topFamily !== "-" ? `Last: ${topFamily}` : "No matches yet"}
                      </span>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-[24px] items-start">
                  
                  {/* Left Card: Input */}
                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] border-l-[2px] border-l-[#FFE600] sticky top-0" style={{ padding: '24px' }}>
                    <div className="flex items-center justify-between mb-5 border-b border-[#F0F0F0] pb-4">
                      <h2 className="text-[14px] font-[700] text-black uppercase tracking-wide">
                        Audit Control Description
                      </h2>
                      <span className="text-[9px] font-[800] text-[#6B7280] uppercase tracking-[0.1em] bg-[#F4F5F7] px-2 py-1 border border-[#E5E7EB]">LIVE</span>
                    </div>
                    <ControlInput onSubmit={handleSubmit} isLoading={isLoading} />
                  </div>
                  
                  {/* Right Card: Results */}
                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] border-t-[2px] border-t-black min-h-[500px] flex flex-col" style={{ padding: '24px' }}>
                    <div className="flex items-center justify-between mb-5 border-b border-[#F0F0F0] pb-4">
                       <h2 className="text-[14px] font-[700] text-black uppercase tracking-wide">
                         Matching TSC Criteria
                       </h2>
                       <span className="text-[10px] font-[800] text-black uppercase tracking-[0.15em] bg-[#FFE600] px-3 py-1.5">TOP 10</span>
                    </div>
                    
                    {isLoading ? (
                      <div className="space-y-[1px] bg-[#F3F4F6] border-y border-[#F3F4F6]">
                        {/* Header skeleton */}
                        <div className="h-[40px] bg-white w-full border-b border-[#F3F4F6] flex items-center px-4">
                           <div className="w-10 h-4 bg-[#F4F5F7] mr-4"></div>
                           <div className="w-24 h-4 bg-[#F4F5F7] mr-4"></div>
                           <div className="w-full h-4 bg-[#F4F5F7] mr-4"></div>
                           <div className="w-16 h-4 bg-[#F4F5F7]"></div>
                        </div>
                        {[...Array(10)].map((_, i) => (
                           <div key={i} className="h-[52px] animate-shimmer bg-white flex items-center px-4"></div>
                        ))}
                      </div>
                    ) : error ? (
                      <div className="bg-[#FEF2F2] border-l-4 border-[#991B1B] p-5 text-[14px] mt-2">
                        <p className="font-[600] text-[#991B1B] mb-1 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                          Analysis Error
                        </p>
                        <p className="text-[#991B1B] font-[500]">{error}</p>
                      </div>
                    ) : results.length > 0 ? (
                      <ResultsTable results={results} />
                    ) : (
                      <div className="flex flex-col items-center justify-center flex-grow py-16">
                        <span className="text-[#FFE600] text-[64px] font-[900] leading-none select-none">—</span>
                        <h3 className="text-black font-[700] text-[16px] mt-6">No results yet</h3>
                        <p className="text-[#6B7280] text-[13px] font-[500] mt-1">Submit a control description to begin mapping</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {mode === 'bulk' && (
              <div className="space-y-[24px] pb-20">
                <div className="bg-[#FFFFFF] border border-[#E5E7EB] border-l-[2px] border-l-[#FFE600]" style={{ padding: '24px' }}>
                  <div className="flex items-center justify-between mb-5 border-b border-[#F0F0F0] pb-4">
                     <div>
                       <h2 className="text-[14px] font-[700] text-black uppercase tracking-wide">Bulk Control Analysis</h2>
                       <p className="text-[13px] text-[#6B7280] mt-1">Analyze multiple controls simultaneously</p>
                     </div>
                     <span className="text-[10px] font-[800] text-[#9CA3AF] uppercase tracking-[0.1em] bg-[#F4F5F7] px-3 py-1.5 border border-[#E5E7EB]">Max 20</span>
                  </div>
                  <BulkInput onSubmit={handleBulkSubmit} isLoading={isBulkLoading} />
                </div>
                
                {isBulkLoading ? (
                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] min-h-[400px] flex flex-col pt-[48px] relative overflow-hidden line-bottom" style={{ padding: '24px' }}>
                     {/* Progress bar line */}
                     <div className="absolute top-0 left-0 w-1/3 h-[3px] bg-[#FFE600] shadow-[0_0_8px_#FFE600] animate-shimmer"></div>
                     <div className="text-center mb-8">
                       <p className="text-[11px] font-[700] text-[#9CA3AF] uppercase tracking-[0.2em] animate-pulse">Processing Controls...</p>
                     </div>
                     <div className="space-y-4 w-full">
                       {[...Array(6)].map((_, i) => (
                           <div key={i} className="h-[60px] bg-[#F4F5F7] animate-shimmer w-full border border-[#F3F4F6]" style={{ animationDelay: `${i * 100}ms` }}></div>
                       ))}
                     </div>
                  </div>
                ) : bulkError ? (
                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] border-t-[2px] border-t-black" style={{ padding: '24px' }}>
                    <div className="bg-[#FEF2F2] border-l-4 border-[#991B1B] p-5 text-[14px]">
                      <p className="font-[600] text-[#991B1B] mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                        Analysis Error
                      </p>
                      <p className="text-[#991B1B] font-[500] leading-relaxed">{bulkError}</p>
                    </div>
                  </div>
                ) : bulkResults.length > 0 ? (
                  <div className="w-full animate-slide-in">
                     <BulkResultsTable results={bulkResults} />
                  </div>
                ) : null}
              </div>
            )}

          </div>
        </div>
      </main>

    </div>
  );
}