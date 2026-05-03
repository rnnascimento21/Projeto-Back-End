require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const path = require("path");
const crypto = require("crypto");

const app = express();

// Map para armazenar códigos temporários de cadastro (Daniel-ajustes)
const codigosCadastro = new Map();

// --- CONFIGURAÇÃO DO CORS (LIBERA O GITHUB PAGES) ---
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
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 14505,
  ssl: {
    rejectUnauthorized: false,
  },
});

// TENTATIVA DE CONEXÃO
db.connect((err) => {
  if (err) {
    console.error("❌ ERRO CRÍTICO NO MYSQL:", err);
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
      perfil VARCHAR(20) DEFAULT 'Comum',
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
        console.error("❌ Erro ao garantir tabela projetos:", errProjetos.message);
        return;
      }
      console.log("✅ Tabelas essenciais verificadas com sucesso.");
    });
  });
}

// 2. ROTA DE CADASTRO (Com verificação de e-mail do Daniel)
app.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: "Preencha nome, e-mail e senha." });
  }

  const sqlVerificar = "SELECT id FROM usuarios WHERE email = ?";

  db.query(sqlVerificar, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ mensagem: "Erro ao verificar e-mail." });
    }

    if (results.length > 0) {
      return res.status(409).json({ mensagem: "Este e-mail já está cadastrado." });
    }

    try {
      const senhaCriptografada = await bcrypt.hash(senha, 10);
      const codigo = crypto.randomInt(100000, 999999).toString();
      const expiraEm = Date.now() + 10 * 60 * 1000;

      codigosCadastro.set(email, {
        nome,
        email,
        senhaCriptografada,
        codigo,
        expiraEm,
      });

      await emailTransporter.sendMail({
        from: process.env.MAIL_FROM || `"SustentaTech" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Código de verificação - SustentaTech",
        html: `
          <h2>Verificação de cadastro</h2>
          <p>Seu código é:</p>
          <h1 style="color: #2c3e50;">${codigo}</h1>
          <p>Esse código expira em 10 minutos.</p>
        `,
      });

      return res.status(200).json({
        mensagem: "Código enviado para o e-mail.",
        precisaVerificar: true,
      });
    } catch (error) {
      console.error("Erro no processo de cadastro:", error);
      return res.status(500).json({ mensagem: "Erro ao processar cadastro." });
    }
  });
});

app.post("/verificar-cadastro", (req, res) => {
  const { email, codigo } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({ mensagem: "Informe e-mail e código." });
  }

  const dados = codigosCadastro.get(email);

  if (!dados) {
    return res.status(400).json({ mensagem: "Nenhum código encontrado." });
  }

  if (Date.now() > dados.expiraEm) {
    codigosCadastro.delete(email);
    return res.status(400).json({ mensagem: "Código expirado." });
  }

  if (dados.codigo !== codigo) {
    return res.status(401).json({ mensagem: "Código inválido." });
  }

  const sql = "INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, 'Comum')";

  db.query(sql, [dados.nome, dados.email, dados.senhaCriptografada], (err) => {
    if (err) {
      return res.status(500).json({ mensagem: "Erro ao cadastrar usuário." });
    }

    codigosCadastro.delete(email);

    return res.status(201).json({
      mensagem: "Cadastro concluído com sucesso!",
    });
  });
});

// 3. ROTA DE LOGIN
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  const sql = "SELECT * FROM usuarios WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ mensagem: "E-mail ou senha incorretos!" });
    }
    const usuario = results[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (senhaCorreta) {
      // Retorna também o perfil para a lógica de Auditoria/Master
      res.json({ 
        mensagem: "Login autorizado!", 
        usuario: usuario.nome, 
        perfil: usuario.perfil 
      });
    } else {
      res.status(401).json({ mensagem: "E-mail ou senha incorretos!" });
    }
  });
});

// ROTA DE PROJETOS
app.get("/projetos", (req, res) => {
  const termoBusca = (req.query.q || "").trim();
  const sql = termoBusca 
    ? "SELECT * FROM projetos WHERE titulo LIKE ? OR descricao LIKE ?" 
    : "SELECT * FROM projetos";
  const params = termoBusca ? [`%${termoBusca}%`, `%${termoBusca}%`] : [];

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ mensagem: "Erro ao buscar projetos" });
    res.json(results);
  });
});

// ROTA DE BUSCA (Alias)
app.get("/projetos/busca", (req, res) => {
  const termoBusca = (req.query.q || "").trim();
  const sql = "SELECT * FROM projetos WHERE titulo LIKE ? OR descricao LIKE ?";
  db.query(sql, [`%${termoBusca}%`, `%${termoBusca}%`], (err, results) => {
    if (err) return res.status(500).json({ mensagem: "Erro ao buscar projetos" });
    res.json(results);
  });
});

// ROTA DE NEWSLETTER
app.post("/newsletter", async (req, res) => {
  const { email } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ mensagem: "E-mail inválido." });
  }
  try {
    await emailTransporter.sendMail({
      from: process.env.MAIL_FROM || `"SustentaTech" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Bem-vindo(a) à newsletter da SustentaTech!",
      html: `<h2>Cadastro confirmado ✅</h2><p>Olá! Seu e-mail foi cadastrado.</p>`,
    });
    return res.json({ mensagem: "E-mail enviado com sucesso!" });
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro ao enviar e-mail." });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});