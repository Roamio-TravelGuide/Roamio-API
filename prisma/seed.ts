import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Plaintext passwords for testing
const testPasswords = {
  admin: 'Admin@1234',
  moderator: 'Moderator@1234',
  guide: 'Guide@1234',
  traveler: 'Traveler@1234',
  vendor: 'Vendor@1234'
};

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  // Delete in correct order to avoid FK constraints
  await prisma.tourStopMedia.deleteMany();
  await prisma.review.deleteMany();
  await prisma.download.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.tourStop.deleteMany();
  await prisma.tourPackage.deleteMany();
  await prisma.hiddenPlace.deleteMany();
  await prisma.media.deleteMany();
  await prisma.report.deleteMany();
  await prisma.pOI.deleteMany();
  await prisma.travelGuide.deleteMany();
  await prisma.traveler.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✅ Database cleared successfully');
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  // Hash all passwords
  const hashedPasswords = {
    admin: await hashPassword(testPasswords.admin),
    moderator: await hashPassword(testPasswords.moderator),
    guide: await hashPassword(testPasswords.guide),
    traveler: await hashPassword(testPasswords.traveler),
    vendor: await hashPassword(testPasswords.vendor)
  };

  // Create admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@roamio.com',
      name: 'Admin User',
      password_hash: hashedPasswords.admin,
      role: 'admin',
      status: 'active',
      phone_no: '+94771234567',
      bio: 'System administrator with full access to all features.'
    }
  });

  // Create moderator
  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@roamio.com',
      name: 'John Moderator',
      password_hash: hashedPasswords.moderator,
      role: 'moderator',
      status: 'active',
      phone_no: '+94771234568',
      bio: 'Content moderator ensuring quality standards.'
    }
  });

  // Create travel guides
  const guide1 = await prisma.user.create({
    data: {
      email: 'guide1@roamio.com',
      name: 'Sarah Williams',
      password_hash: hashedPasswords.guide,
      role: 'travel_guide',
      status: 'active',
      phone_no: '+94771234569',
      bio: 'Professional travel guide specializing in cultural tours of Sri Lanka.',
      guides: {
        create: {
          verification_documents: ['license_sw_2024.pdf', 'certificate_tourism.pdf'],
          languages_spoken: ['English', 'Sinhala', 'Tamil'],
          years_of_experience: 5
        }
      }
    }
  });

  const guide2 = await prisma.user.create({
    data: {
      email: 'guide2@roamio.com',
      name: 'Michael Chen',
      password_hash: hashedPasswords.guide,
      role: 'travel_guide',
      status: 'active',
      phone_no: '+94771234570',
      bio: 'Adventure tour specialist with expertise in hiking and nature tours.',
      guides: {
        create: {
          verification_documents: ['license_mc_2024.pdf', 'wilderness_cert.pdf'],
          languages_spoken: ['English', 'Mandarin', 'Sinhala'],
          years_of_experience: 7
        }
      }
    }
  });

  // Create travelers
  const traveler1 = await prisma.user.create({
    data: {
      email: 'traveler1@roamio.com',
      name: 'Emma Johnson',
      password_hash: hashedPasswords.traveler,
      role: 'traveler',
      status: 'active',
      phone_no: '+94771234571',
      bio: 'Travel enthusiast exploring the beautiful landscapes of Sri Lanka.',
      travelers: {
        create: {}
      }
    }
  });

  const traveler2 = await prisma.user.create({
    data: {
      email: 'traveler2@roamio.com',
      name: 'David Smith',
      password_hash: hashedPasswords.traveler,
      role: 'traveler',
      status: 'active',
      phone_no: '+94771234572',
      bio: 'Photography lover seeking hidden gems and authentic experiences.',
      travelers: {
        create: {}
      }
    }
  });

  // Create vendors
  const vendor1 = await prisma.user.create({
    data: {
      email: 'vendor1@roamio.com',
      name: 'Hotel Paradise Resort',
      password_hash: hashedPasswords.vendor,
      role: 'vendor',
      status: 'active',
      phone_no: '+94771234573',
      bio: 'Luxury beachfront resort offering world-class hospitality.'
    }
  });

  const vendor2 = await prisma.user.create({
    data: {
      email: 'vendor2@roamio.com',
      name: 'Spice Garden Restaurant',
      password_hash: hashedPasswords.vendor,
      role: 'vendor',
      status: 'active',
      phone_no: '+94771234574',
      bio: 'Authentic Sri Lankan cuisine with traditional recipes passed down generations.'
    }
  });

  return { admin, moderator, guide1, guide2, traveler1, traveler2, vendor1, vendor2 };
}

