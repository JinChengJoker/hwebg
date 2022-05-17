import path from 'path';
import fs from 'fs';
import * as prettier from 'prettier';

const { prettier: defaultPrettierOptions } = require('@umijs/fabric');

export const prettierFile = (content: string): [string, boolean] => {
  let result = content;
  let hasError = false;
  try {
    result = prettier.format(content, {
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
      parser: 'typescript',
      ...defaultPrettierOptions,
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