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

async function main() {
  // Clear existing data (in correct order to avoid FK constraints)
  await prisma.tourStopMedia.deleteMany();
  await prisma.tourStop.deleteMany();
  await prisma.tourPackage.deleteMany();
  await prisma.travelGuide.deleteMany();
  await prisma.traveler.deleteMany();
  await prisma.user.deleteMany();

  // Hash all passwords
  const hashedPasswords = {
    admin: await hashPassword(testPasswords.admin),
    moderator: await hashPassword(testPasswords.moderator),
    guide: await hashPassword(testPasswords.guide),
    traveler: await hashPassword(testPasswords.traveler),
    vendor: await hashPassword(testPasswords.vendor)
  };

  // Create users individually to handle relations
  const admin = await prisma.user.create({
    data: {
      email: 'admin@roamio.com',
      name: 'Admin User',
      password_hash: hashedPasswords.admin,
      role: 'admin',
      status: 'active',
      phone_no: '+1000000001'
    }
  });

  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@roamio.com',
      name: 'Moderator User',
      password_hash: hashedPasswords.moderator,
      role: 'moderator',
      status: 'active',
      phone_no: '+1000000002'
    }
  });

  const guideUser = await prisma.user.create({
    data: {
      email: 'guide@roamio.com',
      name: 'Test Guide',
      password_hash: hashedPasswords.guide,
      role: 'travel_guide',
      status: 'active',
      phone_no: '+1000000003',
      guides: {
        create: {
          verification_documents: ['doc1.jpg', 'doc2.pdf'],
          languages_spoken: ['English', 'Spanish'],
          years_of_experience: 3
        }
      }
    }
  });

  const travelerUser = await prisma.user.create({
    data: {
      email: 'traveler@roamio.com',
      name: 'Test Traveler',
      password_hash: hashedPasswords.traveler,
      role: 'traveler',
      status: 'active',
      phone_no: '+1000000004',
      travelers: {
        create: {}
      }
    }
  });

  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor@roamio.com',
      name: 'Test Vendor',
      password_hash: hashedPasswords.vendor,
      role: 'vendor',
      status: 'active',
      phone_no: '+1000000005'
    }
  });

  console.log('Test users created successfully!');
  console.log('------------------------------------');
  console.log('| Role        | Email               | Password      |');
  console.log('|-------------|---------------------|---------------|');
  console.log(`| Admin       | ${admin.email.padEnd(19)} | ${testPasswords.admin.padEnd(12)} |`);
  console.log(`| Moderator   | ${moderator.email.padEnd(19)} | ${testPasswords.moderator.padEnd(12)} |`);
  console.log(`| Travel Guide| ${guideUser.email.padEnd(19)} | ${testPasswords.guide.padEnd(12)} |`);
  console.log(`| Traveler    | ${travelerUser.email.padEnd(19)} | ${testPasswords.traveler.padEnd(12)} |`);
  console.log(`| Vendor      | ${vendorUser.email.padEnd(19)} | ${testPasswords.vendor.padEnd(12)} |`);
  console.log('------------------------------------');
}

main()
  .catch(e => {
    console.error('Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });