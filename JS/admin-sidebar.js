// ===== LOAD SIDEBAR =====
fetch("../HTML/admin-sidebar.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("sidebar").innerHTML = data;

    // AFTER LOADING, ACTIVATE LOGIC
    initSidebar();
  });

function initSidebar() {
  const sidebar = document.getElementById("adminSidebar");
  const toggleBtn = document.getElementById("sidebarToggle");
  const links = document.querySelectorAll(".nav-link");

  // ✅ TOGGLE COLLAPSE
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // ✅ ACTIVE LINK BASED ON CURRENT PAGE
  const currentPage = window.location.pathname.split("/").pop();

  links.forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}
