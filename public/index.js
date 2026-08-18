const API = "https://docemania.onrender.com/api";

/*
=========================================================
CONFIGURAÇÃO
=========================================================
*/

const USUARIO_ADMIN = "admin";

const NUMERO_WHATSAPP = "5599988109348";


/*
=========================================================
ESTADO
=========================================================
*/

let produtos = [];
let carrinho = [];

let produtoSelecionado = null;
let quantidadeAtual = 1;

let produtoEditandoId = null;
let imagemAtualProduto = "";

let tipoEntregaAtual = "entrega";

let pedidos = [];

let periodoRelatorioAtual = "hoje";


/*
=========================================================
ELEMENTOS - CLIENTE
=========================================================
*/

const clienteArea =
    document.getElementById("clienteArea");

const adminArea =
    document.getElementById("adminArea");

const abrirLoginAdmin =
    document.getElementById("abrirLoginAdmin");

const verProdutos =
    document.getElementById("verProdutos");


/*
=========================================================
PRODUTOS
=========================================================
*/

const productsGrid =
    document.getElementById("productsGrid");

const emptyProducts =
    document.getElementById("emptyProducts");


/*
=========================================================
MODAL PRODUTO
=========================================================
*/

const produtoModal =
    document.getElementById("produtoModal");

const fecharProdutoModal =
    document.getElementById("fecharProdutoModal");

const modalProductImage =
    document.getElementById("modalProductImage");

const modalProductCategory =
    document.getElementById("modalProductCategory");

const modalProductName =
    document.getElementById("modalProductName");

const modalProductDescription =
    document.getElementById("modalProductDescription");

const quantidadeProduto =
    document.getElementById("quantidadeProduto");

const diminuirQuantidade =
    document.getElementById("diminuirQuantidade");

const aumentarQuantidade =
    document.getElementById("aumentarQuantidade");

const modalProductTotal =
    document.getElementById("modalProductTotal");

const adicionarCarrinho =
    document.getElementById("adicionarCarrinho");


/*
=========================================================
CARRINHO
=========================================================
*/

const abrirCarrinho =
    document.getElementById("abrirCarrinho");

const fecharCarrinho =
    document.getElementById("fecharCarrinho");

const cart =
    document.getElementById("cart");

const cartOverlay =
    document.getElementById("cartOverlay");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");

const cartCount =
    document.getElementById("cartCount");

const finalizarPedido =
    document.getElementById("finalizarPedido");


/*
=========================================================
CHECKOUT
=========================================================
*/

const checkoutModal =
    document.getElementById("checkoutModal");

const fecharCheckout =
    document.getElementById("fecharCheckout");

const nomeCliente =
    document.getElementById("nomeCliente");

const telefoneCliente =
    document.getElementById("telefoneCliente");

const enderecoCliente =
    document.getElementById("enderecoCliente");

const campoEndereco =
    document.getElementById("campoEndereco");

const formaPagamento =
    document.getElementById("formaPagamento");

const campoTroco =
    document.getElementById("campoTroco");

const valorPagamento =
    document.getElementById("valorPagamento");

const trocoTexto =
    document.getElementById("trocoTexto");

const observacao =
    document.getElementById("observacao");

const checkoutTotal =
    document.getElementById("checkoutTotal");

const enviarWhatsApp =
    document.getElementById("enviarWhatsApp");

const deliveryButtons =
    document.querySelectorAll(".delivery");


/*
=========================================================
LOGIN
=========================================================
*/

const loginModal =
    document.getElementById("loginModal");

const fecharLogin =
    document.getElementById("fecharLogin");

const senhaAdmin =
    document.getElementById("senhaAdmin");

const entrarAdmin =
    document.getElementById("entrarAdmin");


/*
=========================================================
ADMIN
=========================================================
*/

const sairAdmin =
    document.getElementById("sairAdmin");

const abrirCadastroProduto =
    document.getElementById("abrirCadastroProduto");

const adminProducts =
    document.getElementById("adminProducts");

const emptyAdminProducts =
    document.getElementById("emptyAdminProducts");

const totalPedidosHoje =
    document.getElementById("totalPedidosHoje");

const faturamentoHoje =
    document.getElementById("faturamentoHoje");

const totalProdutos =
    document.getElementById("totalProdutos");

const produtosVendidosHoje =
    document.getElementById("produtosVendidosHoje");


/*
=========================================================
MODAL ADMIN PRODUTO
=========================================================
*/

const adminProductModal =
    document.getElementById("adminProductModal");

const fecharAdminProductModal =
    document.getElementById("fecharAdminProductModal");

const adminProductModalTitle =
    document.getElementById("adminProductModalTitle");

const productName =
    document.getElementById("productName");

const productCategory =
    document.getElementById("productCategory");

const productDescription =
    document.getElementById("productDescription");

const productPrice =
    document.getElementById("productPrice");

const productImageFile =
    document.getElementById("productImageFile");

const imagePreviewContainer =
    document.getElementById("imagePreviewContainer");

const imagePreview =
    document.getElementById("imagePreview");

const removeProductImage =
    document.getElementById("removeProductImage");

const salvarProduto =
    document.getElementById("salvarProduto");


/*
=========================================================
MENSAGEM
=========================================================
*/

const mensagemModal =
    document.getElementById("mensagemModal");

const fecharMensagem =
    document.getElementById("fecharMensagem");

const mensagemTitulo =
    document.getElementById("mensagemTitulo");

const mensagemTexto =
    document.getElementById("mensagemTexto");

const mensagemOk =
    document.getElementById("mensagemOk");


/*
=========================================================
RELATÓRIOS
=========================================================
*/

const relatoriosSection =
    document.getElementById("relatoriosSection");

const relatorioFaturamento =
    document.getElementById("relatorioFaturamento");

const relatorioPedidos =
    document.getElementById("relatorioPedidos");

const relatorioItens =
    document.getElementById("relatorioItens");

const relatorioProdutoMaisVendido =
    document.getElementById(
        "relatorioProdutoMaisVendido"
    );

