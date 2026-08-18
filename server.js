/* =========================================================
   DOCEMANIA
   SERVER.JS COMPLETO
========================================================= */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { Pool } = require("pg");
const { createClient } = require("@supabase/supabase-js");

const app = express();


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const PORT =
    process.env.PORT || 3000;

const DATABASE_URL =
    process.env.DATABASE_URL;

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_KEY =
    process.env.SUPABASE_KEY;

const ADMIN_USER =
    process.env.ADMIN_USER;

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD;

const SESSION_SECRET =
    process.env.SESSION_SECRET;


/* =========================================================
   VERIFICAÇÃO DAS VARIÁVEIS
========================================================= */

const variaveisObrigatorias = {
    DATABASE_URL,
    SUPABASE_URL,
    SUPABASE_KEY,
    ADMIN_USER,
    ADMIN_PASSWORD,
    SESSION_SECRET
};

for (
    const [nome, valor]
    of Object.entries(variaveisObrigatorias)
) {
    if (!valor) {

        console.error(
            `ERRO: variável ${nome} não configurada.`
        );

        process.exit(1);
    }
}


/* =========================================================
   EXPRESS
========================================================= */

app.set(
    "trust proxy",
    1
);

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "2mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb"
    })
);


/* =========================================================
   ARQUIVOS PÚBLICOS
========================================================= */

const publicPath =
    path.join(
        __dirname,
        "public"
    );

app.use(
    express.static(
        publicPath
    )
);


/* =========================================================
   POSTGRESQL
========================================================= */

const pool =
    new Pool({

        connectionString:
            DATABASE_URL,

        ssl: {
            rejectUnauthorized:
                false
        },

        max: 10,

        idleTimeoutMillis:
            30000,

        connectionTimeoutMillis:
            10000

    });


async function query(
    texto,
    parametros = []
) {

    return pool.query(
        texto,
        parametros
    );
}


/* =========================================================
   SUPABASE
========================================================= */

const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   UPLOAD DE IMAGENS
========================================================= */

const upload =
    multer({

        storage:
            multer.memoryStorage(),

        limits: {

            fileSize:
                3 * 1024 * 1024

        },

        fileFilter:
            function (
                req,
                file,
                callback
            ) {

                const tiposPermitidos = [

                    "image/jpeg",

                    "image/png",

                    "image/webp"

                ];

                if (
                    !tiposPermitidos.includes(
                        file.mimetype
                    )
                ) {

                    return callback(
                        new Error(
                            "Tipo de imagem não permitido."
                        )
                    );
                }

                callback(
                    null,
                    true
                );
            }

    });


/* =========================================================
   SESSÃO
========================================================= */

const COOKIE_NAME =
    "docemania_session";

const SESSION_DURATION =
    1000 *
    60 *
    60 *
    8;


/* =========================================================
   LEITURA DE COOKIES
========================================================= */

function lerCookies(req) {

    const cookies = {};

    const header =
        req.headers.cookie;

    if (!header) {
        return cookies;
    }

    const partes =
        header.split(";");

    for (
        const parte
        of partes
    ) {

        const indice =
            parte.indexOf("=");

        if (
            indice === -1
        ) {
            continue;
        }

        const nome =
            parte
                .slice(
                    0,
                    indice
                )
                .trim();

        const valor =
            parte
                .slice(
                    indice + 1
                )
                .trim();

        try {

            cookies[nome] =
                decodeURIComponent(
                    valor
                );

        } catch {

            cookies[nome] =
                valor;
        }
    }

    return cookies;
}


/* =========================================================
   CRIAR TOKEN DE SESSÃO
========================================================= */

function criarTokenSessao(
    usuarioId,
    usuario
) {

    const payload = {

        id:
            usuarioId,

        usuario:
            usuario,

        exp:
            Date.now() +
            SESSION_DURATION

    };

    const dados =
        Buffer
            .from(
                JSON.stringify(
                    payload
                )
            )
            .toString(
                "base64url"
            );

    const assinatura =
        crypto
            .createHmac(
                "sha256",
                SESSION_SECRET
            )
            .update(
                dados
            )
            .digest(
                "base64url"
            );

    return (
        dados +
        "." +
        assinatura
    );
}


/* =========================================================
   VERIFICAR TOKEN
========================================================= */

function verificarTokenSessao(
    token
) {

    try {

        if (!token) {
            return null;
        }

        const partes =
            token.split(".");

        if (
            partes.length !== 2
        ) {
            return null;
        }

        const dados =
            partes[0];

        const assinaturaRecebida =
            partes[1];

        const assinaturaEsperada =
            crypto
                .createHmac(
                    "sha256",
                    SESSION_SECRET
                )
                .update(
                    dados
                )
                .digest(
                    "base64url"
                );

        const recebido =
            Buffer.from(
                assinaturaRecebida
            );

        const esperado =
            Buffer.from(
                assinaturaEsperada
            );

        if (
            recebido.length !==
            esperado.length
        ) {
            return null;
        }

        if (
            !crypto.timingSafeEqual(
                recebido,
                esperado
            )
        ) {
            return null;
        }

        const payload =
            JSON.parse(
                Buffer
                    .from(
                        dados,
                        "base64url"
                    )
                    .toString(
                        "utf8"
                    )
            );

        if (
            !payload.exp
        ) {
            return null;
        }

        if (
            Date.now() >
            payload.exp
        ) {
            return null;
        }

        return payload;

    } catch {

        return null;
    }
}


/* =========================================================
   MIDDLEWARE DE LOGIN
========================================================= */

function exigirLogin(
    req,
    res,
    next
) {

    const cookies =
        lerCookies(
            req
        );

    const token =
        cookies[
            COOKIE_NAME
        ];

    const sessao =
        verificarTokenSessao(
            token
        );

    if (!sessao) {

        return res
            .status(401)
            .json({

                sucesso: false,

                erro:
                    "Não autorizado."

            });
    }

    req.usuario =
        sessao;

    next();
}


/* =========================================================
   BANCO DE DADOS
========================================================= */

