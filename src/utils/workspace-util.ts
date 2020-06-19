// takes an array of workspace folder objects and return
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import { WorkspaceFolder } from 'vscode';
import { EOL } from 'os';

// workspace root, assumed to be the first item in the array
export const getWorkspaceFolder = (folders: WorkspaceFolder[] | undefined): string => {
  if (!folders) {
    return '';
  }

  const folder = folders[0] || { uri: null };
  const uri = folder.uri;

  return uri.fsPath;
};

/**
 * takes a filename or relative path and returns an absolute path
 * @param filename the name of the file
 */
export const toAbsolutePath = (workspaceRoot: string, filename: string): string =>
  path.resolve(workspaceRoot, filename);

/**
 * get the content of the first line in file
 * @param pathToFile the path to the file
 */
export const getFirstLine = async (pathToFile: string) => {
  const readable = fs.createReadStream(pathToFile);
  const reader = readline.createInterface({ input: readable });
  const line = await new Promise((resolve) => {
    reader.on('line', (line) => {
      reader.close();
      resolve(line);
    });
  });
  readable.close();
  return line;
};

export const getFileContentForRange = (pathToFile: string, start: number, end: number): string => {
  const fileContent = fs.readFileSync(pathToFile, 'utf8');
  const fileContentLines = fileContent.split(EOL);
  return fileContentLines.slice(start - 1, end + 1).join(EOL);
};

export const removeTrailingSlash = (s: string): string => s.replace(/\/$/, '');
export const removeLeadingSlash = (s: string): string => s.replace(/^\//, '');
export const removeLeadingAndTrailingSlash = (s: string): string => s.replace(/^\/|\/$/g, '');

export const guid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
  var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

export const EscapeComma = '$COMMA$';
export const EscapeQuote = '$QUOTE$';
export const EscapeEnter = '<br>';
export const EscapeCommaReg = '\\$COMMA\\$';
export const EscapeQuoteReg = '\\$QUOTE\\$';
export const EscapeEnterReg = '<br>';

export const Escape = {
  encode: (str: string) => str ? str.replace(/"/g, EscapeQuote).replace(/,/g, EscapeComma).replace(new RegExp('\n', 'g'), EscapeEnter) : '',
  decode: (str: string) => str ? str
    .replace(new RegExp(`${EscapeQuoteReg}`, 'g'), '"')
    .replace(new RegExp(`${EscapeCommaReg}`, 'g'), ',')
    .replace(new RegExp(`${EscapeEnterReg}`, 'g'), '\n') : ''
};