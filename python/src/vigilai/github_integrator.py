"""GitHub Integrator for creating pull requests with fix proposals"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
from github import Github, GithubException
from .ai_diagnostician import Diagnosis
from .code_generator import FixProposal


@dataclass
class GitHubConfig:
    """GitHub configuration"""
    token: str
    owner: str
    repo: str
    base_branch: Optional[str] = None
    branch_prefix: Optional[str] = None
    labels: Optional[List[str]] = None
    assignees: Optional[List[str]] = None


@dataclass
class PullRequest:
    """Pull request information"""
    number: int
    url: str
    branch: str


class GitHubIntegrator:
    """GitHub Integrator class for creating pull requests"""
    
    DEFAULT_BASE_BRANCH = 'main'
    DEFAULT_BRANCH_PREFIX = 'vigilai-fix'
    
    def __init__(self, config: GitHubConfig):
        """Initialize GitHub integrator with configuration"""
        self.config = config
        
        # Set defaults
        if not self.config.base_branch:
            self.config.base_branch = self.DEFAULT_BASE_BRANCH
        if not self.config.branch_prefix:
            self.config.branch_prefix = self.DEFAULT_BRANCH_PREFIX
        if not self.config.labels:
            self.config.labels = []
        if not self.config.assignees:
            self.config.assignees = []
        
        # Initialize GitHub client
        self.github = Github(self.config.token)
        self.repository = self.github.get_repo(f"{self.config.owner}/{self.config.repo}")
    
    def create_fix_pr(
        self,
        proposal: FixProposal,
        diagnosis: Diagnosis
    ) -> PullRequest:
        """Create a pull request for a fix proposal"""
        try:
            # Create a new branch
            branch_name = self._create_branch(proposal.incident_id)
            
            # Commit changes to the branch
            self._commit_changes(branch_name, proposal)
            
            # Create pull request
            pr = self._create_pull_request(branch_name, proposal, diagnosis)
            
            return pr
            
        except Exception as error:
            print(f"Failed to create GitHub PR: {str(error)}")
            raise
    
    def _create_branch(self, incident_id: str) -> str:
        """Create a new branch for the fix"""
        try:
            # Get the base branch reference
            base_ref = self.repository.get_git_ref(f"heads/{self.config.base_branch}")
            base_sha = base_ref.object.sha
            
            # Create branch name with timestamp to ensure uniqueness
            timestamp = int(datetime.now().timestamp() * 1000)
            branch_name = f"{self.config.branch_prefix}/{incident_id}-{timestamp}"
            
            # Create new branch
            self.repository.create_git_ref(
                ref=f"refs/heads/{branch_name}",
                sha=base_sha
            )
            
            return branch_name
            
        except GithubException as error:
            if error.status == 422:
                # Branch already exists, append additional timestamp
                new_timestamp = int(datetime.now().timestamp() * 1000)
                branch_name = f"{self.config.branch_prefix}/{incident_id}-{new_timestamp}"
                
                base_ref = self.repository.get_git_ref(f"heads/{self.config.base_branch}")
                base_sha = base_ref.object.sha
                
                self.repository.create_git_ref(
                    ref=f"refs/heads/{branch_name}",
                    sha=base_sha
                )
                
                return branch_name
            raise
    
    def _commit_changes(
        self,
        branch_name: str,
        proposal: FixProposal
    ) -> None:
        """Commit file changes to the branch"""
        try:
            # Get the latest commit SHA for the branch
            ref = self.repository.get_git_ref(f"heads/{branch_name}")
            latest_commit_sha = ref.object.sha
            
            # Get the tree for the latest commit
            commit = self.repository.get_git_commit(latest_commit_sha)
            base_tree_sha = commit.tree.sha
            
            # Create blobs for each file change
            tree_elements = []
            for change in proposal.changes:
                # Create blob
                blob = self.repository.create_git_blob(
                    content=change.new_content,
                    encoding='utf-8'
                )
                
                tree_elements.append({
                    'path': change.path,
                    'mode': '100644',
                    'type': 'blob',
                    'sha': blob.sha
                })
            
            # Create a new tree
            new_tree = self.repository.create_git_tree(
                tree=tree_elements,
                base_tree=self.repository.get_git_tree(base_tree_sha)
            )
            
            # Create a new commit
            new_commit = self.repository.create_git_commit(
                message=f"Fix: {proposal.description}",
                tree=new_tree,
                parents=[self.repository.get_git_commit(latest_commit_sha)]
            )
            
            # Update the branch reference
            ref.edit(sha=new_commit.sha)
            
        except Exception as error:
            print(f"Failed to commit changes: {str(error)}")
            raise
    
    def _create_pull_request(
        self,
        branch_name: str,
        proposal: FixProposal,
        diagnosis: Diagnosis
    ) -> PullRequest:
        """Create a pull request"""
        try:
            # Build PR title and body
            title = self._build_pr_title(proposal, diagnosis)
            body = self._build_pr_body(proposal, diagnosis)
            
            # Create the pull request
            pr = self.repository.create_pull(
                title=title,
                body=body,
                head=branch_name,
                base=self.config.base_branch
            )
            
            # Add labels if configured
            if self.config.labels and len(self.config.labels) > 0:
                pr.add_to_labels(*self.config.labels)
            
            # Add assignees if configured
            if self.config.assignees and len(self.config.assignees) > 0:
                pr.add_to_assignees(*self.config.assignees)
            
            return PullRequest(
                number=pr.number,
                url=pr.html_url,
                branch=branch_name
            )
            
        except Exception as error:
            print(f"Failed to create pull request: {str(error)}")
            raise
    
    def _build_pr_title(self, proposal: FixProposal, diagnosis: Diagnosis) -> str:
        """Build PR title"""
        category = diagnosis.category.replace('_', ' ')
        return f"Fix: {category} - {diagnosis.root_cause[:80]}"
    
    def _build_pr_body(self, proposal: FixProposal, diagnosis: Diagnosis) -> str:
        """Build PR body"""
        lines = [
            f"# Fix: {diagnosis.category.replace('_', ' ')} Issue",
            "",
            "## Incident Details",
            f"- **ID**: {proposal.incident_id}",
            f"- **Detected**: {datetime.fromtimestamp(diagnosis.timestamp / 1000).isoformat()}",
            f"- **Category**: {diagnosis.category}",
            f"- **Confidence**: {int(diagnosis.confidence * 100)}%",
            "",
            "## Diagnosis",
            diagnosis.explanation,
            "",
            "## Root Cause",
            diagnosis.root_cause,
            "",
        ]
        
        # Add code location if available
        if diagnosis.code_location:
            lines.append("## Code Location")
            lines.append(f"- **File**: {diagnosis.code_location.file}")
            if diagnosis.code_location.line:
                lines.append(f"- **Line**: {diagnosis.code_location.line}")
            if diagnosis.code_location.function:
                lines.append(f"- **Function**: {diagnosis.code_location.function}")
            lines.append("")
        
        # Add changes
        lines.append("## Changes")
        if len(proposal.changes) > 0:
            for change in proposal.changes:
                lines.append(f"- Modified: {change.path}")
        else:
            lines.append("No file changes generated.")
        lines.append("")
        
        # Add suggested fix if available
        if diagnosis.suggested_fix:
            lines.append("## Suggested Fix")
            lines.append(diagnosis.suggested_fix)
            lines.append("")
        
        # Add test cases if available
        if proposal.test_cases and len(proposal.test_cases) > 0:
            lines.append("## Testing")
            for test_case in proposal.test_cases:
                lines.append(f"- {test_case}")
            lines.append("")
        
        lines.append("---")
        lines.append("*Generated automatically by VigilAI SDK*")
        
        return "\n".join(lines)