async function inicializarBanco() {


    /* =====================================================
       ADMINISTRADORES
    ===================================================== */

    await query(`
        CREATE TABLE IF NOT EXISTS administradores (

            id BIGSERIAL PRIMARY KEY,

            usuario TEXT UNIQUE NOT NULL,

            senha TEXT NOT NULL

        )
    `);


    /* =====================================================
       PRODUTOS
    ===================================================== */

    await query(`
        CREATE TABLE IF NOT EXISTS produtos (

            id BIGSERIAL PRIMARY KEY,

            nome TEXT NOT NULL,

            descricao TEXT,

            preco NUMERIC(10,2) NOT NULL,

            imagem TEXT,

            ativo INTEGER DEFAULT 1,

            criado_em TIMESTAMPTZ
                DEFAULT NOW()

        )
    `);


    /* =====================================================
       REGIÕES
    ===================================================== */

    await query(`
        CREATE TABLE IF NOT EXISTS regioes (

            id BIGSERIAL PRIMARY KEY,

            nome TEXT NOT NULL,

            tipo TEXT NOT NULL,

            taxa NUMERIC(10,2) NOT NULL

        )
    `);


    /* =====================================================
       PEDIDOS
    ===================================================== */

    await query(`
        CREATE TABLE IF NOT EXISTS pedidos (

            id BIGSERIAL PRIMARY KEY,

            cliente TEXT NOT NULL,

            telefone TEXT,

            endereco TEXT,

            tipo_entrega TEXT NOT NULL,

            regiao TEXT,

            taxa_entrega NUMERIC(10,2)
                DEFAULT 0,

            pagamento TEXT,

            troco_para NUMERIC(10,2)
                DEFAULT 0,

            subtotal NUMERIC(10,2)
                NOT NULL,

            total NUMERIC(10,2)
                NOT NULL,

            status TEXT
                DEFAULT 'novo',

            criado_em TIMESTAMPTZ
                DEFAULT NOW()

        )
    `);


    /* =====================================================
       ITENS DOS PEDIDOS
    ===================================================== */

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


    /* =====================================================
       GARANTIR COLUNAS
    ===================================================== */

    await query(`
        ALTER TABLE produtos
        ADD COLUMN IF NOT EXISTS ativo INTEGER
        DEFAULT 1
    `);

    await query(`
        ALTER TABLE produtos
        ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ
        DEFAULT NOW()
    `);

    await query(`
        ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS status TEXT
        DEFAULT 'novo'
    `);

    await query(`
        ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ
        DEFAULT NOW()
    `);

    await query(`
        ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS telefone TEXT
    `);

    await query(`
        ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS endereco TEXT
    `);

    await query(`
        ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS regiao TEXT
    `);

    await query(`
        ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS taxa_entrega NUMERIC(10,2)
        DEFAULT 0
    `);

    await query(`
        ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS pagamento TEXT
    `);

    await query(`
        ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS troco_para NUMERIC(10,2)
        DEFAULT 0
    `);


    /* =====================================================
       CRIAR / ATUALIZAR ADMIN
    ===================================================== */

    const senhaHash =
        await bcrypt.hash(
            ADMIN_PASSWORD,
            12
        );

    const admin =
        await query(
            `
            SELECT id

            FROM administradores

            WHERE usuario = $1

            LIMIT 1
            `,
            [
                ADMIN_USER
            ]
        );

    if (
        admin.rows.length === 0
    ) {

        await query(
            `
            INSERT INTO administradores
            (
                usuario,
                senha
            )

            VALUES
            (
                $1,
                $2
            )
            `,
            [
                ADMIN_USER,
                senhaHash
            ]
        );

        console.log(
            "Administrador criado."
        );

    } else {

        await query(
            `
            UPDATE administradores

            SET senha = $1

            WHERE usuario = $2
            `,
            [
                senhaHash,
                ADMIN_USER
            ]
        );

        console.log(
            "Senha do administrador sincronizada."
        );
    }


    /* =====================================================
       REGIÕES INICIAIS
    ===================================================== */

    const regioes =
        await query(
            `
            SELECT COUNT(*) AS total

            FROM regioes
            `
        );

    if (
        Number(
            regioes.rows[0].total
        ) === 0
    ) {

        await query(
            `
            INSERT INTO regioes
            (
                nome,
                tipo,
                taxa
            )

            VALUES
            (
                $1,
                $2,
                $3
            ),
            (
                $4,
                $5,
                $6
            )
            `,
            [

                "Perto",

                "perto",

                2,

                "Longe",

                "longe",

                3

            ]
        );
    }

    console.log(
        "Banco PostgreSQL inicializado."
    );
}


/* =========================================================
   PÁGINA PRINCIPAL
========================================================= */

app.get(
    "/",
    function (
        req,
        res
    ) {

        res.sendFile(
            path.join(
                publicPath,
                "index.html"
            )
        );
    }
);


/* =========================================================
   TESTE DO SERVIDOR
========================================================= */

app.get(
    "/api/teste",
    async function (
        req,
        res
    ) {

        try {

            await query(
                "SELECT NOW()"
            );

            res.json({

                sucesso: true,

                mensagem:
                    "Servidor da Docemania funcionando online."

            });

        } catch (erro) {

            console.error(
                erro
            );

            res
                .status(500)
                .json({

                    sucesso: false,

                    erro:
                        "Banco de dados indisponível."

                });
        }
    }
);


/* =========================================================
   LOGIN
========================================================= */

app.post(
    "/api/login",
    async function (
        req,
        res
    ) {

        try {

            const usuario =
                typeof req.body.usuario ===
                "string"

                    ? req.body.usuario.trim()

                    : "";

            const senha =
                typeof req.body.senha ===
                "string"

                    ? req.body.senha

                    : "";

            if (
                !usuario ||
                !senha
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            "Usuário e senha são obrigatórios."

                    });
            }

            const resultado =
                await query(
                    `
                    SELECT
                        id,
                        usuario,
                        senha

                    FROM administradores

                    WHERE usuario = $1

                    LIMIT 1
                    `,
                    [
                        usuario
                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res
                    .status(401)
                    .json({

                        sucesso: false,

                        mensagem:
                            "Usuário ou senha incorretos."

                    });
            }

            const administrador =
                resultado.rows[0];

            const senhaCorreta =
                await bcrypt.compare(
                    senha,
                    administrador.senha
                );

            if (!senhaCorreta) {

                return res
                    .status(401)
                    .json({

                        sucesso: false,

                        mensagem:
                            "Usuário ou senha incorretos."

                    });
            }

            const token =
                criarTokenSessao(
                    administrador.id,
                    administrador.usuario
                );

            const producao =
                process.env.NODE_ENV ===
                "production";

            const cookie =
                [

                    `${COOKIE_NAME}=${encodeURIComponent(token)}`,

                    "HttpOnly",

                    "Path=/",

                    "Max-Age=28800",

                    producao
                        ? "SameSite=None"
                        : "SameSite=Lax",

                    producao
                        ? "Secure"
                        : ""

                ]

                .filter(Boolean)

                .join("; ");

            res.setHeader(
                "Set-Cookie",
                cookie
            );

            res.json({

                sucesso: true,

                usuario:
                    administrador.usuario

            });

        } catch (erro) {

            console.error(
                "Erro no login:",
                erro
            );

            res
                .status(500)
                .json({

                    sucesso: false,

                    erro:
                        "Erro no login."

                });
        }
    }
);


