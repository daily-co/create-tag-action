const core = require("@actions/core");
const github = require("@actions/github");

function stringifyDate(date) {
  return date.toISOString().substring(0, 10);
}

function getTagName(appName, environment) {
  date = stringifyDate(new Date());
  let tag = `${appName}-${date}`;
  if (environment) {
    tag = `${tag}-${environment}`;
  }
  return tag;
}

async function run() {
  try {
    const appName = core.getInput("app-name", {required: true});
    if (!appName) {
      core.setFailed('Input "app-name" is missing');
    }

    let environment = "";
    const environmentInput = core.getInput("environment", {required: false});
    if (environmentInput) {
      environment = environmentInput;
    }

    let githubToken = core.getInput("github-token", {required: false});
    if (!githubToken) {
      if (process.env.GITHUB_TOKEN) {
        githubToken = process.env.GITHUB_TOKEN;
      } else {
        core.setFailed(
          'Input "github-token" is missing, and not provided in environment'
        );
      }
    }

    const octokit = github.getOctokit(githubToken);
    let { owner, repo } = github.context.repo;

    const repoInput = core.getInput("repo", {required: false});
    if (repoInput) {
      repo = repoInput;
    }

    const ownerInput = core.getInput("owner", {required: false});
    if (ownerInput) {
      owner = ownerInput;
    }

    const tagName = getTagName(appName, environment);
    core.setOutput("tag", tagName);
    const tagMessage = `${tagName} deployed via GitHub Actions`;

    const sha = core.getInput("sha", {required: false}) || process.env.GITHUB_SHA;
    if (!sha) {
      core.setFailed(
        'SHA to tag must be provided as input "sha" or environment variable "GITHUB_SHA"'
      );
    }

    console.log(`Repo: ${owner}/${repo}, Tag: ${tagName}, SHA: ${sha}`);

    const createdTag = await octokit.git.createTag({
      owner,
      repo,
      tag: tagName,
      message: tagMessage,
      object: sha,
      type: "commit",
    });

    console.log("Tag created successfully.");

    const refName = `tags/${tagName}`;
    let refExists = false;

    try {
      const existingRef = await octokit.git.getRef({
        owner,
        repo,
        ref: refName,
      });
      refExists = true;
      console.log("Existing ref found.  Will update.");
    } catch (error) {
      if (error.status != 404) {
        throw error;
      }
    }

    let newRef;

    if (refExists) {
      // Update ref to point to current commit
      newRef = await octokit.git.updateRef({
        owner,
        repo,
        ref: refName,
        sha,
      });
      console.log("Ref updated.");
    } else {
      // Create new ref
      const fullRefName = `refs/${refName}`;
      newRef = await octokit.git.createRef({
        owner,
        repo,
        ref: fullRefName,
        sha,
      });
      console.log("Ref created.");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
