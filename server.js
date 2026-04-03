require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const smtpPort = Number(process.env.MAIL_PORT || 587);
const useCustomSmtp = Boolean(process.env.MAIL_HOST);

const emailTransporter = nodemailer.createTransport(
  useCustomSmtp
    ? {
        host: process.env.MAIL_HOST,
        port: smtpPort,
        secure: process.env.MAIL_SECURE === "true" || smtpPort === 465,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      }
    : {
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
);

// CONFIGURAÇÃO DO BANCO (AIVEN)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS, // ✅ CORRIGIDO AQUI
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 14505,
  ssl: {
    rejectUnauthorized: false,
  },
});

// TENTATIVA DE CONEXÃO ÚNICA
db.connect((err) => {
  if (err) {
    console.error("❌ ERRO CRÍTICO NO MYSQL:", err.message);
    return;
  }
  console.log(`✅ Conectado ao banco ${process.env.DB_NAME} no Aiven!`);
  inicializarBanco();
});

function inicializarBanco() {
  const sqlUsuarios = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      senha VARCHAR(255) NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const sqlProjetos = `
    CREATE TABLE IF NOT EXISTS projetos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(160) NOT NULL,
      descricao TEXT NOT NULL,
      imagem_url VARCHAR(255) DEFAULT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(sqlUsuarios, (err) => {
    if (err) {
      console.error("❌ Erro ao garantir tabela usuarios:", err.message);
      return;
    }
    db.query(sqlProjetos, (errProjetos) => {
      if (errProjetos) {
        console.error(
          "❌ Erro ao garantir tabela projetos:",
          errProjetos.message,
        );
        return;
      }
      console.log("✅ Tabelas essenciais verificadas com sucesso.");
    });
  });
}

// 2. ROTA DE CADASTRO
app.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: "Preencha nome, e-mail e senha." });
  }

  try {
    const saltRounds = 10;
    const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

    const sql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
    db.query(sql, [nome, email, senhaCriptografada], (err, result) => {
      if (err) {
          console.error("Erro SQL /cadastro:", err.message);
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ mensagem: "Este e-mail já está cadastrado." });
        }
        return res.status(500).json({ mensagem: "Erro ao cadastrar usuário." });
      }
      res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
    });
  } catch (erro) {
    res.status(500).json({ mensagem: "Erro ao processar o cadastro." });
  }
});

// 3. ROTA DE LOGIN
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: "Informe e-mail e senha." });
  }

  const sql = "SELECT * FROM usuarios WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Erro SQL /login:", err.message);
      return res.status(500).json({ mensagem: "Erro no servidor" });
    }

    if (results.length > 0) {
      const usuario = results[0];
      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

      if (senhaCorreta) {
        res.json({ mensagem: "Login autorizado!", usuario: usuario.nome });
      } else {
        res.status(401).json({ mensagem: "E-mail ou senha incorretos!" });
      }
    } else {
      res.status(401).json({ mensagem: "E-mail ou senha incorretos!" });
    }
  });
});

// ROTA DE PROJETOS (com busca opcional)
app.get("/projetos", (req, res) => {
  const termoBusca = (req.query.q || "").trim();
  const temBusca = termoBusca.length > 0;

  const sql = temBusca
    ? "SELECT * FROM projetos WHERE titulo LIKE ? OR descricao LIKE ?"
    : "SELECT * FROM projetos";
  const params = temBusca
    ? [`%${termoBusca}%`, `%${termoBusca}%`]
    : [];

  db.query(sql, params, (err, results) => {
    if (err)
      return res.status(500).json({ mensagem: "Erro ao buscar projetos" });
    res.json(results);
  });
});

// ROTA DE BUSCA (alias)
app.get("/projetos/busca", (req, res) => {
  const termoBusca = (req.query.q || "").trim();

  if (!termoBusca) {
    return res.status(400).json({ mensagem: "Informe um termo de busca." });
  }

  const sql = "SELECT * FROM projetos WHERE titulo LIKE ? OR descricao LIKE ?";
  const params = [`%${termoBusca}%`, `%${termoBusca}%`];

  db.query(sql, params, (err, results) => {
    if (err)
      return res.status(500).json({ mensagem: "Erro ao buscar projetos" });
    res.json(results);
  });
});

// ROTA DE NEWSLETTER
app.post("/newsletter", async (req, res) => {
  const { email } = req.body;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ mensagem: "E-mail inválido." });
  }

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    return res
      .status(500)
      .json({ mensagem: "Configuração de e-mail não encontrada no servidor." });
  }

  try {
    await emailTransporter.sendMail({
      from:
        process.env.MAIL_FROM || `"SustentaTech" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Bem-vindo(a) à newsletter da SustentaTech!",
      html: `
        <h2>Cadastro confirmado ✅</h2>
        <p>Olá! Seu e-mail foi cadastrado para receber notícias da SustentaTech.</p>
        <p>Você começará a receber novidades sobre projetos sustentáveis em breve.</p>
      `,
    });

    return res.json({ mensagem: "E-mail enviado com sucesso!" });
  } catch (error) {
    console.error("Erro ao enviar e-mail da newsletter:", error.message);
    return res
      .status(500)
      .json({ mensagem: "Não foi possível enviar o e-mail agora." });
  }
});

// ROTA PRINCIPAL DO FRONT-END
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