/* =========================================================
   SESSÃO
========================================================= */

app.get(
    "/api/sessao",
    exigirLogin,
    function (
        req,
        res
    ) {

        res.json({

            autenticado: true,

            usuario:
                req.usuario.usuario

        });
    }
);


/* =========================================================
   LOGOUT
========================================================= */

app.post(
    "/api/logout",
    function (
        req,
        res
    ) {

        const producao =
            process.env.NODE_ENV ===
            "production";

        const cookie =
            [

                `${COOKIE_NAME}=`,

                "HttpOnly",

                "Path=/",

                "Max-Age=0",

                producao
                    ? "SameSite=None"
                    : "SameSite=Lax",

                producao
                    ? "Secure"
                    : ""

            ]

            .filter(Boolean)

            .join("; ");

        res.setHeader(
            "Set-Cookie",
            cookie
        );

        res.json({

            sucesso: true

        });
    }
);


/* =========================================================
   PRODUTOS - CLIENTE
========================================================= */

app.get(
    "/api/produtos",
    async function (
        req,
        res
    ) {

        try {

            const resultado =
                await query(
                    `
                    SELECT *

                    FROM produtos

                    WHERE ativo = 1

                    ORDER BY id DESC
                    `
                );

            res.json(
                resultado.rows
            );

        } catch (erro) {

            console.error(
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao buscar produtos."

                });
        }
    }
);


/* =========================================================
   PRODUTOS - ADMIN
========================================================= */

app.get(
    "/api/admin/produtos",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const resultado =
                await query(
                    `
                    SELECT *

                    FROM produtos

                    ORDER BY id DESC
                    `
                );

            res.json(
                resultado.rows
            );

        } catch (erro) {

            console.error(
                "Erro ao buscar produtos administrativos:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao buscar produtos."

                });
        }
    }
);


/* =========================================================
   UPLOAD SUPABASE
========================================================= */

async function enviarImagemParaSupabase(
    arquivo
) {

    if (!arquivo) {
        return null;
    }

    const extensao =
        path
            .extname(
                arquivo.originalname
            )
            .toLowerCase();

    const extensoesPermitidas = [

        ".jpg",

        ".jpeg",

        ".png",

        ".webp"

    ];

    if (
        !extensoesPermitidas.includes(
            extensao
        )
    ) {

        throw new Error(
            "Formato de imagem não permitido."
        );
    }

    const nomeArquivo =
        Date.now() +
        "-" +
        crypto
            .randomBytes(8)
            .toString("hex") +
        extensao;

    const caminho =
        "produtos/" +
        nomeArquivo;

    const resultado =
        await supabase.storage
            .from("produtos")
            .upload(
                caminho,
                arquivo.buffer,
                {

                    contentType:
                        arquivo.mimetype,

                    upsert:
                        false

                }
            );

    if (
        resultado.error
    ) {

        throw resultado.error;
    }

    const url =
        supabase.storage
            .from("produtos")
            .getPublicUrl(
                caminho
            );

    return url
        .data
        .publicUrl;
}


/* =========================================================
   CRIAR PRODUTO
========================================================= */

app.post(
    "/api/produtos",
    exigirLogin,
    upload.single("imagem"),
    async function (
        req,
        res
    ) {

        try {

            const nome =
                typeof req.body.nome ===
                "string"

                    ? req.body.nome.trim()

                    : "";

            const descricao =
                typeof req.body.descricao ===
                "string"

                    ? req.body.descricao

                    : "";

            const preco =
                Number(
                    req.body.preco
                );

            const ativo =
                req.body.ativo ===
                undefined

                    ? 1

                    : Number(
                        req.body.ativo
                    )
                        ? 1
                        : 0;

            if (!nome) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Nome é obrigatório."

                    });
            }

            if (
                !Number.isFinite(preco) ||
                preco < 0
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Preço inválido."

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
                await query(
                    `
                    INSERT INTO produtos
                    (
                        nome,
                        descricao,
                        preco,
                        imagem,
                        ativo
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )

                    RETURNING *
                    `,
                    [

                        nome,

                        descricao,

                        preco,

                        imagem,

                        ativo

                    ]
                );

            res.json({

                sucesso: true,

                produto:
                    resultado.rows[0]

            });

        } catch (erro) {

            console.error(
                "Erro ao criar produto:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao adicionar produto."

                });
        }
    }
);


/* =========================================================
   EDITAR PRODUTO
========================================================= */

app.put(
    "/api/produtos/:id",
    exigirLogin,
    upload.single("imagem"),
    async function (
        req,
        res
    ) {

        try {

            const id =
                Number(
                    req.params.id
                );

            if (
                !Number.isInteger(id)
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "ID inválido."

                    });
            }

            const produto =
                await query(
                    `
                    SELECT *

                    FROM produtos

                    WHERE id = $1
                    `,
                    [
                        id
                    ]
                );

            if (
                produto.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        erro:
                            "Produto não encontrado."

                    });
            }

            const atual =
                produto.rows[0];

            const nome =
                req.body.nome ===
                undefined

                    ? atual.nome

                    : String(
                        req.body.nome
                    ).trim();

            const descricao =
                req.body.descricao ===
                undefined

                    ? atual.descricao

                    : String(
                        req.body.descricao
                    );

            const preco =
                req.body.preco ===
                undefined

                    ? Number(
                        atual.preco
                    )

                    : Number(
                        req.body.preco
                    );

            let ativo =
                Number(
                    atual.ativo
                );

            if (
                req.body.ativo !==
                undefined
            ) {

                ativo =
                    Number(
                        req.body.ativo
                    )
                        ? 1
                        : 0;
            }

            if (
                !nome ||
                !Number.isFinite(preco) ||
                preco < 0
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Dados do produto inválidos."

                    });
            }

            let imagem =
                atual.imagem;

            if (req.file) {

                imagem =
                    await enviarImagemParaSupabase(
                        req.file
                    );
            }

            await query(
                `
                UPDATE produtos

                SET

                    nome = $1,

                    descricao = $2,

                    preco = $3,

                    imagem = $4,

                    ativo = $5

                WHERE id = $6
                `,
                [

                    nome,

                    descricao,

                    preco,

                    imagem,

                    ativo,

                    id

                ]
            );

            const atualizado =
                await query(
                    `
                    SELECT *

                    FROM produtos

                    WHERE id = $1
                    `,
                    [
                        id
                    ]
                );

            res.json({

                sucesso: true,

                produto:
                    atualizado.rows[0]

            });

        } catch (erro) {

            console.error(
                "Erro ao atualizar produto:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao atualizar produto."

                });
        }
    }
);


