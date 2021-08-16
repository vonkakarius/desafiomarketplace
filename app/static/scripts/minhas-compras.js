(async () => {

// Banco de Dados
var response = await fetch("/cliente").catch(erro => console.log(erro))
var cliente = await response.json()

var response = await fetch("/produtos")
var produtos = await response.json()

var response = await fetch("/compras")
var compras = await response.json()

// Formatador de Moeda
function rs(quantia) {
    return (quantia/100).toLocaleString('pt-br', {
      style: "currency",
      currency: "BRL"
    })
  }

// Exibição de cada pedido

function criarCaixaPedido(pedido) {
    let local = document.querySelector(".conteudo")
    let caixa = document.createElement("div")
    caixa.className = "compra caixa"
    caixa.innerHTML = `
        <h2 class="cabecalho-pedido">Pedido ${pedido.num}</h2>
        <h3 class="pedido-info">#${pedido.orderId}</h2>
        <div class="pedido-corpo">
        <div class="pedido-corpo-detalhes">
            <div class="pedido-detalhe">
            <p class="detalhe-titulo">Data</p>
            <p>${pedido.date}</p>
            </div>
            <div class="pedido-detalhe">
            <p class="detalhe-titulo">Status do Pedido</p>
            <p>${pedido.orderStatus}</p>
            </div>
            <div class="pedido-detalhe">
            <p class="detalhe-titulo">Status do Pagamento</p>
            <p>${pedido.paymentStatus}</p>
            </div>
            <div class="pedido-detalhe">
            <p class="detalhe-titulo">Endereço</p>
            <p>${pedido.adress}</p>
            </div>
            <div class="pedido-detalhe">
            <p class="detalhe-titulo">Forma de Pagamento</p>
            <p>${pedido.paymentMethod}</p>
            </div>
        </div>
        <div class="pedido-corpo-listagem">
            <div class="lista-itens">
            </div>
            <div class="resumo-pedido">
            <p>Total: ${rs(pedido.total)}</p>
            </div>
        </div>
    `

    pedido.items.forEach(item => {
        let compraItem = document.createElement("div")
        compraItem.className = "compra-item caixa"
        produtos.forEach(produto => {
            if (produto.sku == item.product)
                item.photo = produto.foto
        })
        compraItem.innerHTML = `
            <img class="prodimg" src="${item.photo}" />
            <div class="compra-item-info">
            <p class="compra-item-nome">${item.detail}</p>
            <p class="valor">
                <span class="compra-item-qtd">${item.quantity}</span> ×
                <span class="compra-item-valor">${item.price}</span> =
                <span class="compra-item-valortotal">${rs(item.quantity * item.price)}<span>
            </p>
            </div>
        `

        caixa.querySelector(".lista-itens").appendChild(compraItem)
    });

    local.appendChild(caixa)
}

compras.forEach(compra => {
    criarCaixaPedido(compra)
})

})()