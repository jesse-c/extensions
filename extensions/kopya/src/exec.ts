import { exec } from "child_process";
import { promisify } from "util";

// Ensure commands can find executables in these paths
export const PATH = "/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/opt/homebrew/sbin";

// Promisified exec function with proper PATH
export const execAsync = promisify(exec);

/**
 * Execute a shell command with the proper PATH environment
 * @param command The command to execute
 * @returns Promise with stdout and stderr
 */
export async function execute(command: string): Promise<{ stdout: string; stderr: string }> {
  return execAsync(command, {
    env: { ...process.env, PATH }
  });
}
