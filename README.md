# Create Tag Action

A GitHub action that tags the repo with a tag formatted according to our convention.

## Background

At [Daily](https://www.daily.co), We use a monorepo to manage source code for most of our applications.
As we faced the challenge of maintaining our [changelog](https://docs.daily.co/changelog), we understood
that knowing what's changed in production wouldn't be as simple as comparing two commits in our monorepo,
because we don't deploy every application with every commit.

To help us understand what's changed, and which changes have been deployed to an environment, we developed
a convention for tags we apply in our GitHub:

```
Convention: [app-name]-[YYYY-mm-dd]-[environment]

Example: web-server-2020-07-01-production
```

We added automation around our deployments to automatically create these tags, pointing to the specific commit
which is being deployed.

## This Action

The `create-tag-action` creates GitHub tags after the deployment of an application according to this convention.
If the desired tag already exists, the commit with which the tag is associated is changed to the current commit
being used in the workflow.

# Inputs

- *app-name*: the name of the application being deployed
- *environment*: the name of the environment to which the application is being deployed
- *github-token*: a GitHub access token that gives the action access to tag the repository

# Outputs

- *tag*: the name of the final generated tag

# Notes

We want to use this from multiple repos without duplicating the code.  However, GitHub Actions does not support
using actions in one private repo from another repo.  The workaround is to clone the repo containing the action
in a separate `actions/checkout` step, and refer to it using the path in which it gets checked out.

# Example Usage

```
name: Example Deployment

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/checkout@v2
        with:
          repository: daily-co/create-tag-action
          token ${{ secrets.GITHUB_TOKEN }}
          path: .github/actions/create-tag-action
      - name: Tag the staging deployment
        uses: ./.github/actions/create-tag-action
        with:
          app-name: 'my-application'
          environment: 'qa'
          github-token: '${{ secrets.GITHUB_TOKEN }}'
```

# Building

```
# Once, for setting up ncc:
$ npm i -g @zeit/ncc

# When changed:
$ npm i
$ ncc build
