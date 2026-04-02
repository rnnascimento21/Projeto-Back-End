require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// CONFIGURAÇÃO DO BANCO (AIVEN)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 14505,
    ssl: {
        rejectUnauthorized: false
    }
});

// TENTATIVA DE CONEXÃO ÚNICA
db.connect((err) => {
    if (err) {
        console.error('❌ ERRO CRÍTICO NO MYSQL:', err.message);
        return;
    }
    console.log(`✅ Conectado ao banco ${process.env.DB_NAME} no Aiven!`);
});

// 2. ROTA DE CADASTRO
app.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const saltRounds = 10;
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        const sql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
        db.query(sql, [nome, email, senhaCriptografada], (err, result) => {
            if (err) return res.status(500).json({ mensagem: "Erro ao cadastrar. E-mail já existe!" });
            res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
        });
    } catch (erro) {
        res.status(500).json({ mensagem: "Erro ao processar o cadastro." });
    }
});

// 3. ROTA DE LOGIN
app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ mensagem: "Erro no servidor" });
        
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

// 4. ROTA DE PROJETOS
app.get('/projetos', (req, res) => {
    const sql = "SELECT * FROM projetos"; 
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ mensagem: "Erro ao buscar projetos" });
        res.json(results); 
    });
});

// CORREÇÃO DA PORTA PARA O RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});