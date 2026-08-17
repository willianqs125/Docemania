const API = "https:/docemania.onrender.com/api";

/* =========================================================
   ESTADO
========================================================= */

let produtos = [];
let carrinho = [];

let produtoSelecionado = null;
let quantidadeAtual = 1;
let produtoEditandoId = null;
let tipoEntregaAtual = "entrega";


/* =========================================================
   ELEMENTOS
========================================================= */

const clienteArea = document.getElementById("clienteArea");
const adminArea = document.getElementById("adminArea");

const adminBtn = document.getElementById("adminBtn");
const loginModal = document.getElementById("loginModal");
const closeLogin = document.getElementById("closeLogin");
const loginBtn = document.getElementById("loginBtn");

const adminUser = document.getElementById("adminUser");
const adminPassword = document.getElementById("adminPassword");

const listaProdutos = document.getElementById("listaProdutos");
const adminProducts = document.getElementById("adminProducts");
const adminTotalProdutos =
    document.getElementById("adminTotalProdutos");

const produtoModal = document.getElementById("produtoModal");
const closeModal = document.getElementById("closeModal");

const modalImagem = document.getElementById("modalImagem");
const modalNome = document.getElementById("modalNome");
const modalDescricao = document.getElementById("modalDescricao");

const quantidade = document.getElementById("quantidade");
const menos = document.getElementById("menos");
const mais = document.getElementById("mais");

const observacao = document.getElementById("observacao");
const modalTotal = document.getElementById("modalTotal");
const adicionarPedido =
    document.getElementById("adicionarPedido");

const cartBtn = document.getElementById("cartBtn");
const cart = document.getElementById("cart");
const closeCart = document.getElementById("closeCart");
const overlay = document.getElementById("overlay");

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");

const finalizarBtn =
    document.getElementById("finalizarBtn");

const checkoutModal =
    document.getElementById("checkoutModal");

const closeCheckout =
    document.getElementById("closeCheckout");

const clienteNome =
    document.getElementById("clienteNome");

const endereco =
    document.getElementById("endereco");

const enderecoArea =
    document.getElementById("enderecoArea");

const pagamento =
    document.getElementById("pagamento");

const trocoArea =
    document.getElementById("trocoArea");

const valorPago =
    document.getElementById("valorPago");

const trocoTexto =
    document.getElementById("trocoTexto");

const checkoutTotal =
    document.getElementById("checkoutTotal");

const enviarPedido =
    document.getElementById("enviarPedido");

const deliveryButtons =
    document.querySelectorAll(".delivery");

const logoutBtn =
    document.getElementById("logoutBtn");

const addProductBtn =
    document.getElementById("addProductBtn");

const adminProductModal =
    document.getElementById("adminProductModal");

const closeAdminProduct =
    document.getElementById("closeAdminProduct");

const adminProductTitle =
    document.getElementById("adminProductTitle");

const productName =
    document.getElementById("productName");

const productPrice =
    document.getElementById("productPrice");

const productDescription =
    document.getElementById("productDescription");

const productImageFile =
    document.getElementById("productImageFile");

const imagePreviewContainer =
    document.getElementById("imagePreviewContainer");

const imagePreview =
    document.getElementById("imagePreview");

const removeImage =
    document.getElementById("removeImage");

const saveProduct =
    document.getElementById("saveProduct");


/* =========================================================
   UTILIDADES
========================================================= */

function dinheiro(valor) {

    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return "";
    }

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   REQUISIÇÃO À API
========================================================= */

async function requisicao(
    url,
    opcoes = {}
) {

    const resposta = await fetch(
        API + url,
        {
            credentials: "include",
            ...opcoes
        }
    );

    let dados = null;

    try {
        dados = await resposta.json();
    } catch {
        dados = null;
    }

    if (!resposta.ok) {

        const mensagem =
            dados?.mensagem ||
            dados?.erro ||
            "Ocorreu um erro.";

        throw new Error(mensagem);
    }

    return dados;
}


/* =========================================================
   PRODUTOS
========================================================= */

