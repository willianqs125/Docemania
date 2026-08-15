```javascript
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;

// =====================================================
// CONFIGURAÇÕES
// =====================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// ARQUIVOS PÚBLICOS
// =====================================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

// =====================================================
// SUPABASE
// =====================================================

const DATABASE_URL =
    process.env.DATABASE_URL;

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_KEY =
    process.env.SUPABASE_KEY;

if (!DATABASE_URL) {
    console.error(
        "❌ DATABASE_URL não configurada."
    );
}

if (!SUPABASE_URL) {
    console.error(
        "❌ SUPABASE_URL não configurada."
    );
}

if (!SUPABASE_KEY) {
    console.error(
        "❌ SUPABASE_KEY não configurada."
    );
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

// =====================================================
// UPLOAD DE IMAGENS
// =====================================================

const upload =
    multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 3 * 1024 * 1024
        }
    });

// =====================================================
// FUNÇÃO PARA EXECUTAR SQL
// =====================================================

async function query(text, params = []) {

    const resultado =
        await pool.query(
            text,
            params
        );

    return resultado;
}

// =====================================================
// CRIAR TABELAS
// =====================================================

async function inicializarBanco() {

    await query(`
        CREATE TABLE IF NOT EXISTS administradores (
            id BIGSERIAL PRIMARY KEY,
            usuario TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS produtos (
            id BIGSERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            descricao TEXT,
            preco NUMERIC(10,2) NOT NULL,
            imagem TEXT,
            ativo INTEGER DEFAULT 1,
            criado_em TIMESTAMPTZ DEFAULT NOW()
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS regioes (
            id BIGSERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            tipo TEXT NOT NULL,
            taxa NUMERIC(10,2) NOT NULL
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id BIGSERIAL PRIMARY KEY,
            cliente TEXT NOT NULL,
            telefone TEXT,
            endereco TEXT,
            tipo_entrega TEXT NOT NULL,
            regiao TEXT,
            taxa_entrega NUMERIC(10,2) DEFAULT 0,
            pagamento TEXT,
            troco_para NUMERIC(10,2) DEFAULT 0,
            subtotal NUMERIC(10,2) NOT NULL,
            total NUMERIC(10,2) NOT NULL,
            status TEXT DEFAULT 'novo',
            criado_em TIMESTAMPTZ DEFAULT NOW()
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS itens_pedido (
            id BIGSERIAL PRIMARY KEY,
            pedido_id BIGINT NOT NULL
                REFERENCES pedidos(id)
                ON DELETE CASCADE,
            produto_id BIGINT,
            nome_produto TEXT NOT NULL,
            quantidade INTEGER NOT NULL,
            preco NUMERIC(10,2) NOT NULL
        )
    `);

    // =================================================
    // ADMIN PADRÃO
    // =================================================

    const admin =
        await query(`
            SELECT id
            FROM administradores
            WHERE usuario = $1
            LIMIT 1
        `, ["admin"]);

    if (admin.rows.length === 0) {

        await query(`
            INSERT INTO administradores
            (usuario, senha)
            VALUES ($1, $2)
        `, [
            "admin",
            "1234"
        ]);

        console.log(
            "✅ Administrador padrão criado."
        );
    }

    // =================================================
    // REGIÕES PADRÃO
    // =================================================

    const regioes =
        await query(`
            SELECT COUNT(*) AS total
            FROM regioes
        `);

    if (
        Number(regioes.rows[0].total) === 0
    ) {

        await query(`
            INSERT INTO regioes
            (nome, tipo, taxa)
            VALUES
            ($1, $2, $3),
            ($4, $5, $6)
        `, [
            "Perto",
            "perto",
            2,
            "Longe",
            "longe",
            3
        ]);

        console.log(
            "✅ Regiões padrão criadas."
        );
    }

    console.log(
        "✅ Banco PostgreSQL inicializado."
    );
}

// =====================================================
// ROTA PRINCIPAL
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});

// =====================================================
// TESTE
// =====================================================

app.get(
    "/api/teste",
    async (req, res) => {

        try {

            await query(
                "SELECT NOW()"
            );

            res.json({
                sucesso: true,
                mensagem:
                    "Servidor da Docemania funcionando!"
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                sucesso: false,
                erro:
                    "Banco de dados indisponível."
            });

        }

    }
);

// =====================================================
// LISTAR PRODUTOS
// =====================================================

app.get(
    "/api/produtos",
    async (req, res) => {

        try {

            const resultado =
                await query(`
                    SELECT *
                    FROM produtos
                    WHERE ativo = 1
                    ORDER BY id DESC
                `);

            res.json(
                resultado.rows
            );

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro:
                    "Erro ao buscar produtos"
            });

        }

    }
);

// =====================================================
// UPLOAD PARA SUPABASE STORAGE
// =====================================================

async function enviarImagemParaSupabase(
    arquivo
) {

    if (!arquivo) {
        return null;
    }

    const extensao =
        path.extname(
            arquivo.originalname
        );

    const nomeArquivo =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}${extensao}`;

    const caminho =
        `produtos/${nomeArquivo}`;

    const uploadResultado =
        await supabase.storage
            .from("produtos")
            .upload(
                caminho,
                arquivo.buffer,
                {
                    contentType:
                        arquivo.mimetype,
                    upsert: false
                }
            );

    if (
        uploadResultado.error
    ) {

        throw uploadResultado.error;

    }

    const urlResultado =
        supabase.storage
            .from("produtos")
            .getPublicUrl(
                caminho
            );

    return urlResultado
        .data
        .publicUrl;
}

// =====================================================
// ADICIONAR PRODUTO
// =====================================================

app.post(
    "/api/produtos",
    upload.single("imagem"),
    async (req, res) => {

        try {

            const {
                nome,
                descricao,
                preco
            } = req.body;

            if (
                !nome ||
                !preco
            ) {

                return res.status(400).json({
                    erro:
                        "Nome e preço são obrigatórios"
                });

            }

            let imagem = null;

            if (req.file) {

                imagem =
                    await enviarImagemParaSupabase(
                        req.file
                    );

            }

            const resultado =
                await query(`
                    INSERT INTO produtos
                    (
                        nome,
                        descricao,
                        preco,
                        imagem
                    )
                    VALUES
                    ($1, $2, $3, $4)
                    RETURNING id
                `, [
                    nome,
                    descricao || "",
                    Number(preco),
                    imagem
                ]);

            res.json({
                sucesso: true,
                id:
                    resultado.rows[0].id
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro:
                    "Erro ao adicionar produto"
            });

        }

    }
);

// =====================================================
// ATUALIZAR PRODUTO
// =====================================================

app.put(
    "/api/produtos/:id",
    upload.single("imagem"),
    async (req, res) => {

        try {

            const id =
                Number(
                    req.params.id
                );

            const {
                nome,
                descricao,
                preco,
                ativo
            } = req.body;

            const produto =
                await query(`
                    SELECT *
                    FROM produtos
                    WHERE id = $1
                `, [id]);

            if (
                produto.rows.length === 0
            ) {

                return res.status(404).json({
                    erro:
                        "Produto não encontrado"
                });

            }

            const produtoAtual =
                produto.rows[0];

            let imagem =
                produtoAtual.imagem;

            if (req.file) {

                imagem =
                    await enviarImagemParaSupabase(
                        req.file
                    );

            }

            const ativoFinal =
                ativo === undefined
                    ? produtoAtual.ativo
                    : Number(ativo);

            await query(`
                UPDATE produtos

                SET
                    nome = $1,
                    descricao = $2,
                    preco = $3,
                    imagem = $4,
                    ativo = $5

                WHERE id = $6
            `, [
                nome,
                descricao || "",
                Number(preco),
                imagem,
                ativoFinal,
                id
            ]);

            res.json({
                sucesso: true
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro:
                    "Erro ao atualizar produto"
            });

        }

    }
);

// =====================================================
// EXCLUIR PRODUTO
// =====================================================

app.delete(
    "/api/produtos/:id",
    async (req, res) => {

        try {

            const id =
                Number(
                    req.params.id
                );

            await query(`
                DELETE FROM produtos
                WHERE id = $1
            `, [id]);

            res.json({
                sucesso: true
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro:
                    "Erro ao excluir produto"
            });

        }

    }
);

// =====================================================
// LOGIN
// =====================================================

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const {
                usuario,
                senha
            } = req.body;

            const resultado =
                await query(`
                    SELECT id, usuario
                    FROM administradores
                    WHERE usuario = $1
                    AND senha = $2
                    LIMIT 1
                `, [
                    usuario,
                    senha
                ]);

            if (
                resultado.rows.length === 0
            ) {

                return res.status(401).json({
                    sucesso: false,
                    mensagem:
                        "Usuário ou senha incorretos"
                });

            }

            res.json({
                sucesso: true,
                usuario:
                    resultado.rows[0].usuario
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro:
                    "Erro no login"
            });

        }

    }
);

