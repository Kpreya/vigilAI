const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPRs() {
  try {
    const prs = await prisma.pullRequest.findMany({
      include: {
        incident: {
          include: {
            application: true
          }
        }
      }
    });
    
    console.log('\n=== Pull Requests in Database ===\n');
    console.log(`Total PRs: ${prs.length}\n`);
    
    prs.forEach(pr => {
      console.log('PR ID:', pr.id);
      console.log('GitHub PR #:', pr.githubPrNumber);
      console.log('GitHub URL:', pr.githubPrUrl);
      console.log('Title:', pr.title);
      console.log('Status:', pr.status);
      console.log('Incident:', pr.incident?.title);
      console.log('Application:', pr.incident?.application?.name);
      console.log('Created:', pr.createdAt);
      console.log('---');
    });
    
    if (prs.length === 0) {
      console.log('No pull requests found in database.');
      console.log('\nThis could mean:');
      console.log('1. No incidents have been analyzed yet');
      console.log('2. PR creation failed due to GitHub token/permissions');
      console.log('3. The analyze endpoint encountered an error');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPRs();
