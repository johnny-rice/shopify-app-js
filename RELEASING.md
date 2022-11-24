# Releasing shopify-node-api

1. Check the Semantic Versioning page for info on how to version the new release: [http://semver.org](http://semver.org)

1. Ensure your local repo is up-to-date

   ```shell
   git checkout main && git pull
   ```

1. Add an entry for the new release to `CHANGELOG.md`, and/or move the contents from the _Unreleased_ to the new release

1. Increment the version in `src/version.ts`.

1. Stage the `CHANGELOG.md` and `src/version.ts` files

   ```shell
   git add CHANGELOG.md src/version.ts
   ```

1. The following command updates the version (in `package.json`), creates the appropriate tag, commits all staged changes and pushes to the remote repository

   ```shell
   yarn version [ --patch | --minor | --major ]
   ```

   Select the applicable option to the `yarn version` command to increment the corresponding part of the version number, i.e., for a version of `x.y.z`,

   - `--patch` to increment the `z`
   - `--minor` to increment the `y`
   - `--major` to increment the `x`

   The `preversion` and `postversion` scripts in `package.json` take care of the pre (testing) and post (pushing) actions.

1. Login to `shipit` and press _Deploy_ on the appropriate commit (the commit description will be the version number).

## Release Candidates

For significant API changes that could result in significant refactoring on the part of developers, consider releasing a few _Release Candidate_ versions in advance of the final version. `shipit` is configured to do this from the `main` branch.

1. Ensure your local repo is up-to-date

   ```shell
   git checkout main && git pull
   ```

1. (optional) Add an entry for the release candidate to `CHANGELOG.md`

1. Increment the version in `src/version.ts`, ensuring that it ends with `-rcN`, where `N` starts at `1` and increments with each Release Candidate.

1. Stage the `CHANGELOG.md` and `src/version.ts` files

   ```shell
   git add CHANGELOG.md src/version.ts
   ```

1. Push the files to the remote repository, along with the annotated tag.

   ```shell
   yarn version --new-version X.Y.Z-rcN
   ```

1. Login to `shipit`, search for the _next_ environment for `shopify-app-express`, and press _Deploy_ on the appropriate commit (the commit description will be the version number).