import * as fs from 'fs';
import { EOL } from 'os';
import { window, workspace, TextEditor } from 'vscode';
const gitCommitId = require('git-commit-id');
import { IRecord } from './interfaces';
import { removeLeadingAndTrailingSlash, removeTrailingSlash, guid, EscapeQuote, EscapeComma, Escape } from './utils/workspace-util';
import { FileGenerator } from './file-generator';
import { NitRecordProvider } from './treeView';

export class ReviewCommentService {
  generator: FileGenerator;
  editor: TextEditor;
  constructor(private workspaceRoot: string, private provider: NitRecordProvider) {
    this.generator = new FileGenerator(workspaceRoot);
  }

  initReviewFile() {
    this.generator.execute();
  }

  /**
   * Append a new comment
   * @param filePath the relative file path starting from the workspace root
   * @param lineOrLines the line or lines the comment is related to
   * @param comment the comment message
   */
  async addComment(comment: Partial<IRecord>) {
    if (!this.editor) {
      window.showErrorMessage(`No editor found, please confirm.`);
      return;
    }
    this.checkFileExists();
    const newComment = this.caculateComment(comment);

    this.generator.append({
      id: guid(),
      ...this.escapeComment(newComment)
    });

    this.editor = null;
  }
  
  async modifyComment(comment: Partial<IRecord>) {
    if (!this.editor) {
      this.provider.modifyRecord(this.escapeComment(comment));
      return;
    }
    const newComment = this.caculateComment(comment);
    this.provider.modifyRecord({ ...comment, ...newComment });
    this.editor = null;
  }

  private caculateComment(comment: Partial<IRecord>): Partial<IRecord> {
    let selections = '';
    let startAnker: number | undefined = undefined;
    let endAnker: number | undefined = undefined;
    if (this.editor) {
      // 2:2-12:2|19:0-19:0
      selections = this.editor.selections.reduce((acc, cur) => {
        const tmp = acc ? `${acc}|` : '';
        return `${tmp}${cur.start.line + 1}:${cur.start.character}-${cur.end.line + 1}:${cur.end.character}`;
      }, '');
      // use the first line selection for building an anker for the target URL
      if (this.editor.selections.length) {
        startAnker = this.editor.selections[0].start.line + 1;
        endAnker = this.editor.selections[0].end.line + 1;
      }
    }
    let activeFileName = '';
    if (this.editor) {
      activeFileName = this.editor.document.fileName.replace(this.workspaceRoot, '');
    }
    // escape double quotes
    let sha = this.getSha();
    const remoteUrl = this.remoteUrl(sha, activeFileName, startAnker, endAnker);
    return { ...comment, sha, filename: activeFileName, url: remoteUrl, lines: selections };
  }

  private escapeComment(comment: Partial<IRecord>) {
    const commentExcaped = Escape.encode(comment.comment);
    const titleExcaped = Escape.encode(comment.title);
    const priority = comment.priority || '';
    const additional = Escape.encode(comment.additional);
    const category = comment.category || '';
    return { ...comment, title: titleExcaped, comment: commentExcaped, priority, additional, category };
  }

  private getSha() {
    try {
      return gitCommitId({ cwd: this.workspaceRoot });
    } catch (error) {
      console.log('Not in a git repository. Leaving SHA empty', error);
      return '';
    }
  }

  /**
   * Build the remote URL
   * @param sha a git SHA that's included in the URL
   * @param filePath the relative file path
   * @param start the first line from the first selection
   * @param end the last line from the first selection
   */
  private remoteUrl(sha: string, filePath: string, start?: number, end?: number) {
    const customUrl = workspace.getConfiguration().get('nitpicker.customUrl') as string;
    const baseUrl = workspace.getConfiguration().get('nitpicker.baseUrl') as string;

    const filePathWithoutLeadingAndTrailingSlash = removeLeadingAndTrailingSlash(filePath);

    if (!baseUrl && !customUrl) {
      return '';
    } else if (customUrl) {
      return customUrl
        .replace('{sha}', sha)
        .replace('{file}', filePathWithoutLeadingAndTrailingSlash)
        .replace('{start}', start ? start.toString() : '0')
        .replace('{end}', end ? end.toString() : '0');
    } else {
      const baseUrlWithoutTrailingSlash = removeTrailingSlash(baseUrl);
      const shaPart = sha ? `${sha}/` : '';
      const ankerPart = start && end ? `#L${start}-${end}` : '';
      return `${baseUrlWithoutTrailingSlash}/${shaPart}${filePathWithoutLeadingAndTrailingSlash}${ankerPart}`;
    }
  }

  private checkFileExists() {
    const filePath = this.generator.filePath();
    if (!fs.existsSync(filePath)) {
      window.showErrorMessage(`Could not add modify to file: '${filePath}': File does not exist`);
      return;
    }
  }
}
