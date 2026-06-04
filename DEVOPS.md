# DevOps plan
## Why?
Adhereing to these standards will not take away our pain, but make it very very less severe. We're going to catch issues early, make code readable, and automate (almost) everything.

## Codebase & Repository configuration
The codebase would ideally be a monorepo -- meaning frontend and backend are in a single repository. Simple.

### Consistency - Formatting & Linting
To enforce consistency in the codebase, we're going to use [linting](https://www.sonarsource.com/resources/library/why-linter/) for both the frontend and backend. The way we're going to do this is through a nice tool called [Lefthook](https://lefthook.dev/). This tool basically runs scripts/commands locally on your machine before you commit/push any code to the repository. The tool can be set up to lint your code using a predefined linter for both the Frontend ([ESLint](https://eslint.org/)) and Backend ([Checkstyle](https://checkstyle.sourceforge.io/) for Java or something else). For formatting and the code to look nice, Lefthook can do the same before committing with [Prettier](https://prettier.io/).

**NOTE**: You can skip all these checks when committing with the `--no-verify` option when comitting, or pushing:
```bash
git commit --no-verify "...message"
```
or
```bash
git push --no-verify <remote> <branch>
```

### CI/CD
For Continuous Integration & Continuous Delivery (pipelines), we're going to use [GitHub Actions](https://github.com/features/actions), GitHub's integrated CI/CD tool. We're going to run linting here too, build both the frontend and backend to ensure they are at least in a "compileable" state, run the tests that we define - and finally deploy.

```
Lint --> Build ------> Deploy (only if merged to main)
  |____> Run Tests --|
```
We will deploy only when merging to the main branch to save on resources, and when Build and Test succeed -- otherwise we are deploying something that doesn't even work.
Additionally, we only build and run tests if the linting of the project succeeds, because otherwise its a redundant job.
**NOTE**: If you don't skip the pre-commit checks locally, linting will *never* be a problem in the pipeline.

## Containers
We're going to containerize the database we are using, and the backend project. The frontend project is not in strict need for containerization since its a separate component that will be hosted elsewhere.

## Deployment
### Backend
For deployment of the backend, we are going to leverage our containers, i.e., our [Docker Compose](https://docs.docker.com/compose/) configuration for our containers. We will create an [EC2 - Elastic Cloud Compute](https://aws.amazon.com/ec2/) (a virtual machine with only a terminal) instance on AWS that has a docker engine running on it. Upon each merge to main (given the project is in a state that we are satisfied with), our backend project's code will be pushed there, the Docker Compose runs, and we have containers exposed on a certain `<port>` and it is accessible through a **URL** that EC2 provides -- this will be our API URL (`<api_url>`). Now the frontend may use it.

```bash
<api_url>:<port>/<endpoint>
```
where `<endpoint>` can be any endpoint we define in the backend.

### Frontend
For deployment of the frontend, we're going to use the fact that we have a `dist/` directory directly when we build the frontend project. This folder can be used by [Cloudflare](https://www.cloudflare.com/) to host our website! All the frontend needs now is the API URL defined above.
