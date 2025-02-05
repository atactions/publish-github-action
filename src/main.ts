import * as core from '@actions/core';
import * as exec from '@actions/exec';
const Github = require('@actions/github');
const Octokit = require('@octokit/rest').plugin(require('@octokit/plugin-retry'));
const fs = require('fs');
const semver = require('semver');
const githubToken = core.getInput('github_token', { required: true });
const context = Github.context;
const octokit = new Octokit({auth: githubToken});
const _check_tag = core.getInput('check_tag', { required: false });
console.log("check_tag ",_check_tag);
var check_tag = _check_tag ==='true';

async function run() {
  try {
    let json = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    let version = 'v'+json.version;
    let minorVersion = 'v'+semver.major(json.version)+'.'+semver.minor(json.version);
    let majorVersion = 'v'+semver.major(json.version);
    let branchName: string = 'releases/'+version;

    let tags = await octokit.repos.listTags({owner: context.repo.owner, repo: context.repo.repo});
    if (context.repo.owner=='atactions' && context.repo.repo=='publish-github-action'){
      check_tag=false;
      console.log('self call,check_tag is always false.');
    }
    if (check_tag && tags.data.some(tag => tag.name === version)) {
      console.log('Tag', version, 'already exists,return.');
      return
    } else {
      console.log('Tag already exists, will be deleted first.');     
    }
    var f=(value)=>{console.log('check_tag:',value);}
    if(!check_tag){     
      await exec.exec('git', ['branch', '-d', branchName],{ignoreReturnCode:true}).catch(f);
      console.log('delete branch ',branchName);
      await exec.exec('git', ['tag', '-d', version],{ignoreReturnCode:true}).catch(f);
      console.log('delete tag ',version);
      await exec.exec('git', ['tag', '-d', majorVersion],{ignoreReturnCode:true}).catch(f);
      console.log('delete tag ',majorVersion);
      await exec.exec('git', ['tag', '-d', minorVersion],{ignoreReturnCode:true}).catch(f);
      console.log('delete tag ',minorVersion);
    }
    var f=(value)=>{console.log('delete refs:',value);}
    await exec.exec('git', ['checkout', 'master']);
    await exec.exec('git', ['checkout', '-b', branchName],{ignoreReturnCode:true}).catch(f);
    await exec.exec('npm install --production');
    await exec.exec('git config --global user.email "github-actions[bot]@users.noreply.github.com"');
    await exec.exec('git config --global user.name "github-actions[bot]"');
    await exec.exec('git remote set-url origin https://x-access-token:'+githubToken+'@github.com/'+context.repo.owner+'/'+context.repo.repo+'.git');
    await exec.exec('git add -f node_modules');
    await exec.exec('git commit -a -m "prod dependencies"');
    await exec.exec('git', ['push', 'origin', ':'+branchName],{ignoreReturnCode:true}).catch(f);
    await exec.exec('git', ['push', 'origin', branchName]);

    await exec.exec('git', ['push', 'origin', ':refs/tags/'+version],{ignoreReturnCode:true}).catch(f);
    await exec.exec('git', ['tag', '-fa', version, '-m', version]);
    await exec.exec('git', ['push', 'origin', ':refs/tags/'+minorVersion],{ignoreReturnCode:true}).catch(f);
    await exec.exec('git', ['tag', '-f', minorVersion]);
    await exec.exec('git', ['push', 'origin', ':refs/tags/'+majorVersion],{ignoreReturnCode:true}).catch(f);
    await exec.exec('git', ['tag', '-f', majorVersion]);
    await exec.exec('git push --tags origin')

    await octokit.repos.createRelease({owner: context.repo.owner, repo: context.repo.repo, tag_name: version, name: version});

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
