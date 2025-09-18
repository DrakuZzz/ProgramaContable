import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import {
  cuentasRoutes,
  aperturaRoutes,
  facturaRoutes,
} from "../routes/index.js";

dotenv.config();

const PORT = process.env.PORT;

const app = express();
app.use(express.json());
app.use(express.static("src"));
app.use(cors());

app.use("/catalogo", cuentasRoutes);
app.use("/apertura", aperturaRoutes);
app.use("", facturaRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

//Pagina de inicio con los productos
app.get("/", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/transacciones.html"));
});

app.get("/addcuentas", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/cuentas.html"));
});

app.get("/asiento", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/asiento.html"));
});

app.get("/factura", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/factura.html"));
});