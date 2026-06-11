const SECTION_ID = "opportunitySize";
const SECTION_TYPE = "opportunitySize";

const params = getSectionParams();
const salesforceName = params.salesforceName;
const submissionId = params.submissionId;

const customerNameEl = document.getElementById("customer-name");
const form = document.getElementById("opportunity-form");
const statusMessageEl = document.getElementById("status-message");
const submitBtn = document.getElementById("submit-btn");
const finalValueEl = document.getElementById("final-value");
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

function formatCurrencyValue(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return "";
  }

  const withoutPrefix = trimmed.replace(/^\$+/, "").trim();
  return `$${withoutPrefix}`;
}

async function handleSubmit(event) {
  event.preventDefault();

  const formattedValue = formatCurrencyValue(form.opportunitySize.value);
  if (!formattedValue || formattedValue === "$") {
    setStatus("Please enter an opportunity size.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  setStatus("Saving locally...", "");

  try {
    const sectionData = {
      type: SECTION_TYPE,
      value: formattedValue,
    };

    finalValueEl.textContent = formattedValue;
    showPane("complete-pane");
    setStatus("Saved. Continuing...", "success", completeMessageEl);
    finishSectionWindow(SECTION_ID, null, sectionData);
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
