## 说明

此项目用于`umi`插件[umi-plugin-hwebg](https://github.com/JinChengJoker/umi-plugin-hwebg)调用。


## 开发

### 安装依赖

```bash
$ pnpm install
```

### 运行测试

```bash
$ pnpm test
```


## 打包编译

```bash
$ pnpm build
```


## 使用

### 安装

```bash
pnpm install hwebg
```

### 示例

```typescript
import { join } from 'path';
import { generateRoutes, generatePages } from 'hwebg';

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
]

// 生成 pages
generatePages(openApi)

// 生成 routes
generateRoutes(openApi, '/')
```