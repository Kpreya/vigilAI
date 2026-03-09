const { Octokit } = require('octokit');
require('dotenv').config();

async function testGitHubAccess() {
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!githubToken) {
    console.error('❌ GITHUB_TOKEN not found in environment variables');
    return;
  }
  
  console.log('✓ GitHub token found');
  console.log('Token preview:', githubToken.substring(0, 10) + '...');
  
  try {
    const octokit = new Octokit({ auth: githubToken });
    
    // Test 1: Get authenticated user
    console.log('\n=== Test 1: Authentication ===');
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log('✓ Authenticated as:', user.login);
    console.log('  Name:', user.name);
    console.log('  Type:', user.type);
    
    // Test 2: Check repository access
    console.log('\n=== Test 2: Repository Access ===');
    const owner = 'techiepookie';
    const repo = 'vigilai';
    
    try {
      const { data: repoData } = await octokit.rest.repos.get({
        owner,
        repo
      });
      console.log('✓ Can access repository:', repoData.full_name);
      console.log('  Default branch:', repoData.default_branch);
      console.log('  Permissions:');
      console.log('    - Admin:', repoData.permissions?.admin || false);
      console.log('    - Push:', repoData.permissions?.push || false);
      console.log('    - Pull:', repoData.permissions?.pull || false);
      
      // Test 3: Check if we can create branches
      console.log('\n=== Test 3: Branch Creation Test ===');
      const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${repoData.default_branch}`
      });
      console.log('✓ Can read default branch ref');
      console.log('  SHA:', refData.object.sha);
      
      // Test 4: Check if we can create issues
      console.log('\n=== Test 4: Issue Creation Test ===');
      const testIssue = await octokit.rest.issues.create({
        owner,
        repo,
        title: '[TEST] VigilAI GitHub Integration Test',
        body: 'This is a test issue created by VigilAI to verify GitHub integration. You can safely close this.'
      });
      console.log('✓ Successfully created test issue #' + testIssue.data.number);
      console.log('  URL:', testIssue.data.html_url);
      
      // Close the test issue immediately
      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: testIssue.data.number,
        state: 'closed'
      });
      console.log('✓ Test issue closed');
      
      console.log('\n✅ All tests passed! GitHub integration is working correctly.');
      console.log('\nYou can now create PRs from the VigilAI platform.');
      
    } catch (repoError) {
      console.error('❌ Repository access error:', repoError.message);
      console.error('\nPossible issues:');
      console.error('1. Token does not have access to this repository');
      console.error('2. Repository name is incorrect');
      console.error('3. Token lacks required permissions (repo scope)');
    }
    
  } catch (error) {
    console.error('❌ GitHub API error:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Invalid or expired token');
    console.error('2. Token lacks required scopes');
    console.error('3. Network connectivity issues');
  }
}

testGitHubAccess();
