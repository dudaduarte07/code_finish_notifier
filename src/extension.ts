import * as vscode from 'vscode';
import * as path from 'node:path';
import notifier from 'node-notifier';

type NotifyMode = 'success' | 'error' | 'both';

interface RunningCommandInfo {
    startedAt: number;
    terminalName: string;
    commandLineAtStart: string;
    terminal: vscode.Terminal;
}

const runningTerminalCommands = new Map<string, RunningCommandInfo>();

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Finish Notifier is active');

    context.subscriptions.push(
        vscode.debug.onDidTerminateDebugSession(async (session) => {
            const config = vscode.workspace.getConfiguration('codeFinishNotifier');

            await notifyEnd({
                kind: 'debug',
                label: session.name || 'Debug session',
                success: true,
                durationMs: undefined,
                commandLine: undefined,
                config,
                onClick: async () => {
                    await vscode.commands.executeCommand('workbench.view.debug');
                }
            });
        })
    );

    context.subscriptions.push(
        vscode.tasks.onDidEndTaskProcess(async (event) => {
            const config = vscode.workspace.getConfiguration('codeFinishNotifier');
            const exitCode = event.exitCode ?? 0;
            const success = exitCode === 0;

            await notifyEnd({
                kind: 'task',
                label: event.execution.task.name || 'Task',
                success,
                durationMs: undefined,
                commandLine: undefined,
                config,
                onClick: async () => {
                    await vscode.commands.executeCommand('workbench.action.tasks.showTasks');
                }
            });
        })
    );

    context.subscriptions.push(
        vscode.window.onDidStartTerminalShellExecution((event) => {
            const commandLine = (event.execution.commandLine.value || '').trim();
            const key = getExecutionKey(event.terminal, commandLine);

            runningTerminalCommands.set(key, {
                startedAt: Date.now(),
                terminalName: event.terminal.name,
                commandLineAtStart: commandLine,
                terminal: event.terminal
            });
        })
    );

    context.subscriptions.push(
        vscode.window.onDidEndTerminalShellExecution(async (event) => {
            const config = vscode.workspace.getConfiguration('codeFinishNotifier');
            const commandLine = (event.execution.commandLine.value || '').trim();
            const key = getExecutionKey(event.terminal, commandLine);

            const running = runningTerminalCommands.get(key);
            if (running) {
                runningTerminalCommands.delete(key);
            }

            const durationMs = running ? Date.now() - running.startedAt : undefined;
            const exitCode = event.exitCode;
            const success = exitCode === undefined ? true : exitCode === 0;

            const label = buildHumanLabel(commandLine, event.terminal.name);

            await notifyEnd({
                kind: 'terminal',
                label,
                success,
                durationMs,
                commandLine,
                config,
                onClick: async () => {
                    event.terminal.show(false);
                }
            });
        })
    );
}

export function deactivate() {}

async function notifyEnd(args: {
    kind: 'debug' | 'task' | 'terminal';
    label: string;
    success: boolean;
    durationMs?: number;
    commandLine?: string;
    config: vscode.WorkspaceConfiguration;
    onClick?: () => Promise<void>;
}) {
    const enabled = args.config.get<boolean>('enabled', true);
    if (!enabled) return;

    const notifyMode = args.config.get<NotifyMode>('notifyOn', 'both');
    const showVsCodePopup = args.config.get<boolean>('showPopup', false);
    const showDesktopNotification = args.config.get<boolean>('showDesktopNotification', true);
    const includeDuration = args.config.get<boolean>('includeDuration', true);
    const includeCommandPreview = args.config.get<boolean>('includeCommandPreview', false);
    const autoFocusTerminal = args.config.get<boolean>('focusFinishedTerminal', false);

    if (!shouldNotify(args.success, notifyMode)) return;

    const status = args.success ? 'finalizou com sucesso' : 'terminou com erro';
    const prefix =
        args.kind === 'task' ? 'Task'
        : args.kind === 'debug' ? 'Execução'
        : 'Comando';

    let message = `${args.label} ${status}`;

    if (includeDuration && args.durationMs !== undefined) {
        message += ` • ${formatDuration(args.durationMs)}`;
    }

    const commandPreview =
        includeCommandPreview && args.commandLine
            ? truncate(args.commandLine, 140)
            : undefined;

    if (showVsCodePopup) {
        const fullMessage = commandPreview ? `${prefix}: ${message}\n${commandPreview}` : `${prefix}: ${message}`;
        if (args.success) {
            void vscode.window.showInformationMessage(fullMessage);
        } else {
            void vscode.window.showWarningMessage(fullMessage);
        }
    }

    if (showDesktopNotification) {
        await showNativeDesktopNotification({
            title: `${prefix} finalizado`,
            message,
            subtitle: commandPreview,
            onClick: args.onClick
        });
    }

    if (autoFocusTerminal && args.onClick) {
        await args.onClick();
    }
}

function shouldNotify(success: boolean, mode: NotifyMode): boolean {
    if (mode === 'both') return true;
    if (mode === 'success') return success;
    return !success;
}

function getExecutionKey(terminal: vscode.Terminal, commandLine: string): string {
    return `${terminal.name}::${commandLine}`;
}

function buildHumanLabel(commandLine: string, terminalName: string): string {
    if (!commandLine) {
        return `Terminal ${terminalName}`;
    }

    const cleaned = commandLine.trim();

    const patterns = [
        /\bpython(?:3(?:\.\d+)?)?\s+("?)([^\s"]+\.py)\1/i,
        /\bpy\s+("?)([^\s"]+\.py)\1/i,
        /\bnode\s+("?)([^\s"]+\.(?:js|mjs|cjs|ts))\1/i,
        /\bnpm\s+run\s+([^\s]+)/i,
        /\byarn\s+([^\s]+)/i,
        /\bpnpm\s+([^\s]+)/i,
        /\bscrapy\s+crawl\s+([^\s]+)/i,
        /\bjava\s+("?)([^\s"]+\.jar)\1/i,
        /\buv\s+run\s+("?)([^\s"]+)\1/i,
        /\bgo\s+run\s+("?)([^\s"]+\.go)\1/i,
        /\bruby\s+("?)([^\s"]+\.rb)\1/i,
    ];

    for (const pattern of patterns) {
        const match = cleaned.match(pattern);
        if (match) {
            const candidate = match[2] || match[1];
            if (candidate) {
                return path.basename(candidate.replace(/^["']|["']$/g, ''));
            }
        }
    }

    return truncate(cleaned, 80);
}

function formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

function truncate(text: string, max: number): string {
    return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function showNativeDesktopNotification(args: {
    title: string;
    message: string;
    subtitle?: string;
    onClick?: () => Promise<void>;
}): Promise<void> {
    return new Promise((resolve) => {
        notifier.notify(
            {
                title: args.title,
                message: args.subtitle ? `${args.message}\n${args.subtitle}` : args.message,
                wait: Boolean(args.onClick),
                timeout: 5
            },
            () => resolve()
        );

        if (args.onClick) {
            notifier.once('click', async () => {
                try {
                    await args.onClick?.();
                } catch {
                    // ignora erro de foco
                }
            });
        }
    });
}