#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import type { OpenApi, Service, tableProperties } from '../typing'

const processPath = process.cwd()
const openApiFilePath = path.join(processPath, '/config/openapi.ts')
const templateFilePath = path.join(__dirname, '../template/page')
const templateString = readFileString(templateFilePath)

if (fs.existsSync(openApiFilePath)) {
  import(openApiFilePath).then(module => {
    console.log(module['default'])
    traverseOpenApiList(module['default'])
  })
} else {
  throw new Error('未在当前目录下找到 config/openapi.ts 文件')
}

function traverseOpenApiList(openApiList: OpenApi[]) {
  openApiList.forEach(openApi => {
    if (!openApi.projectName) {
      throw new Error('config/openapi.ts 文件缺少 projectName')
    }
    if (!openApi.schemaPath) {
      throw new Error('config/openapi.ts 文件缺少 schemaPath')
    }
    if (!fs.existsSync(openApi.schemaPath)) return

    const swaggerFileString = readFileString(openApi.schemaPath)
    const swagger = JSON.parse(swaggerFileString)
    const service = generateService(swagger, openApi.projectName)

    generateModuleFile(service)
  })
}

function readFileString(filepath: string) {
  return fs.readFileSync(filepath, { encoding: 'utf-8' }).toString()
}

function generateService(swagger: any, projectName: string) {
  const { paths, definitions } = swagger
  const serviceName = swagger.tags[0].name
  const service: Service = {
    projectName,
    serviceName,
    serviceModules: []
  }

  Object.keys(paths).forEach(pathName => {
    Object.keys(paths[pathName]).forEach(methodName => {
      const method = paths[pathName][methodName]
      const operationId = method['operationId']
      const listPrefix = `${serviceName}_List`

      if (operationId.includes(listPrefix)) {
        const listReplyDef = method['responses']['200']['schema']['$ref'].replace('#/definitions/', '')
        const tableDef = definitions[listReplyDef]['properties']['data']['items']['$ref'].replace('#/definitions/', '')
        const tableProperties = definitions[tableDef]['properties']
        const columns = transformToColumns(tableProperties)
        const moduleName = operationId.replace(listPrefix, '')
        service.serviceModules.push({
          moduleName,
          methods: {
            list: `${serviceName}List${moduleName}`,
            create: `${serviceName}Create${moduleName}`,
            update: `${serviceName}Update${moduleName}`,
            delete: `${serviceName}Delete${moduleName}`,
          },
          columns: columns,
          pbType: `API.v1${moduleName}Pb`,
          createRequestType: `API.v1Create${moduleName}Request`,
        })
      }
    })
  })

  return service
}

function generateModuleFile(service: Service) {
  service.serviceModules.forEach(module => {
    const moduleDirPath = path.join(processPath, 'src/pages', service.projectName, module.moduleName)
    const moduleIndexPath = path.join(moduleDirPath, 'index.tsx')
    const methodsString = Object.keys(module.methods).map(i => module.methods[i]).join(', ')
    const columnsString = module.columns.map(column => JSON.stringify(column)).join(',\n')
    const fileString = templateString
      .replace(/{{__import_services__}}/, `import {${methodsString}} from '@/services/${service.projectName}/${service.serviceName}';`)
      .replace(/{{__columns__}}/, columnsString)
      .replace(/{{__create_request_type__}}/g, module.createRequestType)
      .replace(/{{__pb_type__}}/g, module.pbType)
      .replace(/{{__list_service_name__}}/, module.methods.list)
      .replace(/{{__create_service_name__}}/, module.methods.create)
      .replace(/{{__update_service_name__}}/, module.methods.update)
      .replace(/{{__delete_service_name__}}/, module.methods.delete)

    fs.mkdirSync(moduleDirPath, { recursive: true })
    fs.writeFileSync(moduleIndexPath, fileString, { flag: 'w+' })
  })
}

function transformToColumns(properties: tableProperties) {
  return Object.keys(properties).map(key => ({
    title: properties[key].description || key,
    dataIndex: key
  }))
}