/* =========================================================
   STATUS DO PRODUTO
========================================================= */

app.put(
    "/api/produtos/:id/status",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const id =
                Number(
                    req.params.id
                );

            const ativo =
                Number(
                    req.body.ativo
                )
                    ? 1
                    : 0;

            if (
                !Number.isInteger(id)
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "ID inválido."

                    });
            }

            const resultado =
                await query(
                    `
                    UPDATE produtos

                    SET ativo = $1

                    WHERE id = $2

                    RETURNING *
                    `,
                    [

                        ativo,

                        id

                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        erro:
                            "Produto não encontrado."

                    });
            }

            res.json({

                sucesso: true,

                produto:
                    resultado.rows[0]

            });

        } catch (erro) {

            console.error(
                "Erro ao alterar status do produto:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao alterar status do produto."

                });
        }
    }
);


/* =========================================================
   EXCLUIR PRODUTO
========================================================= */

app.delete(
    "/api/produtos/:id",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const id =
                Number(
                    req.params.id
                );

            if (
                !Number.isInteger(id)
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "ID inválido."

                    });
            }

            const resultado =
                await query(
                    `
                    DELETE FROM produtos

                    WHERE id = $1
                    `,
                    [
                        id
                    ]
                );

            if (
                resultado.rowCount === 0
            ) {

                return res
                    .status(404)
                    .json({

                        erro:
                            "Produto não encontrado."

                    });
            }

            res.json({

                sucesso: true

            });

        } catch (erro) {

            console.error(
                "Erro ao excluir produto:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Não foi possível excluir o produto."

                });
        }
    }
);


/* =========================================================
   REGIÕES
========================================================= */

app.get(
    "/api/regioes",
    async function (
        req,
        res
    ) {

        try {

            const resultado =
                await query(
                    `
                    SELECT *

                    FROM regioes

                    ORDER BY nome
                    `
                );

            res.json(
                resultado.rows
            );

        } catch (erro) {

            console.error(
                "Erro ao buscar regiões:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao buscar regiões."

                });
        }
    }
);


/* =========================================================
   CRIAR REGIÃO
========================================================= */

app.post(
    "/api/regioes",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const nome =
                String(
                    req.body.nome ||
                    ""
                ).trim();

            const tipo =
                String(
                    req.body.tipo ||
                    ""
                ).trim();

            const taxa =
                Number(
                    req.body.taxa
                );

            if (!nome) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Nome da região é obrigatório."

                    });
            }

            if (!tipo) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Tipo da região é obrigatório."

                    });
            }

            if (
                !Number.isFinite(taxa) ||
                taxa < 0
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Taxa inválida."

                    });
            }

            const resultado =
                await query(
                    `
                    INSERT INTO regioes
                    (
                        nome,
                        tipo,
                        taxa
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3
                    )

                    RETURNING *
                    `,
                    [

                        nome,

                        tipo,

                        taxa

                    ]
                );

            res.json({

                sucesso: true,

                regiao:
                    resultado.rows[0]

            });

        } catch (erro) {

            console.error(
                "Erro ao criar região:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao criar região."

                });
        }
    }
);


/* =========================================================
   EDITAR REGIÃO
========================================================= */

app.put(
    "/api/regioes/:id",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const id =
                Number(
                    req.params.id
                );

            const nome =
                String(
                    req.body.nome ||
                    ""
                ).trim();

            const tipo =
                String(
                    req.body.tipo ||
                    ""
                ).trim();

            const taxa =
                Number(
                    req.body.taxa
                );

            if (
                !Number.isInteger(id)
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "ID inválido."

                    });
            }

            if (
                !nome ||
                !tipo ||
                !Number.isFinite(taxa) ||
                taxa < 0
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Dados da região inválidos."

                    });
            }

            const resultado =
                await query(
                    `
                    UPDATE regioes

                    SET

                        nome = $1,

                        tipo = $2,

                        taxa = $3

                    WHERE id = $4

                    RETURNING *
                    `,
                    [

                        nome,

                        tipo,

                        taxa,

                        id

                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        erro:
                            "Região não encontrada."

                    });
            }

            res.json({

                sucesso: true,

                regiao:
                    resultado.rows[0]

            });

        } catch (erro) {

            console.error(
                "Erro ao editar região:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao editar região."

                });
        }
    }
);


/* =========================================================
   EXCLUIR REGIÃO
========================================================= */

app.delete(
    "/api/regioes/:id",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const id =
                Number(
                    req.params.id
                );

            if (
                !Number.isInteger(id)
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "ID inválido."

                    });
            }

            const resultado =
                await query(
                    `
                    DELETE FROM regioes

                    WHERE id = $1
                    `,
                    [
                        id
                    ]
                );

            if (
                resultado.rowCount === 0
            ) {

                return res
                    .status(404)
                    .json({

                        erro:
                            "Região não encontrada."

                    });
            }

            res.json({

                sucesso: true

            });

        } catch (erro) {

            console.error(
                "Erro ao excluir região:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao excluir região."

                });
        }
    }
);


/* =========================================================
   CRIAR PEDIDO
========================================================= */

