export type GitLabProjectDTO = {
  id: string;
  name: string;
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  web_url: string;
};

export class GitlabProject {
  GITLAB_API_PIPELINES_URL = `/projects/:id/pipelines`;
  GITLAB_API_PIPELINE_JOBS_URL = `/projects/:id/pipelines/:pipeline_id/jobs`;
  GITLAB_API_COMMIT_URL = `/projects/:id/repository/commits/:sha`;
  GITLAB_API_PROJECT_MRS_URL = `/projects/:id/merge_requests`;
  GITLAB_API_ENVS_URL = `/projects/:id/environments`;

  constructor(public gitlab: GitLab, public projectId: string) {}

  async commitBy(sha: string) {
    return this.gitlab._get(
      this.GITLAB_API_COMMIT_URL.replace(":id", this.projectId).replace(
        ":sha",
        sha
      )
    );
  }

  async pipelineBy(branch: string) {
    return this.gitlab
      ._get(this.GITLAB_API_PIPELINES_URL.replace(":id", this.projectId), {
        ref: branch,
        per_page: 1,
      })
      .then((pipelines) => pipelines[0]);
  }

  async mergeRequestBy(branch: string) {
    return this.gitlab
      ._get(this.GITLAB_API_PROJECT_MRS_URL.replace(":id", this.projectId), {
        source_branch: branch,
      })
      .then((mrs) => mrs[0]);
  }

  async environmentsBy(branch: string) {
    return this.gitlab
      ._get(this.GITLAB_API_ENVS_URL.replace(":id", this.projectId), {
        search: branch,
      })
      .then((envs) => envs[0]);
  }

  async pipelineJobsBy(pipelineId: string) {
    return this.gitlab._get(
      this.GITLAB_API_PIPELINE_JOBS_URL.replace(":id", this.projectId).replace(
        ":pipeline_id",
        pipelineId
      )
    );
  }
}

export class GitLab {
  BASE_URL = "https://gitlab.com/api/v4";
  GITLAB_API_PROJECTS_URL = `/projects`;

  constructor(public token: string) {}

  async _get(url: string, params = {}) {
    return fetch(
      `${this.BASE_URL}${url}?${new URLSearchParams(params).toString()}`,
      {
        headers: { "Private-Token": this.token },
      }
    ).then((res) => res.json());
  }

  async projectsByName(name: string) {
    return this._get(this.GITLAB_API_PROJECTS_URL, {
      search: name,
      per_page: 100,
    }).then((projects) =>
      projects.map((item: GitLabProjectDTO) => ({
        id: item.id,
        name: item.name,
        ssh_url_to_repo: item.ssh_url_to_repo,
        http_url_to_repo: item.http_url_to_repo,
        web_url: item.web_url,
      }))
    );
  }

  async myProjectsByName(name: string) {
    const filterProjects = (projects: GitLabProjectDTO[], name: string) =>
      projects.filter(
        (project) =>
          project.ssh_url_to_repo.includes(name) ||
          project.http_url_to_repo.includes(name)
      );

    return filterProjects(await this.projectsByName(name), name).map(
      (project) => new GitlabProject(this, project.id)
    );
  }
}