async function carregarProdutos() {

    try {

        produtos =
            await requisicao("/produtos");

        renderizarProdutos();
        renderizarProdutosAdmin();

    } catch (erro) {

        console.error(
            "Erro ao carregar produtos:",
            erro
        );

        if (listaProdutos) {

            listaProdutos.innerHTML = `
                <div class="empty-state">
                    <p>
                        Não foi possível carregar o cardápio.
                    </p>
                </div>
            `;
        }
    }
}


function renderizarProdutos() {

    if (!listaProdutos) {
        return;
    }

    if (!produtos.length) {

        listaProdutos.innerHTML = `
            <div class="empty-state">
                <p>
                    Nenhuma torta cadastrada.
                </p>
            </div>
        `;

        return;
    }

    listaProdutos.innerHTML =
        produtos.map(produto => {

            const imagem =
                produto.imagem ||
                "https://via.placeholder.com/500x350?text=Docemania";

            return `
                <article
                    class="product-card"
                    data-id="${produto.id}"
                >

                    <img
                        src="${escaparHTML(imagem)}"
                        alt="${escaparHTML(produto.nome)}"
                        class="product-image"
                    >

                    <div class="product-card-content">

                        <span class="product-category">
                            TORTA
                        </span>

                        <h3>
                            ${escaparHTML(produto.nome)}
                        </h3>

                        <p>
                            ${escaparHTML(
                                produto.descricao || ""
                            )}
                        </p>

                        <div class="product-bottom">

                            <strong>
                                ${dinheiro(produto.preco)}
                            </strong>

                            <button
                                type="button"
                                class="primary-button product-open-btn"
                                data-id="${produto.id}"
                            >
                                Ver torta
                            </button>

                        </div>

                    </div>

                </article>
            `;

        }).join("");

    document
        .querySelectorAll(".product-open-btn")
        .forEach(botao => {

            botao.addEventListener(
                "click",
                () => {

                    abrirProduto(
                        Number(botao.dataset.id)
                    );

                }
            );

        });
}


/* =========================================================
   MODAL DO PRODUTO
========================================================= */

function abrirProduto(id) {

    const produto =
        produtos.find(
            item =>
                Number(item.id) === Number(id)
        );

    if (!produto) {
        return;
    }

    produtoSelecionado = produto;
    quantidadeAtual = 1;

    if (quantidade) {
        quantidade.textContent =
            quantidadeAtual;
    }

    if (modalNome) {
        modalNome.textContent =
            produto.nome;
    }

    if (modalDescricao) {
        modalDescricao.textContent =
            produto.descricao || "";
    }

    if (modalImagem) {

        modalImagem.src =
            produto.imagem ||
            "https://via.placeholder.com/500x350?text=Docemania";
    }

    if (observacao) {
        observacao.value = "";
    }

    atualizarTotalModal();

    produtoModal?.classList.remove("hidden");
}


function fecharProduto() {

    produtoModal?.classList.add("hidden");

    produtoSelecionado = null;
}


function atualizarTotalModal() {

    if (!produtoSelecionado) {
        return;
    }

    const total =
        Number(produtoSelecionado.preco) *
        quantidadeAtual;

    if (modalTotal) {
        modalTotal.textContent =
            dinheiro(total);
    }
}


menos?.addEventListener(
    "click",
    () => {

        if (quantidadeAtual <= 1) {
            return;
        }

        quantidadeAtual--;

        quantidade.textContent =
            quantidadeAtual;

        atualizarTotalModal();
    }
);


mais?.addEventListener(
    "click",
    () => {

        quantidadeAtual++;

        quantidade.textContent =
            quantidadeAtual;

        atualizarTotalModal();
    }
);


closeModal?.addEventListener(
    "click",
    fecharProduto
);


/* =========================================================
   CARRINHO
========================================================= */

function adicionarAoCarrinho() {

    if (!produtoSelecionado) {
        return;
    }

    const observacaoTexto =
        observacao?.value.trim() || "";

    const existente =
        carrinho.find(item =>
            Number(item.produto_id) ===
                Number(produtoSelecionado.id) &&
            item.observacao ===
                observacaoTexto
        );

    if (existente) {

        existente.quantidade +=
            quantidadeAtual;

    } else {

        carrinho.push({

            produto_id:
                produtoSelecionado.id,

            nome_produto:
                produtoSelecionado.nome,

            preco:
                Number(produtoSelecionado.preco),

            quantidade:
                quantidadeAtual,

            observacao:
                observacaoTexto
        });
    }

    atualizarCarrinho();

    fecharProduto();

    abrirCarrinho();
}