app.post(
    "/api/pedidos",
    async function (
        req,
        res
    ) {

        const client =
            await pool.connect();

        let transacaoIniciada =
            false;

        try {

            const cliente =
                typeof req.body.cliente ===
                "string"

                    ? req.body.cliente.trim()

                    : "";

            const telefone =
                typeof req.body.telefone ===
                "string"

                    ? req.body.telefone.trim()

                    : "";

            const endereco =
                typeof req.body.endereco ===
                "string"

                    ? req.body.endereco.trim()

                    : "";

            const tipoEntrega =
                typeof req.body.tipo_entrega ===
                "string"

                    ? req.body.tipo_entrega.trim()

                    : "";

            const regiao =
                typeof req.body.regiao ===
                "string"

                    ? req.body.regiao.trim()

                    : "";

            const pagamento =
                typeof req.body.pagamento ===
                "string"

                    ? req.body.pagamento.trim()

                    : "";

            const itens =
                req.body.itens;


            /* =================================================
               VALIDAÇÕES
            ================================================= */

            if (
                !cliente ||
                !Array.isArray(itens) ||
                itens.length === 0
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Pedido inválido."

                    });
            }

            if (
                ![
                    "entrega",
                    "retirada"
                ].includes(
                    tipoEntrega
                )
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Tipo de entrega inválido."

                    });
            }

            if (!pagamento) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Forma de pagamento obrigatória."

                    });
            }

            if (
                tipoEntrega ===
                "entrega" &&
                !endereco
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Endereço é obrigatório para entrega."

                    });
            }


            /* =================================================
               CALCULAR SUBTOTAL
            ================================================= */

            let subtotal = 0;

            const itensValidados = [];

            for (
                const item
                of itens
            ) {

                const quantidade =
                    Number(
                        item.quantidade
                    );

                const produtoId =
                    Number(
                        item.produto_id
                    );

                if (
                    !Number.isInteger(
                        quantidade
                    ) ||
                    quantidade <= 0
                ) {

                    return res
                        .status(400)
                        .json({

                            erro:
                                "Quantidade inválida."

                        });
                }

                if (
                    !Number.isInteger(
                        produtoId
                    )
                ) {

                    return res
                        .status(400)
                        .json({

                            erro:
                                "Produto inválido."

                        });
                }

                const produto =
                    await client.query(
                        `
                        SELECT

                            id,

                            nome,

                            preco

                        FROM produtos

                        WHERE id = $1

                        AND ativo = 1

                        LIMIT 1
                        `,
                        [
                            produtoId
                        ]
                    );

                if (
                    produto.rows.length === 0
                ) {

                    return res
                        .status(400)
                        .json({

                            erro:
                                "Produto não encontrado ou inativo."

                        });
                }

                const dadosProduto =
                    produto.rows[0];

                const preco =
                    Number(
                        dadosProduto.preco
                    );

                subtotal +=
                    preco *
                    quantidade;

                itensValidados.push({

                    produto_id:
                        dadosProduto.id,

                    nome:
                        dadosProduto.nome,

                    quantidade,

                    preco

                });
            }


            /* =================================================
               CALCULAR TAXA
            ================================================= */

            let taxa = 0;

            if (
                tipoEntrega ===
                "entrega"
            ) {

                if (!regiao) {

                    return res
                        .status(400)
                        .json({

                            erro:
                                "Selecione uma região para entrega."

                        });
                }

                const resultadoRegiao =
                    await client.query(
                        `
                        SELECT

                            id,

                            nome,

                            taxa

                        FROM regioes

                        WHERE nome = $1

                        LIMIT 1
                        `,
                        [
                            regiao
                        ]
                    );

                if (
                    resultadoRegiao.rows.length === 0
                ) {

                    return res
                        .status(400)
                        .json({

                            erro:
                                "Região de entrega não encontrada."

                        });
                }

                taxa =
                    Number(
                        resultadoRegiao
                            .rows[0]
                            .taxa
                    );
            }


            /* =================================================
               TROCO
            ================================================= */

            const troco =
                Number(
                    req.body.troco_para ||
                    0
                );

            if (
                !Number.isFinite(
                    troco
                ) ||
                troco < 0
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Valor de troco inválido."

                    });
            }


            /* =================================================
               TOTAL
            ================================================= */

            const total =
                subtotal +
                taxa;


            /* =================================================
               VALIDAR PAGAMENTO EM DINHEIRO
            ================================================= */

            if (
                pagamento.toLowerCase() ===
                "dinheiro" &&
                troco < total
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "O valor informado para troco deve ser igual ou maior que o total."

                    });
            }


            /* =================================================
               TRANSAÇÃO
            ================================================= */

            await client.query(
                "BEGIN"
            );

            transacaoIniciada =
                true;

            const pedido =
                await client.query(
                    `
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
                        total,
                        status
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
                        $10,
                        'novo'
                    )

                    RETURNING
                        id,
                        criado_em,
                        status
                    `,
                    [

                        cliente,

                        telefone,

                        endereco,

                        tipoEntrega,

                        regiao,

                        taxa,

                        pagamento,

                        troco,

                        subtotal,

                        total

                    ]
                );

            const pedidoId =
                pedido.rows[0].id;


            /* =================================================
               INSERIR ITENS
            ================================================= */

            for (
                const item
                of itensValidados
            ) {

                await client.query(
                    `
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
                    `,
                    [

                        pedidoId,

                        item.produto_id,

                        item.nome,

                        item.quantidade,

                        item.preco

                    ]
                );
            }

            await client.query(
                "COMMIT"
            );

            transacaoIniciada =
                false;


            /* =================================================
               RESPOSTA
            ================================================= */

            res.json({

                sucesso: true,

                pedido_id:
                    pedidoId,

                status:
                    "novo",

                criado_em:
                    pedido.rows[0]
                        .criado_em,

                subtotal,

                taxa,

                total

            });

        } catch (erro) {

            if (
                transacaoIniciada
            ) {

                await client.query(
                    "ROLLBACK"
                );
            }

            console.error(
                "Erro ao criar pedido:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao criar pedido."

                });

        } finally {

            client.release();
        }
    }
);


/* =========================================================
   LISTAR PEDIDOS
========================================================= */

app.get(
    "/api/pedidos",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const resultado =
                await query(
                    `
                    SELECT *

                    FROM pedidos

                    ORDER BY
                        id DESC
                    `
                );

            const pedidos =
                resultado.rows;

            for (
                const pedido
                of pedidos
            ) {

                const itens =
                    await query(
                        `
                        SELECT *

                        FROM itens_pedido

                        WHERE pedido_id = $1

                        ORDER BY id
                        `,
                        [
                            pedido.id
                        ]
                    );

                pedido.itens =
                    itens.rows;
            }

            res.json(
                pedidos
            );

        } catch (erro) {

            console.error(
                "Erro ao buscar pedidos:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao buscar pedidos."

                });
        }
    }
);


/* =========================================================
   PEDIDO INDIVIDUAL
========================================================= */

app.get(
    "/api/pedidos/:id",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const id =
                Number(
                    req.params.id
                );

            if (
                !Number.isInteger(id)
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "ID inválido."

                    });
            }

            const pedido =
                await query(
                    `
                    SELECT *

                    FROM pedidos

                    WHERE id = $1

                    LIMIT 1
                    `,
                    [
                        id
                    ]
                );

            if (
                pedido.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        erro:
                            "Pedido não encontrado."

                    });
            }

            const itens =
                await query(
                    `
                    SELECT *

                    FROM itens_pedido

                    WHERE pedido_id = $1

                    ORDER BY id
                    `,
                    [
                        id
                    ]
                );

            res.json({

                sucesso: true,

                pedido: {

                    ...pedido.rows[0],

                    itens:
                        itens.rows

                }

            });

        } catch (erro) {

            console.error(
                "Erro ao buscar pedido:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao buscar pedido."

                });
        }
    }
);


/* =========================================================
   ALTERAR STATUS DO PEDIDO
========================================================= */

