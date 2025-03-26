import { tryJSONparse } from "./util.ts";

const isDebug = process.env.DEBUG === "glab-status";

const log = isDebug ? console.debug.bind(console, "[gitlab]") : function () {};

export type GitLabProjectDTO = {
  id: string;
  name: string;
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  web_url: string;
  default_branch: string;
};

export class GitlabProject {
  GITLAB_API_PIPELINES_URL = `/projects/:id/pipelines`;
  GITLAB_API_PIPELINE_JOBS_URL = `/projects/:id/pipelines/:pipeline_id/jobs`;
  GITLAB_API_COMMIT_URL = `/projects/:id/repository/commits/:sha`;
  GITLAB_API_PROJECT_MRS_URL = `/projects/:id/merge_requests`;
  GITLAB_API_ENVS_URL = `/projects/:id/environments`;

  constructor(
    public gitlab: GitLab,
    public projectId: string,
    public defaultBranch: string
  ) {}

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
      .then((pipelines) => pipelines?.length  ? pipelines[0] : null);
  }

  async mergeRequestBy(branch: string) {
    if (branch === this.defaultBranch) {
      return null;
    }

    return this.gitlab
      ._get(this.GITLAB_API_PROJECT_MRS_URL.replace(":id", this.projectId), {
        source_branch: branch,
        target_branch: this.defaultBranch,
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
  // API_PREFIX = "https://gitlab.com/api/v4";
  GITLAB_API_PROJECT_URL = `projects/:url`;

  constructor(public token: string, public hostname: string) {}

  async _get(url: string, params = {}) {
    const query = new URLSearchParams(params || {}).toString();
    const fetchUrl = `https://${this.hostname}/api/v4/${url}?${query}`

    log(`GET ${fetchUrl}`);

    return fetch(fetchUrl, {
      headers: { "Private-Token": this.token },
    }).then(async (res) => {
      if (res.ok) {
        const json = await res.json();

        log(`GET ${fetchUrl} success`, json);

        return json;
      }

      const text = await res.text()
      const json = tryJSONparse(text);
      const message = json?.message || text;

      log(`GET ${fetchUrl} error`, message);

      return Promise.reject(new Error(message));
    });
  }

  async projectByUrl(url: string) {
    return this._get(
      this.GITLAB_API_PROJECT_URL.replace(":url", encodeURIComponent(url))
    ).then((item: GitLabProjectDTO) => {
      return item?.id
        ? new GitlabProject(this, item.id, item.default_branch)
        : null;
    });
  }
}
