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

const PORT = process.env.PORT || 3000;

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
   APP
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
    express.static(publicPath)
);


/* =========================================================
   POSTGRESQL
========================================================= */

const pool =
    new Pool({
        connectionString:
            DATABASE_URL,

        ssl: {
            rejectUnauthorized: false
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
   UPLOAD
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
   COOKIES
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
   CRIAR TOKEN
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
            .update(dados)
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
                .update(dados)
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
        lerCookies(req);

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
            SELECT
                id
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
       REGIÕES
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

                    "SameSite=None",

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
                "SameSite=Lax",
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
   LISTAR PRODUTOS
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
   UPLOAD PARA SUPABASE
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
        crypto.randomBytes(8)
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
                        imagem
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4
                    )
                    RETURNING id
                    `,
                    [
                        nome,
                        descricao,
                        preco,
                        imagem
                    ]
                );


            res.json({

                sucesso: true,

                id:
                    resultado.rows[0].id

            });

        } catch (erro) {

            console.error(
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
                req.body.nome === undefined

                    ? atual.nome

                    : String(
                        req.body.nome
                    ).trim();


            const descricao =
                req.body.descricao === undefined

                    ? atual.descricao

                    : String(
                        req.body.descricao
                    );


            const preco =
                req.body.preco === undefined

                    ? Number(
                        atual.preco
                    )

                    : Number(
                        req.body.preco
                    );


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


            res.json({

                sucesso: true

            });

        } catch (erro) {

            console.error(
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
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro ao excluir produto."
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


        try {

            const cliente =
                typeof req.body.cliente ===
                "string"

                    ? req.body.cliente.trim()

                    : "";


            const telefone =
                req.body.telefone || "";


            const endereco =
                req.body.endereco || "";


            const tipoEntrega =
                req.body.tipo_entrega || "";


            const regiao =
                req.body.regiao || "";


            const pagamento =
                req.body.pagamento || "";


            const itens =
                req.body.itens;


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


            let subtotal = 0;


            for (
                const item
                of itens
            ) {

                const quantidade =
                    Number(
                        item.quantidade
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
                            item.produto_id
                        ]
                    );


                if (
                    produto.rows.length === 0
                ) {

                    return res
                        .status(400)
                        .json({

                            erro:
                                "Produto não encontrado."
                        });
                }


                const dadosProduto =
                    produto.rows[0];


                subtotal +=
                    Number(
                        dadosProduto.preco
                    ) *
                    quantidade;
            }


            const taxa =
                Number(
                    req.body.taxa_entrega ||
                    0
                );


            const troco =
                Number(
                    req.body.troco_para ||
                    0
                );


            if (
                !Number.isFinite(taxa) ||
                taxa < 0
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Taxa de entrega inválida."
                    });
            }


            if (
                !Number.isFinite(troco) ||
                troco < 0
            ) {

                return res
                    .status(400)
                    .json({

                        erro:
                            "Valor de troco inválido."
                    });
            }


            const total =
                subtotal +
                taxa;


            await client.query(
                "BEGIN"
            );


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
                        total
                    )
                    VALUES
                    (
                        $1,$2,$3,$4,$5,
                        $6,$7,$8,$9,$10
                    )
                    RETURNING id
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


            for (
                const item
                of itens
            ) {

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
                            item.produto_id
                        ]
                    );


                const dadosProduto =
                    produto.rows[0];


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
                        dadosProduto.id,
                        dadosProduto.nome,
                        Number(
                            item.quantidade
                        ),
                        Number(
                            dadosProduto.preco
                        )
                    ]
                );
            }


            await client.query(
                "COMMIT"
            );


            res.json({

                sucesso: true,

                pedido_id:
                    pedidoId,

                subtotal,

                taxa,

                total

            });

        } catch (erro) {

            await client.query(
                "ROLLBACK"
            );

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
                    ORDER BY id DESC
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
   ALTERAR STATUS
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
                req.body.status;


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
                    `,
                    [
                        status,
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
                            "Pedido não encontrado."
                    });
            }


            res.json({

                sucesso: true

            });

        } catch (erro) {

            console.error(
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
   DASHBOARD
========================================================= */

app.get(
    "/api/dashboard",
    exigirLogin,
    async function (
        req,
        res
    ) {

        try {

            const vendasHoje =
                await query(
                    `
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS total
                    FROM pedidos
                    WHERE status = 'concluido'
                    AND criado_em::date =
                        CURRENT_DATE
                    `
                );


            const vendasMes =
                await query(
                    `
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
                    `
                );


            const pedidosHoje =
                await query(
                    `
                    SELECT
                        COUNT(*) AS total
                    FROM pedidos
                    WHERE criado_em::date =
                        CURRENT_DATE
                    `
                );


            const tortasHoje =
                await query(
                    `
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
                    `
                );


            res.json({

                vendasHoje:
                    Number(
                        vendasHoje
                            .rows[0]
                            .total
                    ),

                vendasMes:
                    Number(
                        vendasMes
                            .rows[0]
                            .total
                    ),

                pedidosHoje:
                    Number(
                        pedidosHoje
                            .rows[0]
                            .total
                    ),

                tortasHoje:
                    Number(
                        tortasHoje
                            .rows[0]
                            .total
                    )

            });

        } catch (erro) {

            console.error(
                erro
            );

            res
                .status(500)
                .json({

                    erro:
                        "Erro no dashboard."
                });
        }
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
   TRATAMENTO DE ERROS
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
            (
                erro.message ===
                    "Tipo de imagem não permitido." ||

                erro.message ===
                    "Formato de imagem não permitido."
            )
        ) {

            return res
                .status(400)
                .json({

                    erro:
                        erro.message
                });
        }


        console.error(
            "Erro interno:",
            erro
        );


        res
            .status(500)
            .json({

                erro:
                    "Erro interno do servidor."
            });
    }
);


/* =========================================================
   INICIAR SERVIDOR
========================================================= */

async function iniciarServidor() {

    try {

        await inicializarBanco();


        app.listen(
            PORT,
            "0.0.0.0",
            function () {

                console.log("");
                console.log(
                    "================================"
                );

                console.log(
                    "       DOCEMANIA ONLINE"
                );

                console.log(
                    "================================"
                );

                console.log(
                    `Porta: ${PORT}`
                );

                console.log(
                    "PostgreSQL: OK"
                );

                console.log(
                    "Supabase: OK"
                );

                console.log(
                    "Login administrativo: OK"
                );

                console.log(
                    "================================"
                );

                console.log("");
            }
        );

    } catch (erro) {

        console.error(
            "================================"
        );

        console.error(
            "ERRO AO INICIAR SERVIDOR"
        );

        console.error(
            erro
        );

        console.error(
            "================================"
        );

        process.exit(1);
    }
}

iniciarServidor();

setInterval(() => {
    console.log("Servidor continua ativo...");
}, 10000);