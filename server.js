const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;

// ==========================================
// CONFIGURAÇÕES
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos públicos
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// PASTA DE UPLOADS
// ==========================================

const pastaUploads = path.join(__dirname, "uploads");

if (!fs.existsSync(pastaUploads)) {
    fs.mkdirSync(pastaUploads);
}

// ==========================================
// UPLOAD DE IMAGENS
// ==========================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, pastaUploads);
    },

    filename: function (req, file, cb) {

        const extensao =
            path.extname(file.originalname);

        const nome =
            Date.now() + extensao;

        cb(null, nome);
    }
});

const upload = multer({
    storage: storage
});

// ==========================================
// BANCO DE DADOS
// ==========================================

const db = new Database(
    path.join(__dirname, "database.db")
);

db.pragma("foreign_keys = ON");

// ==========================================
// TABELA DE ADMINISTRADORES
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS administradores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL
    )
`).run();

// ==========================================
// ADMIN PADRÃO
// ==========================================

const adminExiste = db.prepare(`
    SELECT id
    FROM administradores
    WHERE usuario = ?
`).get("admin");

if (!adminExiste) {

    db.prepare(`
        INSERT INTO administradores
        (usuario, senha)
        VALUES (?, ?)
    `).run(
        "admin",
        "1234"
    );

}

// ==========================================
// TABELA DE PRODUTOS
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        preco REAL NOT NULL,
        imagem TEXT,
        ativo INTEGER DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// ==========================================
// TABELA DE REGIÕES
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS regioes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        taxa REAL NOT NULL
    )
`).run();

// ==========================================
// REGIÕES PADRÃO
// ==========================================

const quantidadeRegioes =
    db.prepare(`
        SELECT COUNT(*) AS total
        FROM regioes
    `).get().total;

if (quantidadeRegioes === 0) {

    db.prepare(`
        INSERT INTO regioes
        (nome, tipo, taxa)
        VALUES (?, ?, ?)
    `).run(
        "Perto",
        "perto",
        2
    );

    db.prepare(`
        INSERT INTO regioes
        (nome, tipo, taxa)
        VALUES (?, ?, ?)
    `).run(
        "Longe",
        "longe",
        3
    );
}

// ==========================================
// TABELA DE PEDIDOS
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        telefone TEXT,
        endereco TEXT,
        tipo_entrega TEXT NOT NULL,
        regiao TEXT,
        taxa_entrega REAL DEFAULT 0,
        pagamento TEXT,
        troco_para REAL DEFAULT 0,
        subtotal REAL NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'novo',
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// ==========================================
// ITENS DOS PEDIDOS
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS itens_pedido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        produto_id INTEGER,
        nome_produto TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        preco REAL NOT NULL,

        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
    )
`).run();

// ==========================================
// ROTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});

// ==========================================
// TESTE DO SERVIDOR
// ==========================================

app.get("/api/teste", (req, res) => {

    res.json({
        sucesso: true,
        mensagem: "Servidor da Docemania funcionando!"
    });

});

// ==========================================
// LISTAR PRODUTOS
// ==========================================

app.get("/api/produtos", (req, res) => {

    try {

        const produtos =
            db.prepare(`
                SELECT *
                FROM produtos
                WHERE ativo = 1
                ORDER BY id DESC
            `).all();

        res.json(produtos);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar produtos"
        });

    }

});

// ==========================================
// ADICIONAR PRODUTO
// ==========================================

app.post(
    "/api/produtos",
    upload.single("imagem"),
    (req, res) => {

        try {

            const {
                nome,
                descricao,
                preco
            } = req.body;

            if (!nome || !preco) {

                return res.status(400).json({
                    erro: "Nome e preço são obrigatórios"
                });

            }

            const imagem =
                req.file
                    ? `/uploads/${req.file.filename}`
                    : null;

            const resultado =
                db.prepare(`
                    INSERT INTO produtos
                    (nome, descricao, preco, imagem)
                    VALUES (?, ?, ?, ?)
                `).run(
                    nome,
                    descricao || "",
                    Number(preco),
                    imagem
                );

            res.json({
                sucesso: true,
                id: resultado.lastInsertRowid
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro ao adicionar produto"
            });

        }

    }
);

// ==========================================
// ATUALIZAR PRODUTO
// ==========================================

app.put(
    "/api/produtos/:id",
    upload.single("imagem"),
    (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const {
                nome,
                descricao,
                preco,
                ativo
            } = req.body;

            const produto =
                db.prepare(`
                    SELECT *
                    FROM produtos
                    WHERE id = ?
                `).get(id);

            if (!produto) {

                return res.status(404).json({
                    erro: "Produto não encontrado"
                });

            }

            let imagem =
                produto.imagem;

            if (req.file) {

                imagem =
                    `/uploads/${req.file.filename}`;

            }

            db.prepare(`
                UPDATE produtos

                SET
                    nome = ?,
                    descricao = ?,
                    preco = ?,
                    imagem = ?,
                    ativo = ?

                WHERE id = ?
            `).run(
                nome,
                descricao || "",
                Number(preco),
                imagem,
                ativo === undefined
                    ? produto.ativo
                    : Number(ativo),
                id
            );

            res.json({
                sucesso: true
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro ao atualizar produto"
            });

        }

    }
);

// ==========================================
// EXCLUIR PRODUTO
// ==========================================

app.delete(
    "/api/produtos/:id",
    (req, res) => {

        try {

            const id =
                Number(req.params.id);

            db.prepare(`
                DELETE FROM produtos
                WHERE id = ?
            `).run(id);

            res.json({
                sucesso: true
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro ao excluir produto"
            });

        }

    }
);

// ==========================================
// LOGIN ADMIN
// ==========================================

app.post(
    "/api/login",
    (req, res) => {

        try {

            const {
                usuario,
                senha
            } = req.body;

            const admin =
                db.prepare(`
                    SELECT id, usuario
                    FROM administradores

                    WHERE usuario = ?
                    AND senha = ?
                `).get(
                    usuario,
                    senha
                );

            if (!admin) {

                return res.status(401).json({
                    sucesso: false,
                    mensagem: "Usuário ou senha incorretos"
                });

            }

            res.json({
                sucesso: true,
                usuario: admin.usuario
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro no login"
            });

        }

    }
);

// ==========================================
// LISTAR REGIÕES
// ==========================================

app.get(
    "/api/regioes",
    (req, res) => {

        const regioes =
            db.prepare(`
                SELECT *
                FROM regioes
                ORDER BY nome
            `).all();

        res.json(regioes);

    }
);

// ==========================================
// CRIAR PEDIDO
// ==========================================

app.post(
    "/api/pedidos",
    (req, res) => {

        try {

            const {
                cliente,
                telefone,
                endereco,
                tipo_entrega,
                regiao,
                taxa_entrega,
                pagamento,
                troco_para,
                itens
            } = req.body;

            if (
                !cliente ||
                !itens ||
                !itens.length
            ) {

                return res.status(400).json({
                    erro: "Pedido inválido"
                });

            }

            let subtotal = 0;

            for (const item of itens) {

                subtotal +=
                    Number(item.preco) *
                    Number(item.quantidade);

            }

            const taxa =
                Number(taxa_entrega || 0);

            const total =
                subtotal + taxa;

            const resultado =
                db.prepare(`
                    INSERT INTO pedidos
                    (
                        cliente,
                        telefone,
                        endereco,
                        tipo_entrega,
                        regiao,
                        taxa_entrega,
                        pagamento,
                        troco_para,
                        subtotal,
                        total
                    )

                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    cliente,
                    telefone || "",
                    endereco || "",
                    tipo_entrega,
                    regiao || "",
                    taxa,
                    pagamento || "",
                    Number(troco_para || 0),
                    subtotal,
                    total
                );

            const pedidoId =
                resultado.lastInsertRowid;

            const inserirItem =
                db.prepare(`
                    INSERT INTO itens_pedido
                    (
                        pedido_id,
                        produto_id,
                        nome_produto,
                        quantidade,
                        preco
                    )

                    VALUES (?, ?, ?, ?, ?)
                `);

            for (const item of itens) {

                inserirItem.run(
                    pedidoId,
                    item.produto_id || null,
                    item.nome_produto,
                    Number(item.quantidade),
                    Number(item.preco)
                );

            }

            res.json({
                sucesso: true,
                pedido_id: pedidoId,
                subtotal,
                taxa,
                total
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro ao criar pedido"
            });

        }

    }
);

