import { useState } from "react";

export default function ControlInput({ onSubmit, isLoading }) {
  const [control, setControl] = useState("");
  const [alpha, setAlpha] = useState(0.6);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("[INPUT] Submitting control, alpha:", alpha);
    onSubmit(control, alpha);
  };

  const charCount = control.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="control" className="block text-sm font-semibold text-gray-700 mb-2">
          Audit Control Description
        </label>
        <textarea
          id="control"
          value={control}
          onChange={(e) => setControl(e.target.value)}
          placeholder="Paste your audit control description here..."
          rows={6}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:shadow-md transition-all duration-300 resize-y"
        />
        <p className="mt-2 text-xs text-gray-400 font-medium text-right">{charCount} characters</p>
      </div>

      <div>
        <label htmlFor="alpha" className="block text-sm font-semibold text-gray-700 mb-2">
          Retrieval Strategy
        </label>
        <div className="relative">
          <select
            id="alpha"
            value={alpha}
            onChange={(e) => setAlpha(parseFloat(e.target.value))}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:shadow-md appearance-none transition-all duration-300 cursor-pointer hover:border-gray-300"
          >
            <option value={0.4}>Keyword Heavy</option>
            <option value={0.6}>Balanced (Default)</option>
            <option value={0.7}>Semantic Heavy</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !control.trim()}
        className={`w-full py-3.5 px-4 rounded-sm font-semibold shadow-sm transition-all duration-300 mt-2 flex justify-center items-center ${
          isLoading || !control.trim()
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            : "bg-yellow-500 text-white hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/30 active:bg-yellow-600 active:scale-[0.98] border border-transparent hover:-translate-y-1"
        }`}
      >
        {isLoading ? "Analyzing..." : "Analyze Control"}
      </button>
    </form>
  );

}