app.put(
    "/api/pedidos/:id/status",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const id =
                Number(
                    req.params.id
                );

            const status =
                String(
                    req.body.status ||
                    ""
                ).trim();

            const statusPermitidos = [

                "novo",

                "preparando",

                "concluido",

                "cancelado"

            ];

            if (
                !Number.isInteger(id) ||
                !statusPermitidos.includes(
                    status
                )
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Status inválido."

                    });
            }

            const resultado =
                await query(
                    `
                    UPDATE pedidos

                    SET status = $1

                    WHERE id = $2

                    RETURNING *
                    `,
                    [

                        status,

                        id

                    ]
                );

            if (
                resultado.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        erro:
                            "Pedido não encontrado."

                    });
            }

            res.json({

                sucesso: true,

                pedido:
                    resultado.rows[0]

            });

        } catch (erro) {

            console.error(
                "Erro ao alterar status:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao alterar status."

                });
        }
    }
);


/* =========================================================
   NOVOS PEDIDOS
========================================================= */

app.get(
    "/api/pedidos/novos",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const resultado =
                await query(
                    `
                    SELECT

                        COUNT(*) AS total

                    FROM pedidos

                    WHERE status = 'novo'

                    AND criado_em >=
                        CURRENT_TIMESTAMP
                        - INTERVAL '24 hours'
                    `
                );

            res.json({

                sucesso: true,

                total:
                    Number(
                        resultado.rows[0].total
                    )

            });

        } catch (erro) {

            console.error(
                "Erro ao verificar novos pedidos:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao verificar novos pedidos."

                });
        }
    }
);


/* =========================================================
   ESTATÍSTICAS DO ADMIN
========================================================= */

app.get(
    "/api/admin/estatisticas",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const produtos =
                await query(`
                    SELECT
                        COUNT(*) AS total
                    FROM produtos
                    WHERE ativo = 1
                `);

            const pedidos =
                await query(`
                    SELECT
                        COUNT(*) AS total
                    FROM pedidos
                `);

            const pedidosHoje =
                await query(`
                    SELECT
                        COUNT(*) AS total
                    FROM pedidos
                    WHERE criado_em >= CURRENT_DATE
                `);

            const faturamento =
                await query(`
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS total
                    FROM pedidos
                    WHERE status != 'cancelado'
                `);

            const novos =
                await query(`
                    SELECT
                        COUNT(*) AS total
                    FROM pedidos
                    WHERE status = 'novo'
                `);

            res.json({

                sucesso: true,

                produtos:
                    Number(
                        produtos.rows[0].total
                    ),

                pedidos:
                    Number(
                        pedidos.rows[0].total
                    ),

                pedidosHoje:
                    Number(
                        pedidosHoje.rows[0].total
                    ),

                faturamento:
                    Number(
                        faturamento.rows[0].total
                    ),

                novos:
                    Number(
                        novos.rows[0].total
                    )

            });

        } catch (erro) {

            console.error(
                "Erro ao buscar estatísticas:",
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao buscar estatísticas."

                });
        }
    }
);


/* =========================================================
   RELATÓRIOS ADMINISTRATIVOS
========================================================= */

/*
   Esta rota retorna:

   - Faturamento do dia
   - Faturamento da semana
   - Faturamento do mês
   - Quantidade de pedidos
   - Quantidade de produtos vendidos
   - Faturamento total
   - Produtos mais vendidos no mês
*/