function atualizarCarrinho() {

    if (!cartItems) {
        return;
    }

    if (!carrinho.length) {

        cartItems.innerHTML = `
            <div class="empty-cart">
                <p>
                    Seu carrinho está vazio.
                </p>
            </div>
        `;

        if (cartTotal) {
            cartTotal.textContent =
                dinheiro(0);
        }

        if (cartCount) {
            cartCount.textContent =
                "0";
        }

        return;
    }

    let total = 0;
    let quantidadeTotal = 0;

    cartItems.innerHTML =
        carrinho.map(
            (item, indice) => {

                const subtotal =
                    Number(item.preco) *
                    Number(item.quantidade);

                total += subtotal;

                quantidadeTotal +=
                    Number(item.quantidade);

                return `
                    <div class="cart-item">

                        <div>

                            <strong>
                                ${escaparHTML(
                                    item.nome_produto
                                )}
                            </strong>

                            <small>
                                ${item.quantidade} ×
                                ${dinheiro(item.preco)}
                            </small>

                            ${
                                item.observacao
                                    ? `
                                        <small>
                                            Obs:
                                            ${escaparHTML(
                                                item.observacao
                                            )}
                                        </small>
                                    `
                                    : ""
                            }

                        </div>

                        <div>

                            <strong>
                                ${dinheiro(subtotal)}
                            </strong>

                            <button
                                type="button"
                                class="remove-cart-item"
                                data-index="${indice}"
                            >
                                Remover
                            </button>

                        </div>

                    </div>
                `;
            }
        ).join("");

    if (cartTotal) {
        cartTotal.textContent =
            dinheiro(total);
    }

    if (cartCount) {
        cartCount.textContent =
            quantidadeTotal;
    }

    document
        .querySelectorAll(".remove-cart-item")
        .forEach(botao => {

            botao.addEventListener(
                "click",
                () => {

                    const indice =
                        Number(
                            botao.dataset.index
                        );

                    carrinho.splice(
                        indice,
                        1
                    );

                    atualizarCarrinho();
                }
            );
        });
}


function abrirCarrinho() {

    cart?.classList.add("open");

    overlay?.classList.remove("hidden");
}


function fecharCarrinho() {

    cart?.classList.remove("open");

    overlay?.classList.add("hidden");
}


cartBtn?.addEventListener(
    "click",
    abrirCarrinho
);


closeCart?.addEventListener(
    "click",
    fecharCarrinho
);


overlay?.addEventListener(
    "click",
    fecharCarrinho
);


adicionarPedido?.addEventListener(
    "click",
    adicionarAoCarrinho
);


/* =========================================================
   CHECKOUT
========================================================= */

deliveryButtons.forEach(
    botao => {

        botao.addEventListener(
            "click",
            () => {

                deliveryButtons.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );

                botao.classList.add(
                    "active"
                );

                tipoEntregaAtual =
                    botao.dataset.type;

                if (
                    tipoEntregaAtual ===
                    "entrega"
                ) {

                    enderecoArea?.classList.remove(
                        "hidden"
                    );

                } else {

                    enderecoArea?.classList.add(
                        "hidden"
                    );

                    if (endereco) {
                        endereco.value = "";
                    }
                }
            }
        );
    }
);


pagamento?.addEventListener(
    "change",
    () => {

        if (
            pagamento.value ===
            "Dinheiro"
        ) {

            trocoArea?.classList.remove(
                "hidden"
            );

        } else {

            trocoArea?.classList.add(
                "hidden"
            );

            if (valorPago) {
                valorPago.value = "";
            }

            if (trocoTexto) {
                trocoTexto.textContent =
                    "Troco: R$ 0,00";
            }
        }
    }
);


function calcularTotalCarrinho() {

    return carrinho.reduce(
        (total, item) =>
            total +
            Number(item.preco) *
            Number(item.quantidade),
        0
    );
}


