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
    console.log("[BULK INPUT] Submitting controls, alpha:", alpha);
    onSubmit(text, alpha);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col h-full space-y-6">
        <div className="flex-grow flex flex-col">
          <label htmlFor="bulk-control" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 pl-1">
            Audit Control Descriptions
          </label>
          <p className="text-xs text-gray-400 mb-3 block pl-1">
            Enter each control on a new line. Separate controls with a blank line.
          </p>
          <textarea
            id="bulk-control"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Enter multiple controls, one per line or separated by blank lines.\n\nExample:\nControl 1: User access is reviewed quarterly...\n\nControl 2: Backup jobs are executed daily..."}
            rows={12}
            className="w-full flex-grow bg-gray-50 hover:bg-white text-gray-800 p-4 border border-gray-200 rounded-2xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-yellow-400/30 focus:border-[#FFE600] shadow-inner transition-all resize-y placeholder-gray-400 leading-relaxed min-h-[140px]"
          />
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#b3a200] text-right pr-2">
            {controlCount} controls detected
          </p>
        </div>

        <div>
          <label htmlFor="bulk-alpha" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">
            Retrieval Strategy
          </label>
          <div className="relative">
            <select
              id="bulk-alpha"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-full bg-gray-50 hover:bg-white text-gray-800 p-4 border border-gray-200 rounded-2xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-yellow-400/30 focus:border-[#FFE600] shadow-sm transition-all appearance-none cursor-pointer font-medium"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.2rem top 50%', backgroundSize: '0.65rem auto' }}
            >
              <option value={0.4}>Keyword Heavy</option>
              <option value={0.6}>Balanced (Default)</option>
              <option value={0.7}>Semantic Heavy</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || controlCount === 0}
        className={`w-full py-4 px-5 rounded-2xl font-bold shadow-sm hover:shadow transition-all duration-200 mt-4 z-10 relative flex justify-center items-center text-sm ${
          isLoading || controlCount === 0
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            : "bg-[#FFE600] text-gray-900 border border-yellow-500/30 hover:bg-yellow-400 active:scale-[0.98]"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center">
             <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             Analyzing {controlCount} controls...
          </span>
        ) : "Analyze All Controls"}
      </button>
    </div>
  );
}
