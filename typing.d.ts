export type OpenApi = {
  schemaPath: string;
  projectName: string;
}

export type Methods = {
  list: string;
  create: string;
  update: string;
  delete: string;
  [key: string]: string;
};

export type ServiceModule = {
  moduleName: string;
  methods: Methods;
  columns: {
    title: string;
    dataIndex: string;
  }[],
  pbType: string;
  createRequestType: string;
}

export type Service = {
  projectName: string;
  serviceName: string;
  serviceModules: ServiceModule[]
}

export type tableProperties = Record<string, {
  type: string;
  format?: string;
  description?: string;
}>