// =====================================================
// LISTAR REGIÕES
// =====================================================

app.get(
    "/api/regioes",
    async (req, res) => {

        try {

            const resultado =
                await query(`
                    SELECT *
                    FROM regioes
                    ORDER BY nome
                `);

            res.json(
                resultado.rows
            );

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro:
                    "Erro ao buscar regiões"
            });

        }

    }
);

// =====================================================
// CRIAR PEDIDO
// =====================================================

app.post(
    "/api/pedidos",
    async (req, res) => {

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
                    erro:
                        "Pedido inválido"
                });

            }

            let subtotal = 0;

            for (
                const item of itens
            ) {

                const preco =
                    Number(item.preco);

                const quantidade =
                    Number(item.quantidade);

                if (
                    !Number.isFinite(preco) ||
                    !Number.isFinite(quantidade) ||
                    quantidade <= 0
                ) {

                    return res.status(400).json({
                        erro:
                            "Item do pedido inválido"
                    });

                }

                subtotal +=
                    preco *
                    quantidade;

            }

            const taxa =
                Number(
                    taxa_entrega || 0
                );

            const total =
                subtotal + taxa;

            const pedido =
                await query(`
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

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10
                    )

                    RETURNING id
                `, [
                    cliente,
                    telefone || "",
                    endereco || "",
                    tipo_entrega,
                    regiao || "",
                    taxa,
                    pagamento || "",
                    Number(
                        troco_para || 0
                    ),
                    subtotal,
                    total
                ]);

            const pedidoId =
                pedido.rows[0].id;

            for (
                const item of itens
            ) {

                await query(`
                    INSERT INTO itens_pedido
                    (
                        pedido_id,
                        produto_id,
                        nome_produto,
                        quantidade,
                        preco
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )
                `, [
                    pedidoId,
                    item.produto_id || null,
                    item.nome_produto,
                    Number(
                        item.quantidade
                    ),
                    Number(
                        item.preco
                    )
                ]);

            }

            res.json({
                sucesso: true,
                pedido_id:
                    pedidoId,
                subtotal,
                taxa,
                total
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro:
                    "Erro ao criar pedido"
            });

        }

    }
);