async function seedLocations() {
  console.log('📍 Seeding locations...');
  
  const locations = await prisma.location.createMany({
    data: [
      {
        longitude: 79.8612,
        latitude: 6.9271,
        address: 'Galle Face Green',
        city: 'Colombo',
        province: 'Western',
        district: 'Colombo',
        postal_code: '00100'
      },
      {
        longitude: 80.7718,
        latitude: 7.2906,
        address: 'Temple of the Sacred Tooth Relic',
        city: 'Kandy',
        province: 'Central',
        district: 'Kandy',
        postal_code: '20000'
      },
      {
        longitude: 80.3956,
        latitude: 6.0535,
        address: 'Galle Fort',
        city: 'Galle',
        province: 'Southern',
        district: 'Galle',
        postal_code: '80000'
      },
      {
        longitude: 81.8281,
        latitude: 6.9821,
        address: 'Ancient City of Polonnaruwa',
        city: 'Polonnaruwa',
        province: 'North Central',
        district: 'Polonnaruwa',
        postal_code: '51000'
      },
      {
        longitude: 80.3775,
        latitude: 8.3114,
        address: 'Sigiriya Rock Fortress',
        city: 'Sigiriya',
        province: 'Central',
        district: 'Matale',
        postal_code: '21120'
      },
      {
        longitude: 81.2152,
        latitude: 6.9497,
        address: 'Yala National Park Entrance',
        city: 'Tissamaharama',
        province: 'Southern',
        district: 'Hambantota',
        postal_code: '82600'
      }
    ]
  });

  // Get created locations for relations
  const locationRecords = await prisma.location.findMany();
  return locationRecords;
}

async function seedMedia(users: any) {
  console.log('🎬 Seeding media...');
  
  const mediaRecords = await prisma.media.createMany({
    data: [
      {
        url: 'https://example.com/media/galle_face_1.jpg',
        media_type: 'image',
        uploaded_by_id: users.guide1.id,
        file_size: BigInt(2048576),
        format: 'JPEG'
      },
      {
        url: 'https://example.com/media/kandy_temple_audio.mp3',
        media_type: 'audio',
        duration_seconds: 300,
        uploaded_by_id: users.guide1.id,
        file_size: BigInt(5242880),
        format: 'MP3'
      },
      {
        url: 'https://example.com/media/galle_fort_1.jpg',
        media_type: 'image',
        uploaded_by_id: users.guide2.id,
        file_size: BigInt(3145728),
        format: 'JPEG'
      },
      {
        url: 'https://example.com/media/sigiriya_audio.mp3',
        media_type: 'audio',
        duration_seconds: 450,
        uploaded_by_id: users.guide2.id,
        file_size: BigInt(7340032),
        format: 'MP3'
      },
      {
        url: 'https://example.com/media/hidden_beach.jpg',
        media_type: 'image',
        uploaded_by_id: users.traveler1.id,
        file_size: BigInt(1572864),
        format: 'JPEG'
      }
    ]
  });

  return await prisma.media.findMany();
}

