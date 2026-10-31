// Nur in der Vorschau: Die Formulare schicken nichts ab.
document.addEventListener("submit", function (e) {
  e.preventDefault();
  var form = e.target;
  if (form.querySelector(".vorschau-hinweis")) return;
  var p = document.createElement("p");
  p.className = "vorschau-hinweis";
  p.setAttribute("role", "status");
  p.textContent = "In dieser Vorschau wird nichts verschickt. Auf der fertigen Website kommt die Nachricht per E-Mail bei Sabine an.";
  form.appendChild(p);
});
