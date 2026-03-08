import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
dotenv.config();

async function testAWS() {
    console.log('\n--- Testing AWS Bedrock ---');
    console.log('Region:', process.env.AWS_REGION || 'us-east-1');
    console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '********' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'MISSING');
    
    // Explicitly check for Session Token
    if (process.env.AWS_SESSION_TOKEN) {
        console.log('Session Token: EXISTS (Using temporary credentials)');
    } else {
        console.log('Session Token: MISSING (Using permanent IAM credentials)');
    }

    try {
        const client = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
                sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
            }
        });

        console.log('Attempting to invoke Anthropic Claude 3 Haiku...');
        const command = new InvokeModelCommand({
            modelId: "anthropic.claude-3-haiku-20240307-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 10,
                messages: [{ role: "user", content: "Say hello world" }]
            }),
        });

        await client.send(command);
        console.log('✅ AWS Bedrock Connection SUCCESSFUL!');
    } catch (error: any) {
        console.error('❌ AWS Error:', error.name, '-', error.message);
        if (error.name === 'UnrecognizedClientException') {
            console.error('👉 FIX: Your IAM Access Key is either deactivated, deleted, or you are using an IAM Role that requires an AWS_SESSION_TOKEN to be exported in your .env file.');
        } else if (error.name === 'AccessDeniedException') {
            console.error('👉 FIX: Your IAM User does not have the "bedrock:InvokeModel" permission attached. Or Model Access is not enabled for Claude in the selected region.');
        }
    }
}

async function testGitHub() {
    console.log('\n--- Testing GitHub Octokit ---');
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.log('❌ GITHUB_TOKEN is MISSING');
        return;
    }

    try {
        const octokit = new Octokit({ auth: token });
        
        // 1. Test basic auth
        const { data: user } = await octokit.rest.users.getAuthenticated();
        console.log(`✅ Authenticated as: ${user.login}`);

        // 2. Fetch the repo from the database to test the exact strings
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const app = await prisma.application.findFirst({
            where: { githubOwner: { not: null }, githubRepo: { not: null } }
        });

        if (!app) {
            console.log('ℹ️ No applications found in the DB with both githubOwner and githubRepo set.');
            return;
        }

        console.log(`Testing access to repository: ${app.githubOwner}/${app.githubRepo} (App: ${app.name})`);

        try {
            await octokit.rest.repos.get({
                owner: app.githubOwner,
                repo: app.githubRepo,
            });
            console.log(`✅ GitHub Repository Access SUCCESSFUL!`);
            
            // Check for push permissions
            const { data: collab } = await octokit.rest.repos.getCollaboratorPermissionLevel({
                owner: app.githubOwner,
                repo: app.githubRepo,
                username: user.login
            });
            console.log(`Permission Level: ${collab.permission}`);
            if (collab.permission !== 'admin' && collab.permission !== 'write') {
                console.log('⚠️ WARNING: Token does not have write access. PR creation will fail.');
            }

        } catch (repoError: any) {
            console.error('❌ GitHub Repo Error:', repoError.status, '-', repoError.message);
            if (repoError.status === 404) {
                 console.error(`👉 FIX: The repository "${app.githubOwner}/${app.githubRepo}" was Not Found. Either the names in the Database are typo'd, or the GITHUB_TOKEN lacks the "repo" scope to view private repositories.`);
            }
        }
        await prisma.$disconnect();

    } catch (error: any) {
        console.error('❌ GitHub Auth Error:', error.message);
    }
}

async function run() {
    await testAWS();
    await testGitHub();
}

run();
