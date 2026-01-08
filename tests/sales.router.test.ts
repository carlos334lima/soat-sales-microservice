import request from 'supertest'
import { app } from '../src/server'
import axios from 'axios'

jest.mock('@prisma/client', () => {
  const sale = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn()
  }
  return {
    PrismaClient: jest.fn(() => ({ sale })),
    SaleStatus: {
      PENDING_PAYMENT: 'PENDING_PAYMENT',
      PAID: 'PAID',
      CANCELED: 'CANCELED'
    }
  }
})

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedPrisma = new (jest.requireMock('@prisma/client').PrismaClient as any)()

describe('Sales routes', () => {
  beforeEach(() => {
    process.env.INVENTORY_BASE_URL = 'http://inventory'
    jest.clearAllMocks()
  })

  it('retorna 400 para payload inválido na criação de venda', async () => {
    const response = await request(app).post('/sales').send({})
    expect(response.status).toBe(400)
  })

  it('cria venda com sucesso quando veículo está disponível', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        id: 'v1',
        brand: 'Ford',
        model: 'Fiesta',
        color: 'Preto',
        price: 50000,
        status: 'AVAILABLE'
      }
    } as any)

    mockedPrisma.sale.create.mockResolvedValueOnce({
      id: 's1',
      vehicleId: 'v1'
    })

    const response = await request(app).post('/sales').send({
      vehicleId: 'v1',
      cpfBuyer: '12345678901'
    })

    expect(response.status).toBe(201)
    expect(mockedPrisma.sale.create).toHaveBeenCalled()
  })

  it('recusa venda se veículo não está disponível', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { id: 'v1', status: 'SOLD', price: 50000 }
    } as any)

    const response = await request(app).post('/sales').send({
      vehicleId: 'v1',
      cpfBuyer: '12345678901'
    })

    expect(response.status).toBe(409)
  })

  it('processa webhook de pagamento pago e atualiza veículo', async () => {
    mockedPrisma.sale.findUnique.mockResolvedValueOnce({
      paymentCode: 'pay1',
      vehicleId: 'v1'
    })
    mockedPrisma.sale.update.mockResolvedValueOnce({
      paymentCode: 'pay1',
      status: 'PAID'
    })

    const response = await request(app)
      .post('/sales/payments/webhook')
      .send({ paymentCode: 'pay1', status: 'PAID' })

    expect(response.status).toBe(200)
    expect(mockedPrisma.sale.update).toHaveBeenCalled()
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://inventory/vehicles/v1/status',
      { status: 'SOLD' }
    )
  })

  it('lista veículos vendidos ordenados por preço', async () => {
    mockedPrisma.sale.findMany.mockResolvedValueOnce([
      { id: '1', price: 10000 },
      { id: '2', price: 20000 }
    ])

    const response = await request(app).get('/sales/sold-vehicles')

    expect(response.status).toBe(200)
    expect(mockedPrisma.sale.findMany).toHaveBeenCalled()
    expect(response.body[0].price).toBe(10000)
  })
})


