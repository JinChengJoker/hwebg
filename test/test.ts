import { join } from 'path';
import { generateRoutes, generatePages } from '../src/index'

const openApi = [
  {
    schemaPath: join(__dirname, '/swaggers/svc_contracts.swagger.json'),
    projectName: 'contracts',
  },
  {
    schemaPath: join(__dirname, '/swaggers/svc_customers.swagger.json'),
    projectName: 'customers',
  },
  {
    schemaPath: join(__dirname, '/swaggers/svc_order.swagger.json'),
    projectName: 'order',
  },
  {
    schemaPath: join(__dirname, '/swaggers/svc_product.swagger.json'),
    projectName: 'product',
  },
  {
    schemaPath: join(__dirname, '/swaggers/hapsms.swagger.json'),
    projectName: 'hapsms',
  },
  {
    schemaPath: join(__dirname, '/swaggers/test.swagger.json'),
    projectName: 'test',
  },
]

generatePages(openApi)
generateRoutes(openApi, '/ivd/')