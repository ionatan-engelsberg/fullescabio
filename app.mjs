import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path, { dirname } from "path";
import cors from "cors";
import bodyParser from "body-parser";
import admin from "./routes/admin.mjs";
import login from "./routes/auth.mjs";
import flash from "express-flash";
import session from "express-session";
import methodOverride from "method-override";
import bcrypt from "bcrypt";
import passport from "passport";
import initializePassport from "./passport-config.mjs";
import sql from "mssql";
import fs from "fs";

const app = express();
const __dirname = path.resolve();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public", "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(flash());
app.use(
  session({
    secret: "123456",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.use("/", login);
app.use("/admin", admin);
app.get("*", (req, res) => res.render("404"));

const users = [];
const userAlpha = {
  id: Date.now().toString(),
  name: "FullEscabio",
  username: "a",
  password: "",
  business: "a",
};

async function hashPass() {
  const pass = await bcrypt.hash("a", 10);
  userAlpha.password = pass;
  users.push(userAlpha);
  return pass;
}
hashPass();

initializePassport(
  passport,
  (username, business) =>
    users.find(
      (user) => user.username === username && user.business === business
    ),
  (id) => users.find((user) => user.id === id)
);

const { IP, USER_NAME, PASSWORD, DATABASE, PORT, INSTANCENAME } = process.env;
const config = {
  user: USER_NAME,
  password: PASSWORD,
  server: IP,
  database: DATABASE,
  port: Number(PORT),
  options: {
    encrypt: false,
    trustServerCertificate: false,
    instancename: INSTANCENAME,
  },
};

const start = async () => {
  try {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }
    await sql.connect(config);

    sql.on("error", (err) => {
      console.error("SQL Global Error:", err);
    });

    const pool = new sql.ConnectionPool(config);
    pool.on("error", (err) => {
      console.error("SQL Pool Error:", err);
    });

    app.listen(8080, () => {
      console.log("Server on Port 8080");
    });
  } catch (error) {
    console.log("ERROR while connecting to DB: ", error);
  }
};

await start();
