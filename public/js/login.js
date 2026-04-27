// INPUTS ANIMACIÓN
document.querySelectorAll(".input-group input").forEach(input => {

  if (input.value) {
    input.parentElement.classList.add("active");
  }

  input.addEventListener("focus", () => {
    input.parentElement.classList.add("active");
  });

  input.addEventListener("blur", () => {
    if (!input.value) {
      input.parentElement.classList.remove("active");
    }
  });

});

// FORM
const form = document.querySelector("form");

if (form) {
  const btn = form.querySelector("button");

  form.addEventListener("submit", () => {

    btn.innerHTML = `<span class="loader"></span> Entrando...`;
    btn.disabled = true;

    // ⚠️ NO usar preventDefault → deja que Express haga login
  });
}