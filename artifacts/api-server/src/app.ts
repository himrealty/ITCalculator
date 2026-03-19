import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes/index.js";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// process.cwd() = repo root in both dev (tsx) and prod (node dist/index.cjs)
const pub = path.join(process.cwd(), "public");

console.log(`[app] static pub: ${pub}`);
app.use(express.static(pub));

export default app;