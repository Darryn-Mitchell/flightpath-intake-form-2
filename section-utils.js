// Utility functions for section pages
// Works in both iframe (modal) and standalone window modes

function getSectionParams() {
  // Always get from URL (works for both iframe and standalone)
  const urlParams = new URLSearchParams(window.location.search);
  return {
    salesforceName: urlParams.get("salesforceName") || "",
    submissionId: urlParams.get("submissionId") || ""
  };
}
