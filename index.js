const core = require('@actions/core');
const github = require('@actions/github');

function stringifyDate(date) {
  return date.toISOString().substring(0, 10);
}

function getTagName(appName, environment) {
  date = stringifyDate(new Date());
  return `${appName}-${date}-${environment}`;
}

async function run() {
  try {
    const appName = core.getInput('app-name');
    if (!appName) {
      core.setFailed('Input "app-name" is missing');
    }

    const environment = core.getInput('environment');
    if (!environment) {
      core.setFailed('Input "environment" is missing');
    }

    let githubToken = core.getInput('github-token');
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

    const tagName = getTagName(appName, environment);
    core.setOutput('tag', tagName);
    const tagMessage = `${tagName} deployed via GitHub Actions`;

    const { owner, repo } = github.context.repo;
    const sha = core.getInput('sha') || process.env.GITHUB_SHA;
    if (!sha) {
      core.setFailed(
        'SHA to tag must be provided as input "sha" or environment variable "GITHUB_SHA"'
      );
    }

    const createdTag = await octokit.git.createTag({
      owner,
      repo,
      tag: tagName,
      message: tagMessage,
      object: sha,
      type: 'commit',
    });

    console.log('Tag created successfully.');

    const refName = `tags/${tagName}`;
    let refExists = false;

    try {
      const existingRef = await octokit.git.getRef({
        owner,
        repo,
        ref: refName,
      });
      refExists = true;
      console.log('Existing ref found.  Will update.');
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
      console.log('Ref updated.');
    } else {
      // Create new ref
      const fullRefName = `refs/${refName}`;
      newRef = await octokit.git.createRef({
        owner,
        repo,
        ref: fullRefName,
        sha,
      });
      console.log('Ref created.');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
