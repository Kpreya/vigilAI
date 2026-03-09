import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function createProperTestIncident() {
    console.log('Creating test incident with PROPER source file stack trace...\n');
    
    try {
        // Find the login application
        const app = await prisma.application.findFirst({
            where: { name: 'login' }
        });
        
        if (!app) {
            console.log('❌ Login app not found. Creating one...');
            
            // Create the application
            const user = await prisma.user.findFirst();
            if (!user) {
                console.log('❌ No user found. Please create a user first.');
                return;
            }
            
            const newApp = await prisma.application.create({
                data: {
                    name: 'login',
                    description: 'Test application for PR generation',
                    userId: user.id,
                    githubOwner: 'techiepookie',
                    githubRepo: 'vigilai',
                }
            });
            
            console.log(`✓ Created application: ${newApp.name}`);
            console.log(`  GitHub: ${newApp.githubOwner}/${newApp.githubRepo}\n`);
        } else {
            console.log(`✓ Found application: ${app.name}`);
            console.log(`  GitHub: ${app.githubOwner}/${app.githubRepo}\n`);
        }
        
        const application = app || await prisma.application.findFirst({ where: { name: 'login' } });
        
        // Create incident with a PROPER stack trace that points to actual source files
        // This simulates what a real error would look like with source maps enabled
        const stackTrace = `Error: AuthServiceConnectionError: Authentication service connection timed out after 5000ms. Could not reach upstream identity provider.
    at handleSignup (platform/app/demo/signup/page.tsx:20:16)
    at onClick (platform/app/demo/signup/page.tsx:15:5)
    at processFormSubmit (platform/app/demo/signup/page.tsx:13:3)`;
        
        const incident = await prisma.incident.create({
            data: {
                title: 'AuthServiceConnectionError: Connection timeout',
                description: 'Authentication service connection timed out after 5000ms. Could not reach upstream identity provider.',
                stackTrace: stackTrace,
                severity: 'HIGH',
                applicationId: application.id,
                status: 'OPEN',
                errorCount: 1,
            }
        });
        
        console.log('✅ Test incident created with PROPER stack trace!');
        console.log(`   ID: ${incident.id}`);
        console.log(`   Title: ${incident.title}`);
        console.log(`   Stack trace:\n${stackTrace}\n`);
        
        console.log('📝 Next steps:');
        console.log('1. Go to http://localhost:5500/incidents.html (or your frontend URL)');
        console.log(`2. Find incident: ${incident.id}`);
        console.log('3. Click "Analyze" button');
        console.log('4. The system should:');
        console.log('   - Extract path: platform/app/demo/signup/page.tsx');
        console.log('   - Fetch the file from GitHub');
        console.log('   - Generate AI fix');
        console.log('   - Create a PR on GitHub');
        console.log('\n5. Check the backend console for detailed logs');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

createProperTestIncident().catch(console.error);
