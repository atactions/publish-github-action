# Publish GitHub Action
![](https://img.shields.io/github/v/release/atactions/publish-github-action?style=flat-square)

Forked from [TG908/publish-github-action](https://github.com/TG908/publish-github-action) ![](https://img.shields.io/github/v/release/tg908/publish-github-action?style=flat-square).Add `check_tag` parameter to do nothing when setted to `true` and the tag `version` exists-This is the way of TG908/publish-github-action work.When `check_tag` parameter setted to false,tags of `version`,`majorVersion` and `minVersion` are deleted first.

This action creates a release branch for your GitHub Actions which will be automatically tagged and released. The release version can be  defined in `package.json`.

# Example Workflow

```
name: "Publish GitHub Action"
on:
  push:
    branches:    
      - master

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1
    - uses: atactions/publish-github-action@v1
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        check_tag: true
```
