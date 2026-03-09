import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function testAnalyzeFlow() {
    console.log('Testing incident analyze flow...\n');
    
    try {
        // Find the most recent incident
        const incident = await prisma.incident.findFirst({
            include: {
                application: true,
                pullRequests: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        if (!incident) {
            console.log('❌ No incidents found in database');
            return;
        }
        
        console.log('📋 Most Recent Incident:');
        console.log(`   ID: ${incident.id}`);
        console.log(`   Title: ${incident.title}`);
        console.log(`   Status: ${incident.status}`);
        console.log(`   Severity: ${incident.severity}`);
        console.log(`   Application: ${incident.application?.name || 'N/A'}`);
        console.log(`   GitHub Repo: ${incident.application?.githubOwner}/${incident.application?.githubRepo}`);
        console.log(`   Stack Trace: ${incident.stackTrace?.substring(0, 100)}...`);
        console.log(`   AI Diagnosis: ${incident.aiDiagnosis ? 'Yes' : 'No'}`);
        console.log(`   Pull Requests: ${incident.pullRequests.length}\n`);
        
        if (incident.pullRequests.length > 0) {
            console.log('🔗 Associated Pull Requests:');
            incident.pullRequests.forEach(pr => {
                console.log(`   - PR #${pr.githubPrNumber}: ${pr.title}`);
                console.log(`     URL: ${pr.githubPrUrl}`);
                console.log(`     Status: ${pr.status}`);
            });
        }
        
        // Check if we can extract file path from stack trace
        if (incident.stackTrace) {
            const match = incident.stackTrace.match(/([a-zA-Z0-9_\-\.\/]+\.(?:tsx|ts|jsx|js|py|go|java|rb|css|html))/);
            if (match && match[1]) {
                console.log(`\n📁 Extracted file path: ${match[1]}`);
            } else {
                console.log(`\n⚠️  Could not extract file path from stack trace`);
            }
        }
        
        console.log(`\n💡 To test PR creation, make a POST request to:`);
        console.log(`   http://localhost:3000/api/incidents/${incident.id}/analyze`);
        console.log(`   With Authorization header: Bearer <your-jwt-token>`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testAnalyzeFlow().catch(console.error);
