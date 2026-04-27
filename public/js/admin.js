function abrirEditar(btn){

  const p = {
    id: btn.dataset.id,
    nombre: btn.dataset.nombre,
    precio: btn.dataset.precio,
    categoria: btn.dataset.categoria,
    activo: btn.dataset.activo === "true"
  };

  document.getElementById("editNombre").value = p.nombre;
  document.getElementById("editPrecio").value = p.precio;
  document.getElementById("editCategoria").value = p.categoria;
  document.getElementById("editActivo").checked = p.activo;

  const form = document.getElementById("formEditar");
  form.action = "/admin/editar/" + p.id;

  new bootstrap.Modal(document.getElementById("modalEditar")).show();
}