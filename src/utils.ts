import path from 'path';
import fs from 'fs';
import * as prettier from 'prettier';
import type { TableProperties, Table, Methods } from './index.d'
import type { OpenAPIObject, PathItemObject, RequestBodyObject, SchemaObject } from 'openapi3-ts'

const converter = require('swagger2openapi')

// 格式化文件
export const prettierFile = (content: string): [string, boolean] => {
  let result = content;
  let hasError = false;
  try {
    result = prettier.format(content, {
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
      parser: 'typescript',
    });
  } catch (error) {
    hasError = true;
  }
  return [result, hasError];
};

export const mkdir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    mkdir(path.dirname(dir));
    fs.mkdirSync(dir);
  }
};

export const writeFile = (folderPath: string, fileName: string, content: string) => {
  const filePath = path.join(folderPath, fileName);
  mkdir(path.dirname(filePath));
  const [prettierContent, hasError] = prettierFile(content);
  fs.writeFileSync(filePath, prettierContent, {
    encoding: 'utf8',
  });
  return hasError;
};

export const readFileString = (filepath: string) => {
  return fs.readFileSync(filepath, { encoding: 'utf-8' }).toString()
}

// 解析 swagger.json 文件返回所有的表
export const parseSwagger = async (swaggerPath: string) => {
  const swaggerFileString = readFileString(swaggerPath)
  const swagger = JSON.parse(swaggerFileString)
  const openApi = await convertSwaggerToOpenApi(swagger)
  return parseOpenApi(openApi)
}

// 解析 OpenAPI 规范的 JSON，返回所有的表
export const parseOpenApi = (openApi: OpenAPIObject) => {
  const { paths, components } = openApi
  if (!paths || !components || !components.schemas) return
  const schemas = components.schemas as SchemaObject
  const tables: Table[] = []
  const pathsArray = Object.keys(paths)
  pathsArray.forEach(path => {
    const pathItem: PathItemObject = paths[path]
    // 如果接口路径下同时存在 GET & POST 方法，那么就认为这个路径对应了一个表
    if (pathItem.get?.operationId && pathItem.post?.operationId) {
      // 表的名字
      const name = path.split('/')[path.split('/').length - 1]
      // 各请求方法对应的函数名
      const methods: Methods = {
        get: pathItem.get.operationId.replace('_', ''),
        post: pathItem.post.operationId.replace('_', ''),
        put: pathItem.put?.operationId?.replace('_', ''),
        delete: pathItem.delete?.operationId?.replace('_', ''),
      }
      const listReplySchemaName = pathItem.get.responses['200'].content['application/json'].schema.$ref.replace('#/components/schemas/', '')
      // 列的类型定义对应的名称
      const pbTypeName = schemas[listReplySchemaName]?.properties?.data.items.$ref.replace('#/components/schemas/', '')
      // 创建请求的定义对应的名称
      const postRequestBodyTypeName = (pathItem.post.requestBody as RequestBodyObject)?.content['application/json'].schema?.$ref.replace('#/components/schemas/', '')
      // 表的所有列
      const columns = convertPropertiesToColumns(schemas[pbTypeName].properties)
      const tag = pathItem.get.tags?.[0] || pathItem["x-swagger-router-controller"]
      // 寻找 put 和 delete 方法
      if (!methods.put || !methods.delete) {
        for (let i = 0; i < pathsArray.length; i++) {
          if (new RegExp(`^${path}\/`).test(pathsArray[i])) {
            const pItem = paths[pathsArray[i]]
            if (!methods.put && pItem.put?.operationId) methods.put = pItem.put.operationId.replace('_', '')
            if (!methods.delete && pItem.delete?.operationId) methods.delete = pItem.delete.operationId.replace('_', '')
            break;
          }
        }
      }
      tables.push({
        name, tag, columns, methods, pbTypeName, postRequestBodyTypeName
      })
    }
  })
  return tables
}

// 将 swagger.json 转换成 OpenAPI 规范的 JSON 格式
export const convertSwaggerToOpenApi = (swagger: any) => {
  // 判断是不是 swagger 规范，如果是 OpenAPI 规范则不用转换直接返回
  if (!swagger.swagger) return swagger
  return new Promise((resolve, reject) => {
    converter.convertObj(swagger, {}, (err: Error, options: { openapi: OpenAPIObject }) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(options.openapi);
    })
  })
}

// 将表的所有字段转换成 columns 可以供页面组件使用
export const convertPropertiesToColumns = (properties: TableProperties) => {
  return Object.keys(properties).map(key => ({
    title: properties[key].description || key,
    dataIndex: key
  }))
}