async function seedTourPackages(users: any, locations: any) {
  console.log('🎒 Seeding tour packages...');
  
  const guide1 = await prisma.travelGuide.findUnique({
    where: { user_id: users.guide1.id }
  });
  
  const guide2 = await prisma.travelGuide.findUnique({
    where: { user_id: users.guide2.id }
  });

  const package1 = await prisma.tourPackage.create({
    data: {
      guide_id: guide1!.id,
      title: 'Colombo City Cultural Experience',
      description: 'Explore the vibrant culture and history of Colombo with visits to iconic landmarks, local markets, and historical sites.',
      price: 5000.00,
      duration_minutes: 480, // 8 hours
      status: 'published'
    }
  });

  const package2 = await prisma.tourPackage.create({
    data: {
      guide_id: guide1!.id,
      title: 'Sacred Kandy Temple Tour',
      description: 'A spiritual journey through Kandy featuring the Temple of the Sacred Tooth Relic and beautiful botanical gardens.',
      price: 7500.00,
      duration_minutes: 360, // 6 hours
      status: 'published'
    }
  });

  const package3 = await prisma.tourPackage.create({
    data: {
      guide_id: guide2!.id,
      title: 'Ancient Wonders Adventure',
      description: 'Discover the ancient civilizations of Sri Lanka with visits to Sigiriya Rock Fortress and Polonnaruwa.',
      price: 12000.00,
      duration_minutes: 720, // 12 hours
      status: 'published'
    }
  });

  const package4 = await prisma.tourPackage.create({
    data: {
      guide_id: guide2!.id,
      title: 'Southern Coast Heritage Tour',
      description: 'Experience the colonial heritage and natural beauty of the southern coast including Galle Fort.',
      price: 8500.00,
      duration_minutes: 540, // 9 hours
      status: 'pending_approval'
    }
  });

  return { package1, package2, package3, package4 };
}

async function seedTourStops(packages: any, locations: any, media: any) {
  console.log('🚏 Seeding tour stops...');
  
  // Package 1 stops (Colombo)
  const stop1_1 = await prisma.tourStop.create({
    data: {
      package_id: packages.package1.id,
      sequence_no: 1,
      stop_name: 'Galle Face Green',
      description: 'Start your journey at the iconic seafront promenade with stunning ocean views.',
      location_id: locations[0].id
    }
  });

  // Package 2 stops (Kandy)
  const stop2_1 = await prisma.tourStop.create({
    data: {
      package_id: packages.package2.id,
      sequence_no: 1,
      stop_name: 'Temple of the Sacred Tooth Relic',
      description: 'Visit the most sacred Buddhist temple in Sri Lanka housing the tooth relic of Lord Buddha.',
      location_id: locations[1].id
    }
  });

  // Package 3 stops (Ancient Wonders)
  const stop3_1 = await prisma.tourStop.create({
    data: {
      package_id: packages.package3.id,
      sequence_no: 1,
      stop_name: 'Sigiriya Rock Fortress',
      description: 'Climb the ancient rock fortress and marvel at the engineering marvel of the 5th century.',
      location_id: locations[4].id
    }
  });

  const stop3_2 = await prisma.tourStop.create({
    data: {
      package_id: packages.package3.id,
      sequence_no: 2,
      stop_name: 'Ancient City of Polonnaruwa',
      description: 'Explore the ruins of the ancient capital with well-preserved statues and structures.',
      location_id: locations[3].id
    }
  });

  // Package 4 stops (Southern Coast)
  const stop4_1 = await prisma.tourStop.create({
    data: {
      package_id: packages.package4.id,
      sequence_no: 1,
      stop_name: 'Galle Fort',
      description: 'Walk through the UNESCO World Heritage Dutch colonial fort.',
      location_id: locations[2].id
    }
  });

  // Create tour stop media relations
  await prisma.tourStopMedia.createMany({
    data: [
      { stop_id: stop1_1.id, media_id: media[0].id },
      { stop_id: stop2_1.id, media_id: media[1].id },
      { stop_id: stop3_1.id, media_id: media[3].id },
      { stop_id: stop4_1.id, media_id: media[2].id }
    ]
  });

  return { stop1_1, stop2_1, stop3_1, stop3_2, stop4_1 };
}