const rankingProdutos =
    document.getElementById("rankingProdutos");

const relatorioPedidosLista =
    document.getElementById(
        "relatorioPedidosLista"
    );

const reportFilters =
    document.querySelectorAll(".report-filter");


/*
=========================================================
UTILIDADES
=========================================================
*/

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


function mostrarMensagem(
    titulo,
    texto
) {

    if (mensagemTitulo) {
        mensagemTitulo.textContent =
            titulo;
    }

    if (mensagemTexto) {
        mensagemTexto.textContent =
            texto;
    }

    mensagemModal?.classList.remove(
        "hidden"
    );
}


function fecharMensagemModal() {

    mensagemModal?.classList.add(
        "hidden"
    );
}


/*
=========================================================
REQUISIÇÃO À API
=========================================================
*/

async function requisicao(
    url,
    opcoes = {}
) {

    const resposta =
        await fetch(
            API + url,
            {
                credentials: "include",
                ...opcoes
            }
        );

    let dados = null;

    try {

        dados =
            await resposta.json();

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


/*
=========================================================
VER PRODUTOS
=========================================================
*/

verProdutos?.addEventListener(
    "click",
    () => {

        document
            .getElementById("produtos")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }
);


/*
=========================================================
CARREGAR PRODUTOS
=========================================================
*/

async function carregarProdutos() {

    try {

        const resultado =
            await requisicao(
                "/produtos"
            );


        if (Array.isArray(resultado)) {

            produtos =
                resultado;

        } else if (
            Array.isArray(resultado?.produtos)
        ) {

            produtos =
                resultado.produtos;

        } else {

            produtos = [];
        }


        renderizarProdutos();

        renderizarProdutosAdmin();

        atualizarEstatisticasProdutos();

    } catch (erro) {

        console.error(
            "Erro ao carregar produtos:",
            erro
        );


        if (productsGrid) {

            productsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>
                        Não foi possível carregar os produtos
                    </h3>

                    <p>
                        Tente novamente mais tarde.
                    </p>
                </div>
            `;
        }
    }
}


/*
=========================================================
RENDERIZAR PRODUTOS DO CLIENTE
=========================================================
*/

function renderizarProdutos() {

    if (!productsGrid) {
        return;
    }


    if (!produtos.length) {

        productsGrid.innerHTML = "";

        emptyProducts?.classList.remove(
            "hidden"
        );

        return;
    }


    emptyProducts?.classList.add(
        "hidden"
    );


    productsGrid.innerHTML =
        produtos.map(
            produto => {

                const imagem =
                    produto.imagem ||
                    "https://via.placeholder.com/500x350?text=Docemania";


                const categoria =
                    produto.categoria ||
                    "DOCE";


                const ativo =
                    Number(produto.ativo) !== 0;


                if (!ativo) {
                    return "";
                }


                return `
                    <article
                        class="product-card"
                        data-id="${produto.id}"
                    >

                        <img
                            class="product-image"
                            src="${escaparHTML(imagem)}"
                            alt="${escaparHTML(produto.nome)}"
                        >

                        <div class="product-card-content">

                            <span class="product-category">
                                ${escaparHTML(categoria)}
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
                                    class="primary-button product-open-button"
                                    data-id="${produto.id}"
                                >
                                    Ver produto
                                </button>

                            </div>

                        </div>

                    </article>
                `;
            }
        ).join("");


    productsGrid
        .querySelectorAll(
            ".product-open-button"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        abrirProduto(
                            Number(
                                botao.dataset.id
                            )
                        );
                    }
                );
            }
        );
}


/*
=========================================================
ABRIR PRODUTO
=========================================================
*/

function abrirProduto(id) {

    const produto =
        produtos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!produto) {
        return;
    }


    produtoSelecionado =
        produto;

    quantidadeAtual = 1;


    if (quantidadeProduto) {

        quantidadeProduto.textContent =
            quantidadeAtual;
    }


    if (modalProductImage) {

        modalProductImage.src =
            produto.imagem ||
            "https://via.placeholder.com/500x350?text=Docemania";

        modalProductImage.alt =
            produto.nome || "Produto";
    }


    if (modalProductCategory) {

        modalProductCategory.textContent =
            produto.categoria ||
            "DOCE";
    }


    if (modalProductName) {

        modalProductName.textContent =
            produto.nome || "";
    }


    if (modalProductDescription) {

        modalProductDescription.textContent =
            produto.descricao || "";
    }


    atualizarTotalProduto();


    produtoModal?.classList.remove(
        "hidden"
    );
}


/*
=========================================================
FECHAR PRODUTO
=========================================================
*/

function fecharModalProduto() {

    produtoModal?.classList.add(
        "hidden"
    );

    produtoSelecionado =
        null;
}


fecharProdutoModal?.addEventListener(
    "click",
    fecharModalProduto
);


/*
=========================================================
QUANTIDADE
=========================================================
*/

diminuirQuantidade?.addEventListener(
    "click",
    () => {

        if (quantidadeAtual <= 1) {
            return;
        }


        quantidadeAtual--;


        if (quantidadeProduto) {

            quantidadeProduto.textContent =
                quantidadeAtual;
        }


        atualizarTotalProduto();
    }
);


aumentarQuantidade?.addEventListener(
    "click",
    () => {

        quantidadeAtual++;


        if (quantidadeProduto) {

            quantidadeProduto.textContent =
                quantidadeAtual;
        }


        atualizarTotalProduto();
    }
);


function atualizarTotalProduto() {

    if (!produtoSelecionado) {
        return;
    }


    const total =
        Number(
            produtoSelecionado.preco || 0
        ) *
        quantidadeAtual;


    if (modalProductTotal) {

        modalProductTotal.textContent =
            dinheiro(total);
    }
}


/*
=========================================================
ADICIONAR AO CARRINHO
=========================================================
*/

function adicionarProdutoCarrinho() {

    if (!produtoSelecionado) {
        return;
    }


    const existente =
        carrinho.find(
            item =>
                Number(item.produto_id) ===
                Number(produtoSelecionado.id)
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
                Number(
                    produtoSelecionado.preco || 0
                ),

            quantidade:
                quantidadeAtual
        });
    }


    atualizarCarrinho();

    fecharModalProduto();

    abrirCarrinhoPainel();
}


adicionarCarrinho?.addEventListener(
    "click",
    adicionarProdutoCarrinho
);


/*
=========================================================
RENDERIZAR CARRINHO
=========================================================
*/

function atualizarCarrinho() {

    if (!cartItems) {
        return;
    }


    if (!carrinho.length) {

        cartItems.innerHTML = `
            <div class="empty-cart">

                <div>

                    <h3>
                        Seu carrinho está vazio
                    </h3>

                    <p>
                        Adicione alguns doces deliciosos.
                    </p>

                </div>

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
                    Number(item.preco || 0) *
                    Number(item.quantidade || 0);


                total += subtotal;

                quantidadeTotal +=
                    Number(item.quantidade || 0);


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


    cartItems
        .querySelectorAll(
            ".remove-cart-item"
        )
        .forEach(
            botao => {

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
            }
        );
}


/*
=========================================================
ABRIR / FECHAR CARRINHO
=========================================================
*/

function abrirCarrinhoPainel() {

    cart?.classList.add(
        "open"
    );

    cartOverlay?.classList.remove(
        "hidden"
    );
}


function fecharCarrinhoPainel() {

    cart?.classList.remove(
        "open"
    );

    cartOverlay?.classList.add(
        "hidden"
    );
}


abrirCarrinho?.addEventListener(
    "click",
    abrirCarrinhoPainel
);


fecharCarrinho?.addEventListener(
    "click",
    fecharCarrinhoPainel
);


cartOverlay?.addEventListener(
    "click",
    fecharCarrinhoPainel
);


/*
=========================================================
TIPO DE ENTREGA
=========================================================
*/

deliveryButtons.forEach(
    botao => {

        botao.addEventListener(
            "click",
            () => {

                deliveryButtons.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );
                    }
                );


                botao.classList.add(
                    "active"
                );


                tipoEntregaAtual =
                    botao.dataset.tipo ||
                    "entrega";


                if (
                    tipoEntregaAtual ===
                    "entrega"
                ) {

                    campoEndereco?.classList.remove(
                        "hidden"
                    );

                } else {

                    campoEndereco?.classList.add(
                        "hidden"
                    );


                    if (enderecoCliente) {

                        enderecoCliente.value =
                            "";
                    }
                }
            }
        );
    }
);


/*
=========================================================
PAGAMENTO
=========================================================
*/

formaPagamento?.addEventListener(
    "change",
    () => {

        if (
            formaPagamento.value ===
            "dinheiro"
        ) {

            campoTroco?.classList.remove(
                "hidden"
            );

            atualizarTroco();

        } else {

            campoTroco?.classList.add(
                "hidden"
            );


            if (valorPagamento) {

                valorPagamento.value =
                    "";
            }


            if (trocoTexto) {

                trocoTexto.textContent =
                    "Troco: R$ 0,00";
            }
        }
    }
);


/*
=========================================================
TOTAL CARRINHO
=========================================================
*/

function calcularTotalCarrinho() {

    return carrinho.reduce(
        (
            total,
            item
        ) => {

            return (
                total +
                Number(item.preco || 0) *
                Number(item.quantidade || 0)
            );
        },
        0
    );
}


/*
=========================================================
TROCO
=========================================================
*/

function atualizarTroco() {

    if (!formaPagamento) {
        return;
    }


    if (
        formaPagamento.value !==
        "dinheiro"
    ) {
        return;
    }


    const total =
        calcularTotalCarrinho();


    const pago =
        Number(
            valorPagamento?.value || 0
        );


    const troco =
        pago - total;


    if (!trocoTexto) {
        return;
    }


    if (pago <= 0) {

        trocoTexto.textContent =
            "Troco: R$ 0,00";

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


valorPagamento?.addEventListener(
    "input",
    atualizarTroco
);


/*
=========================================================
ABRIR CHECKOUT
=========================================================
*/

function abrirCheckout() {

    if (!carrinho.length) {

        mostrarMensagem(
            "Carrinho vazio",
            "Adicione pelo menos um produto antes de continuar."
        );

        return;
    }


    fecharCarrinhoPainel();


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


finalizarPedido?.addEventListener(
    "click",
    abrirCheckout
);


/*
=========================================================
FECHAR CHECKOUT
=========================================================
*/

fecharCheckout?.addEventListener(
    "click",
    () => {

        checkoutModal?.classList.add(
            "hidden"
        );
    }
);


/*
=========================================================
FINALIZAR PEDIDO
=========================================================
*/

async function finalizarPedidoWhatsApp() {

    try {

        const nome =
            nomeCliente?.value.trim() ||
            "";


        const telefone =
            telefoneCliente?.value.trim() ||
            "";


        const endereco =
            enderecoCliente?.value.trim() ||
            "";


        const forma =
            formaPagamento?.value ||
            "";


        const observacaoTexto =
            observacao?.value.trim() ||
            "";


        /*
        -------------------------------------------------
        VALIDAÇÕES
        -------------------------------------------------
        */


        if (!nome) {

            mostrarMensagem(
                "Nome obrigatório",
                "Digite seu nome para continuar."
            );

            nomeCliente?.focus();

            return;
        }


        if (
            tipoEntregaAtual ===
            "entrega" &&
            !endereco
        ) {

            mostrarMensagem(
                "Endereço obrigatório",
                "Digite o endereço para entrega."
            );

            enderecoCliente?.focus();

            return;
        }


        if (!forma) {

            mostrarMensagem(
                "Pagamento",
                "Selecione a forma de pagamento."
            );

            formaPagamento?.focus();

            return;
        }


        const total =
            calcularTotalCarrinho();


        const valorPago =
            Number(
                valorPagamento?.value || 0
            );


        if (
            forma === "dinheiro" &&
            valorPago < total
        ) {

            mostrarMensagem(
                "Valor insuficiente",
                "O valor recebido precisa ser maior ou igual ao total."
            );

            valorPagamento?.focus();

            return;
        }


        /*
        -------------------------------------------------
        ITENS
        -------------------------------------------------
        */

        const pedidoItens =
            carrinho.map(
                item => ({

                    produto_id:
                        item.produto_id,

                    nome_produto:
                        item.nome_produto,

                    quantidade:
                        item.quantidade,

                    preco:
                        item.preco
                })
            );


        /*
        -------------------------------------------------
        DADOS PARA API
        -------------------------------------------------
        */

        const dados = {

            cliente:
                nome,

            telefone:
                telefone,

            endereco:
                tipoEntregaAtual ===
                "entrega"
                    ? endereco
                    : "",

            tipo_entrega:
                tipoEntregaAtual,

            regiao:
                "",

            taxa_entrega:
                0,

            pagamento:
                forma,

            troco_para:
                forma === "dinheiro"
                    ? valorPago
                    : 0,

            observacao:
                observacaoTexto,

            itens:
                pedidoItens
        };


        enviarWhatsApp.disabled =
            true;


        enviarWhatsApp.textContent =
            "Enviando...";


        /*
        -------------------------------------------------
        ENVIAR PARA API
        -------------------------------------------------
        */

        await requisicao(
            "/pedidos",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        dados
                    )
            }
        );


        /*
        -------------------------------------------------
        MONTAR WHATSAPP
        -------------------------------------------------
        */

        let mensagem =
            "🍰 *NOVO PEDIDO - DOCEMANIA*\n\n";


        mensagem +=
            `👤 Cliente: ${nome}\n`;


        if (telefone) {

            mensagem +=
                `📱 WhatsApp: ${telefone}\n`;
        }


        mensagem +=
            `📦 Tipo: ${
                tipoEntregaAtual ===
                "entrega"
                    ? "Entrega"
                    : "Retirada"
            }\n`;


        if (
            tipoEntregaAtual ===
            "entrega"
        ) {

            mensagem +=
                `📍 Endereço: ${endereco}\n`;
        }


        mensagem +=
            `💳 Pagamento: ${
                nomeFormaPagamento(
                    forma
                )
            }\n`;


        if (
            forma === "dinheiro"
        ) {

            mensagem +=
                `💵 Recebido: ${dinheiro(
                    valorPago
                )}\n`;


            mensagem +=
                `💰 Troco: ${dinheiro(
                    valorPago - total
                )}\n`;
        }


        mensagem +=
            "\n*ITENS DO PEDIDO:*\n";


        carrinho.forEach(
            item => {

                mensagem +=
                    `• ${item.quantidade}x ` +
                    `${item.nome_produto} - ` +
                    `${dinheiro(
                        Number(item.preco) *
                        Number(item.quantidade)
                    )}\n`;
            }
        );


        if (observacaoTexto) {

            mensagem +=
                `\n📝 Observação: ${observacaoTexto}\n`;
        }


        mensagem +=
            `\n💰 *TOTAL: ${dinheiro(total)}*`;


        const url =
            "https://wa.me/" +
            NUMERO_WHATSAPP +
            "?text=" +
            encodeURIComponent(
                mensagem
            );


        window.open(
            url,
            "_blank"
        );


        /*
        -------------------------------------------------
        LIMPAR PEDIDO
        -------------------------------------------------
        */

        carrinho = [];

        atualizarCarrinho();


        checkoutModal?.classList.add(
            "hidden"
        );


        if (nomeCliente) {
            nomeCliente.value = "";
        }


        if (telefoneCliente) {
            telefoneCliente.value = "";
        }


        if (enderecoCliente) {
            enderecoCliente.value = "";
        }


        if (formaPagamento) {
            formaPagamento.value = "";
        }


        if (valorPagamento) {
            valorPagamento.value = "";
        }


        if (observacao) {
            observacao.value = "";
        }


        campoTroco?.classList.add(
            "hidden"
        );


        if (trocoTexto) {

            trocoTexto.textContent =
                "Troco: R$ 0,00";
        }


        mostrarMensagem(
            "Pedido enviado!",
            "Seu pedido foi registrado e o WhatsApp foi aberto."
        );


        /*
        -------------------------------------------------
        ATUALIZAR RELATÓRIOS
        -------------------------------------------------
        */

        if (
            !adminArea?.classList.contains(
                "hidden"
            )
        ) {

            await carregarRelatorios();
        }

    } catch (erro) {

        console.error(
            "Erro ao finalizar pedido:",
            erro
        );


        mostrarMensagem(
            "Erro",
            erro.message ||
            "Não foi possível enviar o pedido."
        );

    } finally {

        if (enviarWhatsApp) {

            enviarWhatsApp.disabled =
                false;

            enviarWhatsApp.textContent =
                "Finalizar pelo WhatsApp";
        }
    }
}


enviarWhatsApp?.addEventListener(
    "click",
    finalizarPedidoWhatsApp
);


/*
=========================================================
NOME DO PAGAMENTO
=========================================================
*/

function nomeFormaPagamento(
    valor
) {

    switch (valor) {

        case "pix":
            return "PIX";

        case "dinheiro":
            return "Dinheiro";

        case "cartao":
            return "Cartão";

        default:
            return valor;
    }
}


/*
=========================================================
LOGIN ADMIN
=========================================================
*/

abrirLoginAdmin?.addEventListener(
    "click",
    () => {

        loginModal?.classList.remove(
            "hidden"
        );

        senhaAdmin?.focus();
    }
);


fecharLogin?.addEventListener(
    "click",
    () => {

        loginModal?.classList.add(
            "hidden"
        );
    }
);


async function fazerLoginAdmin() {

    const senha =
        senhaAdmin?.value || "";


    if (!senha) {

        mostrarMensagem(
            "Senha obrigatória",
            "Digite a senha administrativa."
        );

        senhaAdmin?.focus();

        return;
    }


    try {

        entrarAdmin.disabled =
            true;


        entrarAdmin.textContent =
            "Entrando...";


        /*
        O HTML atual só possui senha.
        O backend original trabalhava com
        usuário + senha, então usamos
        USUARIO_ADMIN configurado no início.
        */

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

                            usuario:
                                USUARIO_ADMIN,

                            senha:
                                senha
                        })
                }
            );


        if (
            resultado?.sucesso ||
            resultado?.usuario
        ) {

            loginModal?.classList.add(
                "hidden"
            );


            if (senhaAdmin) {

                senhaAdmin.value =
                    "";
            }


            await entrarNoPainel();

        } else {

            throw new Error(
                resultado?.mensagem ||
                "Senha incorreta."
            );
        }

    } catch (erro) {

        console.error(
            "Erro no login:",
            erro
        );


        mostrarMensagem(
            "Não foi possível entrar",
            erro.message ||
            "Senha incorreta."
        );

    } finally {

        if (entrarAdmin) {

            entrarAdmin.disabled =
                false;

            entrarAdmin.textContent =
                "Entrar no painel";
        }
    }
}


