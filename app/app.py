# -----------------------------------------------------------------------
# Desafio Marketplace
# -----------------------------------------------------------------------

import json
import requests
from random import random
from sqlalchemy.orm import sessionmaker
from flask import Flask, redirect, url_for, request, render_template, jsonify
from app.banco import engine, Produto, Pedido

# -----------------------------------------------------------------------

app = Flask(__name__)
app.secret_key = '95959595'
TOKEN = 'ERMBFUWIQA1ZJQNR2XXVJRTBUMIL5EDD'
KEY = 'AH2WXPKKQ5TVPGO0CZTRHNGLLWSYSK1ZACLSMKLW'
HASH = 'Basic RVJNQkZVV0lRQTFaSlFOUjJYWFZKUlRCVU1JTDVFREQ6QUgyV1hQS0tRNVRWUEdPMENaVFJITkdMTFdTWVNLMVpBQ0xTTUtMVw=='
Session = sessionmaker(bind=engine)
session = Session()

# -----------------------------------------------------------------------

def pradicio(jsontext): return json.loads(jsontext)
def prajson(dicio): return json.dumps(dicio, indent=4)

# -----------------------------------------------------------------------

@app.route('/')
def home():
    return redirect(url_for('catalogo'))

# -----------------------------------------------------------------------

@app.route('/catalogo/')
def catalogo():
    return render_template('catalogo.html')

# -----------------------------------------------------------------------

@app.route('/minhascompras/', methods=['GET'])
def minhas_compras():
    try:
        orderId = request.args.get('orderId')
        order = requests.get(
            f'https://sandbox.moip.com.br/v2/orders/{orderId}', auth=(TOKEN, KEY)).json()

        pedidos = session.query(Pedido).all()
        for i in range(len(pedidos)):
            if pedidos[i].id == orderId:
                pedidos[i].dadosjson = prajson(order)
                session.commit()
    except Exception as e:
        print(e.args)
    finally:
        return render_template('minhas-compras.html')

# -----------------------------------------------------------------------

@app.route('/produtos/', methods=['GET'])
def info_produtos():
    produtos = []
    prods = session.query(Produto).all()
    for prod in prods:
        produtos.append(pradicio(prod.dadosjson))

    return app.make_response((prajson(produtos), 200, {'Content-Type': 'application/json'}))

# -----------------------------------------------------------------------

@app.route('/cliente/', methods=['GET'])
def info_cliente():
    cliente = requests.get(
        'https://sandbox.moip.com.br/v2/customers/CUS-AR5FQPO72V0V', auth=(TOKEN, KEY)).json()
    return app.make_response((cliente, 200, {'Content-Type': 'application/json'}))

# -----------------------------------------------------------------------

@app.route('/pedidos/', methods=['GET'])
def info_pedidos():
    pedidos = []
    peds = session.query(Pedido).all()
    for ped in peds:
        pedidos.append(pradicio(ped.dadosjson))

    return app.make_response((jsonify(pedidos), 200, {'Content-Type': 'application/json'}))

# -----------------------------------------------------------------------

