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

// const users = [];
// const userAlpha = {
//   id: Date.now().toString(),
//   name: "FullEscabio",
//   username: "a",
//   password: "",
//   business: "a",
// };

// async function hashPass() {
//   const pass = await bcrypt.hash("a", 10);
//   userAlpha.password = pass;
//   users.push(userAlpha);
//   return pass;
// }
// hashPass();

const users = [];
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

const initialUsers = [
  {
    name: "FullEscabio",
    username: "dba_lautaro",
    password: "dba@2020",
    business: "dba_centro",
    database: "factu_dba",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },
  {
    name: "FullEscabio",
    username: "dbasrl",
    password: "dba@2020",
    business: "dba_centro",
    database: "factu_dba",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },
  {
    name: "FullEscabio",
    username: "hernan",
    password: "dba@2020",
    business: "dba_centro",
    database: "factu_dba",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },

  {
    name: "FullEscabio",
    username: "dba_lautaro",
    password: "dba@2020",
    business: "dba_prueba",
    database: "factu_dba_norte_desa",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },
  {
    name: "FullEscabio",
    username: "dbasrl",
    password: "dba@2020",
    business: "dba_centro",
    database: "factu_dba_norte_desa",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },
  {
    name: "FullEscabio",
    username: "hernan",
    password: "dba@2020",
    business: "dba_centro",
    database: "factu_dba_norte_desa",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },

  {
    name: "FullEscabio",
    username: "dba_lautaro",
    password: "dba@2020",
    business: "dba_norte",
    database: "factu_dba_norte",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },
  {
    name: "FullEscabio",
    username: "dbasrl",
    password: "dba@2020",
    business: "dba_norte",
    database: "factu_dba_norte",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },
  {
    name: "FullEscabio",
    username: "hernan",
    password: "dba@2020",
    business: "dba_norte",
    database: "factu_dba_norte",
    ip: "181.119.169.120",
    port: "50322",
    instanceName: "RPSISTEMAS",
  },
];

async function initializeDatabaseConnection(user) {
  const config = {
    user: user.username,
    password: user.password,
    server: user.ip,
    database: user.database,
    port: Number(user.port),
    options: {
      encrypt: false,
      trustServerCertificate: false,
      instancename: user.instanceName,
    },
  };

  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log(`Conexión inicializada para el usuario ${user.username}`);
    return pool;
  } catch (error) {
    console.error(
      `Error al conectar con la base de datos para ${user.username}:`,
      error
    );
    throw error;
  }
}

async function login(username, business) {
  const user = users.find(
    (u) => u.username === username && u.business === business
  );

  if (!user) {
    throw new Error("Usuario no encontrado o credenciales inválidas.");
  }

  const connection = await initializeDatabaseConnection(user);
  return { user, connection };
}

(async () => {
  try {
    await preloadUsers(initialUsers);

    app.listen(8080, () => {
      console.log("Servidor ejecutándose en el puerto 8080.");
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
  }
})();
