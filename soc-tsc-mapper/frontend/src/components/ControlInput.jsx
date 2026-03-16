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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="control" className="block text-sm font-medium text-gray-300 mb-2">
          Audit Control Description
        </label>
        <textarea
          id="control"
          value={control}
          onChange={(e) => setControl(e.target.value)}
          placeholder="Paste your audit control description here..."
          rows={6}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-2 text-xs text-gray-400">{charCount} characters</p>
      </div>

      <div>
        <label htmlFor="alpha" className="block text-sm font-medium text-gray-300 mb-2">
          Retrieval Strategy
        </label>
        <select
          id="alpha"
          value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={0.4}>Keyword Heavy</option>
          <option value={0.6}>Balanced (Default)</option>
          <option value={0.7}>Semantic Heavy</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading || !control.trim()}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isLoading || !control.trim()
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
        }`}
      >
        {isLoading ? "Analyzing..." : "Analyze Control"}
      </button>
    </form>
  );
}
