function getApiUrl() {
  return window.FLIGHTPATH_CONFIG?.apiUrl || "/api/submit";
}

function createSubmissionId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `submission-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function submitToBackend(payload) {
  const apiUrl = getApiUrl();

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit data");
  }

  return response.json();
}

// These functions are NO-OPs now - sections save locally only
async function submitSectionScore({ type, submissionId, score }) {
  // Do nothing - data saved locally via finishSectionWindow
  return Promise.resolve({ success: true, savedLocally: true });
}

async function submitSectionSelection({ type, submissionId, selectedValue, score }) {
  // Do nothing - data saved locally via finishSectionWindow
  return Promise.resolve({ success: true, savedLocally: true });
}

async function submitSectionValue({ type, submissionId, value }) {
  // Do nothing - data saved locally via finishSectionWindow
  return Promise.resolve({ success: true, savedLocally: true });
}

async function submitCompleteAssessment(session) {
  if (!session || !isAssessmentComplete(session)) {
    throw new Error("Assessment is not complete");
  }

  const totalScore =
    session.totalScore !== null && session.totalScore !== undefined
      ? session.totalScore
      : calculateTotalScore(session);
  const recommendation =
    session.recommendation || getFlightPathRecommendation(totalScore);

  // DISABLED: No backend submission while form is being updated
  console.log("Backend submission disabled - would have sent:", {
    type: "completeAssessment",
    submissionId: session.submissionId,
    intakeData: session.intakeData,
    totalScore,
    recommendation: recommendation.text,
  });

  // await submitToBackend(payload);

  session.tallySaved = true;
  session.totalScore = totalScore;
  session.recommendation = recommendation;
  setActiveSubmission(session);
  broadcastStatusUpdate(session);
}

async function maybeSaveFinalTally(session) {
  if (!session || !isAssessmentComplete(session) || session.tallySaved) {
    return;
  }

  try {
    await submitCompleteAssessment(session);
  } catch (error) {
    console.error("Failed to save complete assessment:", error);
  }
}

window.addEventListener("flightpath-session-updated", (event) => {
  maybeSaveFinalTally(event.detail);
});
