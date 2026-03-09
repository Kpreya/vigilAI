import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
dotenv.config();

async function testFetch() {
    const githubToken = process.env.GITHUB_TOKEN;
    const cleanGithubOwner = "techiepookie";
    const cleanGithubRepo = "vigilai";
    const octokit = new Octokit({ auth: githubToken });
    
    // Simulate a Next.js absolute stack trace on a standard file that WE KNOW exists on GitHub
    const stackTrace = "Error: Simulated fetch failure\n    at loginUser (C:/Users/app/platform/app/demo/signup/page.tsx:20:16)";
    
    console.log('Testing improved file path resolution...\n');
    
    // Extract path from stack trace
    let extractedPath = "";
    const match = stackTrace.match(/([a-zA-Z0-9_\-\.\/]+\.(?:tsx|ts|jsx|js|py|go|java|rb|css|html))/);
    if (match && match[1]) {
        extractedPath = match[1];
        console.log(`✓ Extracted path from stack trace: ${extractedPath}`);
    }

    // Build comprehensive list of paths to try
    const pathsToTry: string[] = [];
    
    if (extractedPath) {
        let cleanPath = extractedPath.replace(/^\/+/, '');
        
        // If path contains known root directories, extract from there
        if (cleanPath.includes('platform/')) {
            const idx = cleanPath.indexOf('platform/');
            pathsToTry.push(cleanPath.substring(idx));
        }
        if (cleanPath.includes('frontend/')) {
            const idx = cleanPath.indexOf('frontend/');
            pathsToTry.push(cleanPath.substring(idx));
        }
        if (cleanPath.includes('app/')) {
            const idx = cleanPath.indexOf('app/');
            pathsToTry.push(`platform/${cleanPath.substring(idx)}`);
            pathsToTry.push(cleanPath.substring(idx));
        }
        
        pathsToTry.push(cleanPath);
        pathsToTry.push(`platform/${cleanPath}`);
        pathsToTry.push(`frontend/${cleanPath}`);
        pathsToTry.push(`src/${cleanPath}`);
    }
    
    // Remove duplicates
    const uniquePaths = [...new Set(pathsToTry)];
    console.log(`\nAttempting ${uniquePaths.length} possible paths:\n`);
    
    let targetFilePath = "";
    for (const path of uniquePaths) {
        try {
            console.log(`  Trying: ${path}`);
            const { data } = await octokit.rest.repos.getContent({
                owner: cleanGithubOwner,
                repo: cleanGithubRepo,
                path: path
            });
            
            if (!Array.isArray(data) && data.type === 'file') {
                targetFilePath = path;
                console.log(`  ✅ SUCCESS! Found file at: ${path}\n`);
                break;
            }
        } catch (e: any) {
            console.log(`  ❌ Not found: ${e.message}`);
        }
    }
    
    if (targetFilePath) {
        console.log(`\n🎉 RESULT: Will modify file at: ${targetFilePath}`);
        console.log(`This is a REAL source file, not a markdown fallback!`);
    } else {
        console.log(`\n❌ FAILED: Could not locate file in repository`);
        console.log(`PR creation will be aborted with clear error message`);
    }
}

testFetch().catch(console.error);
