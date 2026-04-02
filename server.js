require('dotenv').config(); // IMPORTANTE: Isso deve ser a primeira linha!

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// CONFIGURAÇÃO ÚNICA USANDO O .ENV
// Configuração da conexão com o MySQL (Aiven)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 14505, // <--- GARANTA QUE ISSO ESTÁ AQUI
    ssl: {
        rejectUnauthorized: false // <--- OBRIGATÓRIO PARA O AIVEN
    }
});

// Tentativa de conexão
db.connect((err) => {
    if (err) {
        console.error('❌ ERRO CRÍTICO NO MYSQL:', err.message);
        return;
    }
    console.log('✅ Conectado ao banco de dados MySQL no Aiven!');
});

// AQUI EMBAIXO CONTINUAM SUAS ROTAS (app.post, app.get, etc...)
db.connect(err => {
    if (err) {
        console.error('❌ ERRO CRÍTICO NO MYSQL:', err.sqlMessage);
    } else {
        console.log('✅ Conectado ao banco "sustentatech_db" com sucesso!');
        console.log("Tentando conectar ao banco:", process.env.DB_NAME);
    }
});

// 2. ROTA DE CADASTRO (Agora com senha protegida)
app.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;
    
    try {
        // Transforma a senha em um código seguro (hash)
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

// 3. ROTA DE LOGIN (Agora comparando a senha protegida)
app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    
    // Buscamos apenas pelo e-mail
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ mensagem: "Erro no servidor" });
        
        if (results.length > 0) {
            const usuario = results[0];
            
            // O bcrypt compara a senha que você digitou com o código do banco
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

// 4. ROTA DE PROJETOS (A QUE TINHA SUMIDO - ESTÁ AQUI!)
app.get('/projetos', (req, res) => {
    const sql = "SELECT * FROM projetos"; 
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ mensagem: "Erro ao buscar projetos" });
        res.json(results); 
    });
});

app.listen(3000, () => {
    console.log('🚀 Servidor rodando em http://localhost:3000');
});