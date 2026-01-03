"use strict";

// ============================================================================
// 1. CONFIGURATION
// ============================================================================

// Function to get the API URL dynamically from the window object (passed from Flask)
function getSheetApiUrl() {
  if (window.flaskUrls && window.flaskUrls.sheetApiUrl) {
    return window.flaskUrls.sheetApiUrl;
  }
  console.log(window.flaskUrls.sheetApiUrl);
  console.error("SHEET_API_URL not found in configuration!");
  return "";
}

// ============================================================================
// 2. INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
  // Clear any cached form data on refresh
  const form = document.getElementById("test-form");
  if (form) form.reset();

  // --- NEW MENU LOGIC START ---
  const dropdownTrigger = document.getElementById("dropdown-trigger");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const dropdownIcon = document.querySelector(".dropdown-icon");

  if (dropdownTrigger && dropdownMenu) {
    // Toggle menu on click
    dropdownTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdownMenu.classList.toggle("hidden");

      // Rotate icon
      if (dropdownIcon) {
        dropdownIcon.style.transform = dropdownMenu.classList.contains("hidden")
          ? "rotate(0deg)"
          : "rotate(180deg)";
      }
    });

    // Close menu when clicking outside
    document.addEventListener("click", function () {
      dropdownMenu.classList.add("hidden");
      if (dropdownIcon) dropdownIcon.style.transform = "rotate(0deg)";
    });

    // Prevent closing when clicking inside menu
    dropdownMenu.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }
  // --- MENU LOGIC END ---

  // Keep your existing initializers
  if (typeof setupEmailCopy === "function") setupEmailCopy();
  initializeCharacterCount();

  // Interaction Setup
  setupRadioBehavior(); // Handles selection, deselection, and validation for radios
  initializeHorizontalLikertScales(); // Handles clicking the container boxes
  setupTextAndSelectValidation(); // Handles text and dropdowns
  setupFormSubmission();
});

// ============================================================================
// 3. SUBMISSION LOGIC (REDIRECTS AFTER SUCCESS)
// ============================================================================

async function sendToSheet(data) {
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.textContent : "Submit";

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
  }

  const form = new FormData();
  for (let key in data) {
    form.append(key, data[key]);
  }

  // Get the URL dynamically here
  const apiUrl = getSheetApiUrl();

  if (!apiUrl) {
    alert("Configuration Error: API URL missing.");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
    return false;
  }

  try {
    // Send data to Google Sheets
    await fetch(apiUrl, {
      method: "POST",
      body: form,
    });

    // Success! Redirect to results page
    if (window.flaskUrls && window.flaskUrls.results) {
      window.location.href = window.flaskUrls.results;
    } else {
      // Fallback only if the redirect URL is broken/missing
      console.warn("Redirect URL not found in window.flaskUrls");
      alert("Data sent successfully! (No result page configured)");
      if (submitBtn) {
        submitBtn.textContent = "Sent!";
      }
    }
    return true;
  } catch (err) {
    console.error("Failed:", err);
    alert("There was an error submitting your answers. Please try again.");

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
    return false;
  }
}

function setupFormSubmission() {
  const form = document.getElementById("test-form");
  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      // Check validity (Updates UI red boxes)
      const isPerfect = validateAll();

      if (isPerfect) {
        // 1. Collect Data
        const data = collectFormData();
        // 2. Send to Google Sheets (and redirect)
        await sendToSheet(data);
      } else {
        // Allow submission with warning
        const userChoice = confirm(
          "Some questions are unanswered or contain invalid values.\n These questions are highlighted. \n\n" +
            "• Click OK to submit your answers as they are.\n" +
            "• Click Cancel/Annuler to review and finish the questionnaire."
        );

        if (userChoice) {
          const data = collectFormData();
          await sendToSheet(data);
        } else {
          scrollToFirstError();
        }
      }
    });
  }
}

// ============================================================================
// 4. DATA COLLECTION
// ============================================================================

