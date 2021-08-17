(async () => {
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  VARIÁVEIS GLOBAIS
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

let listaCarrinho = []
let modal = document.querySelector(".apagao")

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  CARREGAMENTO DO BANCO DE DADOS
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// Produtos
var response = await fetch("/produtos")
let produtos = await response.json()

// Cliente
var response = await fetch("/cliente").catch(erro => console.log(erro))
let cliente = await response.json()

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  UTILITÁRIOS
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function rs(quantia) {
  return (quantia/100).toLocaleString('pt-br', {
    style: "currency",
    currency: "BRL"
  })
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  FUNÇÕES DE CONTADOR
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function aumentarContador(event) {
  event.target.parentElement.querySelector(".qtd").value++
}

function diminuirContador(event) {
  if (event.target.parentElement.querySelector(".qtd").value > 0)
    event.target.parentElement.querySelector(".qtd").value--
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  ATUALIZAÇÃO DO CARRINHO
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function atualizarCarrinho() {
  // Limpa
  document.querySelector(".compras").innerHTML = ""

  // Reescreve
  let total = 0
  listaCarrinho.forEach((produto) => {
    total += produto.qtd * produto.preco
    let item = document.createElement("div")
    item.className = "compra-item"
    item.innerHTML = `
      <img src="${produto.foto}">
      <div class="compra-item-info">
        <p class="compra-item-nome">${produto.nome}</p>
        <p class="valor">
          <span class="compra-item-qtd">${produto.qtd}</span> × <span class="compra-item-valor">${rs(produto.preco)}</span> = <span class="compra-item-valortotal">${rs(produto.qtd * produto.preco)}</span>
        </p>
      </div>
    `

    document.querySelector(".compras").appendChild(item)
  })
  document.querySelector(".compra-valortotal").textContent = rs(total)
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  ATUALIZAÇÃO DE QUANTITATIVO
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function atualizarItens(event) {
  let caixa = event.target.parentElement.parentElement
  let nome = caixa.querySelector(".prodnome").textContent
  let input = caixa.querySelector(".qtd")
  let qtd = Number(input.value)

  // Filtro de valores
  if (qtd < 0) input.value = 0
  qtd = Number(input.value)
  input.value = qtd

  // Atualiza quantidade
  let atualizou = 0
  listaCarrinho.forEach((produto) => {
    if (produto.nome == nome) {
      produto.qtd = qtd
      atualizou = 1
      listaCarrinho = listaCarrinho.filter(produto => produto.qtd > 0)
    }
  })
  if (atualizou == 0) {
    if (qtd > 0) {
      let produto = {}
      produtos.forEach(prod => {
        if (prod.nome == nome)
          produto = prod
      })
      produto.qtd = qtd
      listaCarrinho.push(produto)
    }
  }

  // Atualiza o carrinho
  atualizarCarrinho()
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  FAZER PERDIDO
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

async function fazerPedido() {
  // Inicia pedido Moip
  let pedido = {
    "amount": {
      "currency": "BRL"
    },
    "items": [],
    "checkoutPreferences": {
      "redirectUrls": {
        "urlSuccess": 'https://desafiomarketplace.herokuapp.com/minhascompras',
        "urlFailure": 'https://desafiomarketplace.herokuapp.com/minhascompras'
      }
    },
    "customer": {
      "id": cliente.id
    }
  }

  listaCarrinho.forEach(produto => {
    // Adiciona pedido
    const item_pedido = {
      "product": produto.sku,
      "detail": produto.nome,
      "quantity": produto.qtd,
      "price": produto.preco
    }
    pedido.items.push(item_pedido)
  })

  // Passa pro backend
  var response = await fetch("/fazerpedido", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pedido),
  })
  window.location.href = await response.text()
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// MUDANÇA DE JANELA
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function abrirBox() {
  modal.style.display = "block"
}

function fecharBox() {
  modal.style.display = "none"
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  CARREGAMENTO INICIAL
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const nome = cliente.fullname.split(" ")[0]
document.querySelector(".mensagem-carrinho-vazio").innerHTML = `
Olá, ${nome}!<br>Os itens que você adicionar aparecerão aqui.
`

produtos.forEach((produto) => {
  let caixa = document.createElement("div")
  caixa.className = "caixa"
  caixa.innerHTML = `
  <img
    src="${produto.foto}"
    alt="${produto.nome}"
    class="prodimg"
  />
  <p class="prodnome">${produto.nome}</p>
  <p class="preco">${rs(produto.preco)}</p>
  <p class="vendedor">Por <span class="vendnome">${produto.vendedor}</span></p>
  <div class="contador">
    <button class="botao botao_cont botao_menos">–</button>
    <input class="qtd" type="number" value="0" />
    <button class="botao botao_cont botao_mais">+</button>
  </div>
`
  document.querySelector(".produtos").appendChild(caixa)
})

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  ATRIBUIÇÃO DE FUNÇÕES
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// Inicia na página inicial
window.onclick = function(event) {
  if (event.target == modal) {
    fecharBox()
  }
}

// Abrir modal
document
  .querySelector(".botao-pedido")
  .addEventListener("click", abrirBox)

// Fazer POST de pedido
document
  .querySelector(".botao-compra")
  .addEventListener("click", fazerPedido)

// Aumentar contadores
let botoes_mais = document.querySelectorAll(".botao_mais")
botoes_mais.forEach((botao) => {
  botao.addEventListener("click", aumentarContador)
  botao.addEventListener("click", atualizarItens)
  botao.addEventListener("click", atualizarCarrinho)
})

// Diminuir contadores
let botoes_menos = document.querySelectorAll(".botao_menos")
botoes_menos.forEach((botao) => {
  botao.addEventListener("click", diminuirContador)
  botao.addEventListener("click", atualizarItens)
  botao.addEventListener("click", atualizarCarrinho)
})

// Filtro de campos
let inputs = document.querySelectorAll(".qtd")
inputs.forEach((input) => {
  input.addEventListener("focusout", atualizarItens)
  input.addEventListener("focusout", atualizarCarrinho)
})

})()
