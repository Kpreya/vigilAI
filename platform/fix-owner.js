import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function fixOwner() {
    console.log('Fixing GitHub owner for login app...\n');
    
    try {
        const app = await prisma.application.findFirst({
            where: { name: 'login' }
        });
        
        if (!app) {
            console.log('❌ Login app not found');
            return;
        }
        
        console.log(`Current: ${app.githubOwner}/${app.githubRepo}`);
        
        await prisma.application.update({
            where: { id: app.id },
            data: {
                githubOwner: 'techiepookie',
                githubRepo: 'vigilai'
            }
        });
        
        console.log(`Updated: techiepookie/vigilai`);
        console.log('✅ Fixed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixOwner().catch(console.error);
