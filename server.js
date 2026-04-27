const path = require("path");
const express = require("express");
const fs = require("fs");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer"); 
const sharp = require("sharp"); 
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// ================= SESIONES =================
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none"
  }
}));

// ================= VARIABLES =================
const DATA = path.join(__dirname, "data", "productos.json");
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_HASH = process.env.ADMIN_HASH;

// ================= MULTER (MEMORIA) =================
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo imágenes"));
  }
});

// ================= GUARDAR IMAGEN PRO =================
async function guardarImagen(file, nombreBase = "producto") {
  const nombreLimpio = nombreBase
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");

  const nombreFinal = `${nombreLimpio}-${Date.now()}.webp`;
  const ruta = path.join(__dirname, "public/img", nombreFinal);

  await sharp(file.buffer)
    .resize(800)
    .webp({ quality: 80 })
    .toFile(ruta);

  return "/img/" + nombreFinal;
}

// ================= MIDDLEWARE GLOBAL =================
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// ================= FUNCIONES JSON =================
function leerProductos() {
  try {
    const data = fs.readFileSync(DATA, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error leyendo JSON:", err);
    return [];
  }
}

function guardarProductos(data) {
  fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
}

// ================= AUTH =================
function auth(req, res, next) {
  if (req.session && req.session.user === ADMIN_USER) {
    return next();
  }
  res.redirect("/login");
}

// ================= ROUTES =================

// API
app.get("/api/productos", (req, res) => {
  try {
    const productos = leerProductos().filter(p => p.activo === true);
    res.json(productos);
  } catch (err) {
    res.status(500).json([]);
  }
});

// HOME
app.get("/", (req, res) => {
  const productos = leerProductos().filter(p => p.activo === true);
  const categorias = [...new Set(productos.map(p => p.categoria))];
  res.render("index", { productos, categorias });
});

// LOGIN
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

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ADMIN
app.get("/admin", auth, (req, res) => {
  const productos = leerProductos();
  res.render("admin", { productos });
});

// ================= AGREGAR =================
app.post("/admin/agregar", auth, upload.single("imagen"), async (req, res) => {
  if (!req.body.nombre || !req.body.precio) {
    return res.send("Datos inválidos");
  }

  const productos = leerProductos();

  let rutaImagen = "https://via.placeholder.com/200";

  if (req.file) {
    rutaImagen = await guardarImagen(req.file, req.body.nombre);
  }

  const nuevo = {
    id: Date.now(),
    nombre: req.body.nombre,
    precio: Number(req.body.precio),
    imagen: rutaImagen,
    categoria: req.body.categoria || "General",
    activo: true
  };

  productos.push(nuevo);
  guardarProductos(productos);

  res.redirect("/admin");
});

// ================= EDITAR =================
app.post("/admin/editar/:id", auth, upload.single("imagen"), async (req, res) => {
  let productos = leerProductos();

  for (let p of productos) {
    if (p.id == req.params.id) {

      // si hay nueva imagen
      if (req.file) {

        // borrar vieja
        if (p.imagen && p.imagen.startsWith("/img/")) {
          const rutaVieja = path.join(__dirname, "public", p.imagen);

          if (fs.existsSync(rutaVieja)) {
            try {
              fs.unlinkSync(rutaVieja);
            } catch (err) {
              console.error("Error borrando vieja:", err);
            }
          }
        }

        // guardar nueva
        p.imagen = await guardarImagen(req.file, req.body.nombre);
      }

      p.nombre = req.body.nombre || p.nombre;
      p.precio = req.body.precio ? Number(req.body.precio) : p.precio;
    }
  }

  guardarProductos(productos);
  res.redirect("/admin");
});

// ================= ELIMINAR =================
app.get("/admin/eliminar/:id", auth, (req, res) => {
  let productos = leerProductos();

  const producto = productos.find(p => p.id == req.params.id);

  if (producto && producto.imagen && producto.imagen.startsWith("/img/")) {
    const ruta = path.join(__dirname, "public", producto.imagen);

    if (fs.existsSync(ruta)) {
      try {
        fs.unlinkSync(ruta);
      } catch (err) {
        console.error("Error borrando imagen:", err);
      }
    }
  }

  productos = productos.filter(p => p.id != req.params.id);
  guardarProductos(productos);

  res.redirect("/admin");
});

// ================= TOGGLE =================
app.get("/admin/toggle/:id", auth, (req, res) => {
  let productos = leerProductos();

  productos = productos.map(p =>
    p.id == req.params.id ? { ...p, activo: !p.activo } : p
  );

  guardarProductos(productos);
  res.redirect("/admin");
});

// ================= SERVER =================
app.listen(port, () => {
  console.log("Servidor en http://localhost:" + port);
});