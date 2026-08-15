// =====================================================
// DOCEMANIA
// SISTEMA ONLINE
// =====================================================

let produtos = [];
let carrinho = [];

let produtoSelecionado = null;
let quantidadeAtual = 1;
let tipoEntrega = "entrega";

let produtoEditando = null;
let imagemSelecionada = null;


// =====================================================
// MOEDA
// =====================================================

function moeda(valor) {

    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

}


// =====================================================
// ELEMENTOS
// =====================================================

const listaProdutos =
    document.getElementById("listaProdutos");

const cart =
    document.getElementById("cart");

const overlay =
    document.getElementById("overlay");

const cartItems =
    document.getElementById("cartItems");

const cartCount =
    document.getElementById("cartCount");

const cartTotal =
    document.getElementById("cartTotal");


// =====================================================
// PRODUTOS - BANCO DE DADOS
// =====================================================

async function carregarProdutos() {

    try {

        const resposta =
            await fetch("/api/produtos");


        if (!resposta.ok) {

            throw new Error(
                "Erro ao buscar produtos"
            );

        }


        produtos =
            await resposta.json();


        renderizarProdutos();
        renderizarAdmin();


    } catch (erro) {

        console.error(erro);


        listaProdutos.innerHTML = `

            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:40px;
            ">

                <h3>
                    Não foi possível carregar o cardápio.
                </h3>

                <p>
                    Verifique se o servidor está funcionando.
                </p>

            </div>

        `;

    }

}


// =====================================================
// PRODUTOS NA TELA
// =====================================================

function renderizarProdutos() {

    listaProdutos.innerHTML = "";


    if (produtos.length === 0) {

        listaProdutos.innerHTML = `

            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:50px;
            ">

                <div style="font-size:45px;">
                    🍰
                </div>

                <h3>
                    Nenhuma torta cadastrada
                </h3>

                <p>
                    As tortas aparecerão aqui quando forem cadastradas.
                </p>

            </div>

        `;

        return;

    }


    produtos.forEach(produto => {

        const card =
            document.createElement("article");


        card.className =
            "produto";


        const imagem =
            produto.imagem ||
            "https://via.placeholder.com/600x400?text=Docemania";


        card.innerHTML = `

            <img
                src="${imagem}"
                alt="${produto.nome}"
                onerror="this.src='https://via.placeholder.com/600x400?text=Docemania'"
            >

            <div class="produto-info">

                <span class="product-category">
                    TORTA
                </span>

                <h3>
                    ${produto.nome}
                </h3>

                <p>
                    ${produto.descricao || ""}
                </p>

                <div class="produto-bottom">

                    <strong class="produto-price">
                        ${moeda(produto.preco)}
                    </strong>

                    <button
                        class="choose"
                        type="button"
                    >
                        Escolher
                    </button>

                </div>

            </div>

        `;


        card
            .querySelector(".choose")
            .addEventListener(
                "click",
                () => abrirProduto(produto)
            );


        listaProdutos.appendChild(card);

    });

}


// =====================================================
// ABRIR PRODUTO
// =====================================================

function abrirProduto(produto) {

    produtoSelecionado =
        produto;


    quantidadeAtual =
        1;


    document
        .getElementById("modalImagem")
        .src =
        produto.imagem ||
        "https://via.placeholder.com/600x400?text=Docemania";


    document
        .getElementById("modalNome")
        .textContent =
        produto.nome;


    document
        .getElementById("modalDescricao")
        .textContent =
        produto.descricao || "";


    document
        .getElementById("quantidade")
        .textContent =
        quantidadeAtual;


    document
        .getElementById("observacao")
        .value = "";


    atualizarModalTotal();


    document
        .getElementById("produtoModal")
        .classList
        .remove("hidden");

}


// =====================================================
// FECHAR PRODUTO
// =====================================================

document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("produtoModal")
                .classList
                .add("hidden");

        }
    );


// =====================================================
// QUANTIDADE
// =====================================================

document
    .getElementById("mais")
    .addEventListener(
        "click",
        () => {

            quantidadeAtual++;


            document
                .getElementById("quantidade")
                .textContent =
                quantidadeAtual;


            atualizarModalTotal();

        }
    );


