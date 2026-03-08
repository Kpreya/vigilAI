import { Octokit } from 'octokit';
import dotenv from 'dotenv';
dotenv.config();

async function checkPRDetails() {
    const githubToken = process.env.GITHUB_TOKEN;
    const owner = "techiepookie";
    const repo = "vigilai";
    
    const octokit = new Octokit({ auth: githubToken });
    
    try {
        console.log('Checking recent PRs...\n');
        
        // Get all PRs (open and closed)
        const { data: prs } = await octokit.rest.pulls.list({
            owner,
            repo,
            state: 'all',
            sort: 'created',
            direction: 'desc',
            per_page: 10
        });
        
        console.log(`Found ${prs.length} recent PRs:\n`);
        
        for (const pr of prs) {
            console.log(`PR #${pr.number}: ${pr.title}`);
            console.log(`  State: ${pr.state}`);
            console.log(`  Created: ${pr.created_at}`);
            console.log(`  Branch: ${pr.head.ref} -> ${pr.base.ref}`);
            console.log(`  URL: ${pr.html_url}`);
            
            // Get files changed
            const { data: files } = await octokit.rest.pulls.listFiles({
                owner,
                repo,
                pull_number: pr.number
            });
            
            console.log(`  Files changed (${files.length}):`);
            files.forEach(file => {
                console.log(`    - ${file.filename} (+${file.additions} -${file.deletions})`);
            });
            console.log('');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkPRDetails().catch(console.error);
