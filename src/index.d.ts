export type OpenApiConfig = {
  schemaPath: string;
  projectName: string;
  namespace?: string;
}

export type Methods = Record<string> & {
  get: string;
  post: string;
  put?: string;
  delete?: string;
};

export type Table = {
  name: string;
  tag: string;
  columns: {
    title: string;
    dataIndex: string;
  }[],
  methods: Methods;
  pbTypeName: string;
  postRequestBodyTypeName: string;
}

export type Project = {
  name: string;
  tables: Table[];
}

export type TableProperties = Record<string, {
  type: string;
  format?: string;
  description?: string;
}>

export type Route = {
  path: string;
  routes: string[];
}