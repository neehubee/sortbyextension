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
exports.ExtensionTreeProvider = exports.FileExtensionNode = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class FileExtensionNode extends vscode.TreeItem {
    label;
    collapsibleState;
    children;
    command;
    constructor(label, collapsibleState, children = [], command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.children = children;
        this.command = command;
    }
}
exports.FileExtensionNode = FileExtensionNode;
class ExtensionTreeProvider {
    workspaceRoot;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No workspace folder found');
            return Promise.resolve([]);
        }
        if (!element) {
            return Promise.resolve(this.getGroupedExtensions());
        }
        return Promise.resolve(element.children);
    }
    getGroupedExtensions() {
        const allFiles = [];
        const ignored = vscode.workspace.getConfiguration().get('sortByExtension.ignoreFolders') || [];
        function scanDir(dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (ignored.includes(entry.name))
                        continue;
                    scanDir(fullPath);
                }
                else {
                    allFiles.push(fullPath);
                }
            }
        }
        scanDir(this.workspaceRoot);
        const map = new Map();
        for (const file of allFiles) {
            const ext = path.extname(file) || 'no-extension';
            if (!map.has(ext))
                map.set(ext, []);
            map.get(ext)?.push(file);
        }
        const extNodes = [];
        for (const [ext, files] of map.entries()) {
            const childNodes = files.map(f => {
                return new FileExtensionNode(path.basename(f), vscode.TreeItemCollapsibleState.None, [], {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [vscode.Uri.file(f)]
                });
            });
            extNodes.push(new FileExtensionNode(`${ext} (${files.length})`, vscode.TreeItemCollapsibleState.Collapsed, childNodes));
        }
        return extNodes.sort((a, b) => a.label.localeCompare(b.label));
    }
}
exports.ExtensionTreeProvider = ExtensionTreeProvider;
//# sourceMappingURL=ExtensiontTeeView.js.map