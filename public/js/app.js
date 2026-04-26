let productosGlobal = [];
let carrito = [];
let tel = "523321936637"

// cargar productos
fetch('/api/productos')
  .then(res => res.json())
  .then(data => {
    productosGlobal = data;
    mostrar(data);

     generarCategorias(); // 👈 IMPORTANTE
  });

// mostrar productos
function mostrar(productos) {
  const contenedor = document.getElementById('productos');
  contenedor.innerHTML = '';

  productos.forEach(p => {
    contenedor.innerHTML += `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="card h-100 shadow-sm">

          <img src="${p.imagen || '/img/logo.png'}"
               class="card-img-top"
               style="height:180px;object-fit:cover;cursor:pointer"
               onclick="verImagen('${p.imagen || '/img/logo.png'}')">

          <div class="card-body d-flex flex-column">
            <h6 class="card-title">${p.nombre}</h6>
            <p class="text-danger fw-bold">$${p.precio}</p>

            <button class="btn btn-danger mt-auto"
                    onclick="agregarCarrito(${p.id})">
              Agregar 🛒
            </button>
          </div>

        </div>
      </div>
    `;
  });
}

// modal imagen
function verImagen(src) {
  document.getElementById("imgPreview").src = src;
  const modal = new bootstrap.Modal(document.getElementById('imgModal'));
  modal.show();
}

// carrito
function agregarCarrito(id) {
  const p = productosGlobal.find(x => x.id === id);
  const existe = carrito.find(x => x.id === id);

  if (existe) existe.cantidad++;
  else carrito.push({ ...p, cantidad: 1 });

  actualizarCarrito();

  // 👇 NOTIFICACIÓN
  mostrarNotificacion(p);
}

function actualizarCarrito() {
  const cont = document.getElementById("carrito");
  cont.innerHTML = "";

  let total = 0;

  carrito.forEach(p => {
    total += p.precio * p.cantidad;

    cont.innerHTML += `
      <div class="d-flex align-items-center mb-3">

        <img src="${p.imagen}" width="50" class="rounded me-2">

        <div class="flex-grow-1">
          <div>${p.nombre}</div>
          <small>$${p.precio} x${p.cantidad}</small>
        </div>

        <div>
          <button class="btn btn-sm btn-outline-secondary"
            onclick="cambiarCantidad(${p.id}, -1)">-</button>

          <button class="btn btn-sm btn-outline-secondary"
            onclick="cambiarCantidad(${p.id}, 1)">+</button>

          <button class="btn btn-sm btn-danger"
            onclick="eliminar(${p.id})">x</button>
        </div>

      </div>
    `;
  });

  document.getElementById("total").innerText = "Total: $" + total;
  document.getElementById("contador").innerText =
    carrito.reduce((s,p)=>s+p.cantidad,0);
}

// controles
function cambiarCantidad(id, n) {
  const p = carrito.find(x => x.id === id);
  if (!p) return;

  p.cantidad += n;
  if (p.cantidad <= 0) eliminar(id);

  actualizarCarrito();
}

function eliminar(id) {
  carrito = carrito.filter(p => p.id !== id);
  actualizarCarrito();
}

// WhatsApp
function enviarWhatsApp() {
  let msg = "Pedido:\n";

  carrito.forEach(p => {
    msg += `${p.nombre} x${p.cantidad}\n`;
  });

  window.open(
    "https://wa.me/"+tel+"?text=" + encodeURIComponent(msg)
  );
}

// buscador
document.getElementById("busqueda")
.addEventListener("input", e => {
  const txt = e.target.value.toLowerCase();

  const filtrados = productosGlobal.filter(p =>
    p.nombre.toLowerCase().includes(txt)
  );

  mostrar(filtrados);
});

function mostrarNotificacion(producto) {
  const contenedor = document.getElementById("notificaciones");

  const div = document.createElement("div");
  div.className = "card shadow mb-2 border-0";

  div.innerHTML = `
    <div class="card-body p-2">

      <div class="d-flex align-items-center">
        <img src="${producto.imagen}" width="50" class="rounded me-2">

        <div class="flex-grow-1">
          <div class="fw-bold small">✔ Agregado</div>
          <div class="small text-muted">${producto.nombre}</div>
        </div>
      </div>

      <div class="progress mt-2" style="height:4px;">
        <div class="progress-bar bg-success" style="width:100%"></div>
      </div>

    </div>
  `;

  contenedor.appendChild(div);

  // barra de tiempo
  const barra = div.querySelector(".progress-bar");

  let tiempo = 100;

  const intervalo = setInterval(() => {
    tiempo -= 2;
    barra.style.width = tiempo + "%";

    if (tiempo <= 0) {
      clearInterval(intervalo);
      div.remove();
    }
  }, 50);
}

function generarCategorias() {
  const cont = document.getElementById("listaCategorias");

  const categorias = [...new Set(productosGlobal.map(p => p.categoria))];

  cont.innerHTML = "";

  categorias.forEach(cat => {
    cont.innerHTML += `
      <button class="btn btn-outline-dark w-100 mb-2"
              onclick="filtrarCategoria('${cat}')"
              data-bs-dismiss="offcanvas">
        ${cat}
      </button>
    `;
  });
}
function filtrarCategoria(cat) {
  if (cat === "all") return mostrar(productosGlobal);

  const filtrados = productosGlobal.filter(p => p.categoria === cat);
  mostrar(filtrados);
}