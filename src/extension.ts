import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ExtensionTreeProvider } from './ExtensiontTeeView';

export function activate(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('Open a folder first.');
        return;
    }

    const root = workspaceFolders[0].uri.fsPath;

    // Tree view
    const treeProvider = new ExtensionTreeProvider(root);
    vscode.window.registerTreeDataProvider('fileExtensionView', treeProvider);

    // Command for Output Panel version
    let disposable = vscode.commands.registerCommand('sortByExtension.run', async () => {
        const allFiles: string[] = [];

        const ignoredFolders = vscode.workspace.getConfiguration().get<string[]>('sortByExtension.ignoreFolders') || [];

        function scanDir(dir: string) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (ignoredFolders.includes(entry.name)) continue;
                    scanDir(fullPath);
                } else {
                    allFiles.push(fullPath);
                }
            }
        }

        scanDir(root);

        const byExtension = new Map<string, string[]>();
        for (const file of allFiles) {
            const ext = path.extname(file) || 'no-extension';
            if (!byExtension.has(ext)) byExtension.set(ext, []);
            byExtension.get(ext)?.push(file);
        }

        const sorted = Array.from(byExtension.entries()).sort(([a], [b]) => a.localeCompare(b));

        const output = vscode.window.createOutputChannel('Sorted Files');
        output.clear();
        output.show();

        for (const [ext, files] of sorted) {
            output.appendLine(`\n--- ${ext} (${files.length}) ---`);

            const folderMap = new Map<string, string[]>();
            for (const file of files) {
                const folder = path.dirname(file).replace(root, '.') || '.';
                if (!folderMap.has(folder)) folderMap.set(folder, []);
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

export function deactivate() {}
