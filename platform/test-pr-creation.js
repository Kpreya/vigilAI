import { Octokit } from 'octokit';
import dotenv from 'dotenv';
dotenv.config();

async function testPRCreation() {
    const githubToken = process.env.GITHUB_TOKEN;
    const owner = "techiepookie";
    const repo = "vigilai";
    
    if (!githubToken) {
        console.error('❌ GITHUB_TOKEN not found in environment');
        return;
    }
    
    console.log('Testing GitHub PR creation workflow...\n');
    
    const octokit = new Octokit({ auth: githubToken });
    
    try {
        // Step 1: Verify repo access
        console.log('1️⃣ Verifying repository access...');
        const { data: repoData } = await octokit.rest.repos.get({
            owner,
            repo,
        });
        console.log(`✓ Repository found: ${repoData.full_name}`);
        console.log(`✓ Default branch: ${repoData.default_branch}\n`);
        
        // Step 2: Get base branch SHA
        console.log('2️⃣ Getting base branch SHA...');
        const { data: refData } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${repoData.default_branch}`,
        });
        const baseSha = refData.object.sha;
        console.log(`✓ Base SHA: ${baseSha}\n`);
        
        // Step 3: Create test branch
        const testBranchName = `test-pr-${Date.now()}`;
        console.log(`3️⃣ Creating test branch: ${testBranchName}...`);
        await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${testBranchName}`,
            sha: baseSha,
        });
        console.log(`✓ Branch created\n`);
        
        // Step 4: Get existing file
        const testFile = 'platform/app/demo/signup/page.tsx';
        console.log(`4️⃣ Fetching file: ${testFile}...`);
        const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: testFile,
            ref: repoData.default_branch
        });
        
        if (Array.isArray(fileData) || fileData.type !== 'file') {
            throw new Error('File not found or is a directory');
        }
        
        const originalContent = Buffer.from(fileData.content, 'base64').toString('utf8');
        console.log(`✓ File fetched (${originalContent.length} bytes)\n`);
        
        // Step 5: Modify file (add a comment)
        console.log('5️⃣ Creating modified version...');
        const modifiedContent = `// Test modification at ${new Date().toISOString()}\n${originalContent}`;
        const encodedContent = Buffer.from(modifiedContent).toString('base64');
        console.log(`✓ Content prepared\n`);
        
        // Step 6: Commit to branch
        console.log('6️⃣ Committing changes...');
        await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: testFile,
            message: 'test: Verify PR creation workflow',
            content: encodedContent,
            branch: testBranchName,
            sha: fileData.sha,
        });
        console.log(`✓ Changes committed\n`);
        
        // Step 7: Create PR
        console.log('7️⃣ Creating pull request...');
        const { data: prData } = await octokit.rest.pulls.create({
            owner,
            repo,
            title: '🧪 Test PR - Verify Workflow',
            head: testBranchName,
            base: repoData.default_branch,
            body: `## Test PR
            
This is an automated test to verify the PR creation workflow.

**Created at**: ${new Date().toISOString()}
**Test file**: \`${testFile}\`

You can safely close this PR.`,
        });
        
        console.log(`✅ SUCCESS! PR created:`);
        console.log(`   PR #${prData.number}`);
        console.log(`   URL: ${prData.html_url}`);
        console.log(`   Branch: ${testBranchName}\n`);
        
        console.log('🎉 All steps completed successfully!');
        console.log('The PR should now be visible on GitHub.');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.status) {
            console.error(`   HTTP Status: ${error.status}`);
        }
        if (error.response?.data) {
            console.error(`   Response:`, error.response.data);
        }
        
        // Check token permissions
        if (error.status === 403 || error.status === 401) {
            console.error('\n⚠️  This looks like a permissions issue.');
            console.error('   Make sure your GITHUB_TOKEN has these scopes:');
            console.error('   - repo (full control)');
            console.error('   - workflow (if modifying workflow files)');
        }
    }
}

testPRCreation().catch(console.error);
