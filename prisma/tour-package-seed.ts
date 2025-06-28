import { PrismaClient, PackageStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTourPackages() {
  try {
    console.log('Starting seed process...');

    // 1. First create users
    console.log('Creating users...');
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'guide1@example.com' },
        update: {},
        create: {
          email: 'guide1@example.com',
          phone_no: '+1234567890',
          password_hash: 'hashed_password_1',
          name: 'Sarah Johnson',
          role: 'travel_guide',
        },
      }),
      prisma.user.upsert({
        where: { email: 'guide2@example.com' },
        update: {},
        create: {
          email: 'guide2@example.com',
          phone_no: '+1234567891',
          password_hash: 'hashed_password_2',
          name: 'Michael Chen',
          role: 'travel_guide',
        },
      }),
      prisma.user.upsert({
        where: { email: 'guide3@example.com' },
        update: {},
        create: {
          email: 'guide3@example.com',
          phone_no: '+1234567892',
          password_hash: 'hashed_password_3',
          name: 'Emma Rodriguez',
          role: 'travel_guide',
        },
      }),
    ]);

    console.log('Created users:', users.map(u => ({ id: u.id, email: u.email })));

    // 2. Create travel guides with error handling for each one
    console.log('Creating travel guides...');
    const guides = [];
    
    for (const user of users) {
      try {
        const guide = await prisma.travelGuide.upsert({
          where: { user_id: user.id },
          update: {},
          create: {
            user_id: user.id,
            verification_documents: ['license.pdf'],
            years_of_experience: Math.floor(Math.random() * 10) + 1,
            languages_spoken: ['English'],
          },
        });
        guides.push(guide);
        console.log(`Created guide for user ${user.email} with ID ${guide.id}`);
      } catch (error) {
        console.error(`Failed to create guide for user ${user.email}:`, error);
        throw error;
      }
    }

    // Verify guides were created
    const existingGuides = await prisma.travelGuide.findMany({
      where: {
        id: { in: guides.map(g => g.id) }
      }
    });

    console.log('Database contains guides:', existingGuides.map(g => g.id));
    
    if (existingGuides.length !== users.length) {
      const missingGuides = users.filter(
        user => !existingGuides.some(g => g.user_id === user.id)
      );
      console.error('Missing guides for users:', missingGuides.map(u => u.email));
      throw new Error(`Only ${existingGuides.length} of ${users.length} guides were created`);
    }

    // 3. Create tour packages
    console.log('Creating tour packages...');
    const tourPackages = [
      {
        guide_id: guides[0].id,
        title: "Historic Downtown Walking Tour",
        status: PackageStatus.pending_approval,
        description: "Explore the rich history of our downtown area",
        price: 25.99,
        duration_minutes: 120,
      },
      {
        guide_id: guides[0].id,
        title: "Ghosts and Legends Night Tour",
        status: PackageStatus.published,
        description: "Discover the haunted history of the city",
        price: 35.00,
        duration_minutes: 90,
      },
      {
        guide_id: guides[1].id,
        title: "Food Lover's Market Tour",
        status: PackageStatus.published,
        description: "Taste your way through the city's best market foods",
        price: 45.50,
        duration_minutes: 180,
      },
      {
        guide_id: guides[2].id,
        title: "Modern Architecture Walk",
        status: PackageStatus.rejected,
        description: "Explore contemporary architectural landmarks",
        price: 28.00,
        duration_minutes: 135,
        rejection_reason: "Need more details about the route"
      },
    ];

    // Clean up existing packages
    await prisma.tourPackage.deleteMany({});

    // Create new packages with individual error handling
    for (const [i, packageData] of tourPackages.entries()) {
      try {
        await prisma.tourPackage.create({
          data: packageData,
        });
        console.log(`Created package ${i + 1}: ${packageData.title}`);
      } catch (error) {
        console.error(`Failed to create package ${i + 1}:`, {
          title: packageData.title,
          guide_id: packageData.guide_id,
          error
        });
        throw error;
      }
    }

    console.log(`Successfully seeded ${tourPackages.length} tour packages`);
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

seedTourPackages()
  .catch((e) => {
    console.error('Error in seed process:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });