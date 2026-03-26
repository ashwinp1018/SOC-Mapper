import { useState } from "react";

export default function ControlInput({ onSubmit, isLoading }) {
  const [control, setControl] = useState("");
  const [alpha, setAlpha] = useState(0.6);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(control, alpha);
  };

  const charCount = control.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-[28px]">
      <div className="flex-grow flex flex-col">
        <textarea
          id="control"
          value={control}
          onChange={(e) => setControl(e.target.value)}
          placeholder="Paste your audit control description here..."
          rows={7}
          className="w-full flex-grow bg-[#FAFAFA] text-[#111827] p-[16px] border border-transparent border-b-[2px] border-b-[#FFE600] outline-none text-[15px] focus:border-[2px] focus:border-[#FFE600] focus:bg-[#FFFFFF] transition-all duration-150 resize-y placeholder-[#9CA3AF] leading-relaxed min-h-[140px]"
        />
        <div className="flex justify-end mt-2">
          <p className={`text-[12px] font-[700] tracking-wider ${charCount > 500 ? 'text-[#D4A017]' : 'text-[#9CA3AF]'}`}>
            {charCount} / ∞
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-3">
          <label htmlFor="alpha" className="block text-[11px] font-[600] text-[#6B7280] uppercase tracking-[0.1em]">
            Retrieval Strategy
          </label>
          <div className="relative group cursor-help flex items-center">
            <span className="text-[12px] text-[#9CA3AF] font-bold border border-[#E5E7EB] w-4 h-4 flex items-center justify-center rounded-full bg-[#F9FAFB]">i</span>
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
            id="alpha"
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

      <button
        type="submit"
        disabled={isLoading || !control.trim()}
        className={`w-full h-[52px] font-[800] transition-all duration-200 flex justify-center items-center text-[15px] tracking-[0.05em] uppercase outline-none ${
          isLoading || !control.trim()
            ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border border-[#E5E7EB]"
            : "bg-[#FFE600] text-[#111827] border-l-[4px] border-l-[#D4A017] hover:bg-[#FFD700] hover:-translate-y-[2px] active:translate-y-[0px] active:scale-100"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#9CA3AF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ANALYZING...
          </span>
        ) : "ANALYZE CONTROL"}
      </button>
    </form>
  );
}