entrarAdmin?.addEventListener(
    "click",
    fazerLoginAdmin
);


senhaAdmin?.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key ===
            "Enter"
        ) {

            fazerLoginAdmin();
        }
    }
);


/*
=========================================================
ENTRAR NO PAINEL
=========================================================
*/

async function entrarNoPainel() {

    clienteArea?.classList.add(
        "hidden"
    );


    adminArea?.classList.remove(
        "hidden"
    );


    await carregarProdutos();

    await carregarRelatorios();
}


/*
=========================================================
LOGOUT
=========================================================
*/

sairAdmin?.addEventListener(
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


        loginModal?.classList.add(
            "hidden"
        );


        adminProductModal?.classList.add(
            "hidden"
        );


        if (senhaAdmin) {

            senhaAdmin.value =
                "";
        }


        mostrarMensagem(
            "Sessão encerrada",
            "Você saiu do painel administrativo."
        );
    }
);


/*
=========================================================
NOVO PRODUTO
=========================================================
*/

function limparFormularioProduto() {

    produtoEditandoId =
        null;

    imagemAtualProduto =
        "";


    if (adminProductModalTitle) {

        adminProductModalTitle.textContent =
            "Novo produto";
    }


    if (productName) {

        productName.value =
            "";
    }


    if (productCategory) {

        productCategory.value =
            "";
    }


    if (productDescription) {

        productDescription.value =
            "";
    }


    if (productPrice) {

        productPrice.value =
            "";
    }


    if (productImageFile) {

        productImageFile.value =
            "";
    }


    if (imagePreview) {

        imagePreview.src =
            "";
    }


    imagePreviewContainer?.classList.add(
        "hidden"
    );
}


