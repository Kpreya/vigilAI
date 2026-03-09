import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function createTestIncident() {
    console.log('Creating test incident with proper stack trace...\n');
    
    try {
        // Find the login application
        const app = await prisma.application.findFirst({
            where: { name: 'login' }
        });
        
        if (!app) {
            console.log('❌ Login app not found');
            return;
        }
        
        console.log(`✓ Found application: ${app.name}`);
        console.log(`  GitHub: ${app.githubOwner}/${app.githubRepo}\n`);
        
        // Create incident with a realistic stack trace
        const stackTrace = `Error: AuthServiceConnectionError: Authentication service connection timed out after 5000ms
    at handleSignup (C:/Users/app/platform/app/demo/signup/page.tsx:20:16)
    at onClick (C:/Users/app/platform/app/demo/signup/page.tsx:15:5)
    at HTMLButtonElement.callCallback (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:4164:14)`;
        
        const incident = await prisma.incident.create({
            data: {
                title: 'AuthServiceConnectionError: Authentication service connection timed out after 5000ms. Could not reach upstream identity provider.',
                description: 'Test incident with proper stack trace for PR generation',
                stackTrace: stackTrace,
                severity: 'HIGH',
                applicationId: app.id,
                status: 'OPEN',
                errorCount: 1,
            }
        });
        
        console.log('✅ Test incident created!');
        console.log(`   ID: ${incident.id}`);
        console.log(`   Title: ${incident.title}`);
        console.log(`   Stack trace: ${stackTrace.substring(0, 100)}...\n`);
        
        console.log('📝 Next steps:');
        console.log('1. Make sure your Next.js dev server is restarted (to load the new code)');
        console.log('2. Go to http://localhost:3000/incidents');
        console.log(`3. Click "New Fix" on incident: ${incident.id}`);
        console.log('4. Check the server console for detailed logs');
        console.log('5. Verify the PR modifies platform/app/demo/signup/page.tsx (not a .md file)');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createTestIncident().catch(console.error);
