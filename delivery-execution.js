const DELIVERY_OPTIONS = {
  partner: "A Partner",
  "red-hat-consulting": "Red Hat Consulting Services",
  unknown: "I dont know",
};

const RELATIONSHIP_OPTIONS = {
  great: { label: "Great", score: 11 },
  okay: { label: "Okay, have had some failings in the past", score: 5 },
  avoid: {
    label: "Customer wants to avoid using Red Hat Services or Partner Services",
    score: 0,
  },
};

const SECTION_ID = "deliveryExecution";
const SECTION_TYPE = "deliveryExecution";

const params = new URLSearchParams(window.location.search);
const salesforceName = params.get("salesforceName") || "";
const submissionId = params.get("submissionId") || "";

let selectedDelivery = "";

const customerNameEl = document.getElementById("customer-name");
const continueBtn = document.getElementById("continue-btn");
const backBtn = document.getElementById("back-btn");
const submitBtn = document.getElementById("submit-btn");
const pane1MessageEl = document.getElementById("pane-1-message");
const pane2MessageEl = document.getElementById("pane-2-message");
const finalDeliveryEl = document.getElementById("final-delivery");
const finalScoreEl = document.getElementById("final-score");
const completeMessageEl = document.getElementById("complete-message");
const errorMessageEl = document.getElementById("error-message");

function showPane(paneId) {
  document.querySelectorAll(".question-pane").forEach((pane) => {
    pane.classList.remove("active");
  });
  document.getElementById(paneId).classList.add("active");
}

function setPaneMessage(text, type, targetEl) {
  targetEl.textContent = text;
  targetEl.className = `form-message ${type}`;
}

function getSelectedDeliveryOptions() {
  return Array.from(document.querySelectorAll('input[name="delivery"]:checked')).map(
    (input) => DELIVERY_OPTIONS[input.value]
  );
}

function handleContinue() {
  const selections = getSelectedDeliveryOptions();

  if (selections.length === 0) {
    setPaneMessage(
      "Please select at least one delivery option.",
      "error",
      pane1MessageEl
    );
    return;
  }

  selectedDelivery = selections.join(", ");
  setPaneMessage("", "", pane1MessageEl);
  showPane("pane-2");
}

function handleBack() {
  setPaneMessage("", "", pane2MessageEl);
  showPane("pane-1");
}

async function handleSubmit() {
  const selectedRelationship = document.querySelector(
    'input[name="relationship"]:checked'
  );
  const relationship = selectedRelationship
    ? RELATIONSHIP_OPTIONS[selectedRelationship.value]
    : null;

  if (!relationship) {
    setPaneMessage(
      "Please select a relationship rating.",
      "error",
      pane2MessageEl
    );
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  setPaneMessage("Saving to Google Sheets...", "", pane2MessageEl);

  try {
    await submitSectionSelection({
      type: SECTION_TYPE,
      submissionId,
      selectedValue: selectedDelivery,
      score: relationship.score,
    });

    finalDeliveryEl.textContent = selectedDelivery;
    finalScoreEl.textContent = String(relationship.score);
    showPane("complete-pane");
    setPaneMessage("Saved. Continuing...", "success", completeMessageEl);
    finishSectionWindow(SECTION_ID, relationship.score);
  } catch (error) {
    setPaneMessage(
      error.message || "Could not save. Please try again.",
      "error",
      pane2MessageEl
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
  continueBtn.addEventListener("click", handleContinue);
  backBtn.addEventListener("click", handleBack);
  submitBtn.addEventListener("click", handleSubmit);
}

init();
