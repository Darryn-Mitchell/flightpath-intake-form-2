const SCORES = {
  "1-yes": 11,
  "2-yes": 7,
  "3-yes": 3,
  "3-no": 0,
};

const SECTION_ID = "customerProblemStatement";
const SECTION_TYPE = "customerProblemStatement";

const params = getSectionParams();
const salesforceName = params.salesforceName;
const submissionId = params.submissionId;

const customerNameEl = document.getElementById("customer-name");
const finalScoreEl = document.getElementById("final-score");
const statusMessageEl = document.getElementById("status-message");
const errorMessageEl = document.getElementById("error-message");

function showPane(paneId) {
  document.querySelectorAll(".question-pane").forEach((pane) => {
    pane.classList.remove("active");
  });
  document.getElementById(paneId).classList.add("active");
}

function setStatus(text, type) {
  statusMessageEl.textContent = text;
  statusMessageEl.className = `form-message ${type}`;
}

const answers = {};

async function finishSection(score, answers) {
  document.querySelectorAll(".yes-no-actions button").forEach((button) => {
    button.disabled = true;
  });

  finalScoreEl.textContent = String(score);
  showPane("complete-pane");
  setStatus("Saving locally...", "");

  try {
    const sectionData = {
      type: SECTION_TYPE,
      score,
      answers,
    };

    setStatus("Saved. Continuing...", "success");
    finishSectionWindow(SECTION_ID, score, sectionData);
  } catch (error) {
    setStatus(
      error.message || "Could not save. Please try again.",
      "error"
    );
    document.querySelectorAll(".yes-no-actions button").forEach((button) => {
      button.disabled = false;
    });
  }
}

function handleAnswer(question, answer) {
  const isYes = answer === "yes";
  answers[`question${question}`] = answer;

  if (question === 1) {
    if (isYes) {
      finishSection(SCORES["1-yes"], answers);
      return;
    }
    showPane("pane-2");
    return;
  }

  if (question === 2) {
    if (isYes) {
      finishSection(SCORES["2-yes"], answers);
      return;
    }
    showPane("pane-3");
    return;
  }

  if (question === 3) {
    finishSection(isYes ? SCORES["3-yes"] : SCORES["3-no"], answers);
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

  document.querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () => {
      handleAnswer(Number(button.dataset.question), button.dataset.answer);
    });
  });
}

init();
