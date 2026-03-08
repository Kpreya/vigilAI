/**
 * GitHub Integrator for creating pull requests with fix proposals
 */

import { Octokit } from '@octokit/rest';
import { Diagnosis } from './ai-diagnostician';
import { FixProposal } from './code-generator';

/**
 * GitHub configuration
 */
export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  baseBranch?: string;
  branchPrefix?: string;
  labels?: string[];
  assignees?: string[];
}

/**
 * Pull request information
 */
export interface PullRequest {
  number: number;
  url: string;
  branch: string;
}

/**
 * GitHub Integrator class for creating pull requests
 */
export class GitHubIntegrator {
  private octokit: Octokit;
  private config: GitHubConfig;
  private readonly DEFAULT_BASE_BRANCH = 'main';
  private readonly DEFAULT_BRANCH_PREFIX = 'vigilai-fix';

  constructor(config: GitHubConfig) {
    this.config = {
      ...config,
      baseBranch: config.baseBranch || this.DEFAULT_BASE_BRANCH,
      branchPrefix: config.branchPrefix || this.DEFAULT_BRANCH_PREFIX,
      labels: config.labels || [],
      assignees: config.assignees || [],
    };

    this.octokit = new Octokit({
      auth: this.config.token,
    });
  }

  /**
   * Create a pull request for a fix proposal
   */
  async createFixPR(
    proposal: FixProposal,
    diagnosis: Diagnosis
  ): Promise<PullRequest> {
    try {
      // Create a new branch
      const branchName = await this.createBranch(proposal.incidentId);

      // Commit changes to the branch
      await this.commitChanges(branchName, proposal);

      // Create pull request
      const pr = await this.createPullRequest(branchName, proposal, diagnosis);

      return pr;

    } catch (error) {
      console.error('Failed to create GitHub PR:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Create a new branch for the fix
   */
  private async createBranch(incidentId: string): Promise<string> {
    try {
      // Get the base branch reference
      const { data: baseRef } = await this.octokit.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${this.config.baseBranch}`,
      });

      // Create branch name with timestamp to ensure uniqueness
      const timestamp = Date.now();
      const branchName = `${this.config.branchPrefix}/${incidentId}-${timestamp}`;

      // Create new branch
      await this.octokit.git.createRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      });

      return branchName;

    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as any).status === 422) {
        // Branch already exists, append additional timestamp
        const newTimestamp = Date.now();
        const branchName = `${this.config.branchPrefix}/${incidentId}-${newTimestamp}`;
        
        const { data: baseRef } = await this.octokit.git.getRef({
          owner: this.config.owner,
          repo: this.config.repo,
          ref: `heads/${this.config.baseBranch}`,
        });

        await this.octokit.git.createRef({
          owner: this.config.owner,
          repo: this.config.repo,
          ref: `refs/heads/${branchName}`,
          sha: baseRef.object.sha,
        });

        return branchName;
      }
      throw error;
    }
  }

  /**
   * Commit file changes to the branch
   */
  private async commitChanges(
    branchName: string,
    proposal: FixProposal
  ): Promise<void> {
    try {
      // Get the latest commit SHA for the branch
      const { data: refData } = await this.octokit.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${branchName}`,
      });

      const latestCommitSha = refData.object.sha;

      // Get the tree for the latest commit
      const { data: commitData } = await this.octokit.git.getCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        commit_sha: latestCommitSha,
      });

      const baseTreeSha = commitData.tree.sha;

      // Create blobs for each file change
      const tree = await Promise.all(
        proposal.changes.map(async (change) => {
          const { data: blob } = await this.octokit.git.createBlob({
            owner: this.config.owner,
            repo: this.config.repo,
            content: Buffer.from(change.newContent).toString('base64'),
            encoding: 'base64',
          });

          return {
            path: change.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          };
        })
      );

      // Create a new tree
      const { data: newTree } = await this.octokit.git.createTree({
        owner: this.config.owner,
        repo: this.config.repo,
        base_tree: baseTreeSha,
        tree,
      });

      // Create a new commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        message: `Fix: ${proposal.description}`,
        tree: newTree.sha,
        parents: [latestCommitSha],
      });

      // Update the branch reference
      await this.octokit.git.updateRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${branchName}`,
        sha: newCommit.sha,
      });

    } catch (error) {
      console.error('Failed to commit changes:', error);
      throw error;
    }
  }

  /**
   * Create a pull request
   */
  private async createPullRequest(
    branchName: string,
    proposal: FixProposal,
    diagnosis: Diagnosis
  ): Promise<PullRequest> {
    try {
      // Build PR title and body
      const title = this.buildPRTitle(proposal, diagnosis);
      const body = this.buildPRBody(proposal, diagnosis);

      // Create the pull request
      const { data: pr } = await this.octokit.pulls.create({
        owner: this.config.owner,
        repo: this.config.repo,
        title,
        body,
        head: branchName,
        base: this.config.baseBranch!,
      });

      // Add labels if configured
      if (this.config.labels && this.config.labels.length > 0) {
        await this.octokit.issues.addLabels({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: pr.number,
          labels: this.config.labels,
        });
      }

      // Add assignees if configured
      if (this.config.assignees && this.config.assignees.length > 0) {
        await this.octokit.issues.addAssignees({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: pr.number,
          assignees: this.config.assignees,
        });
      }

      return {
        number: pr.number,
        url: pr.html_url,
        branch: branchName,
      };

    } catch (error) {
      console.error('Failed to create pull request:', error);
      throw error;
    }
  }

  /**
   * Build PR title
   */
  private buildPRTitle(proposal: FixProposal, diagnosis: Diagnosis): string {
    const category = diagnosis.category.replace('_', ' ');
    return `Fix: ${category} - ${diagnosis.rootCause.substring(0, 80)}`;
  }

  /**
   * Build PR body
   */
  private buildPRBody(proposal: FixProposal, diagnosis: Diagnosis): string {
    const lines: string[] = [
      `# Fix: ${diagnosis.category.replace('_', ' ')} Issue`,
      '',
      '## Incident Details',
      `- **ID**: ${proposal.incidentId}`,
      `- **Detected**: ${new Date(diagnosis.timestamp).toISOString()}`,
      `- **Category**: ${diagnosis.category}`,
      `- **Confidence**: ${(diagnosis.confidence * 100).toFixed(0)}%`,
      '',
      '## Diagnosis',
      diagnosis.explanation,
      '',
      '## Root Cause',
      diagnosis.rootCause,
      '',
    ];

    // Add code location if available
    if (diagnosis.codeLocation) {
      lines.push('## Code Location');
      lines.push(`- **File**: ${diagnosis.codeLocation.file}`);
      if (diagnosis.codeLocation.line) {
        lines.push(`- **Line**: ${diagnosis.codeLocation.line}`);
      }
      if (diagnosis.codeLocation.function) {
        lines.push(`- **Function**: ${diagnosis.codeLocation.function}`);
      }
      lines.push('');
    }

    // Add changes
    lines.push('## Changes');
    if (proposal.changes.length > 0) {
      proposal.changes.forEach(change => {
        lines.push(`- Modified: ${change.path}`);
      });
    } else {
      lines.push('No file changes generated.');
    }
    lines.push('');

    // Add suggested fix if available
    if (diagnosis.suggestedFix) {
      lines.push('## Suggested Fix');
      lines.push(diagnosis.suggestedFix);
      lines.push('');
    }

    // Add test cases if available
    if (proposal.testCases && proposal.testCases.length > 0) {
      lines.push('## Testing');
      proposal.testCases.forEach(testCase => {
        lines.push(`- ${testCase}`);
      });
      lines.push('');
    }

    lines.push('---');
    lines.push('*Generated automatically by VigilAI SDK*');

    return lines.join('\n');
  }
}
