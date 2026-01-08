export const salesOpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Serviço de Vendas de Veículos',
    version: '1.0.0'
  },
  servers: [
    {
      url: 'http://localhost:3002'
    }
  ],
  paths: {
    '/sales/available-vehicles': {
      get: {
        summary: 'Listar veículos disponíveis para venda',
        responses: {
          '200': { description: 'Lista de veículos disponíveis' },
          '500': { description: 'Configuração de inventário ausente' }
        }
      }
    },
    '/sales/sold-vehicles': {
      get: {
        summary: 'Listar veículos vendidos',
        responses: {
          '200': { description: 'Lista de veículos vendidos' }
        }
      }
    },
    '/sales': {
      post: {
        summary: 'Criar venda de veículo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  vehicleId: { type: 'string' },
                  cpfBuyer: { type: 'string' }
                },
                required: ['vehicleId', 'cpfBuyer']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Venda criada' },
          '400': { description: 'Payload inválido' },
          '409': { description: 'Veículo indisponível para venda' },
          '500': { description: 'Configuração de inventário ausente' }
        }
      }
    },
    '/sales/payments/webhook': {
      post: {
        summary: 'Webhook de pagamento',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  paymentCode: { type: 'string' },
                  status: { type: 'string', enum: ['PAID', 'CANCELED'] }
                },
                required: ['paymentCode', 'status']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Pagamento processado' },
          '400': { description: 'Payload inválido' },
          '404': { description: 'Venda não encontrada' }
        }
      }
    }
  }
}

