import React, { useState, useRef } from 'react';
import { uploadSection3, extractControls } from "../api/match";

const DOMAIN_OPTIONS = [
  "Governance",
  "Access Control",
  "Risk Management",
  "Change Management",
  "Incident Response",
  "Availability",
  "Confidentiality",
  "Privacy",
  "Processing Integrity",
  "Vendor Management",
  "Monitoring",
  "Other"
];

export default function Section3Upload({ onControlsReady }) {
  const [uploadState, setUploadState] = useState("idle");
  // idle | uploading | extracting | review | error
  const [extractedControls, setExtractedControls] = useState([]);
  const [editableControls, setEditableControls] = useState([]);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [editingAll, setEditingAll] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    
    setFileName(file.name);
    setUploadState("uploading");
    setError(null);
    
    try {
      console.log("[SECTION3] Starting upload...");
      const uploadResult = await uploadSection3(file);
      console.log("[SECTION3] Upload complete, starting extraction...");
      
      setUploadState("extracting");
      
      const extractResult = await extractControls(uploadResult.text);
      console.log("[SECTION3] Extraction complete:", extractResult.count, "controls");
      
      setExtractedControls(extractResult.controls);
      setEditableControls(extractResult.controls.map(c => ({
        ...c,
        include: true
      })));
      
      setUploadState("review");
    } catch (err) {
      console.error("[SECTION3] Error:", err);
      setError(err.message || "Failed to process document");
      setUploadState("error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUpdateControl = (idx, field, value) => {
    const newControls = [...editableControls];
    newControls[idx][field] = value;
    setEditableControls(newControls);
  };

  const handleToggleInclude = (idx) => {
    const newControls = [...editableControls];
    newControls[idx].include = !newControls[idx].include;
    setEditableControls(newControls);
  };

  const handleRunAnalysis = () => {
    const checkedControls = editableControls
      .filter(c => c.include)
      .map(c => ({
        control_number: c.control_number,
        control_description: c.control_description,
        domain: c.domain
      }));
    
    console.log("[SECTION3] Passing", checkedControls.length, "controls to analysis");
    onControlsReady(checkedControls);
  };

  const handleReset = () => {
    setUploadState("idle");
    setExtractedControls([]);
    setEditableControls([]);
    setError(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const checkedCount = editableControls.filter(c => c.include).length;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {uploadState === "idle" && (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="h-[200px] border-2 border-dashed border-[#E5E7EB] rounded-none flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-[#FFE600] hover:bg-[#FFFBCC]"
          >
            <svg className="w-12 h-12 text-[#9CA3AF] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-[600] text-[#111827] text-[14px]">Drop your Section 3 document here</p>
            <p className="text-[#9CA3AF] text-[13px] mt-2">or click to browse</p>
            <p className="text-[#9CA3AF] text-[11px] mt-1">Supports PDF and DOCX</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            className="hidden"
          />
        </div>
      )}

      {uploadState === "uploading" && (
        <div className="space-y-4">
          <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="flex items-center gap-3 mb-3">
              <svg className="animate-spin h-5 w-5 text-[#FFE600]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-[600] text-[#111827]">{fileName}</span>
            </div>
            <p className="text-[13px] text-[#6B7280]">Extracting text from document...</p>
            <div className="h-1 bg-[#E5E7EB] mt-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#FFE600] via-[#FFF59D] to-[#FFE600] animate-shimmer" style={{backgroundSize: '200% 100%'}}></div>
            </div>
          </div>
        </div>
      )}

      {uploadState === "extracting" && (
        <div className="space-y-4">
          <div className="p-6 bg-[#F9FAFB] border border-[#E5E7EB] text-center">
            <div className="flex justify-center mb-4">
              <span className="inline-flex gap-1">
                <span className="inline-block w-2 h-2 bg-[#FFE600] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                <span className="inline-block w-2 h-2 bg-[#FFE600] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="inline-block w-2 h-2 bg-[#FFE600] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </span>
            </div>
            <p className="font-[600] text-[#111827] text-[14px]">AI is reading Section 3 and identifying controls...</p>
            <p className="text-[#9CA3AF] text-[12px] mt-2">This may take 15-20 seconds</p>
          </div>
        </div>
      )}

      {uploadState === "review" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-[700] text-[18px] text-[#111827]">{editableControls.length} Controls Extracted from {fileName}</h2>
            <p className="text-[13px] text-[#6B7280] mt-1">Review and edit before running analysis</p>
          </div>

          <div className="border border-[#E5E7EB]">
            <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-[600] text-[12px] text-[#9CA3AF] uppercase">Edit All</span>
                <button
                  onClick={() => setEditingAll(!editingAll)}
                  className={`w-5 h-5 border border-[#D1D5DB] flex items-center justify-center transition-colors ${editingAll ? 'bg-[#FFE600] border-[#FFE600]' : 'hover:border-[#FFE600]'}`}
                >
                  {editingAll && <span className="text-[11px] font-bold text-[#111827]">✓</span>}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="px-4 py-3 text-left font-[600] text-[#9CA3AF] w-8">#</th>
                    <th className="px-4 py-3 text-left font-[600] text-[#9CA3AF]" style={{width: '55%'}}>Control Description</th>
                    <th className="px-4 py-3 text-left font-[600] text-[#9CA3AF] w-1/4">Domain</th>
                    <th className="px-4 py-3 text-center font-[600] text-[#9CA3AF] w-12">Include</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {editableControls.map((control, idx) => (
                    <tr key={idx} className="hover:bg-[#FFFBCC] transition-colors">
                      <td className="px-4 py-3 text-[#9CA3AF] font-[600]">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <textarea
                          value={control.control_description}
                          onChange={(e) => handleUpdateControl(idx, 'control_description', e.target.value)}
                          className="w-full bg-transparent text-[#374151] outline-none border border-transparent border-b-[1px] border-b-[#E5E7EB] focus:border-b-[2px] focus:border-b-[#FFE600] focus:bg-white transition-all resize-y p-1"
                          rows={editingAll ? 6 : 5}
                          style={{minHeight: '120px'}}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={control.domain}
                          onChange={(e) => handleUpdateControl(idx, 'domain', e.target.value)}
                          className="w-full bg-transparent text-[#374151] outline-none border border-transparent border-b-[1px] border-b-[#E5E7EB] focus:border-b-[2px] focus:border-b-[#FFE600] focus:bg-white transition-all p-1"
                        >
                          {DOMAIN_OPTIONS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleInclude(idx)}
                          className={`w-5 h-5 border border-[#D1D5DB] flex items-center justify-center transition-colors ${control.include ? 'bg-[#FFE600] border-[#FFE600]' : 'hover:border-[#FFE600]'}`}
                        >
                          {control.include && <span className="text-[11px] font-bold text-[#111827]">✓</span>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 font-[600] text-[13px] text-[#111827] bg-white border-[2px] border-[#E5E7EB] hover:border-[#FFE600] hover:bg-[#FFFBCC] transition-colors"
            >
              Re-upload Document
            </button>
            <button
              onClick={handleRunAnalysis}
              disabled={checkedCount === 0}
              className={`px-6 py-2 font-[700] text-[13px] uppercase tracking-wide ${
                checkedCount === 0
                  ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                  : 'bg-[#FFE600] text-[#111827] hover:bg-[#FFF59D] transition-colors'
              }`}
            >
              Run Analysis on {checkedCount} Control{checkedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {uploadState === "error" && (
        <div className="space-y-4">
          <div className="p-4 bg-[#FEE2E2] border-2 border-[#EF4444]">
            <p className="font-[600] text-[#991B1B] text-[14px]">Error</p>
            <p className="text-[#7F1D1D] text-[13px] mt-2">{error}</p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 font-[600] text-[13px] text-[#111827] bg-white border-[2px] border-[#E5E7EB] hover:border-[#FFE600] hover:bg-[#FFFBCC] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
