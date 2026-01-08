import express from 'express'
import { json } from 'express'
import swaggerUi from 'swagger-ui-express'
import { salesRouter } from './sales/sales.router'
import { salesOpenApiSpec } from './docs/openapi'

export const app = express()

app.use(json())
app.use('/sales', salesRouter)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(salesOpenApiSpec))
app.get('/docs-json', (_req, res) => {
  res.json(salesOpenApiSpec)
})

