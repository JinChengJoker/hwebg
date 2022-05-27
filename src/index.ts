#!/usr/bin/env node

import * as path from 'path';
import * as nunjucks from 'nunjucks';
import type { OpenApiConfig, Route } from './index.d'
import { writeFile, readFileString, parseSwagger } from './utils'

const processPath = process.cwd()
const pageTemplateFilePath = path.join(__dirname, '../templates/page.njk')
const routesTemplateFilePath = path.join(__dirname, '../templates/routes.njk')

nunjucks.configure({
  autoescape: false,
});

export const generatePages = (openApiConfigs: OpenApiConfig[]) => {
  const pageTemplate = readFileString(pageTemplateFilePath)
  openApiConfigs.forEach(openApiConfig => generatePageFile(openApiConfig, pageTemplate))
}

export const generateRoutes = async (openApiConfigs: OpenApiConfig[], base: string = '/') => {
  const modules: Route[] = []
  for (let i = 0; i < openApiConfigs.length; i++) {
    const tables = await parseSwagger(openApiConfigs[i].schemaPath)
    tables && modules.push({
      path: openApiConfigs[i].projectName,
      routes: tables.map(table => table.name)
    })
  }
  genarateRouteFile(modules, base)
}

const generatePageFile = async (openApiConfig: OpenApiConfig, template: string) => {
  const tables = await parseSwagger(openApiConfig.schemaPath)
  tables?.forEach(table => {
    // 要把页面文件放在哪个目录下
    const folderPath = path.join(processPath, 'src/pages', openApiConfig.projectName, table.name)
    const fileName = 'index.tsx'
    const methodsString = Object.keys(table.methods).filter(t => table.methods[t]).map(i => table.methods[i]).join(', ')
    const namespace = openApiConfig.namespace ?? 'API'
    const pbTypeName = table.pbTypeName && `${namespace}.${table.pbTypeName}`
    const postRequestBodyTypeName = table.postRequestBodyTypeName && `${namespace}.${table.postRequestBodyTypeName}`
    // 页面模板文件渲染
    const pageFileString = nunjucks.renderString(template, {
      ...table,
      pbTypeName,
      postRequestBodyTypeName,
      import_statment: `import {${methodsString}} from '@/services/${openApiConfig.projectName}/${table.tag}';`,
    })
    writeFile(folderPath, fileName, pageFileString)
  })
}

const genarateRouteFile = (modules: Route[], base: string) => {
  // 要把路由文件放在哪个目录下
  const folderPath = path.join(processPath, '/config')
  const fileName = 'routes.ts'
  const template = readFileString(routesTemplateFilePath)
  // 路由模板文件渲染
  const routeFileString = nunjucks.renderString(template, {
    base,
    modules,
  })
  writeFile(folderPath, fileName, routeFileString)
}
