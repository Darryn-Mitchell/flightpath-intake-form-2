const SECTIONS = [
  {
    id: "executiveEngagement",
    label: "Executive Engagement",
    page: "executive-engagement.html",
  },
  {
    id: "customerTechnology",
    label: "Customer Technology",
    page: "customer-technology.html",
  },
  {
    id: "customerArr",
    label: "Customer ARR",
    page: "customer-arr.html",
  },
  {
    id: "opportunitySize",
    label: "Opportunity Size",
    page: "opportunity-size.html",
  },
  {
    id: "deliveryExecution",
    label: "Delivery & Execution",
    page: "delivery-execution.html",
  },
  {
    id: "customerProblemStatement",
    label: "Customer problem statement",
    page: "customer-problem-statement.html",
  },
  {
    id: "customerStrategicDirection",
    label: "Customer Strategic direction",
    page: "customer-strategic-direction.html",
  },
  {
    id: "executiveSponsorship",
    label: "Executive Sponsorship",
    page: "executive-sponsorship.html",
  },
];

const SCORING_SECTION_IDS = [
  "executiveEngagement",
  "customerTechnology",
  "customerArr",
  "deliveryExecution",
  "customerProblemStatement",
  "customerStrategicDirection",
  "executiveSponsorship",
];

const STORAGE_KEY = "flightpath-active-submission";
const STATUS_CHANNEL = "flightpath-status";

function createEmptySectionStatus() {
  return SECTIONS.reduce((sections, section) => {
    sections[section.id] = false;
    return sections;
  }, {});
}

function createEmptyScores() {
  return SCORING_SECTION_IDS.reduce((scores, sectionId) => {
    scores[sectionId] = null;
    return scores;
  }, {});
}

function getActiveSubmission() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function setActiveSubmission(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function resetActiveSubmission() {
  localStorage.removeItem(STORAGE_KEY);
  broadcastStatusUpdate(null);
}

function createSubmissionSession({ submissionId, salesforceName, intakeData }) {
  const session = {
    submissionId,
    salesforceName,
    sections: createEmptySectionStatus(),
    scores: createEmptyScores(),
    sectionData: {}, // Store all section responses
    intakeData: intakeData || null, // Store intake form data
    totalScore: null,
    recommendation: null,
    tallySaved: false,
    createdAt: new Date().toISOString(),
  };

  setActiveSubmission(session);
  broadcastStatusUpdate(session);
  return session;
}

function isAssessmentComplete(session) {
  if (!session?.sections) {
    return false;
  }

  return SECTIONS.every((section) => Boolean(session.sections[section.id]));
}

function calculateTotalScore(session) {
  if (!session?.scores) {
    return 0;
  }

  return SCORING_SECTION_IDS.reduce((total, sectionId) => {
    const score = Number(session.scores[sectionId]);
    return total + (Number.isNaN(score) ? 0 : score);
  }, 0);
}

function getFlightPathRecommendation(totalScore) {
  if (totalScore > 30) {
    return {
      text: "Customer is a strong fit for FlightPath engagement",
      level: "good",
    };
  }

  if (totalScore > 20) {
    return {
      text: "Customer is a potential fit for FlightPath",
      level: "okay",
    };
  }

  return {
    text: "Customer is not currently a good fit for FlightPath, see recommendations",
    level: "not-fit",
  };
}

function markSectionComplete(sectionId, score, data) {
  const session = getActiveSubmission();
  if (!session || !session.sections || !(sectionId in session.sections)) {
    return null;
  }

  session.sections[sectionId] = true;

  if (!session.scores) {
    session.scores = createEmptyScores();
  }

  if (!session.sectionData) {
    session.sectionData = {};
  }

  if (
    SCORING_SECTION_IDS.includes(sectionId) &&
    score !== undefined &&
    score !== null &&
    !Number.isNaN(Number(score))
  ) {
    session.scores[sectionId] = Number(score);
  }

  // Store section-specific data
  if (data !== undefined && data !== null) {
    session.sectionData[sectionId] = data;
  }

  if (isAssessmentComplete(session)) {
    session.totalScore = calculateTotalScore(session);
    session.recommendation = getFlightPathRecommendation(session.totalScore);
  }

  setActiveSubmission(session);
  broadcastStatusUpdate(session);
  window.dispatchEvent(
    new CustomEvent("flightpath-session-updated", { detail: session })
  );
  return session;
}

function broadcastStatusUpdate(session) {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  const channel = new BroadcastChannel(STATUS_CHANNEL);
  channel.postMessage({ type: "status-update", session });
  channel.close();
}

function onStatusUpdate(callback) {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(STATUS_CHANNEL);
    channel.addEventListener("message", (event) => {
      if (event.data?.type === "status-update") {
        callback(event.data.session);
      }
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      callback(getActiveSubmission());
    }
  });
}

function getSectionById(sectionId) {
  return SECTIONS.find((section) => section.id === sectionId) || null;
}

function loadSectionInModal(sectionId) {
  const session = getActiveSubmission();
  const section = getSectionById(sectionId);

  if (!session || !section?.page) {
    return false;
  }

  const overlay = document.getElementById("section-overlay");
  const iframe = document.getElementById("section-frame");
  const title = document.getElementById("section-modal-title");

  // Set modal title
  title.textContent = section.label;

  // Build URL with params
  const params = new URLSearchParams({
    salesforceName: session.salesforceName,
    submissionId: session.submissionId,
  });

  // Load section in iframe
  iframe.src = `${section.page}?${params.toString()}`;

  // Show the modal
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");

  return true;
}

function openSectionWindow(sectionId) {
  return loadSectionInModal(sectionId);
}

function closeSectionModal() {
  const overlay = document.getElementById("section-overlay");
  const iframe = document.getElementById("section-frame");

  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  iframe.src = "about:blank";
}

function finishSectionWindow(sectionId, score, data) {
  // Check if we're in an iframe (modal context)
  if (window.parent !== window) {
    // Send message to parent window
    window.parent.postMessage({
      type: "section-complete",
      sectionId,
      score,
      data
    }, window.location.origin);
    return;
  }

  // Standalone window mode (fallback)
  markSectionComplete(sectionId, score, data);

  setTimeout(() => {
    const session = getActiveSubmission();
    const nextSection = SECTIONS.find(
      (section) => section.page && !session?.sections[section.id]
    );

    if (nextSection) {
      const params = new URLSearchParams({
        salesforceName: session.salesforceName,
        submissionId: session.submissionId,
      });
      window.location.href = `${nextSection.page}?${params.toString()}`;
      return;
    }

    window.close();
  }, 1000);
}
