"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ExtensiontTeeView_1 = require("./ExtensiontTeeView");
function activate(context) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('Open a folder first.');
        return;
    }
    const root = workspaceFolders[0].uri.fsPath;
    // Tree view
    const treeProvider = new ExtensiontTeeView_1.ExtensionTreeProvider(root);
    vscode.window.registerTreeDataProvider('fileExtensionView', treeProvider);
    // Command for Output Panel version
    let disposable = vscode.commands.registerCommand('sortByExtension.run', async () => {
        const allFiles = [];
        const ignoredFolders = vscode.workspace.getConfiguration().get('sortByExtension.ignoreFolders') || [];
        function scanDir(dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (ignoredFolders.includes(entry.name))
                        continue;
                    scanDir(fullPath);
                }
                else {
                    allFiles.push(fullPath);
                }
            }
        }
        scanDir(root);
        const byExtension = new Map();
        for (const file of allFiles) {
            const ext = path.extname(file) || 'no-extension';
            if (!byExtension.has(ext))
                byExtension.set(ext, []);
            byExtension.get(ext)?.push(file);
        }
        const sorted = Array.from(byExtension.entries()).sort(([a], [b]) => a.localeCompare(b));
        const output = vscode.window.createOutputChannel('Sorted Files');
        output.clear();
        output.show();
        for (const [ext, files] of sorted) {
            output.appendLine(`\n--- ${ext} (${files.length}) ---`);
            const folderMap = new Map();
            for (const file of files) {
                const folder = path.dirname(file).replace(root, '.') || '.';
                if (!folderMap.has(folder))
                    folderMap.set(folder, []);
                folderMap.get(folder)?.push(path.basename(file));
            }
            const sortedFolders = Array.from(folderMap.entries()).sort(([a], [b]) => a.localeCompare(b));
            for (const [folder, filenames] of sortedFolders) {
                output.appendLine(`📁 ${folder}`);
                filenames.sort().forEach(name => {
                    const relativePath = path.join(folder, name);
                    const absolutePath = path.resolve(root, relativePath);
                    output.appendLine(`  └─ ${name}`);
                    output.appendLine(`     ⇨ Click: vscode://file${absolutePath}`);
                });
            }
        }
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map