import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function fixGitHubRepos() {
    console.log('Fixing GitHub repository data...\n');
    
    try {
        const applications = await prisma.application.findMany();
        
        for (const app of applications) {
            let needsUpdate = false;
            let newOwner = app.githubOwner;
            let newRepo = app.githubRepo;
            
            // Fix githubOwner if it contains a URL
            if (newOwner && newOwner.includes('github.com/')) {
                const parts = newOwner.split('github.com/')[1].split('/');
                if (parts.length >= 1) {
                    newOwner = parts[0];
                    needsUpdate = true;
                }
            }
            
            // Fix githubRepo if it contains a URL
            if (newRepo && newRepo.includes('github.com/')) {
                const parts = newRepo.split('github.com/')[1].split('/');
                if (parts.length >= 2) {
                    newRepo = parts[1].replace('.git', '');
                    needsUpdate = true;
                }
            }
            
            if (needsUpdate) {
                console.log(`Fixing application: ${app.name}`);
                console.log(`  Old: ${app.githubOwner}/${app.githubRepo}`);
                console.log(`  New: ${newOwner}/${newRepo}`);
                
                await prisma.application.update({
                    where: { id: app.id },
                    data: {
                        githubOwner: newOwner,
                        githubRepo: newRepo
                    }
                });
                
                console.log(`  ✓ Updated\n`);
            } else {
                console.log(`Application "${app.name}" is already correct: ${app.githubOwner}/${app.githubRepo}\n`);
            }
        }
        
        console.log('✅ All applications fixed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixGitHubRepos().catch(console.error);
