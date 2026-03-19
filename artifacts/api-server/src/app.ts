import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

console.log("[app] loading routes...");
import router from "./routes/index.js";
console.log("[app] routes loaded");

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..", "..");
const pub = path.join(root, "public");

console.log(`[app] static pub: ${pub}`);
app.use(express.static(pub));

export default app;
