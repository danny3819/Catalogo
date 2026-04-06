let productosGlobal = [];
let carrito = [];

// cargar productos
fetch('/api/productos')
  .then(res => res.json())
  .then(data => {
    productosGlobal = data;
    mostrar(data);
  });

// mostrar productos
function mostrar(productos) {
  const contenedor = document.getElementById('productos');
  contenedor.innerHTML = '';

  productos.forEach(p => {
    contenedor.innerHTML += `
      <div class="card">
        <img src="${p.imagen || '/img/logo.png'}" 
             onerror="this.src='/img/logo.png'">
        <h4>${p.nombre}</h4>
        <p>$${p.precio}</p>
        <button onclick="agregarCarrito(${p.id})">Agregar 🛒</button>
      </div>
    `;
  });
}

// agregar
function agregarCarrito(id) {
  const producto = productosGlobal.find(p => p.id === id);

  const existente = carrito.find(p => p.id === id);

  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  actualizarCarrito();
}

// actualizar carrito
function actualizarCarrito() {
  const lista = document.getElementById('carrito');
  lista.innerHTML = '';

  let total = 0;

  carrito.forEach(p => {
    total += p.precio * p.cantidad;

    lista.innerHTML += `
      <li class="item-carrito">
        <div>
          ${p.nombre} x${p.cantidad}
        </div>

        <div class="controles">
          <button onclick="disminuir(${p.id})">-</button>
          <button onclick="aumentar(${p.id})">+</button>
          <button onclick="eliminar(${p.id})">❌</button>
        </div>
      </li>
    `;
  });

  document.getElementById('total').innerText = "Total: $" + total.toFixed(2);
  actualizarContador();
}

// controles
function aumentar(id) {
  const p = carrito.find(p => p.id === id);
  p.cantidad++;
  actualizarCarrito();
}

function disminuir(id) {
  const p = carrito.find(p => p.id === id);
  if (p.cantidad > 1) p.cantidad--;
  else eliminar(id);
  actualizarCarrito();
}

function eliminar(id) {
  carrito = carrito.filter(p => p.id !== id);
  actualizarCarrito();
}

// contador
function actualizarContador() {
  const totalItems = carrito.reduce((sum, p) => sum + p.cantidad, 0);
  document.getElementById('contador').innerText = totalItems;
}

// abrir carrito
function toggleCarrito() {
  document.getElementById('carritoPanel').classList.toggle('activo');
}

// WhatsApp
function enviarWhatsApp() {
  let mensaje = " Pedido:\n\n";

  carrito.forEach(p => {
    mensaje += `${p.nombre} x${p.cantidad}\n`;
  });

  const numero = "523333542591"; // CAMBIA
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank");
}

// buscador
function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

document.getElementById('busqueda').addEventListener('input', e => {
  const texto = normalizar(e.target.value);

  if (!texto) return mostrar(productosGlobal);

  const regex = new RegExp(texto.split(' ').join('.*'), 'i');

  const filtrados = productosGlobal.filter(p =>
    regex.test(normalizar(p.nombre))
  );

  mostrar(filtrados);
});