document
    .getElementById("menos")
    .addEventListener(
        "click",
        () => {

            if (quantidadeAtual <= 1) {
                return;
            }


            quantidadeAtual--;


            document
                .getElementById("quantidade")
                .textContent =
                quantidadeAtual;


            atualizarModalTotal();

        }
    );


// =====================================================
// TOTAL DO PRODUTO
// =====================================================

function atualizarModalTotal() {

    if (!produtoSelecionado) {
        return;
    }


    const total =
        Number(produtoSelecionado.preco) *
        quantidadeAtual;


    document
        .getElementById("modalTotal")
        .textContent =
        moeda(total);

}


// =====================================================
// ADICIONAR AO CARRINHO
// =====================================================

document
    .getElementById("adicionarPedido")
    .addEventListener(
        "click",
        () => {

            if (!produtoSelecionado) {
                return;
            }


            const observacao =
                document
                    .getElementById("observacao")
                    .value
                    .trim();


            carrinho.push({

                id:
                    Date.now(),

                produtoId:
                    produtoSelecionado.id,

                nome:
                    produtoSelecionado.nome,

                preco:
                    Number(
                        produtoSelecionado.preco
                    ),

                quantidade:
                    quantidadeAtual,

                observacao:
                    observacao

            });


            salvarCarrinho();

            renderizarCarrinho();


            document
                .getElementById("produtoModal")
                .classList
                .add("hidden");


            abrirCarrinho();

        }
    );


// =====================================================
// CARRINHO
// =====================================================

function salvarCarrinho() {

    localStorage.setItem(
        "docemaniaCarrinho",
        JSON.stringify(carrinho)
    );

}


function carregarCarrinho() {

    const salvo =
        localStorage.getItem(
            "docemaniaCarrinho"
        );


    if (!salvo) {
        return;
    }


    try {

        carrinho =
            JSON.parse(salvo);

    } catch {

        carrinho = [];

    }

}


function abrirCarrinho() {

    cart.classList.add("open");

    overlay.classList.remove("hidden");

}


function fecharCarrinho() {

    cart.classList.remove("open");

    overlay.classList.add("hidden");

}


document
    .getElementById("cartBtn")
    .addEventListener(
        "click",
        abrirCarrinho
    );


document
    .getElementById("closeCart")
    .addEventListener(
        "click",
        fecharCarrinho
    );


overlay.addEventListener(
    "click",
    fecharCarrinho
);


// =====================================================
// RENDERIZAR CARRINHO
// =====================================================

function renderizarCarrinho() {

    cartItems.innerHTML = "";


    let quantidadeTotal = 0;
    let total = 0;


    carrinho.forEach(
        (item, index) => {

            quantidadeTotal +=
                item.quantidade;


            total +=
                item.preco *
                item.quantidade;


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "cart-item";


            div.innerHTML = `

                <div class="cart-item-top">

                    <div>

                        <h3>
                            ${item.nome}
                        </h3>

                        <div class="cart-details">

                            ${
                                item.observacao
                                ? "Obs: " +
                                  item.observacao
                                : "Sem observações"
                            }

                        </div>

                    </div>

                    <strong>
                        ${moeda(
                            item.preco *
                            item.quantidade
                        )}
                    </strong>

                </div>


                <div class="cart-actions">

                    <div class="cart-quantity">

                        <button
                            type="button"
                            data-action="menos"
                            data-index="${index}"
                        >
                            −
                        </button>

                        <strong>
                            ${item.quantidade}
                        </strong>

                        <button
                            type="button"
                            data-action="mais"
                            data-index="${index}"
                        >
                            +
                        </button>

                    </div>


                    <button
                        type="button"
                        class="remove"
                        data-action="remover"
                        data-index="${index}"
                    >
                        Remover
                    </button>

                </div>

            `;


            cartItems.appendChild(div);

        }
    );


    if (carrinho.length === 0) {

        cartItems.innerHTML = `

            <div style="
                text-align:center;
                padding:60px 10px;
                color:#806c74;
            ">

                <div style="
                    font-size:40px;
                    margin-bottom:10px;
                ">
                    🛒
                </div>

                <h3>
                    Seu pedido está vazio
                </h3>

                <p>
                    Escolha uma deliciosa torta.
                </p>

            </div>

        `;

    }


    cartCount.textContent =
        quantidadeTotal;


    cartTotal.textContent =
        moeda(total);


    cartItems
        .querySelectorAll("[data-action]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    const action =
                        button.dataset.action;


                    if (action === "mais") {

                        carrinho[index]
                            .quantidade++;

                    }


                    if (action === "menos") {

                        carrinho[index]
                            .quantidade--;


                        if (
                            carrinho[index]
                                .quantidade <= 0
                        ) {

                            carrinho.splice(
                                index,
                                1
                            );

                        }

                    }


                    if (action === "remover") {

                        carrinho.splice(
                            index,
                            1
                        );

                    }


                    salvarCarrinho();

                    renderizarCarrinho();

                }
            );

        });

}


