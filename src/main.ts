import * as core from '@actions/core'
import * as github from '@actions/github'

const query = `query($repo: String!, $owner: String!, $environment: [String!]) {
  repository(name: $repo, owner: $owner) {
    deployments(environments: $environment, last: 1) {
      edges {
        node {
          state
          latestStatus {
            logUrl
            state
            environmentUrl
          }
        }
      }
    }
  }
}
`

async function run(): Promise<void> {
  try {
    const token = (core.getInput('github_token') ||
      process.env.GITHUB_TOKEN) as string

    const octokit = new github.GitHub(token)
    const context = github.context

    const environment = core.getInput('environment')
    const owner = core.getInput('owner')
    const repo = core.getInput('repo')

    const graphql_result = await octokit.graphql(query, {
      environment: [environment],
      owner,
      repo
    })

    core.debug('------ octokit context ---------')
    core.debug(JSON.stringify(context))

    core.debug('===== graphql result ======')
    core.debug(JSON.stringify(graphql_result))
    const request = await octokit.repos.listDeployments({
      ...context.repo,
      environment
    })

    const deployments = request.data

    core.debug('====== deployment ======')
    core.debug(JSON.stringify(deployments))
    if (deployments.length > 0) {
      core.setOutput('payload', JSON.stringify(deployments))
      core.setOutput('deployment_id', deployments[0].id.toString())
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