// ==========================================
// LISTAR PEDIDOS
// ==========================================

app.get(
    "/api/pedidos",
    (req, res) => {

        try {

            const pedidos =
                db.prepare(`
                    SELECT *
                    FROM pedidos
                    ORDER BY id DESC
                `).all();

            for (const pedido of pedidos) {

                pedido.itens =
                    db.prepare(`
                        SELECT *
                        FROM itens_pedido
                        WHERE pedido_id = ?
                    `).all(pedido.id);

            }

            res.json(pedidos);

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro ao buscar pedidos"
            });

        }

    }
);

// ==========================================
// ALTERAR STATUS DO PEDIDO
// ==========================================

app.put(
    "/api/pedidos/:id/status",
    (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const {
                status
            } = req.body;

            db.prepare(`
                UPDATE pedidos

                SET status = ?

                WHERE id = ?
            `).run(
                status,
                id
            );

            res.json({
                sucesso: true
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro ao alterar status"
            });

        }

    }
);

// ==========================================
// DASHBOARD
// ==========================================

app.get(
    "/api/dashboard",
    (req, res) => {

        try {

            const vendasHoje =
                db.prepare(`
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS total

                    FROM pedidos

                    WHERE status = 'concluido'

                    AND date(criado_em) =
                        date('now', 'localtime')
                `).get().total;

            const vendasMes =
                db.prepare(`
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS total

                    FROM pedidos

                    WHERE status = 'concluido'

                    AND strftime(
                        '%Y-%m',
                        criado_em,
                        'localtime'
                    ) = strftime(
                        '%Y-%m',
                        'now',
                        'localtime'
                    )
                `).get().total;

            const pedidosHoje =
                db.prepare(`
                    SELECT
                        COUNT(*) AS total

                    FROM pedidos

                    WHERE date(criado_em) =
                        date('now', 'localtime')
                `).get().total;

            const tortasHoje =
                db.prepare(`
                    SELECT
                        COALESCE(
                            SUM(ip.quantidade),
                            0
                        ) AS total

                    FROM itens_pedido ip

                    INNER JOIN pedidos p
                    ON p.id = ip.pedido_id

                    WHERE p.status = 'concluido'

                    AND date(p.criado_em) =
                        date('now', 'localtime')
                `).get().total;

            res.json({
                vendasHoje,
                vendasMes,
                pedidosHoje,
                tortasHoje
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro: "Erro no dashboard"
            });

        }

    }
);

// ==========================================
// ARQUIVOS DE UPLOAD
// ==========================================

app.use(
    "/uploads",
    express.static(pastaUploads)
);

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "🍰 DOCEMANIA ONLINE"
        );

        console.log(
            `Servidor rodando em:`
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log("");

    }
);
