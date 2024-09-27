#!/usr/bin/env node
import colors from "picocolors";
import { Git } from "./git";
import { GitLab } from "./gitlab";
import {
  Display,
  DisplayCommit,
  DisplayEnvironment,
  DisplayMergeRequest,
  DisplayPipelineJobs,
} from "./display";

async function main() {
  if (!process.env.GITLAB_TOKEN) {
    console.error("Please set the GITLAB_TOKEN environment variable.");
    console.error("You can generate a new token here:");
    console.error(
      colors.blue("> https://gitlab.com/-/user_settings/personal_access_tokens")
    );
    process.exit(1);
  }

  try {
    const git = new Git();
    const repoName = await git.repoName().catch(() => {
      console.warn("Failed getting remote url");
      console.warn("It seems that you are not in a Git repository.");
      process.exit(1);
    });
    const branch = await git.branch().catch(() => {
      console.warn("Failed getting branch name");
      process.exit(1);
    });

    const gitlab = new GitLab(process.env.GITLAB_TOKEN);
    const project = await gitlab.projectByUrl(repoName);

    if (!project) {
      const name = colors.bold(repoName);
      const branchName = colors.bold(branch);

      console.warn(
        `Trying to find project for ${name} on branch ${branchName}`
      );
      console.warn("No Gitlab project found for this repository.");
      process.exit(0);
    }

    const pipeline = await project.pipelineBy(branch);

    if (pipeline) {
      new Display(
        new DisplayCommit(await project.commitBy(pipeline.sha), pipeline),
        new DisplayMergeRequest(await project.mergeRequestBy(branch)),
        new DisplayEnvironment(await project.environmentsBy(branch)),
        new DisplayPipelineJobs(await project.pipelineJobsBy(pipeline.id))
      );
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching pipeline status:", error.message);
    }
    console.error(error);
  }
}

main();
