/**
 * API module for calling the /match endpoint on the FastAPI backend.
 */

export async function callMatch(control, alpha) {
  console.log("[API] Calling /match with alpha:", alpha);
  
  try {
    const response = await fetch("http://localhost:8000/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ control, alpha })
    });
    
    console.log("[API] Response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("[API] Response data:", data);
    
    return data;
  } catch (error) {
    console.error("[API] Error calling /match:", error.message);
    throw error;
  }
}

export async function callMatchBulk(controls, alpha) {
  console.log("[API BULK] Sending", controls.length, "controls");
  
  try {
    const response = await fetch("http://localhost:8000/match/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ controls, alpha, top_k: 3 })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("[API BULK] Response:", data);
    return data;
  } catch (error) {
    console.error("[API BULK] Error:", error.message);
    throw error;
  }
}

export async function generateNarrative(controlText, criteria) {
  console.log("[API] Generating narrative for criteria:", criteria);
  
  const response = await fetch("http://localhost:8000/generate-narrative", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      control_text: controlText,
      criteria: criteria
    })
  });
  
  console.log("[API] Narrative response status:", response.status);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate narrative");
  }
  
  const data = await response.json();
  console.log("[API] Narrative received:", data.narrative?.substring(0, 80));
  return data;
}

export async function uploadSection3(file) {
  console.log("[API] Uploading Section 3:", file.name)
  const formData = new FormData()
  formData.append("file", file)
  
  const response = await fetch("http://localhost:8000/upload-section3", {
    method: "POST",
    body: formData
  })
  
  console.log("[API] Upload response status:", response.status)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Upload failed")
  }
  return await response.json()
}

export async function extractControls(text) {
  console.log("[API] Extracting controls from", text.length, "chars")
  
  const response = await fetch("http://localhost:8000/extract-controls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  })
  
  console.log("[API] Extract response status:", response.status)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Extraction failed")
  }
  return await response.json()
}
