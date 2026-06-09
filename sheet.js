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

async function submitSectionScore({ type, submissionId, score }) {
  return submitToBackend({
    type,
    submissionId,
    score,
  });
}

async function submitSectionSelection({ type, submissionId, selectedValue, score }) {
  return submitToBackend({
    type,
    submissionId,
    selectedValue,
    score,
  });
}

async function submitSectionValue({ type, submissionId, value }) {
  return submitToBackend({
    type,
    submissionId,
    value,
  });
}

async function maybeSaveFinalTally(session) {
  if (!session || !isAssessmentComplete(session) || session.tallySaved) {
    return;
  }

  const totalScore =
    session.totalScore !== null && session.totalScore !== undefined
      ? session.totalScore
      : calculateTotalScore(session);
  const recommendation =
    session.recommendation || getFlightPathRecommendation(totalScore);

  try {
    await submitToBackend({
      type: "finalTally",
      submissionId: session.submissionId,
      totalScore,
      recommendation: recommendation.text,
    });

    session.tallySaved = true;
    session.totalScore = totalScore;
    session.recommendation = recommendation;
    setActiveSubmission(session);
    broadcastStatusUpdate(session);
  } catch (error) {
    console.error("Failed to save final tally:", error);
  }
}

window.addEventListener("flightpath-session-updated", (event) => {
  maybeSaveFinalTally(event.detail);
});