// =====================================================
// LISTAR PEDIDOS
// =====================================================

app.get(
    "/api/pedidos",
    async (req, res) => {

        try {

            const resultado =
                await query(`
                    SELECT *
                    FROM pedidos
                    ORDER BY id DESC
                `);

            const pedidos =
                resultado.rows;

            for (
                const pedido of pedidos
            ) {

                const itens =
                    await query(`
                        SELECT *
                        FROM itens_pedido
                        WHERE pedido_id = $1
                        ORDER BY id
                    `, [
                        pedido.id
                    ]);

                pedido.itens =
                    itens.rows;

            }

            res.json(
                pedidos
            );

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro:
                    "Erro ao buscar pedidos"
            });

        }

    }
);

// =====================================================
// ALTERAR STATUS
// =====================================================

app.put(
    "/api/pedidos/:id/status",
    async (req, res) => {

        try {

            const id =
                Number(
                    req.params.id
                );

            const {
                status
            } = req.body;

            const statusPermitidos = [
                "novo",
                "preparando",
                "concluido",
                "cancelado"
            ];

            if (
                !statusPermitidos.includes(
                    status
                )
            ) {

                return res.status(400).json({
                    erro:
                        "Status inválido"
                });

            }

            await query(`
                UPDATE pedidos
                SET status = $1
                WHERE id = $2
            `, [
                status,
                id
            ]);

            res.json({
                sucesso: true
            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro:
                    "Erro ao alterar status"
            });

        }

    }
);

// =====================================================
// DASHBOARD
// =====================================================

app.get(
    "/api/dashboard",
    async (req, res) => {

        try {

            const vendasHoje =
                await query(`
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS total
                    FROM pedidos
                    WHERE status = 'concluido'
                    AND criado_em::date =
                        CURRENT_DATE
                `);

            const vendasMes =
                await query(`
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS total
                    FROM pedidos
                    WHERE status = 'concluido'
                    AND DATE_TRUNC(
                        'month',
                        criado_em
                    ) =
                    DATE_TRUNC(
                        'month',
                        CURRENT_TIMESTAMP
                    )
                `);

            const pedidosHoje =
                await query(`
                    SELECT
                        COUNT(*) AS total
                    FROM pedidos
                    WHERE criado_em::date =
                        CURRENT_DATE
                `);

            const tortasHoje =
                await query(`
                    SELECT
                        COALESCE(
                            SUM(ip.quantidade),
                            0
                        ) AS total
                    FROM itens_pedido ip
                    INNER JOIN pedidos p
                        ON p.id =
                           ip.pedido_id
                    WHERE p.status =
                        'concluido'
                    AND p.criado_em::date =
                        CURRENT_DATE
                `);

            res.json({

                vendasHoje:
                    Number(
                        vendasHoje.rows[0].total
                    ),

                vendasMes:
                    Number(
                        vendasMes.rows[0].total
                    ),

                pedidosHoje:
                    Number(
                        pedidosHoje.rows[0].total
                    ),

                tortasHoje:
                    Number(
                        tortasHoje.rows[0].total
                    )

            });

        } catch (erro) {

            console.error(erro);

            res.status(500).json({
                erro:
                    "Erro no dashboard"
            });

        }

    }
);

// =====================================================
// TRATAMENTO DE ERROS DO MULTER
// =====================================================

app.use(
    (erro, req, res, next) => {

        if (
            erro &&
            erro.code ===
            "LIMIT_FILE_SIZE"
        ) {

            return res.status(400).json({
                erro:
                    "A imagem deve ter no máximo 3 MB."
            });

        }

        next(erro);

    }
);

// =====================================================
// INICIAR SERVIDOR
// =====================================================

async function iniciarServidor() {

    try {

        await inicializarBanco();

        app.listen(
            PORT,
            () => {

                console.log("");
                console.log(
                    "🍰 DOCEMANIA ONLINE"
                );

                console.log(
                    `Servidor rodando na porta ${PORT}`
                );

                console.log("");

            }
        );

    } catch (erro) {

        console.error(
            "❌ Erro ao iniciar servidor:"
        );

        console.error(
            erro
        );

        process.exit(1);

    }

}

iniciarServidor();
```
