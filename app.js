function renderRecommendation(session) {
  const panelEl = document.getElementById("recommendation-panel");
  const recommendationEl = document.getElementById("flightpath-recommendation");

  if (!session || !isAssessmentComplete(session)) {
    panelEl.classList.add("hidden");
    return;
  }

  const totalScore =
    session.totalScore !== null && session.totalScore !== undefined
      ? session.totalScore
      : calculateTotalScore(session);
  const recommendation =
    session.recommendation || getFlightPathRecommendation(totalScore);

  panelEl.classList.remove("hidden");
  recommendationEl.textContent = recommendation.text;
  recommendationEl.className = `flightpath-recommendation ${recommendation.level}`;

  maybeSaveFinalTally(session);
}

function renderSectionStatus() {
  const listEl = document.getElementById("section-status-list");
  const customerEl = document.getElementById("active-customer");
  const hintEl = document.getElementById("status-hint");
  const session = getActiveSubmission();

  listEl.innerHTML = "";

  if (!session) {
    customerEl.classList.add("hidden");
    customerEl.textContent = "";
    hintEl.textContent =
      "Complete the intake form to begin tracking assessment progress.";
    renderRecommendation(null);
  } else {
    customerEl.classList.remove("hidden");
    customerEl.textContent = session.salesforceName;

    if (isAssessmentComplete(session)) {
      hintEl.textContent = "Assessment complete. See your recommendation below.";
    } else {
      hintEl.textContent =
        "Green sections are complete. Click a grey section to continue the assessment.";
    }
  }

  SECTIONS.forEach((section) => {
    const isComplete = Boolean(session?.sections?.[section.id]);
    const isAvailable = Boolean(session && section.page);
    const item = document.createElement("li");
    item.className = `section-status ${isComplete ? "complete" : "outstanding"}${isAvailable ? " clickable" : ""}`;

    if (isAvailable) {
      item.setAttribute("role", "button");
      item.tabIndex = 0;
      item.title = isComplete
        ? `Reopen ${section.label}`
        : `Start ${section.label}`;
      item.addEventListener("click", () => {
        openSectionWindow(section.id);
      });
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openSectionWindow(section.id);
        }
      });
    }

    const indicator = document.createElement("span");
    indicator.className = "status-indicator";
    indicator.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "section-name";
    label.textContent = section.label;

    const badge = document.createElement("span");
    badge.className = "status-badge";
    badge.textContent = isComplete ? "Complete" : "Outstanding";

    item.append(indicator, label, badge);
    listEl.appendChild(item);
  });

  renderRecommendation(session);
}

function openExecutiveEngagement({ salesforceName, submissionId }) {
  const session = getActiveSubmission();
  if (
    session &&
    session.submissionId === submissionId &&
    session.salesforceName === salesforceName
  ) {
    openSectionWindow("executiveEngagement");
    return;
  }

  // Fallback - should not normally reach here
  openSectionWindow("executiveEngagement");
}

const openBtn = document.getElementById("open-form-btn");
const closeBtn = document.getElementById("close-form-btn");
const cancelBtn = document.getElementById("cancel-form-btn");
const overlay = document.getElementById("form-overlay");
const form = document.getElementById("intake-form");
const messageEl = document.getElementById("form-message");
const submitBtn = document.getElementById("submit-form-btn");

function openForm() {
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  document.getElementById("salesforce-name").focus();
}

function closeForm() {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  clearMessage();
}

function clearMessage() {
  messageEl.textContent = "";
  messageEl.className = "form-message";
}

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `form-message ${type}`;
}

async function submitForm(event) {
  event.preventDefault();
  clearMessage();

  if (!form.reportValidity()) {
    return;
  }

  const submittedAt = new Date().toISOString();
  const submissionId = createSubmissionId();
  const salesforceName = form.salesforceName.value.trim();

  submitBtn.disabled = true;
  submitBtn.textContent = "Starting...";

  try {
    console.log("DEBUG: Starting form submission");

    // Save intake data locally - don't submit to backend yet
    createSubmissionSession({
      submissionId,
      salesforceName,
      intakeData: {
        salesforceName,
        segment: form.segment.value,
        region: form.region.value,
        submittedAt,
        submissionId,
      },
    });

    console.log("DEBUG: Session created");

    renderSectionStatus();
    console.log("DEBUG: Status rendered");

    openExecutiveEngagement({ salesforceName, submissionId });
    console.log("DEBUG: Opening executive engagement");

    form.reset();
    setMessage("Assessment started! Complete all sections to save.", "success");
    setTimeout(closeForm, 2000);
  } catch (error) {
    console.error("DEBUG: Error caught:", error);
    setMessage(
      error.message || "Something went wrong. Please try again.",
      "error"
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
}

openBtn.addEventListener("click", openForm);
closeBtn.addEventListener("click", closeForm);
cancelBtn.addEventListener("click", closeForm);
overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    closeForm();
  }
});
form.addEventListener("submit", submitForm);

// Section modal close button
const closeSectionBtn = document.getElementById("close-section-btn");
const sectionOverlay = document.getElementById("section-overlay");

if (closeSectionBtn) {
  closeSectionBtn.addEventListener("click", closeSectionModal);
}

if (sectionOverlay) {
  sectionOverlay.addEventListener("click", (event) => {
    if (event.target === sectionOverlay) {
      closeSectionModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!overlay.classList.contains("hidden")) {
      closeForm();
    } else if (!sectionOverlay.classList.contains("hidden")) {
      closeSectionModal();
    }
  }
});

// Listen for section completion messages from iframe
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  if (event.data.type === "section-complete") {
    const { sectionId, score, data } = event.data;

    // Mark section complete in parent context
    markSectionComplete(sectionId, score, data);

    setTimeout(() => {
      const session = getActiveSubmission();
      const nextSection = SECTIONS.find(
        (section) => section.page && !session?.sections[section.id]
      );

      if (nextSection) {
        // Close current modal and open next section
        closeSectionModal();
        setTimeout(() => {
          loadSectionInModal(nextSection.id);
        }, 300);
        return;
      }

      // All sections complete - close modal
      closeSectionModal();
    }, 1000);
  }
});

resetActiveSubmission();
renderSectionStatus();
onStatusUpdate(() => {
  renderSectionStatus();
});
window.addEventListener("flightpath-session-updated", () => {
  renderSectionStatus();
});