function atualizarTroco() {

    const total =
        calcularTotalCarrinho();

    const pago =
        Number(valorPago?.value || 0);

    const troco =
        pago - total;

    if (!trocoTexto) {
        return;
    }

    if (troco >= 0) {

        trocoTexto.textContent =
            "Troco: " +
            dinheiro(troco);

    } else {

        trocoTexto.textContent =
            "Valor insuficiente.";
    }
}


valorPago?.addEventListener(
    "input",
    atualizarTroco
);


function abrirCheckout() {

    if (!carrinho.length) {

        alert(
            "Seu carrinho está vazio."
        );

        return;
    }

    fecharCarrinho();

    if (checkoutTotal) {

        checkoutTotal.textContent =
            dinheiro(
                calcularTotalCarrinho()
            );
    }

    checkoutModal?.classList.remove(
        "hidden"
    );
}


finalizarBtn?.addEventListener(
    "click",
    abrirCheckout
);


closeCheckout?.addEventListener(
    "click",
    () => {

        checkoutModal?.classList.add(
            "hidden"
        );
    }
);


/* =========================================================
   FINALIZAR PEDIDO
========================================================= */

async function finalizarPedido() {

    try {

        const nome =
            clienteNome?.value.trim() || "";

        if (!nome) {

            alert(
                "Digite seu nome."
            );

            clienteNome?.focus();

            return;
        }

        const enderecoTexto =
            endereco?.value.trim() || "";

        if (
            tipoEntregaAtual === "entrega" &&
            !enderecoTexto
        ) {

            alert(
                "Digite seu endereço."
            );

            endereco?.focus();

            return;
        }

        if (!pagamento?.value) {

            alert(
                "Selecione a forma de pagamento."
            );

            pagamento?.focus();

            return;
        }

        const total =
            calcularTotalCarrinho();

        const valorTroco =
            Number(valorPago?.value || 0);

        if (
            pagamento.value === "Dinheiro" &&
            valorTroco < total
        ) {

            alert(
                "O valor para troco precisa ser maior ou igual ao total."
            );

            valorPago?.focus();

            return;
        }

        const pedidoItens =
            carrinho.map(item => ({

                produto_id:
                    item.produto_id,

                nome_produto:
                    item.nome_produto,

                quantidade:
                    item.quantidade,

                preco:
                    item.preco
            }));

        const dados = {

            cliente:
                nome,

            telefone:
                "",

            endereco:
                tipoEntregaAtual === "entrega"
                    ? enderecoTexto
                    : "",

            tipo_entrega:
                tipoEntregaAtual,

            regiao:
                "",

            taxa_entrega:
                0,

            pagamento:
                pagamento.value,

            troco_para:
                pagamento.value === "Dinheiro"
                    ? valorTroco
                    : 0,

            itens:
                pedidoItens
        };

        enviarPedido.disabled = true;

        enviarPedido.textContent =
            "Enviando...";

        await requisicao(
            "/pedidos",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(dados)
            }
        );


        /* =================================================
           WHATSAPP
        ================================================= */

        let mensagem =
            "🍰 *NOVO PEDIDO - DOCEMANIA*\n\n";

        mensagem +=
            `👤 Cliente: ${nome}\n`;

        mensagem +=
            `📦 Tipo: ${
                tipoEntregaAtual === "entrega"
                    ? "Entrega"
                    : "Retirada"
            }\n`;

        if (
            tipoEntregaAtual === "entrega"
        ) {

            mensagem +=
                `📍 Endereço: ${enderecoTexto}\n`;
        }

        mensagem +=
            `💳 Pagamento: ${pagamento.value}\n\n`;

        mensagem +=
            "*ITENS DO PEDIDO:*\n";

        carrinho.forEach(
            item => {

                mensagem +=
                    `• ${item.quantidade}x ` +
                    `${item.nome_produto} - ` +
                    `${dinheiro(
                        item.preco *
                        item.quantidade
                    )}\n`;

                if (item.observacao) {

                    mensagem +=
                        `  Obs: ${item.observacao}\n`;
                }
            }
        );

        mensagem +=
            `\n💰 *TOTAL: ${dinheiro(total)}*`;


        /*
            NÚMERO DO WHATSAPP DA DOCEMANIA
        */

        const numeroWhatsApp =
            "5599988109348";

        const url =
            "https://wa.me/" +
            numeroWhatsApp +
            "?text=" +
            encodeURIComponent(
                mensagem
            );

        window.open(
            url,
            "_blank"
        );


        /* =================================================
           LIMPAR
        ================================================= */

        carrinho = [];

        atualizarCarrinho();

        checkoutModal?.classList.add(
            "hidden"
        );

        if (clienteNome) {
            clienteNome.value = "";
        }

        if (endereco) {
            endereco.value = "";
        }

        if (pagamento) {
            pagamento.value = "";
        }

        if (valorPago) {
            valorPago.value = "";
        }

        alert(
            "Pedido enviado com sucesso!"
        );

    } catch (erro) {

        console.error(
            "Erro ao finalizar pedido:",
            erro
        );

        alert(
            erro.message ||
            "Não foi possível enviar o pedido."
        );

    } finally {

        if (enviarPedido) {

            enviarPedido.disabled =
                false;

            enviarPedido.textContent =
                "📲 Enviar pedido pelo WhatsApp";
        }
    }
}


