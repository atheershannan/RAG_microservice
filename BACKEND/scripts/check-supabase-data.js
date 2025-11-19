/**
 * Script to check if data exists in Supabase
 * 
 * Usage: node scripts/check-supabase-data.js [search_term]
 * 
 * Example:
 *   node scripts/check-supabase-data.js "Eden Levi"
 *   node scripts/check-supabase-data.js "user_profile"
 *   node scripts/check-supabase-data.js
 */

import { getPrismaClient } from '../src/config/database.config.js';
import { logger } from '../src/utils/logger.util.js';

async function checkSupabaseData(searchTerm = null) {
  try {
    const prisma = await getPrismaClient();

    console.log('\n🔍 Checking Supabase Data...\n');
    console.log('='.repeat(60));

    // 1. Check total records
    const totalCount = await prisma.vectorEmbedding.count();
    console.log(`\n📊 Total records in vector_embeddings: ${totalCount}`);

    // 2. Check by content type
    const byType = await prisma.$queryRaw`
      SELECT 
        content_type,
        COUNT(*) as count
      FROM vector_embeddings
      GROUP BY content_type
      ORDER BY count DESC
    `;
    console.log('\n📁 Records by content type:');
    byType.forEach(row => {
      console.log(`   ${row.content_type}: ${row.count}`);
    });

    // 3. Check user profiles specifically
    const userProfiles = await prisma.vectorEmbedding.findMany({
      where: {
        contentType: 'user_profile'
      },
      select: {
        contentId: true,
        contentText: true,
        metadata: true,
      },
      take: 20
    });

    console.log(`\n👥 User Profiles found: ${userProfiles.length}`);
    userProfiles.forEach((profile, idx) => {
      console.log(`\n   ${idx + 1}. Content ID: ${profile.contentId}`);
      console.log(`      Text preview: ${profile.contentText?.substring(0, 100)}...`);
      if (profile.metadata) {
        const meta = typeof profile.metadata === 'object' ? profile.metadata : JSON.parse(profile.metadata);
        console.log(`      Metadata:`, JSON.stringify(meta, null, 2));
      }
    });

    // 4. Search for specific term if provided
    if (searchTerm) {
      console.log(`\n🔎 Searching for: "${searchTerm}"`);
      console.log('-'.repeat(60));

      // Search in content_text
      const textResults = await prisma.vectorEmbedding.findMany({
        where: {
          OR: [
            { contentText: { contains: searchTerm, mode: 'insensitive' } },
            { contentId: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          contentId: true,
          contentType: true,
          contentText: true,
          metadata: true,
        },
        take: 10
      });

      console.log(`\n   Found ${textResults.length} records containing "${searchTerm}":`);
      textResults.forEach((result, idx) => {
        console.log(`\n   ${idx + 1}. ID: ${result.id}`);
        console.log(`      Content ID: ${result.contentId}`);
        console.log(`      Content Type: ${result.contentType}`);
        console.log(`      Text: ${result.contentText?.substring(0, 200)}...`);
        if (result.metadata) {
          const meta = typeof result.metadata === 'object' ? result.metadata : JSON.parse(result.metadata);
          console.log(`      Metadata:`, JSON.stringify(meta, null, 2));
        }
      });

      // Search in metadata (JSON)
      const metadataResults = await prisma.$queryRaw`
        SELECT 
          id,
          content_id,
          content_type,
          content_text,
          metadata
        FROM vector_embeddings
        WHERE metadata::text ILIKE ${`%${searchTerm}%`}
        LIMIT 10
      `;

      if (metadataResults.length > 0) {
        console.log(`\n   Found ${metadataResults.length} records in metadata containing "${searchTerm}":`);
        metadataResults.forEach((result, idx) => {
          console.log(`\n   ${idx + 1}. ID: ${result.id}`);
          console.log(`      Content ID: ${result.content_id}`);
          console.log(`      Content Type: ${result.content_type}`);
          console.log(`      Text: ${result.content_text?.substring(0, 200)}...`);
        });
      }
    }

    // 5. Check for "Eden Levi" specifically
    console.log(`\n\n🎯 Checking for "Eden Levi" specifically:`);
    console.log('-'.repeat(60));

    const edenResults = await prisma.vectorEmbedding.findMany({
      where: {
        OR: [
          { contentText: { contains: 'Eden Levi', mode: 'insensitive' } },
          { contentText: { contains: 'Eden', mode: 'insensitive' } },
          { contentText: { contains: 'Levi', mode: 'insensitive' } },
          { contentId: { contains: 'eden', mode: 'insensitive' } },
          { contentId: { contains: 'manager', mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        contentId: true,
        contentType: true,
        contentText: true,
        metadata: true,
      }
    });

    if (edenResults.length > 0) {
      console.log(`\n   ✅ Found ${edenResults.length} records related to "Eden Levi":`);
      edenResults.forEach((result, idx) => {
        console.log(`\n   ${idx + 1}. Content ID: ${result.contentId}`);
        console.log(`      Content Type: ${result.contentType}`);
        console.log(`      Full Text:\n${result.contentText}`);
        if (result.metadata) {
          const meta = typeof result.metadata === 'object' ? result.metadata : JSON.parse(result.metadata);
          console.log(`      Metadata:`, JSON.stringify(meta, null, 2));
        }
      });
    } else {
      console.log(`\n   ❌ No records found containing "Eden Levi"`);
      console.log(`\n   💡 This means the data is NOT in Supabase vector_embeddings table.`);
      console.log(`      You need to:`);
      console.log(`      1. Check if user data exists in the source database`);
      console.log(`      2. Run the embedding/ingestion process to add it to vector_embeddings`);
      console.log(`      3. Verify the content was properly embedded`);
    }

    // 6. Check all user profiles content
    console.log(`\n\n👤 All User Profile Content:`);
    console.log('-'.repeat(60));

    const allUserProfiles = await prisma.vectorEmbedding.findMany({
      where: {
        contentType: 'user_profile'
      },
      select: {
        contentId: true,
        contentText: true,
      }
    });

    allUserProfiles.forEach((profile, idx) => {
      console.log(`\n   ${idx + 1}. ${profile.contentId}:`);
      console.log(`      ${profile.contentText?.substring(0, 150)}...`);
    });

    // 7. Check if embeddings are valid (not null)
    const nullEmbeddings = await prisma.vectorEmbedding.count({
      where: {
        embedding: null
      }
    });

    console.log(`\n\n🔢 Embedding Statistics:`);
    console.log(`   Records with null embeddings: ${nullEmbeddings}`);
    console.log(`   Records with valid embeddings: ${totalCount - nullEmbeddings}`);

    // 8. Sample a few records to check embedding dimensions
    const sample = await prisma.vectorEmbedding.findFirst({
      where: {
        embedding: { not: null }
      },
      select: {
        contentId: true,
        contentType: true,
      }
    });

    if (sample) {
      console.log(`\n   Sample record with embedding: ${sample.contentId} (${sample.contentType})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Check complete!\n');

  } catch (error) {
    console.error('\n❌ Error checking Supabase data:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    const prisma = await getPrismaClient();
    await prisma.$disconnect();
  }
}

// Get search term from command line
const searchTerm = process.argv[2] || null;

// Run the check
checkSupabaseData(searchTerm).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

