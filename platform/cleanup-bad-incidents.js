import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function cleanupBadIncidents() {
    console.log('Cleaning up incidents with webpack/compiled stack traces...\n');
    
    try {
        // Find all incidents with webpack chunks in stack trace
        const allIncidents = await prisma.incident.findMany({
            include: {
                application: true
            }
        });
        
        console.log(`Found ${allIncidents.length} total incidents\n`);
        
        let deletedCount = 0;
        let keptCount = 0;
        
        for (const incident of allIncidents) {
            const hasWebpackChunks = incident.stackTrace && (
                incident.stackTrace.includes('/_next/static/') ||
                incident.stackTrace.includes('._.js') ||
                incident.stackTrace.includes('chunks/')
            );
            
            if (hasWebpackChunks) {
                console.log(`❌ Deleting incident ${incident.id}: ${incident.title.substring(0, 50)}...`);
                console.log(`   Reason: Contains webpack/compiled paths`);
                
                // Delete associated pull requests first
                await prisma.pullRequest.deleteMany({
                    where: { incidentId: incident.id }
                });
                
                // Delete the incident
                await prisma.incident.delete({
                    where: { id: incident.id }
                });
                
                deletedCount++;
            } else {
                console.log(`✓ Keeping incident ${incident.id}: ${incident.title.substring(0, 50)}...`);
                keptCount++;
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Deleted: ${deletedCount} incidents with bad stack traces`);
        console.log(`   Kept: ${keptCount} incidents with proper stack traces`);
        
        if (deletedCount > 0) {
            console.log(`\n✅ Cleanup complete! Now run:`);
            console.log(`   node platform/create-proper-test-incident.js`);
            console.log(`   to create a new test incident with proper stack trace.`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupBadIncidents().catch(console.error);
