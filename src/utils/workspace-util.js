"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// takes an array of workspace folder objects and return
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const os_1 = require("os");
// workspace root, assumed to be the first item in the array
exports.getWorkspaceFolder = (folders) => {
    if (!folders) {
        return '';
    }
    const folder = folders[0] || {};
    const uri = folder.uri;
    return uri.fsPath;
};
/**
 * takes a filename or relative path and returns an absolute path
 * @param filename the name of the file
 */
exports.toAbsolutePath = (workspaceRoot, filename) => path.resolve(workspaceRoot, filename);
/**
 * get the content of the first line in file
 * @param pathToFile the path to the file
 */
exports.getFirstLine = (pathToFile) => __awaiter(void 0, void 0, void 0, function* () {
    const readable = fs.createReadStream(pathToFile);
    const reader = readline.createInterface({ input: readable });
    const line = yield new Promise((resolve) => {
        reader.on('line', (line) => {
            reader.close();
            resolve(line);
        });
    });
    readable.close();
    return line;
});
exports.getFileContentForRange = (pathToFile, start, end) => {
    const fileContent = fs.readFileSync(pathToFile, 'utf8');
    const fileContentLines = fileContent.split(os_1.EOL);
    return fileContentLines.slice(start - 1, end + 1).join(os_1.EOL);
};
exports.removeTrailingSlash = (s) => s.replace(/\/$/, '');
exports.removeLeadingSlash = (s) => s.replace(/^\//, '');
exports.removeLeadingAndTrailingSlash = (s) => s.replace(/^\/|\/$/g, '');
//# sourceMappingURL=workspace-util.js.map