import { Router } from 'express'
import { z } from 'zod'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()
export const salesRouter = Router()

const createSaleSchema = z.object({
  vehicleId: z.string().min(1),
  cpfBuyer: z.string().min(11).max(11)
})

salesRouter.post('/', async (req, res) => {
  const parseResult = createSaleSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() })
  }
  const data = parseResult.data
  const inventoryBaseUrl = process.env.INVENTORY_BASE_URL
  if (!inventoryBaseUrl) {
    return res.status(500).json({ message: 'Configuração de inventário ausente' })
  }
  let vehicle: any
  try {
    const vehicleResponse = await axios.get(`${inventoryBaseUrl}/vehicles/${data.vehicleId}`)
    vehicle = vehicleResponse.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).json({ message: 'Veículo não encontrado no inventário' })
    }
    return res.status(502).json({ message: 'Erro ao consultar serviço de inventário' })
  }
  if (vehicle.status !== 'AVAILABLE') {
    return res.status(409).json({ message: 'Veículo indisponível para venda' })
  }
  const paymentCode = randomUUID()
  const sale = await prisma.sale.create({
    data: {
      vehicleId: data.vehicleId,
      cpfBuyer: data.cpfBuyer,
      price: vehicle.price,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      paymentCode
    }
  })
  return res.status(201).json(sale)
})

salesRouter.get('/available-vehicles', async (_req, res) => {
  const inventoryBaseUrl = process.env.INVENTORY_BASE_URL
  if (!inventoryBaseUrl) {
    return res.status(500).json({ message: 'Configuração de inventário ausente' })
  }
  const vehiclesResponse = await axios.get(`${inventoryBaseUrl}/vehicles`, {
    params: { status: 'AVAILABLE' }
  })
  const vehicles = vehiclesResponse.data as Array<{ price: number }>
  vehicles.sort((a, b) => a.price - b.price)
  return res.json(vehicles)
})

salesRouter.post('/payments/webhook', async (req, res) => {
  const schema = z.object({
    paymentCode: z.string().min(1),
    status: z.enum(['PAID', 'CANCELED'])
  })
  const parseResult = schema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.flatten() })
  }
  const { paymentCode, status } = parseResult.data
  const sale = await prisma.sale.findUnique({ where: { paymentCode } })
  if (!sale) {
    return res.status(404).json({ message: 'Venda não encontrada' })
  }
  const updated = await prisma.sale.update({
    where: { paymentCode },
    data: { status: status === 'PAID' ? 'PAID' : 'CANCELED' }
  })
  if (status === 'PAID') {
    const inventoryBaseUrl = process.env.INVENTORY_BASE_URL
    if (inventoryBaseUrl) {
      await axios.patch(`${inventoryBaseUrl}/vehicles/${sale.vehicleId}/status`, {
        status: 'SOLD'
      })
    }
  }
  return res.json(updated)
})

salesRouter.get('/sold-vehicles', async (_req, res) => {
  const sales = await prisma.sale.findMany({
    where: { status: 'PAID' },
    orderBy: { price: 'asc' }
  })
  return res.json(sales)
})