async function seedPayments(users: any, packages: any) {
  console.log('💳 Seeding payments...');
  
  await prisma.payment.createMany({
    data: [
      {
        transaction_id: 'TXN_001_2024',
        user_id: users.traveler1.id,
        package_id: packages.package1.id,
        amount: 5000.00,
        status: 'completed',
        currency: 'LKR',
        paid_at: new Date('2024-01-15T10:30:00Z'),
        invoice_number: 'INV-001-2024'
      },
      {
        transaction_id: 'TXN_002_2024',
        user_id: users.traveler2.id,
        package_id: packages.package2.id,
        amount: 7500.00,
        status: 'completed',
        currency: 'LKR',
        paid_at: new Date('2024-01-20T14:15:00Z'),
        invoice_number: 'INV-002-2024'
      },
      {
        transaction_id: 'TXN_003_2024',
        user_id: users.traveler1.id,
        package_id: packages.package3.id,
        amount: 12000.00,
        status: 'pending',
        currency: 'LKR'
      }
    ]
  });
}

async function seedDownloads(users: any, packages: any) {
  console.log('⬬ Seeding downloads...');
  
  const traveler1 = await prisma.traveler.findUnique({
    where: { user_id: users.traveler1.id }
  });
  
  const traveler2 = await prisma.traveler.findUnique({
    where: { user_id: users.traveler2.id }
  });

  await prisma.download.createMany({
    data: [
      {
        traveler_id: traveler1!.id,
        package_id: packages.package1.id,
        date: new Date('2024-01-15T11:00:00Z'),
        time: new Date('2024-01-15T11:00:00Z'),
        file_size: BigInt(15728640),
        url: 'https://downloads.roamio.com/packages/colombo_cultural_v1.zip'
      },
      {
        traveler_id: traveler2!.id,
        package_id: packages.package2.id,
        date: new Date('2024-01-20T15:00:00Z'),
        time: new Date('2024-01-20T15:00:00Z'),
        file_size: BigInt(23068672),
        url: 'https://downloads.roamio.com/packages/kandy_temple_v1.zip'
      }
    ]
  });
}

async function seedReviews(users: any, packages: any) {
  console.log('⭐ Seeding reviews...');
  
  const traveler1 = await prisma.traveler.findUnique({
    where: { user_id: users.traveler1.id }
  });
  
  const traveler2 = await prisma.traveler.findUnique({
    where: { user_id: users.traveler2.id }
  });

  await prisma.review.createMany({
    data: [
      {
        traveler_id: traveler1!.id,
        package_id: packages.package1.id,
        user_id: users.traveler1.id,
        rating: 5,
        comments: 'Absolutely fantastic tour! Sarah was incredibly knowledgeable and made the history come alive. Highly recommended!',
        date: new Date('2024-01-16T18:00:00Z')
      },
      {
        traveler_id: traveler2!.id,
        package_id: packages.package2.id,
        user_id: users.traveler2.id,
        rating: 4,
        comments: 'Beautiful temple and great insights into Buddhist culture. The audio guide was very helpful.',
        date: new Date('2024-01-21T16:30:00Z')
      }
    ]
  });
}

async function seedHiddenPlaces(users: any, locations: any, media: any) {
  console.log('🗺️ Seeding hidden places...');
  
  const traveler1 = await prisma.traveler.findUnique({
    where: { user_id: users.traveler1.id }
  });

  await prisma.hiddenPlace.create({
    data: {
      traveler_id: traveler1!.id,
      location_id: locations[5].id, // Yala area
      picture_id: media[4].id,
      title: 'Secret Beach near Yala',
      description: 'A pristine, untouched beach just a short walk from the main Yala National Park entrance. Perfect for a quiet sunset.',
      status: 'approved',
      created_at: new Date('2024-01-10T12:00:00Z'),
      verified_at: new Date('2024-01-12T09:00:00Z')
    }
  });
}