abrirCadastroProduto?.addEventListener(
    "click",
    () => {

        limparFormularioProduto();


        adminProductModal?.classList.remove(
            "hidden"
        );


        productName?.focus();
    }
);


/*
=========================================================
FECHAR MODAL ADMIN PRODUTO
=========================================================
*/

fecharAdminProductModal?.addEventListener(
    "click",
    () => {

        adminProductModal?.classList.add(
            "hidden"
        );
    }
);


/*
=========================================================
UPLOAD DE IMAGEM
=========================================================
*/

productImageFile?.addEventListener(
    "change",
    () => {

        const arquivo =
            productImageFile.files?.[0];


        if (!arquivo) {

            return;
        }


        if (
            !arquivo.type.startsWith(
                "image/"
            )
        ) {

            mostrarMensagem(
                "Imagem inválida",
                "Selecione um arquivo de imagem."
            );


            productImageFile.value =
                "";


            return;
        }


        const url =
            URL.createObjectURL(
                arquivo
            );


        imagemAtualProduto =
            "";


        if (imagePreview) {

            imagePreview.src =
                url;
        }


        imagePreviewContainer?.classList.remove(
            "hidden"
        );
    }
);


/*
=========================================================
REMOVER IMAGEM
=========================================================
*/

removeProductImage?.addEventListener(
    "click",
    () => {

        if (productImageFile) {

            productImageFile.value =
                "";
        }


        if (imagePreview) {

            imagePreview.src =
                "";
        }


        imagemAtualProduto =
            "";


        imagePreviewContainer?.classList.add(
            "hidden"
        );
    }
);