// =====================================================
// FINALIZAR
// =====================================================

document
    .getElementById("finalizarBtn")
    .addEventListener(
        "click",
        () => {

            if (carrinho.length === 0) {

                alert(
                    "Adicione pelo menos uma torta ao pedido."
                );

                return;

            }


            document
                .getElementById("checkoutModal")
                .classList
                .remove("hidden");


            atualizarCheckoutTotal();

        }
    );


// =====================================================
// FECHAR CHECKOUT
// =====================================================

document
    .getElementById("closeCheckout")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("checkoutModal")
                .classList
                .add("hidden");

        }
    );


// =====================================================
// ENTREGA
// =====================================================

document
    .querySelectorAll(".delivery")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".delivery")
                    .forEach(item =>
                        item.classList.remove(
                            "active"
                        )
                    );


                button.classList.add(
                    "active"
                );


                tipoEntrega =
                    button.dataset.type;


                const enderecoArea =
                    document.getElementById(
                        "enderecoArea"
                    );


                if (
                    tipoEntrega === "entrega"
                ) {

                    enderecoArea
                        .classList
                        .remove("hidden");

                } else {

                    enderecoArea
                        .classList
                        .add("hidden");

                }

            }
        );

    });


// =====================================================
// PAGAMENTO
// =====================================================

document
    .getElementById("pagamento")
    .addEventListener(
        "change",
        () => {

            const pagamento =
                document
                    .getElementById("pagamento")
                    .value;


            const trocoArea =
                document.getElementById(
                    "trocoArea"
                );


            if (
                pagamento === "Dinheiro"
            ) {

                trocoArea
                    .classList
                    .remove("hidden");

            } else {

                trocoArea
                    .classList
                    .add("hidden");

            }

        }
    );


// =====================================================
// TROCO
// =====================================================

document
    .getElementById("valorPago")
    .addEventListener(
        "input",
        calcularTroco
    );


function calcularTroco() {

    const valor =
        Number(
            document
                .getElementById("valorPago")
                .value
        );


    const total =
        calcularTotalCarrinho();


    const texto =
        document.getElementById(
            "trocoTexto"
        );


    if (!valor) {

        texto.textContent =
            "Troco: R$ 0,00";

        texto.style.color =
            "#16a34a";

        return;

    }


    const troco =
        valor - total;


    if (troco < 0) {

        texto.textContent =
            "⚠️ Valor insuficiente.";

        texto.style.color =
            "#dc2626";

        return;

    }


    texto.textContent =
        "Troco: " +
        moeda(troco);


    texto.style.color =
        "#16a34a";

}


// =====================================================
// TOTAL
// =====================================================

function calcularTotalCarrinho() {

    return carrinho.reduce(
        (total, item) => {

            return total +
                item.preco *
                item.quantidade;

        },
        0
    );

}


function atualizarCheckoutTotal() {

    document
        .getElementById("checkoutTotal")
        .textContent =
        moeda(
            calcularTotalCarrinho()
        );

}


// =====================================================
// ENVIAR PEDIDO
// =====================================================

document
    .getElementById("enviarPedido")
    .addEventListener(
        "click",
        enviarPedido
    );


