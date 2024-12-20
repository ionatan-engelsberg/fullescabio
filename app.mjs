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
// const userAlpha = {
//   id: Date.now().toString(),
//   name: "FullEscabio",
//   username: "dba_lautaro",
//   password: "dba@2020",
//   business: "dba_centro",
// };

// async function hashPass() {
//   const pass = await bcrypt.hash("dba@2020", 10);
//   userAlpha.password = pass;
//   users.push(userAlpha);
//   return pass;
// }
// hashPass();

//! --- ---- ----
const initialUsers = [
  {
    name: "FullEscabio",
    username: "factu_dba",
    password: "dba@2020",
    business: "dba_centro",
    database: "factu_dba",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },
  {
    name: "FullEscabio",
    username: "factu_dba_norte_desa",
    password: "dba@2020",
    business: "dba_prueba",
    database: "factu_dba_norte_desa",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },
  {
    name: "FullEscabio",
    username: "factu_dba_norte",
    password: "dba@2020",
    business: "dba_norte",
    database: "factu_dba_norte",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },
];
class User {
  constructor({
    id = Date.now().toString(),
    name,
    username,
    password,
    business,
    database,
    ip,
    port,
    instanceName,
  }) {
    this.id = id;
    this.name = name;
    this.username = username;
    this.password = password;
    this.business = business;
    this.database = database;
    this.ip = ip;
    this.port = port;
    this.instanceName = instanceName;
  }
}

async function createUser({
  name,
  username,
  password,
  business,
  database,
  ip,
  port,
  instanceName,
}) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new User({
      name,
      username,
      password: hashedPassword,
      //password,
      business,
      database,
      ip,
      port,
      instanceName,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    throw error;
  }
}

async function preloadUsers(usersArray) {
  try {
    const promises = usersArray.map((user) => createUser(user));
    const loadedUsers = await Promise.all(promises);
    users.push(...loadedUsers);
    console.log("Usuarios precargados exitosamente.");
  } catch (error) {
    console.error("Error al precargar usuarios:", error);
    throw error;
  }
}

async function init() {
  await preloadUsers(initialUsers);
  initializePassport(
    passport,
    (username, business) =>
      users.find(
        (user) => user.username === username && user.business === business
      ),
    (id) => users.find((user) => user.id === id)
  );
}

await init();
//! --- ---- ----

const start = async () => {
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }

  app.listen(8080, () => {
    console.log("Server on Port 8080");
  });
};

await start();