function collectFormData() {
  const formData = {
    timestamp: new Date().toISOString(),

    // Text Inputs
    "anonymous-id":
      document.querySelector('input[name="anonymous-id"]')?.value || "",
    age: document.querySelector('input[name="age"]')?.value || "",
    grades: document.querySelector('input[name="grades"]')?.value || "",

    // Dropdowns
    gender: document.querySelector('select[name="gender"]')?.value || "",
    "economic-situation":
      document.querySelector('select[name="economic-situation"]')?.value || "",
    scholarship:
      document.querySelector('select[name="scholarship"]')?.value || "",
    "housing-situation":
      document.querySelector('select[name="housing-situation"]')?.value || "",
    "class-year":
      document.querySelector('select[name="class-year"]')?.value || "",
    "study-field":
      document.querySelector('select[name="study-field"]')?.value || "",

    // Text Areas
    "remarks-admin":
      document.querySelector('textarea[name="remarks-admin"]')?.value || "",
    "study-tips":
      document.querySelector('textarea[name="study-tips"]')?.value || "",
  };

  // Auto-collect all answer from Matrix Groups (Likert Scales)
  const radioGroups = new Set();
  document.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radioGroups.add(radio.name);
  });

  radioGroups.forEach((name) => {
    if (!formData[name]) {
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      formData[name] = checked ? checked.value : "";
    }
  });

  return formData;
}

// ============================================================================
// 5. VALIDATION & INTERACTION
// ============================================================================

function validateAll() {
  const validations = [
    // --- Manual Sections ---
    validateTextLength("anonymous-id", "anonymous-id-error", 3, 20),
    validateRequiredSelect("gender", "gender-error"),
    validateNumberRange("age", "age-error", 1, 120),
    validateRequiredSelect("economic-situation", "eco-error"),
    validateRequiredSelect("scholarship", "scholarship-error"),
    validateRequiredSelect("housing-situation", "housing-error"),
    validateRequiredSelect("class-year", "class-year-error"),
    validateRequiredSelect("study-field", "study-field-error"),
    validateNumberRange("grades", "grades-error", 0, 20),

    // --- Matrix 1 (Academic Behavior) ---
    validateRequiredRadio("self-confidence", "self-confidence-error"),
    validateRequiredRadio("stress", "stress-error"),
    validateRequiredRadio("absence", "absence-error"),
    validateRequiredRadio("lateness", "lateness-error"),
    validateRequiredRadio("well-being", "well-being-error"),
    validateRequiredRadio("knowledge-durability", "knowledge-durability-error"),
    validateRequiredRadio("cheating", "cheating-error"),
    validateRequiredRadio("interest", "interest-error"),
    validateRequiredRadio("performance", "performance-error"),

    // --- Matrix 2 (Personal Motivations) ---
    validateRequiredRadio("curiosity", "curiosity-error"),
    validateRequiredRadio("explanation-seeking", "explanation-seeking-error"),
    validateRequiredRadio("skill-acquisition", "skill-acquisition-error"),
    validateRequiredRadio("play", "play-error"),
    validateRequiredRadio("mental-time-travel", "mental-time-travel-error"),
    validateRequiredRadio("pride", "pride-error"),
    validateRequiredRadio("shame", "shame-error"),
    validateRequiredRadio("affiliation", "affiliation-error"),
    validateRequiredRadio("friendship", "friendship-error"),
    validateRequiredRadio("reasoning", "reasoning-error"),
    validateRequiredRadio(
      "coalitional-affiliation",
      "coalitional-affiliation-error"
    ),
    validateRequiredRadio("status-seeking", "status-seeking-error"),

    // --- Matrix 3 (Pedagogical Preferences) ---
    validateRequiredRadio("clear-instructions", "clear-instructions-error"),
    validateRequiredRadio("grading-scale", "grading-scale-error"),
    validateRequiredRadio("eval-content", "eval-content-error"),
    validateRequiredRadio("resources", "resources-error"),
    validateRequiredRadio("practice", "practice-error"),
    validateRequiredRadio("limit-time", "limit-time-error"),
    validateRequiredRadio("feedback", "feedback-error"),
    validateRequiredRadio("explanation", "explanation-error"),
    validateRequiredRadio("correction", "correction-error"),
    validateRequiredRadio("interaction", "interaction-error"),
    validateRequiredRadio("group-work", "group-work-error"),

    // --- Text inputs ---
    validateRemarksAdmin(),
    validateStudyTips(),
  ];

  const hasErrors = validations.includes(false);
  return !hasErrors;
}

