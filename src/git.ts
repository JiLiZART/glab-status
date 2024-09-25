import { $ } from "bun";

export class Git {
  cwd: string;

  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
  }

  async branch() {
    const stdout = await $`git rev-parse --abbrev-ref HEAD`
      .cwd(this.cwd)
      .text();

    return stdout.trim();
  }

  async remoteUrl() {
    const stdout = await $`git ls-remote --get-url`.cwd(this.cwd).text();

    return stdout
      .trim()
      .replace(/^git@(.*?):/, "https://$1/")
      .replace(/[A-z0-9\-]+@/, "")
      .replace(/\.git$/, "");
  }

  async repoName() {
    const projectName = (remoteUrl: string) => remoteUrl.split("/").pop();

    return projectName(await this.remoteUrl());
  }
}
