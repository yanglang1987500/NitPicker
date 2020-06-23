import * as fs from 'fs';
import { EOL } from 'os';
import { workspace, window } from 'vscode';
import * as readline from 'readline';
import { toAbsolutePath, getFirstLine, guid, Escape } from './utils/workspace-util';
import { IRecord } from './interfaces';

export class FileGenerator {
  private readonly defaultFileExtension = '.csv';
  static defaultFileName = 'code-review';
  static csvFileHeader = 'id,sha,filename,url,lines,title,comment,priority,category,additional';

  constructor(private workspaceRoot: string) {
    const configFileName = workspace.getConfiguration().get('nitpicker.filename') as string;
    if (configFileName) {
      FileGenerator.defaultFileName = configFileName;
    }
  }

  /**
   * leveraging all of the other functions to execute
   * the flow of adding a duck to a project
   */
  execute(): void {
    this.create(this.filePath());
  }

  filePath(): string {
    return toAbsolutePath(this.workspaceRoot, `${FileGenerator.defaultFileName}${this.defaultFileExtension}`);
  }

  /**
   * Try to create the code review fiel if not already exist
   * @param absoluteFilePath the absolute file path
   */
  create(absoluteFilePath: string) {
    if (fs.existsSync(absoluteFilePath)) {
      console.log(`File: '${absoluteFilePath}' already exists`);
      getFirstLine(absoluteFilePath).then((lineContent) => {
        if (lineContent !== FileGenerator.csvFileHeader) {
          window.showErrorMessage(
            `CSV header "${lineContent}" is not matching "${FileGenerator.csvFileHeader}" format. Please adjust it manually`,
          );
        } else console.log(`CSV header "${lineContent}" is OK`);
      });
      return;
    }

    try {
      fs.writeFileSync(absoluteFilePath, `${FileGenerator.csvFileHeader}${EOL}`);
      window.showInformationMessage(
        `Code review file: '${FileGenerator.defaultFileName}${this.defaultFileExtension}' successfully created.`,
      );
    } catch (err) {
      window.showErrorMessage(`Error when trying to create code review file: '${absoluteFilePath}': ${err}`);
    }
  }

  async read() {
    return new Promise<IRecord[]>((resolve => {
      const list: IRecord[] = [];
      let count = 0;
      const readable = fs.createReadStream(this.filePath());
      readline.createInterface({
        input: readable
      }).on('line', line => {
        if (count > 0 && line && line.trim() !== '') {
          const [id, sha, filename, url, lines, title, comment, priority, category, additional] = line.split(',').map(i => i.replace(/^"(.*)"$/, '$1'));
          list.push({ id, sha, filename, url, lines,
            title: Escape.decode(title),
            comment: Escape.decode(comment),
            priority: priority ? parseInt(priority, 10) : '',
            category, 
            additional: Escape.decode(additional) });
        }
        count++;
      }).on('close', () => {
        readable.close();
        resolve(list);
      });
    }));
  }

  async write(list: IRecord[]) {
    return new Promise(resolve => {
      const result = list.map(record => {
        const { id, sha, filename, url, lines, title, comment, priority, category, additional } = record;
        return `"${id}","${sha}","${filename}","${url}","${lines}","${Escape.encode(title)}","${Escape.encode(comment)}","${priority}","${category}","${Escape.encode(additional)}"${EOL}`;
      });
      fs.writeFile(this.filePath(), [`${FileGenerator.csvFileHeader}${EOL}`, ...result].join(''), () => resolve());
    });
  }

  async append(record: Partial<IRecord>) {
    const { id, sha, filename, url, lines, title, comment, priority, category, additional } = record;
    fs.appendFileSync(
      this.filePath(),
      `"${id}","${sha}","${filename}","${url}","${lines}","${Escape.encode(title)}","${Escape.encode(comment)}","${priority}","${category}","${Escape.encode(additional)}"${EOL}`,
    );
  }

  /**
   * not really using anything that needs to be disposed of, but
   * including in case we need to use in a future update
   */
  dispose() {}
}
