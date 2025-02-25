import { exec } from "child_process";
import { z } from "zod";

/**
 * Shell Terminal tool
 *   - Executes shell commands safely
 *   - Returns the command output and any errors
 *   - Supports SSH connections and remote command execution
 */

export const shellTerminalToolName = "shell_terminal";
export const shellTerminalToolDescription = "Execute shell commands safely. Can be used for both local and remote (SSH) command execution.";

export const ShellTerminalToolSchema = z.object({
    command: z.string().describe("The shell command to execute"),
    sshTarget: z.string().optional().describe("SSH target in format user@host. If provided, command will be executed remotely"),
    timeoutMs: z.number().optional().default(30000).describe("Command timeout in milliseconds"),
    workingDir: z.string().optional().describe("Working directory for command execution"),
});

interface CommandResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
}

async function executeCommand(command: string, options: { cwd?: string, timeout?: number }): Promise<CommandResult> {
    return new Promise((resolve) => {
        const child = exec(command, {
            cwd: options.cwd,
            timeout: options.timeout,
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        }, (error, stdout, stderr) => {
            resolve({
                stdout: stdout.toString(),
                stderr: stderr.toString(),
                exitCode: error ? error.code || 1 : 0
            });
        });
    });
}

export async function runShellTerminalTool(
    args: z.infer<typeof ShellTerminalToolSchema>
) {
    try {
        const { command, sshTarget, timeoutMs = 30000, workingDir } = args;

        // If SSH target is provided, wrap the command in SSH
        const finalCommand = sshTarget
            ? `ssh ${sshTarget} '${command.replace(/'/g, "'\\''")}'`  // Escape single quotes in command
            : command;

        const result = await executeCommand(finalCommand, {
            cwd: workingDir,
            timeout: timeoutMs
        });

        // Format the output
        let output = "";
        if (result.stdout) {
            output += `Output:\n${result.stdout}\n`;
        }
        if (result.stderr) {
            output += `Errors:\n${result.stderr}\n`;
        }
        output += `Exit code: ${result.exitCode}`;

        return {
            content: [{
                type: "text",
                text: output
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error executing command: ${error.message || error}`
            }]
        };
    }
}