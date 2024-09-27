# Gitlab Status

GitLab CLI rich status display tool

This tool displays the status of your GitLab pipelines in your terminal.
For given repository directory, it will display the following information:

- Commit
- Merge Request
- Environment
- Pipeline Jobs

<p align="center">
  <img alt="GitLab Status Preview" src="https://github.com/JiLiZART/glab-status/blob/main/.github/screenshot.png?raw=true" />
</p>

## Usage

```bash
$ cd my-gitlab-project
$ glab-status
```

## Installation

```bash
$ npm install -g glab-status
```

or use npx

```bash
$ npx glab-status
```

## Configuration

You need to set the `GITLAB_TOKEN` environment variable to your GitLab token.

Follow https://gitlab.com/-/user_settings/personal_access_tokens to generate a new token.
