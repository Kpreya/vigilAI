const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'vigilai-cluster-instance-1.cgzqkiegeb3g.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'vigilai',
    password: 'urLq8knyXdXDgAn',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Aurora PostgreSQL');
    
    // Check if vigilai database exists
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'vigilai'"
    );
    
    if (checkDb.rows.length === 0) {
      console.log('Creating vigilai database...');
      await client.query('CREATE DATABASE vigilai');
      console.log('✅ Database vigilai created');
    } else {
      console.log('✅ Database vigilai already exists');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(console.error);