app.get(
    "/api/admin/relatorios",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {


            /* =================================================
               FATURAMENTO DO DIA
            ================================================= */

            const faturamentoDia =
                await query(`
                    SELECT

                        COALESCE(
                            SUM(total),
                            0
                        ) AS faturamento,

                        COUNT(*) AS pedidos

                    FROM pedidos

                    WHERE status != 'cancelado'

                    AND criado_em >= CURRENT_DATE

                    AND criado_em <
                        CURRENT_DATE +
                        INTERVAL '1 day'
                `);


            /* =================================================
               FATURAMENTO DA SEMANA
            ================================================= */

            const faturamentoSemana =
                await query(`
                    SELECT

                        COALESCE(
                            SUM(total),
                            0
                        ) AS faturamento,

                        COUNT(*) AS pedidos

                    FROM pedidos

                    WHERE status != 'cancelado'

                    AND criado_em >=
                        DATE_TRUNC(
                            'week',
                            CURRENT_TIMESTAMP
                        )

                    AND criado_em <
                        DATE_TRUNC(
                            'week',
                            CURRENT_TIMESTAMP
                        ) +
                        INTERVAL '1 week'
                `);


            /* =================================================
               FATURAMENTO DO MÊS
            ================================================= */

            const faturamentoMes =
                await query(`
                    SELECT

                        COALESCE(
                            SUM(total),
                            0
                        ) AS faturamento,

                        COUNT(*) AS pedidos

                    FROM pedidos

                    WHERE status != 'cancelado'

                    AND criado_em >=
                        DATE_TRUNC(
                            'month',
                            CURRENT_TIMESTAMP
                        )

                    AND criado_em <
                        DATE_TRUNC(
                            'month',
                            CURRENT_TIMESTAMP
                        ) +
                        INTERVAL '1 month'
                `);


            /* =================================================
               FATURAMENTO TOTAL
            ================================================= */

            const faturamentoTotal =
                await query(`
                    SELECT

                        COALESCE(
                            SUM(total),
                            0
                        ) AS faturamento,

                        COUNT(*) AS pedidos

                    FROM pedidos

                    WHERE status != 'cancelado'
                `);


            /* =================================================
               PRODUTOS VENDIDOS HOJE
            ================================================= */

            const produtosHoje =
                await query(`
                    SELECT

                        COALESCE(
                            SUM(ip.quantidade),
                            0
                        ) AS quantidade

                    FROM itens_pedido ip

                    INNER JOIN pedidos p
                        ON p.id = ip.pedido_id

                    WHERE p.status != 'cancelado'

                    AND p.criado_em >= CURRENT_DATE

                    AND p.criado_em <
                        CURRENT_DATE +
                        INTERVAL '1 day'
                `);


            /* =================================================
               PRODUTOS VENDIDOS NA SEMANA
            ================================================= */

            const produtosSemana =
                await query(`
                    SELECT

                        COALESCE(
                            SUM(ip.quantidade),
                            0
                        ) AS quantidade

                    FROM itens_pedido ip

                    INNER JOIN pedidos p
                        ON p.id = ip.pedido_id

                    WHERE p.status != 'cancelado'

                    AND p.criado_em >=
                        DATE_TRUNC(
                            'week',
                            CURRENT_TIMESTAMP
                        )

                    AND p.criado_em <
                        DATE_TRUNC(
                            'week',
                            CURRENT_TIMESTAMP
                        ) +
                        INTERVAL '1 week'
                `);


            /* =================================================
               PRODUTOS VENDIDOS NO MÊS
            ================================================= */

            const produtosMes =
                await query(`
                    SELECT

                        COALESCE(
                            SUM(ip.quantidade),
                            0
                        ) AS quantidade

                    FROM itens_pedido ip

                    INNER JOIN pedidos p
                        ON p.id = ip.pedido_id

                    WHERE p.status != 'cancelado'

                    AND p.criado_em >=
                        DATE_TRUNC(
                            'month',
                            CURRENT_TIMESTAMP
                        )

                    AND p.criado_em <
                        DATE_TRUNC(
                            'month',
                            CURRENT_TIMESTAMP
                        ) +
                        INTERVAL '1 month'
                `);


            /* =================================================
               PRODUTOS MAIS VENDIDOS
               MÊS ATUAL
            ================================================= */

            const maisVendidos =
                await query(`
                    SELECT

                        ip.produto_id,

                        ip.nome_produto,

                        SUM(
                            ip.quantidade
                        ) AS quantidade_vendida,

                        SUM(
                            ip.quantidade *
                            ip.preco
                        ) AS faturamento

                    FROM itens_pedido ip

                    INNER JOIN pedidos p
                        ON p.id = ip.pedido_id

                    WHERE p.status != 'cancelado'

                    AND p.criado_em >=
                        DATE_TRUNC(
                            'month',
                            CURRENT_TIMESTAMP
                        )

                    AND p.criado_em <
                        DATE_TRUNC(
                            'month',
                            CURRENT_TIMESTAMP
                        ) +
                        INTERVAL '1 month'

                    GROUP BY

                        ip.produto_id,

                        ip.nome_produto

                    ORDER BY

                        quantidade_vendida DESC,

                        faturamento DESC

                    LIMIT 10
                `);


            /* =================================================
               RESPOSTA
            ================================================= */

            res.json({

                sucesso: true,

                periodo: {

                    dia: {

                        faturamento:
                            Number(
                                faturamentoDia
                                    .rows[0]
                                    .faturamento
                            ),

                        pedidos:
                            Number(
                                faturamentoDia
                                    .rows[0]
                                    .pedidos
                            ),

                        produtosVendidos:
                            Number(
                                produtosHoje
                                    .rows[0]
                                    .quantidade
                            )

                    },

                    semana: {

                        faturamento:
                            Number(
                                faturamentoSemana
                                    .rows[0]
                                    .faturamento
                            ),

                        pedidos:
                            Number(
                                faturamentoSemana
                                    .rows[0]
                                    .pedidos
                            ),

                        produtosVendidos:
                            Number(
                                produtosSemana
                                    .rows[0]
                                    .quantidade
                            )

                    },

                    mes: {

                        faturamento:
                            Number(
                                faturamentoMes
                                    .rows[0]
                                    .faturamento
                            ),

                        pedidos:
                            Number(
                                faturamentoMes
                                    .rows[0]
                                    .pedidos
                            ),

                        produtosVendidos:
                            Number(
                                produtosMes
                                    .rows[0]
                                    .quantidade
                            )

                    },

                    total: {

                        faturamento:
                            Number(
                                faturamentoTotal
                                    .rows[0]
                                    .faturamento
                            ),

                        pedidos:
                            Number(
                                faturamentoTotal
                                    .rows[0]
                                    .pedidos
                            )

                    }

                },

                produtosMaisVendidos:
                    maisVendidos.rows.map(
                        function (
                            produto
                        ) {

                            return {

                                produto_id:
                                    produto.produto_id,

                                nome:
                                    produto.nome_produto,

                                quantidadeVendida:
                                    Number(
                                        produto.quantidade_vendida
                                    ),

                                faturamento:
                                    Number(
                                        produto.faturamento
                                    )

                            };
                        }
                    )

            });

        } catch (erro) {

            console.error(
                "Erro ao gerar relatório:",
                erro
            );

            res
                .status(500)
                .json({

                    sucesso: false,

                    erro:
                        "Erro ao gerar relatório."

                });
        }
    }
);


/* =========================================================
   RELATÓRIO POR PRODUTO
========================================================= */

/*
   GET:

   /api/admin/relatorios/produtos

   Retorna:

   - Todos os produtos vendidos
   - Produtos vendidos hoje
   - Produtos vendidos na semana
   - Produtos vendidos no mês
   - Quantidade vendida
   - Faturamento por produto
   - Número de pedidos
*/