async function enviarPedido() {

    if (carrinho.length === 0) {
        return;
    }


    const nome =
        document
            .getElementById("clienteNome")
            .value
            .trim();


    const pagamento =
        document
            .getElementById("pagamento")
            .value;


    const endereco =
        document
            .getElementById("endereco")
            .value
            .trim();


    if (!nome) {

        alert(
            "Informe seu nome."
        );

        return;

    }


    if (
        tipoEntrega === "entrega" &&
        !endereco
    ) {

        alert(
            "Informe o endereço de entrega."
        );

        return;

    }


    if (!pagamento) {

        alert(
            "Escolha a forma de pagamento."
        );

        return;

    }


    const total =
        calcularTotalCarrinho();


    let valorPago = 0;


    if (
        pagamento === "Dinheiro"
    ) {

        valorPago =
            Number(
                document
                    .getElementById("valorPago")
                    .value
            );


        if (
            !valorPago ||
            valorPago < total
        ) {

            alert(
                "Informe um valor suficiente para o pagamento."
            );

            return;

        }

    }


    const itens =
        carrinho.map(item => ({

            produto_id:
                item.produtoId,

            nome_produto:
                item.nome,

            quantidade:
                item.quantidade,

            preco:
                item.preco

        }));


    try {

        const resposta =
            await fetch(
                "/api/pedidos",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            cliente:
                                nome,

                            telefone:
                                "",

                            endereco:
                                tipoEntrega === "entrega"
                                    ? endereco
                                    : "",

                            tipo_entrega:
                                tipoEntrega,

                            regiao:
                                "",

                            taxa_entrega:
                                0,

                            pagamento:
                                pagamento,

                            troco_para:
                                valorPago,

                            itens:
                                itens

                        })

                }
            );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                "Erro ao registrar pedido"
            );

        }


        let mensagem =
            "🍰 *DOCEMANIA*\\n\\n";


        mensagem +=
            "👤 Cliente: " +
            nome +
            "\\n\\n";


        mensagem +=
            "*PEDIDO:*\\n\\n";


        carrinho.forEach(item => {

            mensagem +=
                "🍰 " +
                item.quantidade +
                "x " +
                item.nome +
                "\\n";


            mensagem +=
                "Valor: " +
                moeda(
                    item.preco *
                    item.quantidade
                ) +
                "\\n";


            if (item.observacao) {

                mensagem +=
                    "📝 " +
                    item.observacao +
                    "\\n";

            }


            mensagem +=
                "\\n";

        });


        mensagem +=
            "💰 *TOTAL: " +
            moeda(total) +
            "*\\n\\n";


        if (
            tipoEntrega === "entrega"
        ) {

            mensagem +=
                "🚚 *ENTREGA*\\n";

            mensagem +=
                "📍 " +
                endereco +
                "\\n\\n";

        } else {

            mensagem +=
                "🛍️ *RETIRADA NA DOCEMANIA*\\n\\n";

        }


        mensagem +=
            "💳 Pagamento: " +
            pagamento +
            "\\n";


        if (
            pagamento === "Dinheiro"
        ) {

            mensagem +=
                "💵 Pagará com: " +
                moeda(valorPago) +
                "\\n";


            mensagem +=
                "💰 Troco: " +
                moeda(
                    valorPago - total
                ) +
                "\\n";

        }


        const telefone =
            "5599988109348";


        const url =
            "https://wa.me/" +
            telefone +
            "?text=" +
            encodeURIComponent(
                mensagem
            );


        carrinho = [];


        salvarCarrinho();

        renderizarCarrinho();


        alert(
            "Pedido registrado com sucesso!"
        );


        window.open(
            url,
            "_blank"
        );


        document
            .getElementById("checkoutModal")
            .classList
            .add("hidden");


    } catch (erro) {

        console.error(erro);


        alert(
            "Não foi possível registrar o pedido."
        );

    }

}


// =====================================================
// LOGIN ADMIN
// =====================================================

document
    .getElementById("adminBtn")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("loginModal")
                .classList
                .remove("hidden");

        }
    );


document
    .getElementById("closeLogin")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("loginModal")
                .classList
                .add("hidden");

        }
    );


// =====================================================
// LOGIN NO SERVIDOR
// =====================================================

document
    .getElementById("loginBtn")
    .addEventListener(
        "click",
        loginAdmin
    );


async function loginAdmin() {

    const usuario =
        document
            .getElementById("adminUser")
            .value
            .trim();


    const senha =
        document
            .getElementById("adminPassword")
            .value;


    if (!usuario || !senha) {

        alert(
            "Informe usuário e senha."
        );

        return;

    }


    try {

        const resposta =
            await fetch(
                "/api/login",
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


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            alert(
                dados.mensagem ||
                "Usuário ou senha incorretos."
            );

            return;

        }


        document
            .getElementById("loginModal")
            .classList
            .add("hidden");


        document
            .getElementById("clienteArea")
            .classList
            .add("hidden");


        document
            .getElementById("adminArea")
            .classList
            .remove("hidden");


        renderizarAdmin();

        carregarDashboard();

        carregarPedidos();

    } catch (erro) {

        console.error(erro);


        alert(
            "Não foi possível conectar ao servidor."
        );

    }

}