// ----------------------------------------------------------------------------
// INTERACTION: DESELECTABLE RADIOS
// ----------------------------------------------------------------------------
function setupRadioBehavior() {
  const radios = document.querySelectorAll('input[type="radio"]');

  radios.forEach((radio) => {
    // Initialize tracking state
    radio.dataset.state = radio.checked ? "checked" : "unchecked";

    radio.addEventListener("click", function (e) {
      if (this.dataset.state === "checked") {
        // It was already checked, so we uncheck it (Deselect)
        this.checked = false;
        this.dataset.state = "unchecked";
      } else {
        // It was unchecked, so we check it
        // We must also update siblings to 'unchecked' state
        const siblings = document.querySelectorAll(
          `input[name="${this.name}"]`
        );
        siblings.forEach((sib) => (sib.dataset.state = "unchecked"));

        this.dataset.state = "checked";
        this.checked = true;
      }

      // Trigger Validation immediately to update UI (red boxes)
      validateRequiredRadio(this.name, `${this.name}-error`);
    });
  });
}

function initializeHorizontalLikertScales() {
  // Handle clicks on the CONTAINER (Cell not just dot)
  const likertOptions = document.querySelectorAll(
    ".likert-option-horizontal, .likert-choice"
  );

  likertOptions.forEach((option) => {
    const radio = option.querySelector('input[type="radio"]');
    if (radio) {
      option.addEventListener("click", function (e) {
        if (e.target !== radio) {
          // Pass the click to the radio input
          // This will trigger the setupRadioBehavior listener above
          radio.click();
        }
      });
    }
  });
}

function setupTextAndSelectValidation() {
  // Remove conflicting inline handlers
  document
    .querySelectorAll("[onchange]")
    .forEach((element) => element.removeAttribute("onchange"));
  document.querySelectorAll("[oninput]").forEach((element) => {
    if (
      !element.name.includes("study-tips") &&
      !element.name.includes("remarks-admin")
    )
      element.removeAttribute("oninput");
  });

  // Selects/Dropdowns
  document.querySelectorAll("select").forEach((element) => {
    element.addEventListener("change", function () {
      validateRequiredSelect(this.name, `${this.name}-error`);
    });
  });

  // Text Inputs
  document
    .querySelectorAll('input[type="text"], input[type="number"]')
    .forEach((element) => {
      element.addEventListener("input", function () {
        if (this.name === "anonymous-id")
          validateTextLength(this.name, `${this.name}-error`, 3, 20);
        else if (this.name === "age")
          validateNumberRange(this.name, `${this.name}-error`, 1, 120);
        else if (this.name === "grades")
          validateNumberRange(this.name, `${this.name}-error`, 0, 20);
      });
    });
}

// ----------------------------------------------------------------------------
// VALIDATION HELPERS
// ----------------------------------------------------------------------------

function scrollToFirstError() {
  const firstError = document.querySelector(
    '[id$="-error"][style*="display: block"], .likert-row-error'
  );
  if (firstError)
    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
}

function validateRequiredRadio(groupName, errorElementId) {
  const selected = document.querySelector(`input[name="${groupName}"]:checked`);
  const errorElement = document.getElementById(errorElementId);
  const anyInput = document.querySelector(`input[name="${groupName}"]`);
  const container = anyInput
    ? anyInput.closest(".likert-row, .question")
    : null;

  if (selected) {
    if (errorElement) errorElement.style.display = "none";
    if (container) container.classList.remove("likert-row-error");
    return true;
  } else {
    if (errorElement) errorElement.style.display = "block";
    if (container) container.classList.add("likert-row-error");
    return false;
  }
}

