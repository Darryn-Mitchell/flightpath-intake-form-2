const ARR_OPTIONS = {
  "100k-500k": { label: "$100k - $500k", score: 2 },
  "500k-1.5m": { label: "$500k - $1.5M", score: 11 },
  "1.5m-3m": { label: "$1.5M - $3M", score: 7 },
  "3m-5m": { label: "$3M - $5M", score: 5 },
  "5m-plus": { label: "$5M+", score: 2 },
};

const SECTION_ID = "customerArr";
const SECTION_TYPE = "customerArr";

const params = getSectionParams();
const salesforceName = params.salesforceName;
const submissionId = params.submissionId;

const customerNameEl = document.getElementById("customer-name");
const form = document.getElementById("arr-form");
const statusMessageEl = document.getElementById("status-message");
const submitBtn = document.getElementById("submit-btn");
const finalSelectionEl = document.getElementById("final-selection");
const finalScoreEl = document.getElementById("final-score");
const completeMessageEl = document.getElementById("complete-message");
const errorMessageEl = document.getElementById("error-message");

function showPane(paneId) {
  document.querySelectorAll(".question-pane").forEach((pane) => {
    pane.classList.remove("active");
  });
  document.getElementById(paneId).classList.add("active");
}

function setStatus(text, type, targetEl = statusMessageEl) {
  targetEl.textContent = text;
  targetEl.className = `form-message ${type}`;
}

async function handleSubmit(event) {
  event.preventDefault();

  const selectedKey = form.arrRange.value;
  const option = ARR_OPTIONS[selectedKey];

  if (!option) {
    setStatus("Please select an ARR range.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  setStatus("Saving locally...", "");

  try {
    const sectionData = {
      type: SECTION_TYPE,
      selectedValue: option.label,
      score: option.score,
    };

    finalSelectionEl.textContent = option.label;
    finalScoreEl.textContent = String(option.score);
    showPane("complete-pane");
    setStatus("Saved. Continuing...", "success", completeMessageEl);
    finishSectionWindow(SECTION_ID, option.score, sectionData);
  } catch (error) {
    setStatus(
      error.message || "Could not save. Please try again.",
      "error"
    );
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
}

function init() {
  if (!salesforceName || !submissionId) {
    showPane("error-pane");
    errorMessageEl.textContent =
      "Missing customer details. Please start from the FlightPath Intake Form.";
    return;
  }

  customerNameEl.textContent = salesforceName;
  form.addEventListener("submit", handleSubmit);
}

init();