// =====================================================
// LOGOUT
// =====================================================

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("adminArea")
                .classList
                .add("hidden");


            document
                .getElementById("clienteArea")
                .classList
                .remove("hidden");

        }
    );


// =====================================================
// ADMIN - PRODUTOS
// =====================================================

function renderizarAdmin() {

    const container =
        document.getElementById(
            "adminProducts"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    document
        .getElementById(
            "adminTotalProdutos"
        )
        .textContent =
        produtos.length;


    produtos.forEach(produto => {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "admin-product";


        const imagem =
            produto.imagem ||
            "https://via.placeholder.com/600x400?text=Docemania";


        div.innerHTML = `

            <img
                src="${imagem}"
                alt="${produto.nome}"
                onerror="this.src='https://via.placeholder.com/600x400?text=Docemania'"
            >

            <div class="admin-product-info">

                <h3>
                    ${produto.nome}
                </h3>

                <p>
                    ${moeda(produto.preco)}
                </p>

                <div class="admin-product-actions">

                    <button
                        class="edit"
                        type="button"
                    >
                        Editar
                    </button>

                    <button
                        class="delete"
                        type="button"
                    >
                        Excluir
                    </button>

                </div>

            </div>

        `;


        div
            .querySelector(".edit")
            .addEventListener(
                "click",
                () => abrirEdicao(produto)
            );


        div
            .querySelector(".delete")
            .addEventListener(
                "click",
                () => excluirProduto(produto.id)
            );


        container.appendChild(div);

    });

}


// =====================================================
// DASHBOARD
// =====================================================

async function carregarDashboard() {

    try {

        const resposta =
            await fetch(
                "/api/dashboard"
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao buscar dashboard"
            );

        }


        const dados =
            await resposta.json();


        document
            .getElementById("vendasHoje")
            .textContent =
            moeda(
                dados.vendasHoje
            );


        document
            .getElementById("vendasMes")
            .textContent =
            moeda(
                dados.vendasMes
            );


        document
            .getElementById("pedidosHoje")
            .textContent =
            dados.pedidosHoje;


        document
            .getElementById("tortasVendidas")
            .textContent =
            dados.tortasHoje;


    } catch (erro) {

        console.error(
            "Erro no dashboard:",
            erro
        );

    }

}


// =====================================================
// ATUALIZAR DASHBOARD
// =====================================================

document
    .getElementById(
        "atualizarDashboard"
    )
    .addEventListener(
        "click",
        async () => {

            const botao =
                document.getElementById(
                    "atualizarDashboard"
                );


            const textoOriginal =
                botao.textContent;


            botao.textContent =
                "⏳ Atualizando...";


            await carregarDashboard();


            botao.textContent =
                textoOriginal;

        }
    );


// =====================================================
// PEDIDOS
// =====================================================

