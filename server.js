const express = require("express");
const fs = require("fs");
const session = require("express-session");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true en producción con HTTPS
    httpOnly: true,
    sameSite: "lax"
  }
}));

// Variables
const DATA = "./data/productos.json";
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_HASH = process.env.ADMIN_HASH;

// Middleware global user
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Funciones JSON
function leerProductos() {
  return JSON.parse(fs.readFileSync(DATA));
}

function guardarProductos(data) {
  fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
}

// Auth middleware
function auth(req, res, next) {
  if (req.session && req.session.user === ADMIN_USER) {
    return next();
  }
  res.redirect("/login");
}

// ================= ROUTES =================

// Home
app.get("/", (req, res) => {
  const productos = leerProductos().filter(p => p.activo === true);

  const categorias = [...new Set(productos.map(p => p.categoria))];

  res.render("index", { productos, categorias });
});

// Login
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { user, password } = req.body;

  if (user === ADMIN_USER && await bcrypt.compare(password, ADMIN_HASH)) {
    req.session.user = ADMIN_USER;
    return res.redirect("/admin");
  }

  res.render("login", { error: "Credenciales incorrectas" });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// Admin
app.get("/admin", auth, (req, res) => {
  const productos = leerProductos();
  res.render("admin", { productos });
});

// Agregar
app.post("/admin/agregar", auth, (req, res) => {
  if (!req.body.nombre || !req.body.precio) {
    return res.send("Datos inválidos");
  }

  const productos = leerProductos();

  const nuevo = {
    id: Date.now(),
    nombre: req.body.nombre,
    precio: Number(req.body.precio),
    imagen: req.body.imagen || "https://via.placeholder.com/200",
    categoria: req.body.categoria || "General",
    activo: true
  };

  productos.push(nuevo);
  guardarProductos(productos);

  res.redirect("/admin");
});

// Editar
app.post("/admin/editar/:id", auth, (req, res) => {
  let productos = leerProductos();

  productos = productos.map(p =>
    p.id == req.params.id
      ? {
          ...p,
          nombre: req.body.nombre || p.nombre,
          precio: req.body.precio ? Number(req.body.precio) : p.precio
        }
      : p
  );

  guardarProductos(productos);
  res.redirect("/admin");
});

// Eliminar
app.get("/admin/eliminar/:id", auth, (req, res) => {
  let productos = leerProductos();
  productos = productos.filter(p => p.id != req.params.id);
  guardarProductos(productos);
  res.redirect("/admin");
});

// Toggle activo
app.get("/admin/toggle/:id", auth, (req, res) => {
  let productos = leerProductos();

  productos = productos.map(p =>
    p.id == req.params.id ? { ...p, activo: !p.activo } : p
  );

  guardarProductos(productos);
  res.redirect("/admin");
});

app.listen(port, () =>
  console.log("Servidor en http://localhost:" + port)
);