app.get(
    "/api/admin/relatorios/produtos",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {


            /* =================================================
               TODOS OS PRODUTOS
            ================================================= */

            const resultado =
                await query(`
                    SELECT

                        ip.produto_id,

                        ip.nome_produto,

                        SUM(
                            ip.quantidade
                        ) AS quantidade_vendida,

                        SUM(
                            ip.quantidade *
                            ip.preco
                        ) AS faturamento,

                        COUNT(
                            DISTINCT ip.pedido_id
                        ) AS pedidos

                    FROM itens_pedido ip

                    INNER JOIN pedidos p
                        ON p.id = ip.pedido_id

                    WHERE p.status != 'cancelado'

                    GROUP BY

                        ip.produto_id,

                        ip.nome_produto

                    ORDER BY

                        quantidade_vendida DESC,

                        faturamento DESC
                `);


            /* =================================================
               PRODUTOS VENDIDOS HOJE
            ================================================= */

            const hoje =
                await query(`
                    SELECT

                        ip.produto_id,

                        ip.nome_produto,

                        SUM(
                            ip.quantidade
                        ) AS quantidade_vendida,

                        SUM(
                            ip.quantidade *
                            ip.preco
                        ) AS faturamento

                    FROM itens_pedido ip

                    INNER JOIN pedidos p
                        ON p.id = ip.pedido_id

                    WHERE p.status != 'cancelado'

                    AND p.criado_em >= CURRENT_DATE

                    AND p.criado_em <
                        CURRENT_DATE +
                        INTERVAL '1 day'

                    GROUP BY

                        ip.produto_id,

                        ip.nome_produto

                    ORDER BY

                        quantidade_vendida DESC
                `);


            /* =================================================
               PRODUTOS VENDIDOS NA SEMANA
            ================================================= */

            const semana =
                await query(`
                    SELECT

                        ip.produto_id,

                        ip.nome_produto,

                        SUM(
                            ip.quantidade
                        ) AS quantidade_vendida,

                        SUM(
                            ip.quantidade *
                            ip.preco
                        ) AS faturamento

                    FROM itens_pedido ip

                    INNER JOIN pedidos p
                        ON p.id = ip.pedido_id

                    WHERE p.status != 'cancelado'

                    AND p.criado_em >=
                        DATE_TRUNC(
                            'week',
                            CURRENT_TIMESTAMP
                        )

                    AND p.criado_em <
                        DATE_TRUNC(
                            'week',
                            CURRENT_TIMESTAMP
                        ) +
                        INTERVAL '1 week'

                    GROUP BY

                        ip.produto_id,

                        ip.nome_produto

                    ORDER BY

                        quantidade_vendida DESC
                `);


            /* =================================================
               PRODUTOS VENDIDOS NO MÊS
            ================================================= */

            const mes =
                await query(`
                    SELECT

                        ip.produto_id,

                        ip.nome_produto,

                        SUM(
                            ip.quantidade
                        ) AS quantidade_vendida,

                        SUM(
                            ip.quantidade *
                            ip.preco
                        ) AS faturamento

                    FROM itens_pedido ip

                    INNER JOIN pedidos p
                        ON p.id = ip.pedido_id

                    WHERE p.status != 'cancelado'

                    AND p.criado_em >=
                        DATE_TRUNC(
                            'month',
                            CURRENT_TIMESTAMP
                        )

                    AND p.criado_em <
                        DATE_TRUNC(
                            'month',
                            CURRENT_TIMESTAMP
                        ) +
                        INTERVAL '1 month'

                    GROUP BY

                        ip.produto_id,

                        ip.nome_produto

                    ORDER BY

                        quantidade_vendida DESC
                `);


            /* =================================================
               FORMATAR PRODUTOS
            ================================================= */

            function formatarProdutos(
                lista
            ) {

                return lista.map(
                    function (
                        produto
                    ) {

                        const resultado = {

                            produto_id:
                                produto.produto_id,

                            nome:
                                produto.nome_produto,

                            quantidadeVendida:
                                Number(
                                    produto.quantidade_vendida
                                ),

                            faturamento:
                                Number(
                                    produto.faturamento
                                )

                        };

                        if (
                            produto.pedidos !==
                            undefined
                        ) {

                            resultado.pedidos =
                                Number(
                                    produto.pedidos
                                );
                        }

                        return resultado;
                    }
                );
            }


            /* =================================================
               RESPOSTA
            ================================================= */

            res.json({

                sucesso: true,

                todos:
                    formatarProdutos(
                        resultado.rows
                    ),

                hoje:
                    formatarProdutos(
                        hoje.rows
                    ),

                semana:
                    formatarProdutos(
                        semana.rows
                    ),

                mes:
                    formatarProdutos(
                        mes.rows
                    )

            });

        } catch (erro) {

            console.error(
                "Erro ao gerar relatório por produto:",
                erro
            );

            res
                .status(500)
                .json({

                    sucesso: false,

                    erro:
                        "Erro ao gerar relatório por produto."

                });
        }
    }
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/api/health",
    async function (
        req,
        res
    ) {

        try {

            await query(
                "SELECT 1"
            );

            res.json({

                status:
                    "ok",

                banco:
                    "online",

                servidor:
                    "online"

            });

        } catch (erro) {

            res
                .status(503)
                .json({

                    status:
                        "erro",

                    banco:
                        "offline",

                    servidor:
                        "online"

                });
        }
    }
);


/* =========================================================
   ERRO DO MULTER
========================================================= */

app.use(
    function (
        erro,
        req,
        res,
        next
    ) {

        if (
            erro &&
            erro.code ===
            "LIMIT_FILE_SIZE"
        ) {

            return res
                .status(400)
                .json({

                    erro:
                        "A imagem deve ter no máximo 3 MB."

                });
        }

        if (
            erro &&
            erro.message ===
            "Tipo de imagem não permitido."
        ) {

            return res
                .status(400)
                .json({

                    erro:
                        erro.message

                });
        }

        next(
            erro
        );
    }
);


/* =========================================================
   ROTA 404 DA API
========================================================= */

app.use(
    "/api",
    function (
        req,
        res
    ) {

        res
            .status(404)
            .json({

                sucesso: false,

                erro:
                    "Rota da API não encontrada."

            });
    }
);


/* =========================================================
   ERRO GERAL
========================================================= */

app.use(
    function (
        erro,
        req,
        res,
        next
    ) {

        console.error(
            "Erro interno do servidor:",
            erro
        );

        if (
            res.headersSent
        ) {

            return next(
                erro
            );
        }

        res
            .status(500)
            .json({

                sucesso: false,

                erro:
                    "Erro interno do servidor."

            });
    }
);


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function iniciarServidor() {

    try {

        console.log(
            "========================================"
        );

        console.log(
            "       DOCEMANIA - INICIANDO"
        );

        console.log(
            "========================================"
        );

        await inicializarBanco();

        app.listen(
            PORT,
            "0.0.0.0",
            function () {

                console.log(
                    "========================================"
                );

                console.log(
                    `Docemania online na porta ${PORT}`
                );

                console.log(
                    `http://localhost:${PORT}`
                );

                console.log(
                    "Banco PostgreSQL conectado."
                );

                console.log(
                    "Supabase configurado."
                );

                console.log(
                    "Relatórios administrativos ativos."
                );

                console.log(
                    "========================================"
                );
            }
        );

    } catch (erro) {

        console.error(
            "========================================"
        );

        console.error(
            "ERRO AO INICIAR A DOCEMANIA"
        );

        console.error(
            erro
        );

        console.error(
            "========================================"
        );

        process.exit(1);
    }
}


/* =========================================================
   ERROS NÃO TRATADOS
========================================================= */

process.on(
    "unhandledRejection",
    function (
        erro
    ) {

        console.error(
            "Unhandled Rejection:",
            erro
        );
    }
);


process.on(
    "uncaughtException",
    function (
        erro
    ) {

        console.error(
            "Uncaught Exception:",
            erro
        );
    }
);


/* =========================================================
   ENCERRAMENTO
========================================================= */

async function encerrarServidor(
    sinal
) {

    console.log(
        `\nRecebido ${sinal}. Encerrando servidor...`
    );

    try {

        await pool.end();

        console.log(
            "Conexão com PostgreSQL encerrada."
        );

        process.exit(0);

    } catch (erro) {

        console.error(
            "Erro ao encerrar:",
            erro
        );

        process.exit(1);
    }
}


process.on(
    "SIGINT",
    function () {

        encerrarServidor(
            "SIGINT"
        );
    }
);


process.on(
    "SIGTERM",
    function () {

        encerrarServidor(
            "SIGTERM"
        );
    }
);


/* =========================================================
   INICIAR
========================================================= */

iniciarServidor();