async function carregarPedidos() {

    const container =
        document.getElementById(
            "listaPedidos"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="empty-orders">

            <div class="empty-orders-icon">
                ⏳
            </div>

            <h3>
                Carregando pedidos...
            </h3>

        </div>

    `;


    try {

        const resposta =
            await fetch(
                "/api/pedidos"
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao buscar pedidos"
            );

        }


        const pedidos =
            await resposta.json();


        renderizarPedidos(pedidos);


    } catch (erro) {

        console.error(
            "Erro ao carregar pedidos:",
            erro
        );


        container.innerHTML = `

            <div class="empty-orders">

                <div class="empty-orders-icon">
                    ⚠️
                </div>

                <h3>
                    Não foi possível carregar os pedidos.
                </h3>

                <p>
                    Verifique se o servidor está funcionando.
                </p>

            </div>

        `;

    }

}


// =====================================================
// FORMATAR DATA
// =====================================================

function formatarData(data) {

    if (!data) {
        return "";
    }


    const dataConvertida =
        new Date(
            data.replace(" ", "T") + "Z"
        );


    if (
        Number.isNaN(
            dataConvertida.getTime()
        )
    ) {

        return data;

    }


    return dataConvertida.toLocaleString(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


// =====================================================
// STATUS
// =====================================================

function nomeStatus(status) {

    const nomes = {

        novo:
            "🆕 Novo",

        preparando:
            "👨‍🍳 Em preparo",

        pronto:
            "✅ Pronto",

        concluido:
            "🎉 Concluído",

        cancelado:
            "❌ Cancelado"

    };


    return nomes[status] ||
        status ||
        "Novo";

}


// =====================================================
// RENDERIZAR PEDIDOS
// =====================================================

function renderizarPedidos(pedidos) {

    const container =
        document.getElementById(
            "listaPedidos"
        );


    container.innerHTML = "";


    if (!pedidos.length) {

        container.innerHTML = `

            <div class="empty-orders">

                <div class="empty-orders-icon">
                    📦
                </div>

                <h3>
                    Nenhum pedido recebido
                </h3>

                <p>
                    Os pedidos dos clientes aparecerão aqui.
                </p>

            </div>

        `;

        return;

    }


    pedidos.forEach(pedido => {

        const card =
            document.createElement(
                "article"
            );


        card.className =
            "order-card";


        const tipoEntrega =
            pedido.tipo_entrega === "entrega"
                ? "🚚 Entrega"
                : "🛍️ Retirada";


        let itensHTML = "";


        if (
            pedido.itens &&
            pedido.itens.length
        ) {

            pedido.itens.forEach(item => {

                const subtotalItem =
                    Number(item.preco) *
                    Number(item.quantidade);


                itensHTML += `

                    <div class="order-item">

                        <div>

                            <strong>
                                ${item.quantidade}x
                                ${item.nome_produto}
                            </strong>

                        </div>

                        <strong>
                            ${moeda(subtotalItem)}
                        </strong>

                    </div>

                `;

            });

        } else {

            itensHTML = `

                <div class="order-item">

                    <span>
                        Nenhum item encontrado.
                    </span>

                </div>

            `;

        }


        let enderecoHTML = "";


        if (
            pedido.tipo_entrega ===
            "entrega"
        ) {

            enderecoHTML = `

                <div class="order-address">

                    📍

                    <strong>
                        Endereço:
                    </strong>

                    ${pedido.endereco || "Não informado"}

                </div>

            `;

        }


        let trocoHTML = "";


        if (
            pedido.pagamento ===
            "Dinheiro" &&
            Number(pedido.troco_para) > 0
        ) {

            const troco =
                Number(pedido.troco_para) -
                Number(pedido.total);


            trocoHTML = `

                <br>

                <small>
                    Troco para:
                    ${moeda(pedido.troco_para)}
                    |
                    Troco:
                    ${moeda(troco)}
                </small>

            `;

        }


        card.innerHTML = `

            <div class="order-top">

                <div>

                    <span class="order-number">
                        PEDIDO #${pedido.id}
                    </span>

                    <h3>
                        ${pedido.cliente}
                    </h3>

                    <div class="order-date">
                        ${formatarData(
                            pedido.criado_em
                        )}
                    </div>

                </div>


                <select
                    class="order-status"
                    data-id="${pedido.id}"
                >

                    <option
                        value="novo"
                        ${pedido.status === "novo" ? "selected" : ""}
                    >
                        🆕 Novo
                    </option>

                    <option
                        value="preparando"
                        ${pedido.status === "preparando" ? "selected" : ""}
                    >
                        👨‍🍳 Em preparo
                    </option>

                    <option
                        value="pronto"
                        ${pedido.status === "pronto" ? "selected" : ""}
                    >
                        ✅ Pronto
                    </option>

                    <option
                        value="concluido"
                        ${pedido.status === "concluido" ? "selected" : ""}
                    >
                        🎉 Concluído
                    </option>

                    <option
                        value="cancelado"
                        ${pedido.status === "cancelado" ? "selected" : ""}
                    >
                        ❌ Cancelado
                    </option>

                </select>

            </div>


            <div class="order-info">


                <div class="order-info-box">

                    <small>
                        Recebimento
                    </small>

                    <strong>
                        ${tipoEntrega}
                    </strong>

                </div>


                <div class="order-info-box">

                    <small>
                        Pagamento
                    </small>

                    <strong>
                        ${pedido.pagamento || "Não informado"}
                    </strong>

                    ${trocoHTML}

                </div>


                <div class="order-info-box">

                    <small>
                        Região
                    </small>

                    <strong>
                        ${pedido.regiao || "Não informada"}
                    </strong>

                </div>


            </div>


            <div class="order-items">

                <div class="order-items-title">
                    🛒 Itens do pedido
                </div>

                ${itensHTML}

            </div>


            ${enderecoHTML}


            <div class="order-bottom">

                <div>

                    <div class="order-payment">
                        Subtotal:
                        ${moeda(pedido.subtotal)}

                        ${
                            Number(pedido.taxa_entrega) > 0
                            ? " | Entrega: " +
                              moeda(pedido.taxa_entrega)
                            : ""
                        }
                    </div>

                </div>


                <strong class="order-total">
                    ${moeda(pedido.total)}
                </strong>

            </div>

        `;


        const statusSelect =
            card.querySelector(
                ".order-status"
            );


        statusSelect.addEventListener(
            "change",
            () => {

                alterarStatusPedido(
                    pedido.id,
                    statusSelect.value
                );

            }
        );


        container.appendChild(card);

    });

}


// =====================================================
// ALTERAR STATUS DO PEDIDO
// =====================================================

async function alterarStatusPedido(
    id,
    status
) {

    try {

        const resposta =
            await fetch(
                "/api/pedidos/" +
                id +
                "/status",
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status
                        })

                }
            );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                "Erro ao alterar status"
            );

        }


        await carregarDashboard();

        await carregarPedidos();


    } catch (erro) {

        console.error(
            erro
        );


        alert(
            "Não foi possível alterar o status do pedido."
        );


        await carregarPedidos();

    }

}


// =====================================================
// ATUALIZAR PEDIDOS
// =====================================================

document
    .getElementById(
        "atualizarPedidos"
    )
    .addEventListener(
        "click",
        async () => {

            const botao =
                document.getElementById(
                    "atualizarPedidos"
                );


            const textoOriginal =
                botao.textContent;


            botao.textContent =
                "⏳ Carregando...";


            await carregarPedidos();

            await carregarDashboard();


            botao.textContent =
                textoOriginal;

        }
    );


// =====================================================
// UPLOAD
// =====================================================

const productImageFile =
    document.getElementById(
        "productImageFile"
    );


const imagePreview =
    document.getElementById(
        "imagePreview"
    );


const imagePreviewContainer =
    document.getElementById(
        "imagePreviewContainer"
    );


const removeImage =
    document.getElementById(
        "removeImage"
    );


// =====================================================
// ESCOLHER IMAGEM
// =====================================================

productImageFile.addEventListener(
    "change",
    function () {

        const arquivo =
            this.files[0];


        if (!arquivo) {
            return;
        }


        if (
            !arquivo.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "Escolha uma imagem válida."
            );


            this.value = "";


            return;

        }


        if (
            arquivo.size >
            3 * 1024 * 1024
        ) {

            alert(
                "A imagem deve ter no máximo 3 MB."
            );


            this.value = "";


            return;

        }


        imagemSelecionada =
            arquivo;


        const leitor =
            new FileReader();


        leitor.onload =
            function(evento) {

                imagePreview.src =
                    evento.target.result;


                imagePreviewContainer
                    .classList
                    .remove(
                        "hidden"
                    );

            };


        leitor.readAsDataURL(
            arquivo
        );

    }
);


// =====================================================
// REMOVER IMAGEM
// =====================================================

removeImage.addEventListener(
    "click",
    () => {

        imagemSelecionada =
            null;


        productImageFile.value =
            "";


        imagePreview.src =
            "";


        imagePreviewContainer
            .classList
            .add(
                "hidden"
            );

    }
);


// =====================================================
// NOVA TORTA
// =====================================================

document
    .getElementById(
        "addProductBtn"
    )
    .addEventListener(
        "click",
        () => {

            produtoEditando =
                null;


            imagemSelecionada =
                null;


            document
                .getElementById(
                    "adminProductTitle"
                )
                .textContent =
                "Nova torta";


            document
                .getElementById(
                    "productName"
                )
                .value =
                "";


            document
                .getElementById(
                    "productPrice"
                )
                .value =
                "";


            document
                .getElementById(
                    "productDescription"
                )
                .value =
                "";


            productImageFile.value =
                "";


            imagePreview.src =
                "";


            imagePreviewContainer
                .classList
                .add(
                    "hidden"
                );


            document
                .getElementById(
                    "adminProductModal"
                )
                .classList
                .remove(
                    "hidden"
                );

        }
    );


// =====================================================
// EDITAR
// =====================================================

function abrirEdicao(produto) {

    produtoEditando =
        produto;


    document
        .getElementById(
            "adminProductTitle"
        )
        .textContent =
        "Editar torta";


    document
        .getElementById(
            "productName"
        )
        .value =
        produto.nome;


    document
        .getElementById(
            "productPrice"
        )
        .value =
        produto.preco;


    document
        .getElementById(
            "productDescription"
        )
        .value =
        produto.descricao || "";


    imagemSelecionada =
        null;


    productImageFile.value =
        "";


    if (produto.imagem) {

        imagePreview.src =
            produto.imagem;


        imagePreviewContainer
            .classList
            .remove(
                "hidden"
            );

    } else {

        imagePreview.src =
            "";


        imagePreviewContainer
            .classList
            .add(
                "hidden"
            );

    }


    document
        .getElementById(
            "adminProductModal"
        )
        .classList
        .remove(
            "hidden"
        );

}


// =====================================================
// SALVAR PRODUTO
// =====================================================

document
    .getElementById(
        "saveProduct"
    )
    .addEventListener(
        "click",
        salvarProduto
    );


async function salvarProduto() {

    const nome =
        document
            .getElementById(
                "productName"
            )
            .value
            .trim();


    const preco =
        Number(
            document
                .getElementById(
                    "productPrice"
                )
                .value
        );


    const descricao =
        document
            .getElementById(
                "productDescription"
            )
            .value
            .trim();


    if (!nome) {

        alert(
            "Informe o nome da torta."
        );


        return;

    }


    if (
        !preco ||
        preco <= 0
    ) {

        alert(
            "Informe um preço válido."
        );


        return;

    }


    if (!descricao) {

        alert(
            "Informe a descrição."
        );


        return;

    }


    if (
        !produtoEditando &&
        !imagemSelecionada
    ) {

        alert(
            "Escolha uma imagem."
        );


        return;

    }


    try {

        const dados =
            new FormData();


        dados.append(
            "nome",
            nome
        );


        dados.append(
            "preco",
            preco
        );


        dados.append(
            "descricao",
            descricao
        );


        if (
            imagemSelecionada
            instanceof File
        ) {

            dados.append(
                "imagem",
                imagemSelecionada
            );

        }


        let resposta;


        if (produtoEditando) {

            resposta =
                await fetch(
                    "/api/produtos/" +
                    produtoEditando.id,
                    {

                        method: "PUT",

                        body: dados

                    }
                );

        } else {

            resposta =
                await fetch(
                    "/api/produtos",
                    {

                        method: "POST",

                        body: dados

                    }
                );

        }


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.erro ||
                "Erro ao salvar produto"
            );

        }


        alert(
            produtoEditando
                ? "Produto atualizado!"
                : "Produto cadastrado!"
        );


        document
            .getElementById(
                "adminProductModal"
            )
            .classList
            .add(
                "hidden"
            );


        produtoEditando =
            null;


        imagemSelecionada =
            null;


        await carregarProdutos();


    } catch (erro) {

        console.error(
            erro
        );


        alert(
            "Não foi possível salvar o produto."
        );

    }

}


// =====================================================
// EXCLUIR
// =====================================================

async function excluirProduto(id) {

    const confirmar =
        confirm(
            "Deseja realmente excluir esta torta?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                "/api/produtos/" +
                id,
                {

                    method:
                        "DELETE"

                }
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao excluir"
            );

        }


        await carregarProdutos();


    } catch (erro) {

        console.error(
            erro
        );


        alert(
            "Não foi possível excluir o produto."
        );

    }

}


// =====================================================
// FECHAR MODAL ADMIN
// =====================================================

document
    .getElementById(
        "closeAdminProduct"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "adminProductModal"
                )
                .classList
                .add(
                    "hidden"
                );

        }
    );


// =====================================================
// INICIAR
// =====================================================

carregarCarrinho();

renderizarCarrinho();

carregarProdutos();