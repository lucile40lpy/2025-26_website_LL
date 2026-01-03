document.addEventListener("DOMContentLoaded", function () {
  const dropdownTrigger = document.getElementById("dropdown-trigger");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const dropdownIcon = document.querySelector(".dropdown-icon");

  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdownMenu.classList.toggle("hidden");

      if (dropdownIcon) {
        dropdownIcon.style.transform = dropdownMenu.classList.contains("hidden")
          ? "rotate(0deg)"
          : "rotate(180deg)";
      }
    });

    document.addEventListener("click", function () {
      dropdownMenu.classList.add("hidden");
      if (dropdownIcon) dropdownIcon.style.transform = "rotate(0deg)";
    });

    dropdownMenu.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }
});

function goBackToTest() {
  window.location.href = window.flaskUrls
    ? window.flaskUrls.take_test
    : "test.html";
}