enviarPedido?.addEventListener(
    "click",
    finalizarPedido
);


/* =========================================================
   LOGIN ADMIN
========================================================= */

adminBtn?.addEventListener(
    "click",
    async () => {

        loginModal?.classList.remove(
            "hidden"
        );

        adminUser?.focus();

        try {

            const sessao =
                await requisicao(
                    "/sessao"
                );

            if (
                sessao &&
                sessao.autenticado
            ) {

                entrarNoPainel(
                    sessao.usuario
                );
            }

        } catch {

            // Usuário ainda não está logado.
        }
    }
);


closeLogin?.addEventListener(
    "click",
    () => {

        loginModal?.classList.add(
            "hidden"
        );
    }
);


async function fazerLogin() {

    const usuario =
        adminUser?.value.trim() || "";

    const senha =
        adminPassword?.value || "";

    if (!usuario) {

        alert(
            "Digite o usuário."
        );

        adminUser?.focus();

        return;
    }

    if (!senha) {

        alert(
            "Digite a senha."
        );

        adminPassword?.focus();

        return;
    }

    try {

        loginBtn.disabled = true;

        loginBtn.textContent =
            "Entrando...";


        const resultado =
            await requisicao(
                "/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            usuario,
                            senha
                        })
                }
            );


        if (resultado.sucesso) {

            loginModal?.classList.add(
                "hidden"
            );

            entrarNoPainel(
                resultado.usuario
            );
        }

    } catch (erro) {

        console.error(
            "Erro no login:",
            erro
        );

        alert(
            erro.message ||
            "Usuário ou senha incorretos."
        );

    } finally {

        loginBtn.disabled = false;

        loginBtn.textContent =
            "Entrar no painel";
    }
}


loginBtn?.addEventListener(
    "click",
    fazerLogin
);


adminPassword?.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key === "Enter"
        ) {

            fazerLogin();
        }
    }
);


/* =========================================================
   PAINEL ADMINISTRATIVO
========================================================= */

async function entrarNoPainel(usuario) {

    clienteArea?.classList.add(
        "hidden"
    );

    adminArea?.classList.remove(
        "hidden"
    );

    await carregarProdutos();

    console.log(
        "Administrador autenticado:",
        usuario
    );
}


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn?.addEventListener(
    "click",
    async () => {

        try {

            await requisicao(
                "/logout",
                {
                    method: "POST"
                }
            );

        } catch (erro) {

            console.error(
                "Erro no logout:",
                erro
            );
        }

        adminArea?.classList.add(
            "hidden"
        );

        clienteArea?.classList.remove(
            "hidden"
        );

        if (adminUser) {
            adminUser.value = "";
        }

        if (adminPassword) {
            adminPassword.value = "";
        }

        loginModal?.classList.add(
            "hidden"
        );

        alert(
            "Você saiu do painel."
        );
    }
);


