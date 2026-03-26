import { useState, useMemo } from "react";

export default function BulkInput({ onSubmit, isLoading }) {
  const [text, setText] = useState("");
  const [alpha, setAlpha] = useState(0.6);

  const controlCount = useMemo(() => {
    if (!text.trim()) return 0;
    const byBlankLine = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    if (byBlankLine.length > 1) return byBlankLine.length;
    
    const byNumber = text.split(/\n(?=\d+[.:])/).map(s => s.replace(/^\d+[.:]\s*/, '').trim()).filter(Boolean);
    if (byNumber.length > 1) return byNumber.length;
    
    return [text.trim()].filter(Boolean).length;
  }, [text]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(text, alpha);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col h-full space-y-[28px]">
        <div className="flex-grow flex flex-col relative">
          <div className="flex items-center justify-between mb-3 pl-1 pr-1">
            <label htmlFor="bulk-control" className="block text-[11px] font-[600] text-[#6B7280] uppercase tracking-[0.1em]">
              Audit Control Descriptions
            </label>
            <p className="text-[13px] text-[#9CA3AF] mb-0 block absolute right-0 -top-[24px]">
              Separate controls with a blank line or number them (1. 2. 3.)
            </p>
          </div>
          
          <div className="relative">
            <textarea
              id="bulk-control"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Example:\n\n1. User access is reviewed quarterly...\n2. Backup jobs are executed daily..."}
              rows={14}
              className="w-full flex-grow bg-[#FAFAFA] text-[#111827] p-[16px] border border-transparent border-b-[2px] border-b-[#FFE600] outline-none text-[14px] focus:border-[2px] focus:border-[#FFE600] focus:bg-[#FFFFFF] transition-all duration-150 resize-y placeholder-[#9CA3AF] leading-relaxed min-h-[140px] appearance-none"
            />
            {/* Absolute Badge inside textarea wrapper for top right positioning */}
            <div className="absolute top-0 right-0">
               <span className={`inline-block px-3 py-1.5 text-[11px] font-[800] uppercase tracking-[0.15em] border-l-[2px] border-b-[2px] transition-colors ${
                 controlCount > 0 
                   ? "bg-[#FFE600] text-black border-l-[#D4A017] border-b-[#D4A017]" 
                   : "bg-[#F3F4F6] text-[#9CA3AF] border-l-[#E5E7EB] border-b-[#E5E7EB]"
               }`}>
                 {controlCount} CONTROLS
               </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-3">
            <label htmlFor="bulk-alpha" className="block text-[11px] font-[600] text-[#6B7280] uppercase tracking-[0.1em]">
              Retrieval Strategy
            </label>
            <div className="relative group cursor-help flex items-center">
              <span className="text-[12px] text-[#9CA3AF] font-bold border border-[#E5E7EB] w-4 h-4 flex items-center justify-center bg-[#F9FAFB]">i</span>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[140%] hidden group-hover:block w-[240px] bg-[#111827] text-[#FFFFFF] text-[12px] p-4 z-50">
                <p className="font-[700] mb-1 text-[#FFE600]">Keyword Heavy (0.4)</p>
                <p className="mb-3 text-[#D1D5DB] leading-relaxed">Prioritizes exact string matches for highly technical controls.</p>
                <p className="font-[700] mb-1 text-[#FFE600]">Balanced (Default 0.6)</p>
                <p className="mb-3 text-[#D1D5DB] leading-relaxed">Best mix of exact keyword matching and conceptual similarity.</p>
                <p className="font-[700] mb-1 text-[#FFE600]">Semantic Heavy (0.7)</p>
                <p className="text-[#D1D5DB] leading-relaxed">Focuses heavily on overall conceptual meaning over exact phrasing.</p>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[100%] hidden group-hover:block w-3 h-3 bg-[#111827] rotate-45 z-40"></div>
            </div>
          </div>
          <div className="relative">
            <select
              id="bulk-alpha"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-full bg-[#FAFAFA] text-[#111827] p-[16px] border border-[#E5E7EB] outline-none text-[14px] focus:border-b-[2px] focus:border-b-[#FFE600] transition-colors appearance-none cursor-pointer font-[600]"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111827%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '0.65rem auto' }}
            >
              <option value={0.4}>Keyword Heavy</option>
              <option value={0.6}>Balanced (Default)</option>
              <option value={0.7}>Semantic Heavy</option>
            </select>
            <div className="mt-3">
               <p className="text-[11px] text-[#9CA3AF] italic">
                 {alpha === 0.4 ? "Prioritizes exact TSC terminology matches" : 
                  alpha === 0.6 ? "Equal weight on keywords and semantics" : 
                  "Prioritizes conceptual similarity"}
               </p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || controlCount === 0}
        className={`w-full h-[52px] font-[800] transition-all duration-200 mt-[32px] z-10 relative flex justify-center items-center text-[15px] tracking-[0.05em] uppercase outline-none ${
          isLoading || controlCount === 0
            ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border border-[#E5E7EB]"
            : "bg-[#FFE600] text-[#111827] border-l-[4px] border-l-[#D4A017] hover:bg-[#FFD700] hover:-translate-y-[2px] active:translate-y-[0px] active:scale-100"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center">
             <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#9CA3AF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             ANALYZING {controlCount} CONTROLS...
          </span>
        ) : "ANALYZE ALL CONTROLS"}
      </button>
    </div>
  );
}
