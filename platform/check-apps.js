const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkApps() {
  try {
    const apps = await prisma.application.findMany({
      include: {
        user: true
      }
    });
    
    console.log('\n=== Applications in Database ===\n');
    console.log(`Total Apps: ${apps.length}\n`);
    
    apps.forEach(app => {
      console.log('App ID:', app.id);
      console.log('Name:', app.name);
      console.log('User:', app.user?.email);
      console.log('GitHub Owner:', app.githubOwner || 'NOT SET');
      console.log('GitHub Repo:', app.githubRepo || 'NOT SET');
      console.log('---');
    });
    
    if (apps.length === 0) {
      console.log('No applications found.');
    } else {
      const appsWithGithub = apps.filter(a => a.githubOwner && a.githubRepo);
      console.log(`\n${appsWithGithub.length} of ${apps.length} apps have GitHub configured.`);
      
      if (appsWithGithub.length === 0) {
        console.log('\n⚠️  WARNING: No applications have GitHub repository configured!');
        console.log('PR creation requires githubOwner and githubRepo to be set.');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApps();
