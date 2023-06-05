module.exports = {
  getDeletedFiles: async ({ github, context }) => {
    const PATHS = ['src/fragments', 'src/pages'];

    const {
      issue: { number: issue_number },
      repo: { owner, repo }
    } = context;

    const deletedFiles = await github.paginate(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/files',
      { owner, repo, pull_number: issue_number },
      (response) =>
        response.data
          .filter((file) => file.status === 'removed')
          .filter((file) =>
            PATHS.some((path) => file.filename.startsWith(path))
          )
    );

    console.log('Deleted file count: ', deletedFiles.length);
    console.log(
      'Deleted files: ',
      deletedFiles.map((file) => file.filename)
    );

    return deletedFiles.length;
  },
  addRedirectsNeededLabel: async ({ github, context, fs, artifactName }) => {
    const {
      payload: {
        repository: {
          owner: { login: ownerLogin },
          name: repoName
        }
      }
    } = context;

    const artifactContents = fs
      .readFileSync(`./${artifactName}.txt`)
      .toString();

    const [prNumber, numberOfDeletedFiles] = artifactContents.split('\n');

    console.log('PR number that triggered workflow: ', prNumber);
    console.log('Number of deleted files: ', numberOfDeletedFiles);

    if (Number(numberOfDeletedFiles) > 0) {
      github.rest.issues.addLabels({
        owner: ownerLogin,
        repo: repoName,
        issue_number: Number(prNumber),
        labels: ['redirects-needed']
      });
    }
  }
};
