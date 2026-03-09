import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function testClaude() {
    console.log('\n--- Testing AWS Bedrock (Llama 3.1 8B Instruct) ---');
    console.log('Region:', process.env.AWS_REGION || 'us-east-1');
    console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 4) + '...' : 'MISSING');
    
    if (process.env.AWS_SESSION_TOKEN) {
        console.log('Session Token: Present');
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

        const command = new ConverseCommand({
            modelId: "us.meta.llama3-1-8b-instruct-v1:0",
            messages: [{ role: "user", content: [{ text: "Hello from VigilAI! Please reply with a short, 1-sentence confirmation that you are online and working." }] }]
        });

        console.log('\nSending prompt: "Hello from VigilAI! Please reply with a short, 1-sentence confirmation that you are online and working."');
        console.log('Waiting for response...\n');
        
        const response = await client.send(command);
        const claudeOutput = response.output?.message?.content?.[0]?.text || "No text content returned.";

        console.log('✅ MODEL RESPONSE SUCCESSFUL!');
        console.log('--------------------------------------------------');
        console.log(claudeOutput);
        console.log('--------------------------------------------------');
        
        fs.writeFileSync('aws_output.txt', `SUCCESS: \n\n${claudeOutput}`);
        
    } catch (error: any) {
        let errorMsg = `ERROR:\n${error.name}\n${error.message}\n`;
        
        console.error('❌ AWS BEDROCK ERROR:', error.name);
        console.error('Message:', error.message);
        
        if (error.name === 'UnrecognizedClientException') {
            errorMsg += '\nDIAGNOSIS: The AWS credentials exist, but are invalid for literal API usage. This usually happens if you generated an SSO token without an AWS_SESSION_TOKEN, or the IAM user is deactivated.';
        } else if (error.name === 'AccessDeniedException') {
            errorMsg += '\nDIAGNOSIS: Authentication passed, but Authorization failed. Make sure your IAM User has "AmazonBedrockFullAccess", and that Claude 3.5 Sonnet is activated in your AWS Account Model Access page.';
        } else if (error.name === 'ValidationException' && error.message.includes('modelId')) {
            errorMsg += '\nDIAGNOSIS: The model ID anthropic.claude-3-5-sonnet-20241022-v2:0 is not accessible in this region. You may need to change regions or enable it.';
        }
        
        fs.writeFileSync('aws_output.txt', errorMsg);
    }
}

testClaude();
