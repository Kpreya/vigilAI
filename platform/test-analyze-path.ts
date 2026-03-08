import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    // 1. Create a dummy incident
    const app = await prisma.application.findFirst();
    
    if (!app) {
        console.log("No apps found.");
        return;
    }

    const incident = await prisma.incident.create({
        data: {
            title: "Simulated Test Bug",
            description: "Testing Octokit Path Resolution",
            stackTrace: "Error: Something broke\n    at handleSignup (platform/app/demo/signup/page.tsx:20:16)",
            status: "OPEN",
            severity: "HIGH",
            applicationId: app.id,
        }
    });

    console.log(`Created test incident ${incident.id}. Hitting analysis endpoint...`);

    // 2. Hit the analyze endpoint locally to trigger the console.logs
    const res = await fetch(`http://localhost:3000/api/incidents/${incident.id}/analyze`, {
        method: 'POST'
    });
    
    const data = await res.json();
    console.log("\n--- RESULT ---");
    console.log(data);
}

run()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