/* =========================================================
   VERIFICAR SESSÃO
========================================================= */

async function verificarSessao() {

    try {

        const sessao =
            await requisicao(
                "/sessao"
            );

        if (
            sessao &&
            sessao.autenticado
        ) {

            await entrarNoPainel(
                sessao.usuario
            );
        }

    } catch {

        // Sem sessão.
    }
}


/* =========================================================
   PRODUTOS ADMIN
========================================================= */

function renderizarProdutosAdmin() {

    if (!adminProducts) {
        return;
    }

    if (adminTotalProdutos) {

        adminTotalProdutos.textContent =
            produtos.length;
    }

    if (!produtos.length) {

        adminProducts.innerHTML = `
            <div class="empty-state">
                <p>
                    Nenhuma torta cadastrada.
                </p>
            </div>
        `;

        return;
    }

    adminProducts.innerHTML =
        produtos.map(produto => {

            const imagem =
                produto.imagem ||
                "https://via.placeholder.com/300x200?text=Docemania";

            return `
                <div class="admin-product-card">

                    <img
                        src="${escaparHTML(imagem)}"
                        alt="${escaparHTML(produto.nome)}"
                    >

                    <div class="admin-product-info">

                        <span>
                            ${
                                Number(produto.ativo)
                                    ? "ATIVO"
                                    : "INATIVO"
                            }
                        </span>

                        <h3>
                            ${escaparHTML(
                                produto.nome
                            )}
                        </h3>

                        <p>
                            ${escaparHTML(
                                produto.descricao || ""
                            )}
                        </p>

                        <strong>
                            ${dinheiro(
                                produto.preco
                            )}
                        </strong>

                    </div>

                    <div class="admin-product-actions">

                        <button
                            type="button"
                            class="edit-product"
                            data-id="${produto.id}"
                        >
                            ✏️ Editar
                        </button>

                        <button
                            type="button"
                            class="delete-product"
                            data-id="${produto.id}"
                        >
                            🗑️ Excluir
                        </button>

                    </div>

                </div>
            `;

        }).join("");


    document
        .querySelectorAll(".edit-product")
        .forEach(botao => {

            botao.addEventListener(
                "click",
                () => {

                    abrirEdicaoProduto(
                        Number(
                            botao.dataset.id
                        )
                    );
                }
            );
        });


    document
        .querySelectorAll(".delete-product")
        .forEach(botao => {

            botao.addEventListener(
                "click",
                () => {

                    excluirProduto(
                        Number(
                            botao.dataset.id
                        )
                    );
                }
            );
        });
}


/* =========================================================
   NOVO PRODUTO
========================================================= */

function limparFormularioProduto() {

    produtoEditandoId = null;

    if (adminProductTitle) {
        adminProductTitle.textContent =
            "Nova torta";
    }

    if (productName) {
        productName.value = "";
    }

    if (productPrice) {
        productPrice.value = "";
    }

    if (productDescription) {
        productDescription.value = "";
    }

    if (productImageFile) {
        productImageFile.value = "";
    }

    if (imagePreview) {
        imagePreview.src = "";
    }

    imagePreviewContainer?.classList.add(
        "hidden"
    );
}


addProductBtn?.addEventListener(
    "click",
    () => {

        limparFormularioProduto();

        adminProductModal?.classList.remove(
            "hidden"
        );
    }
);


closeAdminProduct?.addEventListener(
    "click",
    () => {

        adminProductModal?.classList.add(
            "hidden"
        );
    }
);


/* =========================================================
   PREVIEW DA IMAGEM
========================================================= */

productImageFile?.addEventListener(
    "change",
    () => {

        const arquivo =
            productImageFile.files[0];

        if (!arquivo) {

            imagePreviewContainer?.classList.add(
                "hidden"
            );

            return;
        }

        if (!arquivo.type.startsWith("image/")) {

            alert(
                "Selecione uma imagem válida."
            );

            productImageFile.value = "";

            return;
        }

        const url =
            URL.createObjectURL(
                arquivo
            );

        imagePreview.src = url;

        imagePreviewContainer?.classList.remove(
            "hidden"
        );
    }
);