@app.route('/compras/', methods=['GET'])
def info_compras():
    entradas = []
    pedidos = []
    peds = session.query(Pedido).all()
    for ped in peds:
        entradas.append(pradicio(ped.dadosjson))

    def formatar_status_pedido(status):
        traducao = {
            'CREATED': 'Criado',
            'WAITING': 'Aguardando Pagamento',
            'PAID': 'Pago',
            'NOT_PAID': 'Cancelado',
            'REVERTED': 'Revertido'
        }
        return traducao[status]

    def formatar_status_pagamento(status):
        traducao = {
            'CREATED': 'Criado',
            'WAITING': 'Aguardando',
            'IN_ANALYSIS': 'Em Análise',
            'PRE_AUTHORIZED': 'Pré-autorizado',
            'AUTHORIZED': 'Autorizado',
            'CANCELLED': 'Cancelado',
            'REFUNDED': 'Reembolsado',
            'REVERSED': 'Estornado',
            'SETTLED': 'Concluído',
            '-': 'Não Iniciado'
        }
        return traducao[status]

    def formatar_data(data):
        dia, mes, ano = data[-2:], data[5:7], data[:4]
        return f'{dia}/{mes}/{ano}'

    def formatar_endereco(data):
        return data['street'] + ', ' + data['streetNumber'] + ' - ' + data['district'] + ', ' + data['city'] + ' - ' + data['state'] + ', ' + data['zipCode'][:-3] + '-' + data['zipCode'][-3:]

    def formatar_pagamento(metodo, parcelas):
        if metodo == 'CREDIT_CARD':
            if parcelas > 1:
                return f'Cartão de Crédito ({parcelas}×)'
            else:
                return f'Cartão de Crétido (à vista)'
        elif metodo == 'BOLETO':
            return 'Boleto'
        elif metodo == 'ONLINE_BANK_DEBIT':
            return 'Débito Online'
        else:
            return '-'

    for i, entrada in enumerate(entradas):
        if not entrada['payments']:
            entrada['payments'] = [{
                'status': '-',
                'fundingInstrument': {'method': '-'},
                'installmentCount': '-'
            }]

        pedido = {
            'num': i+1,
            'orderId': entrada['id'],
            'orderStatus': formatar_status_pedido(entrada['status']),
            'paymentStatus': formatar_status_pagamento(entrada['payments'][0]['status']),
            'date': formatar_data(entrada['createdAt'][:10]),
            'adress': formatar_endereco(entrada['customer']['shippingAddress']),
            'total': entrada['amount']['total'],
            'paymentMethod': formatar_pagamento(entrada['payments'][0]['fundingInstrument']['method'], entrada['payments'][0]['installmentCount']),
            'items': entrada['items']
        }
        pedidos.append(pedido)

    return app.make_response((prajson(pedidos[::-1]), 200, {'Content-Type': 'application/json'}))

# -----------------------------------------------------------------------

@app.route('/fazerpedido/', methods=['POST'])
def fazer_pedido():
    # Processa pedido
    pedido = request.get_json()
    pedido['ownId'] = pedido['customer']['id'][4:] + '_' + str(random())

    # Cria pedido formal no Moip
    headers = {
        'Content-Type': 'application/json',
        'Authorization': HASH
    }
    r = requests.post('https://sandbox.moip.com.br/v2/orders/',
                      data=prajson(pedido), headers=headers)
    pedido = r.json()
    session.add(Pedido(id=pedido['id'], dadosjson=prajson(pedido)))

    # Cria resposta
    return pedido['_links']['checkout']['payCheckout']['redirectHref']

# -----------------------------------------------------------------------

@app.route('/atualizarstatus/', methods=['POST'])
def atualizar_status():
    resource = request.get_json()['resource']
    
    # Obtém ID do Pedido
    if 'order' in resource:
        orderId = resource['order']['id']
        print(f'Atualização de status de pedido, do pedido {orderId}')
    elif 'payment' in resource:
        orderId = resource['payment']['_links']['order']['title']
        print(f'Atualização de status de pagamento, do pedido {orderId}')
    
    # Busca a versão atualizada
    order = requests.get(f'https://sandbox.moip.com.br/v2/orders/{orderId}', auth=(TOKEN, KEY))
    if order.status_code >= 400:
        return app.make_response(('Falha de Obtenção do Pedido', order.status_code))
    order = order.json()

    # Atualiza o banco de dados
    pedidos = session.query(Pedido).all()
    for i, pedido in enumerate(pedidos):
        if pedido.id == orderId:
            pedidos[i].dadosjson = prajson(order)
            print(f'Pedido {orderId} atualizado no banco de dados')
            session.commit()
    
    return app.make_response(('Ok', 200))

# -----------------------------------------------------------------------

if __name__ == '__main__':
    '''
    from livereload import Server
    app.jinja_env.auto_reload = False
    app.config['TEMPLATES_AUTO_RELOAD'] = False
    server = Server(app.wsgi_app)
    server.serve(host='localhost', port=5000)
    '''
    app.run(host='localhost', port=5000)

# -----------------------------------------------------------------------
