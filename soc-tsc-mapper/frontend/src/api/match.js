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
