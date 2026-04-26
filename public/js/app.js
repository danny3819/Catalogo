let productosGlobal = [];
let productosOriginales = [];
let carrito = [];
let tel = "523321936637";

let pagina = 0;
const limite = 8;

// ================= FETCH =================
fetch('/api/productos')
  .then(res => res.json())
  .then(data => {
    productosGlobal = data;
    productosOriginales = data;

    generarCategorias();

    resetVista(); // 👈 IMPORTANTE
  });

// ================= RESET VISTA =================
function resetVista() {
  pagina = 0;
  document.getElementById('productos').innerHTML = "";

  cargarMas();

  setTimeout(() => {
    llenarPantalla(); // 👈 🔥 clave para PC
  }, 100);
}

// ================= RENDER =================
function renderAppend(productos) {
  const contenedor = document.getElementById('productos');
  const fragment = document.createDocumentFragment();

  productos.forEach(p => {
    const div = document.createElement("div");
    div.className = "col-6 col-md-4 col-lg-3";

    div.innerHTML = `
      <div class="card h-100">

        <img src="${p.imagen}"
             class="card-img-top"
             style="cursor:pointer"
             onclick="verImagen('${p.imagen}')">

        <div class="card-body d-flex flex-column">
          <h6>${p.nombre}</h6>
          <p>$${p.precio}</p>

          <button class="btn btn-danger mt-auto"
                  onclick="agregarCarrito(${p.id})">
            Agregar 🛒
          </button>
        </div>

      </div>
    `;

    fragment.appendChild(div);
  });

  contenedor.appendChild(fragment);
}

// ================= SCROLL PRO =================

const sentinel = document.getElementById("sentinel");

const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    cargarMas();
  }
}, {
  rootMargin: "300px"
});

if (sentinel) observer.observe(sentinel);

// ================= CARGAR =================
function cargarMas() {
  const inicio = pagina * limite;
  const fin = inicio + limite;

  const nuevos = productosGlobal.slice(inicio, fin);

  if (nuevos.length === 0) return;

  renderAppend(nuevos);
  pagina++;
}

// ================= 🔥 FIX DESKTOP =================
function llenarPantalla() {
  const contenedor = document.getElementById('productos');

  while (contenedor.scrollHeight <= window.innerHeight) {
    const antes = pagina;
    cargarMas();

    if (pagina === antes) break; // evita loop infinito
  }
}

// ================= MODAL =================
function verImagen(src) {
  document.getElementById("imgPreview").src = src;
  new bootstrap.Modal(document.getElementById('imgModal')).show();
}

// ================= CARRITO =================
function agregarCarrito(id) {
  const p = productosOriginales.find(x => x.id === id);
  const existe = carrito.find(x => x.id === id);

  if (existe) existe.cantidad++;
  else carrito.push({ ...p, cantidad: 1 });

  actualizarCarrito();
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

// ================= WHATS =================
function enviarWhatsApp() {
  let msg = "Pedido:\n";

  carrito.forEach(p => {
    msg += `${p.nombre} x${p.cantidad}\n`;
  });

  window.open("https://wa.me/" + tel + "?text=" + encodeURIComponent(msg));
}

// ================= BUSCADOR =================
document.getElementById("busqueda")
.addEventListener("input", e => {
  const txt = e.target.value.toLowerCase();

  const filtrados = productosOriginales.filter(p =>
    p.nombre.toLowerCase().includes(txt)
  );

  productosGlobal = filtrados;

  resetVista(); // 👈 🔥 clave
});

// ================= NOTIFICACIÓN =================
function mostrarNotificacion(producto) {
  const contenedor = document.getElementById("notificaciones");

  const div = document.createElement("div");
  div.className = "card mb-2";

  div.innerHTML = `
    <div class="card-body p-2">
      ✔ ${producto.nombre}
      <div class="progress mt-2" style="height:4px;">
        <div class="progress-bar bg-success" style="width:100%"></div>
      </div>
    </div>
  `;

  contenedor.appendChild(div);

  const barra = div.querySelector(".progress-bar");

  let tiempo = 100;

  const i = setInterval(() => {
    tiempo -= 2;
    barra.style.width = tiempo + "%";

    if (tiempo <= 0) {
      clearInterval(i);
      div.remove();
    }
  }, 50);
}

// ================= CATEGORÍAS =================
function generarCategorias() {
  const cont = document.getElementById("listaCategorias");

  const categorias = [...new Set(productosOriginales.map(p => p.categoria))];

  cont.innerHTML = `
    <button class="btn btn-outline-primary w-100 mb-2"
            onclick="resetCatalogo()"
            data-bs-dismiss="offcanvas">
      Todos
    </button>
  `;

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
  productosGlobal = productosOriginales.filter(p => p.categoria === cat);
  resetVista();
}

function resetCatalogo() {
  productosGlobal = productosOriginales;
  resetVista();
}