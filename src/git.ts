import { exec } from "node:child_process";
import { promisify } from "node:util";
import process from "node:process";

const $ = (...args: Parameters<typeof exec>) => {
  const e = promisify(exec);

  return e(args[0], args[1]).then(({ stdout }) => stdout.toString().trim());
};
export class Git {
  cwd: string;

  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
  }

  async branch() {
    const stdout = await $(`git rev-parse --abbrev-ref HEAD`, {
      cwd: this.cwd,
    });

    return stdout.trim();
  }

  async remoteUrl() {
    const stdout = await $("git ls-remote --get-url", { cwd: this.cwd });

    return stdout
      .trim()
      .replace(/^git@(.*?):/, "https://$1/")
      .replace(/[A-z0-9\-]+@/, "")
      .replace(/\.git$/, "");
  }

  async repoName() {
    const projectName = (remoteUrl: string) => remoteUrl.split("/").pop();

    return projectName(await this.remoteUrl())!;
  }
}