removeImage?.addEventListener(
    "click",
    () => {

        productImageFile.value = "";

        imagePreview.src = "";

        imagePreviewContainer?.classList.add(
            "hidden"
        );
    }
);


/* =========================================================
   EDITAR PRODUTO
========================================================= */

function abrirEdicaoProduto(id) {

    const produto =
        produtos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!produto) {
        return;
    }

    produtoEditandoId =
        produto.id;

    adminProductTitle.textContent =
        "Editar torta";

    productName.value =
        produto.nome || "";

    productPrice.value =
        produto.preco || "";

    productDescription.value =
        produto.descricao || "";

    productImageFile.value = "";


    if (produto.imagem) {

        imagePreview.src =
            produto.imagem;

        imagePreviewContainer?.classList.remove(
            "hidden"
        );

    } else {

        imagePreview.src = "";

        imagePreviewContainer?.classList.add(
            "hidden"
        );
    }

    adminProductModal?.classList.remove(
        "hidden"
    );
}


/* =========================================================
   SALVAR PRODUTO
========================================================= */

async function salvarProduto() {

    try {

        const nome =
            productName.value.trim();

        const preco =
            Number(productPrice.value);

        const descricao =
            productDescription.value.trim();


        if (!nome) {

            alert(
                "Digite o nome da torta."
            );

            productName.focus();

            return;
        }


        if (
            !Number.isFinite(preco) ||
            preco < 0
        ) {

            alert(
                "Digite um preço válido."
            );

            productPrice.focus();

            return;
        }


        const formData =
            new FormData();

        formData.append(
            "nome",
            nome
        );

        formData.append(
            "preco",
            preco
        );

        formData.append(
            "descricao",
            descricao
        );


        if (
            productImageFile.files.length > 0
        ) {

            formData.append(
                "imagem",
                productImageFile.files[0]
            );
        }


        saveProduct.disabled = true;

        saveProduct.textContent =
            "Salvando...";


        let resultado;


        if (produtoEditandoId) {

            resultado =
                await requisicao(
                    `/produtos/${produtoEditandoId}`,
                    {
                        method: "PUT",
                        body: formData
                    }
                );

        } else {

            resultado =
                await requisicao(
                    "/produtos",
                    {
                        method: "POST",
                        body: formData
                    }
                );
        }


        if (resultado.sucesso) {

            alert(
                produtoEditandoId
                    ? "Produto atualizado com sucesso!"
                    : "Produto criado com sucesso!"
            );

            adminProductModal?.classList.add(
                "hidden"
            );

            limparFormularioProduto();

            await carregarProdutos();
        }

    } catch (erro) {

        console.error(
            "Erro ao salvar produto:",
            erro
        );

        if (
            erro.message ===
            "Não autorizado."
        ) {

            alert(
                "Sua sessão expirou. Faça login novamente."
            );

            adminArea?.classList.add(
                "hidden"
            );

            clienteArea?.classList.remove(
                "hidden"
            );

            loginModal?.classList.remove(
                "hidden"
            );

            return;
        }

        alert(
            erro.message ||
            "Erro ao salvar produto."
        );

    } finally {

        saveProduct.disabled = false;

        saveProduct.textContent =
            "💾 Salvar produto";
    }
}


saveProduct?.addEventListener(
    "click",
    salvarProduto
);


/* =========================================================
   EXCLUIR PRODUTO
========================================================= */

async function excluirProduto(id) {

    const produto =
        produtos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!produto) {
        return;
    }


    const confirmar =
        confirm(
            `Deseja realmente excluir "${produto.nome}"?`
        );


    if (!confirmar) {
        return;
    }


    try {

        await requisicao(
            `/produtos/${id}`,
            {
                method: "DELETE"
            }
        );

        alert(
            "Produto excluído com sucesso."
        );

        await carregarProdutos();

    } catch (erro) {

        console.error(
            "Erro ao excluir:",
            erro
        );

        alert(
            erro.message ||
            "Não foi possível excluir o produto."
        );
    }
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Docemania carregado."
        );

        atualizarCarrinho();

        await carregarProdutos();

        await verificarSessao();
    }
);