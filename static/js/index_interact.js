"use strict";

// Scroll to content arrow
window.scrollToContent = function () {
  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    mainContent.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
};

// Menu function
document.addEventListener("DOMContentLoaded", function () {
  // Create dropdown container
  const dropdownContainer = document.createElement("div");
  dropdownContainer.id = "dropdown-container";

  // Create dropdown trigger
  const dropdownTrigger = document.createElement("div");
  dropdownTrigger.id = "dropdown-trigger";

  // Create menu label
  const menuLabel = document.createElement("span");
  menuLabel.id = "menu-label";
  menuLabel.textContent = "MENU";

  // Create dropdown icon (chevron)
  const dropdownIcon = document.createElement("span");
  dropdownIcon.classList.add("dropdown-icon");
  dropdownIcon.innerHTML = "▼";

  // Create dropdown menu
  const dropdownMenu = document.createElement("div");
  dropdownMenu.id = "dropdown-menu";
  dropdownMenu.classList.add("hidden");

  // Menu items data using Flask URLs
  const menuItems = [
    {
      text: "Discover",
      action: () => scrollToSection("discover-WASPP"),
    },
    {
      text: "Start Test",
      action: () => scrollToSection("take-test"),
    },
    {
      text: "Research",
      action: () => scrollToSection("research-ground"),
    },
    {
      text: "About",
      action: () => scrollToSection("about-project"),
    },
  ];

  // Create menu items
  menuItems.forEach((item) => {
    const menuItem = document.createElement("div");
    menuItem.classList.add("menu-item");

    const itemText = document.createElement("span");
    itemText.textContent = item.text;

    menuItem.appendChild(itemText);

    menuItem.addEventListener("click", function (e) {
      e.stopPropagation();
      if (item.action) {
        item.action();
      }
      closeMenu();
    });

    dropdownMenu.appendChild(menuItem);
  });

  // Assemble the dropdown
  dropdownTrigger.appendChild(menuLabel);
  dropdownTrigger.appendChild(dropdownIcon);
  dropdownContainer.appendChild(dropdownTrigger);
  dropdownContainer.appendChild(dropdownMenu);

  // Add to the body
  document.body.appendChild(dropdownContainer);

  // Toggle menu function
  function toggleMenu() {
    const isHidden = dropdownMenu.classList.contains("hidden");

    if (isHidden) {
      openMenu();
    } else {
      closeMenu();
    }
  }

  function openMenu() {
    dropdownMenu.classList.remove("hidden");
    dropdownIcon.style.transform = "rotate(180deg)";
  }

  function closeMenu() {
    dropdownMenu.classList.add("hidden");
    dropdownIcon.style.transform = "rotate(0deg)";
  }

  // Scroll to section function
  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  // Event listeners
  dropdownTrigger.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu when clicking outside
  document.addEventListener("click", function () {
    closeMenu();
  });

  // Prevent menu from closing when clicking inside it
  dropdownMenu.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  // Email copy functionality
  setupEmailCopy();
});

// Email copy functionality
function setupEmailCopy() {
  const emailLinks = document.querySelectorAll(
    ".email-link, [data-copy-email]"
  );

  emailLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const email =
        this.getAttribute("data-email") ||
        this.textContent.trim() ||
        "adress.name@x.com";

      navigator.clipboard
        .writeText(email)
        .then(() => {
          // Visual feedback
          const originalText = this.textContent;
          const originalBg = this.style.backgroundColor;

          this.textContent = "✓ Copied!";
          this.style.backgroundColor = "rgba(139, 120, 109, 0.3)";

          setTimeout(() => {
            this.textContent = originalText;
            this.style.backgroundColor = originalBg;
          }, 2000);
        })
        .catch((err) => {
          console.error("Copy failed:", err);
          fallbackCopyTextToClipboard(email);
        });
    });
  });
}

// Fallback copy function for older browsers
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    if (successful) {
      alert("Email copied to clipboard: " + text);
    } else {
      alert("Please copy manually: " + text);
    }
  } catch (err) {
    alert("Please copy manually: " + text);
  }

  document.body.removeChild(textArea);
}
