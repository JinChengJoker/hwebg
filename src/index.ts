#!/usr/bin/env node

import * as path from 'path';
import * as nunjucks from 'nunjucks';
import type { Swagger, OpenApiConfig, tableProperties } from '../typing'
import { writeFile, readFileString } from './utils'

let pageTemplate: string
const processPath = process.cwd()
const pageTemplateFilePath = path.join(__dirname, '../templates/page.njk')
const routesTemplateFilePath = path.join(__dirname, '../templates/routes.njk')

nunjucks.configure({
  autoescape: false,
});

export const generatePages = (openApiConfigs: OpenApiConfig[]) => {
  pageTemplate = readFileString(pageTemplateFilePath)
  const swaggers = traverseOpenApiConfigs(openApiConfigs)
  swaggers.forEach(swagger => generateModuleFile(swagger))
}

export const generateRoutes = (openApiConfigs: OpenApiConfig[], base: string) => {
  const swaggers = traverseOpenApiConfigs(openApiConfigs)
  genarateRouteFile(swaggers, base)
}

const traverseOpenApiConfigs = (openApiConfigs: OpenApiConfig[]) => {
  return openApiConfigs.map(openApiConfig => {
    const openApiFileString = readFileString(openApiConfig.schemaPath)
    const openApi = JSON.parse(openApiFileString)
    return parseOpenApi(openApi, openApiConfig.projectName)
  })
}

const parseOpenApi = (openApi: any, projectName: string) => {
  const { paths, definitions } = openApi
  const serviceName = openApi.tags[0].name
  const swagger: Swagger = {
    projectName,
    serviceName,
    modules: []
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
        swagger.modules.push({
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
  return swagger
}

const transformToColumns = (properties: tableProperties) => {
  return Object.keys(properties).map(key => ({
    title: properties[key].description || key,
    dataIndex: key
  }))
}

const generateModuleFile = (swagger: Swagger) => {
  swagger.modules.forEach(module => {
    const moduleFolderPath = path.join(processPath, 'src/pages', swagger.projectName, module.moduleName)
    const moduleFileName = 'index.tsx'
    const methodsString = Object.keys(module.methods).map(i => module.methods[i]).join(', ')
    const pageFileString = nunjucks.renderString(pageTemplate, {
      import_statment: `import {${methodsString}} from '@/services/${swagger.projectName}/${swagger.serviceName}';`,
      columns: module.columns,
      createRequestType: module.createRequestType,
      pbType: module.pbType,
      methods: module.methods,
    })
    writeFile(moduleFolderPath, moduleFileName, pageFileString)
  })
}

const genarateRouteFile = (swaggers: Swagger[], base: string) => {
  const routeFolderPath = path.join(processPath, '/config')
  const routeFileName = 'routes.ts'
  const template = readFileString(routesTemplateFilePath)
  const list = swaggers.map(swagger => ({
    path: swagger.projectName,
    routes: swagger.modules.map(m => ({
      path: m.moduleName.toLocaleLowerCase(),
      component: m.moduleName
    }))
  }))
  const routeFileString = nunjucks.renderString(template, {
    base,
    list,
  })
  writeFile(routeFolderPath, routeFileName, routeFileString)
}