async function seedpOIs(users: any, locations: any) {
  console.log('📍 Seeding pOIs...');
  
  await prisma.pOI.createMany({
    data: [
      {
        name: 'Paradise Beach Resort',
        category: 'Accommodation',
        description: 'Luxury beachfront resort with world-class amenities and spa services.',
        type: 'hotel',
        status: 'approved',
        location_id: locations[2].id, // Galle
        vendor_id: users.vendor1.id,
        created_at: new Date('2024-01-05T10:00:00Z')
      },
      {
        name: 'Spice Garden Restaurant',
        category: 'Dining',
        description: 'Authentic Sri Lankan cuisine with traditional spices and cooking methods.',
        type: 'restaurant',
        status: 'approved',
        location_id: locations[1].id, // Kandy
        vendor_id: users.vendor2.id,
        created_at: new Date('2024-01-08T14:00:00Z')
      }
    ]
  });
}

async function seedReports(users: any, packages: any) {
  console.log('📋 Seeding reports...');
  
  await prisma.report.createMany({
    data: [
      {
        reporter_id: users.traveler2.id,
        reported_user_id: users.guide1.id,
        status: 'resolved',
        description: 'Tour guide was late to the meeting pOInt, but issue was resolved through communication.',
        created_at: new Date('2024-01-17T09:00:00Z')
      },
      {
        reporter_id: users.moderator.id,
        reported_package_id: packages.package4.id,
        status: 'in_progress',
        description: 'Package description needs more detailed itinerary information for approval.',
        created_at: new Date('2024-01-22T11:30:00Z')
      }
    ]
  });
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data step by step
    const users = await seedUsers();
    const locations = await seedLocations();
    const media = await seedMedia(users);
    const packages = await seedTourPackages(users, locations);
    const stops = await seedTourStops(packages, locations, media);
    await seedPayments(users, packages);
    await seedDownloads(users, packages);
    await seedReviews(users, packages);
    await seedHiddenPlaces(users, locations, media);
    await seedpOIs(users, locations);
    await seedReports(users, packages);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 8 Users created (1 admin, 1 moderator, 2 guides, 2 travelers, 2 vendors)');
    console.log('- 6 Locations across Sri Lanka');
    console.log('- 5 Media files (images and audio)');
    console.log('- 4 Tour packages with various statuses');
    console.log('- 5 Tour stops with media attachments');
    console.log('- 3 Payment records');
    console.log('- 2 Downloads');
    console.log('- 2 Reviews');
    console.log('- 1 Hidden place');
    console.log('- 2 pOIs');
    console.log('- 2 Reports');
    
    console.log('\n🔐 Test Login Credentials:');
    console.log('┌─────────────┬─────────────────────┬───────────────┐');
    console.log('│ Role        │ Email               │ Password      │');
    console.log('├─────────────┼─────────────────────┼───────────────┤');
    console.log(`│ Admin       │ admin@roamio.com    │ ${testPasswords.admin}     │`);
    console.log(`│ Moderator   │ moderator@roamio.com│ ${testPasswords.moderator} │`);
    console.log(`│ Guide 1     │ guide1@roamio.com   │ ${testPasswords.guide}      │`);
    console.log(`│ Guide 2     │ guide2@roamio.com   │ ${testPasswords.guide}      │`);
    console.log(`│ Traveler 1  │ traveler1@roamio.com│ ${testPasswords.traveler}  │`);
    console.log(`│ Traveler 2  │ traveler2@roamio.com│ ${testPasswords.traveler}  │`);
    console.log(`│ Vendor 1    │ vendor1@roamio.com  │ ${testPasswords.vendor}     │`);
    console.log(`│ Vendor 2    │ vendor2@roamio.com  │ ${testPasswords.vendor}     │`);
    console.log('└─────────────┴─────────────────────┴───────────────┘');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('💥 Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed.');
  });
  