function validateRequiredSelect(selectName, errorElementId) {
  const select = document.querySelector(`select[name="${selectName}"]`);
  const errorElement = document.getElementById(errorElementId);

  if (select && select.value) {
    if (errorElement) errorElement.style.display = "none";
    return true;
  } else {
    if (errorElement) errorElement.style.display = "block";
    return false;
  }
}

function validateTextLength(
  inputName,
  errorElementId,
  minLength = 0,
  maxLength = Infinity
) {
  const input = document.querySelector(`input[name="${inputName}"]`);
  const errorElement = document.getElementById(errorElementId);
  if (!input) return true;
  const value = input.value.trim();
  const isValid =
    value === "" || (value.length >= minLength && value.length <= maxLength);
  if (errorElement) errorElement.style.display = isValid ? "none" : "block";
  return isValid;
}

function validateNumberRange(inputName, errorElementId, min, max) {
  const input = document.querySelector(`input[name="${inputName}"]`);
  const errorElement = document.getElementById(errorElementId);
  if (!input) return true;
  const value = parseFloat(input.value);
  // Empty is considered valid (optional/skipped), invalid only if number is out of range
  const isValid =
    input.value === "" || (!isNaN(value) && value >= min && value <= max);
  if (errorElement) errorElement.style.display = isValid ? "none" : "block";
  return isValid;
}

function validateRemarksAdmin() {
  const textarea = document.querySelector('textarea[name="remarks-admin"]');
  const errorElement = document.getElementById("remarks-admin-error");
  if (!textarea || !errorElement) return true;
  const isValid = textarea.value.length <= 1000;
  errorElement.style.display = isValid ? "none" : "block";
  return isValid;
}

function validateStudyTips() {
  const textarea = document.querySelector('textarea[name="study-tips"]');
  const errorElement = document.getElementById("study-tips-error");
  if (!textarea || !errorElement) return true;
  const isValid = textarea.value.length <= 1000;
  errorElement.style.display = isValid ? "none" : "block";
  return isValid;
}

// ============================================================================
// 6. UI & STYLING FUNCTIONS
// ============================================================================

function initializeCharacterCount() {
  updateRemarksAdminCount();
  updateStudyTipsCount();
  const remarksArea = document.querySelector('textarea[name="remarks-admin"]');
  if (remarksArea)
    remarksArea.addEventListener("input", handleRemarksAdminInput);
  const studyTipsArea = document.querySelector('textarea[name="study-tips"]');
  if (studyTipsArea)
    studyTipsArea.addEventListener("input", handleStudyTipsInput);
}

let remarksAdminTimeout;
function handleRemarksAdminInput(e) {
  clearTimeout(remarksAdminTimeout);
  remarksAdminTimeout = setTimeout(updateRemarksAdminCount, 100);
}

let studyTipsTimeout;
function handleStudyTipsInput(e) {
  clearTimeout(studyTipsTimeout);
  studyTipsTimeout = setTimeout(updateStudyTipsCount, 100);
}

function updateRemarksAdminCount() {
  const textarea = document.querySelector('textarea[name="remarks-admin"]');
  const charCount = document.getElementById("remarks-admin-char-count");
  if (!textarea || !charCount) return;
  const currentLength = textarea.value.length;
  charCount.textContent = `${currentLength}/1000 characters`;
  if (currentLength > 1000) charCount.style.color = "#ff6b6b";
  else charCount.style.color = "#5c564f";
}

function updateStudyTipsCount() {
  const textarea = document.querySelector('textarea[name="study-tips"]');
  const charCount = document.getElementById("study-tips-char-count");
  if (!textarea || !charCount) return;
  const currentLength = textarea.value.length;
  charCount.textContent = `${currentLength}/1000 characters`;
  if (currentLength > 1000) charCount.style.color = "#ff6b6b";
  else charCount.style.color = "#5c564f";
}