/*
=========================================================
RENDERIZAR PRODUTOS ADMIN
=========================================================
*/

function renderizarProdutosAdmin() {

    if (!adminProducts) {
        return;
    }


    if (totalProdutos) {

        totalProdutos.textContent =
            produtos.length;
    }


    if (!produtos.length) {

        adminProducts.innerHTML =
            "";


        emptyAdminProducts?.classList.remove(
            "hidden"
        );


        return;
    }


    emptyAdminProducts?.classList.add(
        "hidden"
    );


    adminProducts.innerHTML =
        produtos.map(
            produto => {

                const imagem =
                    produto.imagem ||
                    "https://via.placeholder.com/300x200?text=Docemania";


                const ativo =
                    Number(produto.ativo) !== 0;


                return `
                    <div
                        class="admin-product-card"
                    >

                        <img
                            src="${escaparHTML(imagem)}"
                            alt="${escaparHTML(
                                produto.nome
                            )}"
                        >

                        <div
                            class="admin-product-info"
                        >

                            <span>
                                ${
                                    ativo
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
                                    produto.descricao ||
                                    ""
                                )}
                            </p>

                            <strong>
                                ${dinheiro(
                                    produto.preco
                                )}
                            </strong>

                        </div>

                        <div
                            class="admin-product-actions"
                        >

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
            }
        ).join("");


    adminProducts
        .querySelectorAll(
            ".edit-product"
        )
        .forEach(
            botao => {

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
            }
        );


    adminProducts
        .querySelectorAll(
            ".delete-product"
        )
        .forEach(
            botao => {

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
            }
        );
}


/*
=========================================================
EDITAR PRODUTO
=========================================================
*/

function abrirEdicaoProduto(
    id
) {

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


    imagemAtualProduto =
        produto.imagem || "";


    if (adminProductModalTitle) {

        adminProductModalTitle.textContent =
            "Editar produto";
    }


    if (productName) {

        productName.value =
            produto.nome || "";
    }


    if (productCategory) {

        productCategory.value =
            produto.categoria || "";
    }


    if (productDescription) {

        productDescription.value =
            produto.descricao || "";
    }


    if (productPrice) {

        productPrice.value =
            produto.preco || "";
    }


    if (productImageFile) {

        productImageFile.value =
            "";
    }


    if (produto.imagem) {

        if (imagePreview) {

            imagePreview.src =
                produto.imagem;
        }


        imagePreviewContainer?.classList.remove(
            "hidden"
        );

    } else {

        if (imagePreview) {

            imagePreview.src =
                "";
        }


        imagePreviewContainer?.classList.add(
            "hidden"
        );
    }


    adminProductModal?.classList.remove(
        "hidden"
    );
}


/*
=========================================================
SALVAR PRODUTO
=========================================================
*/

async function salvarProdutoAdmin() {

    try {

        const nome =
            productName?.value.trim() ||
            "";


        const categoria =
            productCategory?.value.trim() ||
            "";


        const descricao =
            productDescription?.value.trim() ||
            "";


        const preco =
            Number(
                productPrice?.value
            );


        if (!nome) {

            mostrarMensagem(
                "Nome obrigatório",
                "Digite o nome do produto."
            );

            productName?.focus();

            return;
        }


        if (
            !Number.isFinite(preco) ||
            preco < 0
        ) {

            mostrarMensagem(
                "Preço inválido",
                "Digite um preço válido."
            );

            productPrice?.focus();

            return;
        }


        const formData =
            new FormData();


        formData.append(
            "nome",
            nome
        );


        formData.append(
            "categoria",
            categoria
        );


        formData.append(
            "descricao",
            descricao
        );


        formData.append(
            "preco",
            preco
        );


        /*
        -------------------------------------------------
        NOVA IMAGEM
        -------------------------------------------------
        */

        if (
            productImageFile?.files?.length
        ) {

            formData.append(
                "imagem",
                productImageFile.files[0]
            );
        }


        salvarProduto.disabled =
            true;


        salvarProduto.textContent =
            "Salvando...";


        let resultado;


        if (produtoEditandoId) {

            resultado =
                await requisicao(
                    `/produto/${produtoEditandoId}`,
                    {
                        method: "PUT",
                        body: formData
                    }
                );

        } else {

            resultado =
                await requisicao(
                    "/produto",
                    {
                        method: "POST",
                        body: formData
                    }
                );
        }


        if (
            resultado?.sucesso ||
            resultado?.produto ||
            resultado?.id
        ) {

            adminProductModal?.classList.add(
                "hidden"
            );


            limparFormularioProduto();


            await carregarProdutos();


            mostrarMensagem(
                "Tudo certo!",
                produtoEditandoId
                    ? "Produto atualizado com sucesso."
                    : "Produto criado com sucesso."
            );

        } else {

            /*
            Mesmo que o backend retorne
            o produto diretamente, consideramos
            a operação concluída quando não
            houver erro HTTP.
            */

            adminProductModal?.classList.add(
                "hidden"
            );


            limparFormularioProduto();


            await carregarProdutos();


            mostrarMensagem(
                "Tudo certo!",
                "Produto salvo com sucesso."
            );
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


        mostrarMensagem(
            "Erro ao salvar",
            erro.message ||
            "Não foi possível salvar o produto."
        );

    } finally {

        if (salvarProduto) {

            salvarProduto.disabled =
                false;

            salvarProduto.textContent =
                "Salvar produto";
        }
    }
}


salvarProduto?.addEventListener(
    "click",
    salvarProdutoAdmin
);


/*
=========================================================
EXCLUIR PRODUTO
=========================================================
*/

async function excluirProduto(
    id
) {

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
            `/produto/${id}`,
            {
                method: "DELETE"
            }
        );


        await carregarProdutos();


        mostrarMensagem(
            "Produto excluído",
            "O produto foi removido com sucesso."
        );

    } catch (erro) {

        console.error(
            "Erro ao excluir produto:",
            erro
        );


        mostrarMensagem(
            "Erro",
            erro.message ||
            "Não foi possível excluir o produto."
        );
    }
}


/*
=========================================================
ESTATÍSTICAS DE PRODUTOS
=========================================================
*/

function atualizarEstatisticasProdutos() {

    if (totalProdutos) {

        totalProdutos.textContent =
            produtos.length;
    }
}


/*
=========================================================
CARREGAR PEDIDOS
=========================================================
*/

async function carregarPedidos() {

    try {

        const resultado =
            await requisicao(
                "/pedidos"
            );


        if (Array.isArray(resultado)) {

            pedidos =
                resultado;

        } else if (
            Array.isArray(resultado?.pedidos)
        ) {

            pedidos =
                resultado.pedidos;

        } else {

            pedidos = [];
        }


        atualizarEstatisticasPedidos();

        atualizarRelatorio();

    } catch (erro) {

        /*
        O sistema continua funcionando
        mesmo que a API não disponibilize
        GET /pedidos.
        */

        console.warn(
            "Não foi possível carregar pedidos:",
            erro.message
        );


        pedidos = [];


        atualizarEstatisticasPedidos();

        atualizarRelatorio();
    }
}


/*
=========================================================
NORMALIZAR DATA
=========================================================
*/

function obterDataPedido(
    pedido
) {

    return (
        pedido.created_at ||
        pedido.criado_em ||
        pedido.data ||
        pedido.createdAt ||
        pedido.data_pedido ||
        null
    );
}


function converterData(
    valor
) {

    if (!valor) {
        return null;
    }


    const data =
        new Date(valor);


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return null;
    }


    return data;
}


/*
=========================================================
FILTRAR PEDIDOS POR PERÍODO
=========================================================
*/

function filtrarPedidosPorPeriodo(
    lista,
    periodo
) {

    const agora =
        new Date();


    const inicio =
        new Date(agora);


    inicio.setHours(
        0,
        0,
        0,
        0
    );


    if (periodo === "hoje") {

        return lista.filter(
            pedido => {

                const data =
                    converterData(
                        obterDataPedido(
                            pedido
                        )
                    );


                if (!data) {
                    return false;
                }


                return (
                    data >= inicio
                );
            }
        );
    }


    if (
        periodo ===
        "7dias"
    ) {

        inicio.setDate(
            inicio.getDate() - 6
        );

    } else if (
        periodo ===
        "mes"
    ) {

        inicio.setDate(1);

    } else if (
        periodo ===
        "30dias"
    ) {

        inicio.setDate(
            inicio.getDate() - 29
        );
    }


    return lista.filter(
        pedido => {

            const data =
                converterData(
                    obterDataPedido(
                        pedido
                    )
                );


            if (!data) {
                return false;
            }


            return (
                data >= inicio
            );
        }
    );
}


/*
=========================================================
TOTAL DO PEDIDO
=========================================================
*/

function obterTotalPedido(
    pedido
) {

    if (
        pedido.total !== undefined
    ) {

        return Number(
            pedido.total || 0
        );
    }


    if (
        pedido.valor_total !== undefined
    ) {

        return Number(
            pedido.valor_total || 0
        );
    }


    if (
        pedido.total_pedido !== undefined
    ) {

        return Number(
            pedido.total_pedido || 0
        );
    }


    if (
        Array.isArray(
            pedido.itens
        )
    ) {

        return pedido.itens.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    Number(
                        item.preco || 0
                    ) *
                    Number(
                        item.quantidade || 0
                    )
                );
            },
            0
        );
    }


    return 0;
}


/*
=========================================================
ITENS DO PEDIDO
=========================================================
*/

function obterItensPedido(
    pedido
) {

    if (
        Array.isArray(
            pedido.itens
        )
    ) {

        return pedido.itens;
    }


    if (
        Array.isArray(
            pedido.items
        )
    ) {

        return pedido.items;
    }


    return [];
}


/*
=========================================================
ESTATÍSTICAS DE PEDIDOS
=========================================================
*/

function atualizarEstatisticasPedidos() {

    const pedidosHoje =
        filtrarPedidosPorPeriodo(
            pedidos,
            "hoje"
        );


    let faturamento =
        0;


    let itensVendidos =
        0;


    pedidosHoje.forEach(
        pedido => {

            faturamento +=
                obterTotalPedido(
                    pedido
                );


            const itens =
                obterItensPedido(
                    pedido
                );


            itens.forEach(
                item => {

                    itensVendidos +=
                        Number(
                            item.quantidade ||
                            0
                        );
                }
            );
        }
    );


    if (totalPedidosHoje) {

        totalPedidosHoje.textContent =
            pedidosHoje.length;
    }


    if (faturamentoHoje) {

        faturamentoHoje.textContent =
            dinheiro(
                faturamento
            );
    }


    if (produtosVendidosHoje) {

        produtosVendidosHoje.textContent =
            itensVendidos;
    }
}


/*
=========================================================
RELATÓRIOS
=========================================================
*/

async function carregarRelatorios() {

    await carregarPedidos();
}


function atualizarRelatorio() {

    const lista =
        filtrarPedidosPorPeriodo(
            pedidos,
            periodoRelatorioAtual
        );


    let faturamento =
        0;


    let itens =
        0;


    const ranking =
        {};


    lista.forEach(
        pedido => {

            faturamento +=
                obterTotalPedido(
                    pedido
                );


            const itensPedido =
                obterItensPedido(
                    pedido
                );


            itensPedido.forEach(
                item => {

                    const quantidade =
                        Number(
                            item.quantidade ||
                            0
                        );


                    itens +=
                        quantidade;


                    const nome =
                        item.nome_produto ||
                        item.nome ||
                        "Produto";


                    if (
                        !ranking[nome]
                    ) {

                        ranking[nome] = {
                            quantidade: 0,
                            faturamento: 0
                        };
                    }


                    ranking[nome].quantidade +=
                        quantidade;


                    ranking[nome].faturamento +=
                        Number(
                            item.preco || 0
                        ) *
                        quantidade;
                }
            );
        }
    );


    if (relatorioFaturamento) {

        relatorioFaturamento.textContent =
            dinheiro(
                faturamento
            );
    }


    if (relatorioPedidos) {

        relatorioPedidos.textContent =
            lista.length;
    }


    if (relatorioItens) {

        relatorioItens.textContent =
            itens;
    }


    renderizarRanking(
        ranking
    );


    renderizarPedidosRecentes(
        lista
    );
}


/*
=========================================================
RANKING
=========================================================
*/

function renderizarRanking(
    ranking
) {

    if (!rankingProdutos) {
        return;
    }


    const produtosRanking =
        Object.entries(
            ranking
        )
        .sort(
            (
                a,
                b
            ) =>
                b[1].quantidade -
                a[1].quantidade
        );


    if (
        !produtosRanking.length
    ) {

        rankingProdutos.innerHTML = `
            <div class="empty-state">

                <h3>
                    Ainda não há vendas
                </h3>

                <p>
                    O ranking aparecerá aqui conforme
                    os pedidos forem realizados.
                </p>

            </div>
        `;


        if (
            relatorioProdutoMaisVendido
        ) {

            relatorioProdutoMaisVendido.textContent =
                "—";
        }


        return;
    }


    const primeiro =
        produtosRanking[0];


    if (
        relatorioProdutoMaisVendido
    ) {

        relatorioProdutoMaisVendido.textContent =
            primeiro[0];
    }


    rankingProdutos.innerHTML =
        produtosRanking
            .map(
                (
                    [nome, dados],
                    indice
                ) => {

                    return `
                        <div
                            class="admin-product-card"
                        >

                            <div
                                class="admin-product-info"
                            >

                                <span>
                                    #${indice + 1}
                                </span>

                                <h3>
                                    ${escaparHTML(nome)}
                                </h3>

                                <p>
                                    ${dados.quantidade}
                                    ${
                                        dados.quantidade === 1
                                            ? "unidade"
                                            : "unidades"
                                    }
                                    vendidas
                                </p>

                                <strong>
                                    ${dinheiro(
                                        dados.faturamento
                                    )}
                                </strong>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/*
=========================================================
PEDIDOS RECENTES
=========================================================
*/

function renderizarPedidosRecentes(
    lista
) {

    if (!relatorioPedidosLista) {
        return;
    }


    const recentes =
        [...lista]
            .sort(
                (
                    a,
                    b
                ) => {

                    const dataA =
                        converterData(
                            obterDataPedido(
                                a
                            )
                        );


                    const dataB =
                        converterData(
                            obterDataPedido(
                                b
                            )
                        );


                    return (
                        (dataB?.getTime() || 0) -
                        (dataA?.getTime() || 0)
                    );
                }
            )
            .slice(
                0,
                10
            );


    if (!recentes.length) {

        relatorioPedidosLista.innerHTML = `
            <div class="empty-state">

                <h3>
                    Nenhum pedido encontrado
                </h3>

                <p>
                    Os pedidos aparecerão aqui.
                </p>

            </div>
        `;

        return;
    }


    relatorioPedidosLista.innerHTML =
        recentes
            .map(
                pedido => {

                    const nome =
                        pedido.cliente ||
                        pedido.nome_cliente ||
                        "Cliente";


                    const total =
                        obterTotalPedido(
                            pedido
                        );


                    const tipo =
                        pedido.tipo_entrega ||
                        pedido.tipo ||
                        "entrega";


                    const pagamento =
                        pedido.pagamento ||
                        "Não informado";


                    const data =
                        converterData(
                            obterDataPedido(
                                pedido
                            )
                        );


                    const dataTexto =
                        data
                            ? data.toLocaleString(
                                "pt-BR"
                            )
                            : "Data não informada";


                    return `
                        <div
                            class="cart-item"
                        >

                            <div>

                                <strong>
                                    ${escaparHTML(nome)}
                                </strong>

                                <small>
                                    ${escaparHTML(
                                        dataTexto
                                    )}
                                </small>

                                <small>
                                    ${
                                        tipo === "retirada"
                                            ? "🛍️ Retirada"
                                            : "🚚 Entrega"
                                    }
                                </small>

                                <small>
                                    💳 ${
                                        nomeFormaPagamento(
                                            pagamento
                                        )
                                    }
                                </small>

                            </div>

                            <div>

                                <strong>
                                    ${dinheiro(total)}
                                </strong>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


/*
=========================================================
FILTROS DOS RELATÓRIOS
=========================================================
*/

reportFilters.forEach(
    botao => {

        botao.addEventListener(
            "click",
            () => {

                reportFilters.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );
                    }
                );


                botao.classList.add(
                    "active"
                );


                periodoRelatorioAtual =
                    botao.dataset.periodo ||
                    "hoje";


                atualizarRelatorio();
            }
        );
    }
);


/*
=========================================================
MODAL DE MENSAGEM
=========================================================
*/

fecharMensagem?.addEventListener(
    "click",
    fecharMensagemModal
);


mensagemOk?.addEventListener(
    "click",
    fecharMensagemModal
);


/*
=========================================================
FECHAR MODAIS AO CLICAR FORA
=========================================================
*/

produtoModal?.addEventListener(
    "click",
    evento => {

        if (
            evento.target ===
            produtoModal
        ) {

            fecharModalProduto();
        }
    }
);


checkoutModal?.addEventListener(
    "click",
    evento => {

        if (
            evento.target ===
            checkoutModal
        ) {

            checkoutModal.classList.add(
                "hidden"
            );
        }
    }
);


loginModal?.addEventListener(
    "click",
    evento => {

        if (
            evento.target ===
            loginModal
        ) {

            loginModal.classList.add(
                "hidden"
            );
        }
    }
);


adminProductModal?.addEventListener(
    "click",
    evento => {

        if (
            evento.target ===
            adminProductModal
        ) {

            adminProductModal.classList.add(
                "hidden"
            );
        }
    }
);


mensagemModal?.addEventListener(
    "click",
    evento => {

        if (
            evento.target ===
            mensagemModal
        ) {

            fecharMensagemModal();
        }
    }
);


/*
=========================================================
ESC FECHA MODAIS
=========================================================
*/

document.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key !==
            "Escape"
        ) {
            return;
        }


        produtoModal?.classList.add(
            "hidden"
        );


        checkoutModal?.classList.add(
            "hidden"
        );


        loginModal?.classList.add(
            "hidden"
        );


        adminProductModal?.classList.add(
            "hidden"
        );


        mensagemModal?.classList.add(
            "hidden"
        );


        fecharCarrinhoPainel();
    }
);


/*
=========================================================
INICIALIZAÇÃO
=========================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "🍰 Docemania carregado."
        );


        /*
        Carrinho
        */

        atualizarCarrinho();


        /*
        Produtos
        */

        await carregarProdutos();


        /*
        Garante estado inicial
        */

        tipoEntregaAtual =
            "entrega";


        campoEndereco?.classList.remove(
            "hidden"
        );


        /*
        O painel administrativo
        começa escondido.
        */

        adminArea?.classList.add(
            "hidden"
        );


        /*
        Cliente começa visível.
        */

        clienteArea?.classList.remove(
            "hidden"
        );


        console.log(
            "Produtos carregados:",
            produtos.length
        );
    }
);