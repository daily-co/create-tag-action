# Create Tag Action

A GitHub action that tags the repo with a tag formatted according to our
[version tagging standard](https://www.notion.so/dailyco/Version-Tagging-Proposal-5cd4e26542234f898d5c0a38e3cb08bd).

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
