import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Plaintext passwords for testing
const testPasswords = {
  admin: "Admin@1234",
  moderator: "Moderator@1234",
  guide: "Guide@1234",
  traveler: "Traveler@1234",
  vendor: "Vendor@1234",
};

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function clearDatabase() {
  console.log("🧹 Clearing existing data...");

  // Delete in correct order to avoid FK constraints
  await prisma.tourStopMedia.deleteMany();
  await prisma.review.deleteMany();
  await prisma.download.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.tourStop.deleteMany();
  await prisma.tourPackage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.hiddenPlace.deleteMany();
  await prisma.pOI.deleteMany();
  await prisma.media.deleteMany();
  await prisma.report.deleteMany();
  await prisma.travelGuide.deleteMany();
  await prisma.traveler.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Database cleared successfully");
}

async function seedUsers() {
  console.log("👥 Seeding users...");

  // Hash all passwords
  const hashedPasswords = {
    admin: await hashPassword(testPasswords.admin),
    moderator: await hashPassword(testPasswords.moderator),
    guide: await hashPassword(testPasswords.guide),
    traveler: await hashPassword(testPasswords.traveler),
    vendor: await hashPassword(testPasswords.vendor),
  };

  // Create admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@roamio.com",
      name: "Admin User",
      password_hash: hashedPasswords.admin,
      role: "admin",
      status: "active",
      phone_no: "+94771234567",
      bio: "System administrator with full access to all features.",
    },
  });

  // Create moderator
  const moderator = await prisma.user.create({
    data: {
      email: "moderator@roamio.com",
      name: "John Moderator",
      password_hash: hashedPasswords.moderator,
      role: "moderator",
      status: "active",
      phone_no: "+94771234568",
      bio: "Content moderator ensuring quality standards.",
    },
  });

  // Create travel guides (6 guides to handle 20 packages)
  const guide1 = await prisma.user.create({
    data: {
      email: "guide1@roamio.com",
      name: "Sarah Williams",
      password_hash: hashedPasswords.guide,
      role: "travel_guide",
      status: "active",
      phone_no: "+94771234569",
      bio: "Professional travel guide specializing in cultural tours of Sri Lanka.",
      guides: {
        create: {
          verification_documents: [
            "license_sw_2024.pdf",
            "certificate_tourism.pdf",
          ],
          languages_spoken: ["English", "Sinhala", "Tamil"],
          years_of_experience: 5,
        },
      },
    },
  });

  const guide2 = await prisma.user.create({
    data: {
      email: "guide2@roamio.com",
      name: "Michael Chen",
      password_hash: hashedPasswords.guide,
      role: "travel_guide",
      status: "active",
      phone_no: "+94771234570",
      bio: "Adventure tour specialist with expertise in hiking and nature tours.",
      guides: {
        create: {
          verification_documents: [
            "license_mc_2024.pdf",
            "wilderness_cert.pdf",
          ],
          languages_spoken: ["English", "Mandarin", "Sinhala"],
          years_of_experience: 7,
        },
      },
    },
  });

  const guide3 = await prisma.user.create({
    data: {
      email: "guide3@roamio.com",
      name: "Priya Patel",
      password_hash: hashedPasswords.guide,
      role: "travel_guide",
      status: "active",
      phone_no: "+94771234580",
      bio: "Wildlife and nature specialist with deep knowledge of Sri Lankan flora and fauna.",
      guides: {
        create: {
          verification_documents: ["license_pp_2024.pdf", "wildlife_cert.pdf"],
          languages_spoken: ["English", "Hindi", "Sinhala"],
          years_of_experience: 8,
        },
      },
    },
  });

  const guide4 = await prisma.user.create({
    data: {
      email: "guide4@roamio.com",
      name: "Rajesh Fernando",
      password_hash: hashedPasswords.guide,
      role: "travel_guide",
      status: "active",
      phone_no: "+94771234581",
      bio: "Heritage and archaeology expert specializing in ancient Sri Lankan civilizations.",
      guides: {
        create: {
          verification_documents: [
            "license_rf_2024.pdf",
            "archaeology_cert.pdf",
          ],
          languages_spoken: ["English", "Sinhala", "Tamil"],
          years_of_experience: 12,
        },
      },
    },
  });

  const guide5 = await prisma.user.create({
    data: {
      email: "guide5@roamio.com",
      name: "Amanda Thompson",
      password_hash: hashedPasswords.guide,
      role: "travel_guide",
      status: "active",
      phone_no: "+94771234582",
      bio: "Culinary tour specialist showcasing authentic Sri Lankan cuisine and cooking traditions.",
      guides: {
        create: {
          verification_documents: ["license_at_2024.pdf", "culinary_cert.pdf"],
          languages_spoken: ["English", "French", "Sinhala"],
          years_of_experience: 6,
        },
      },
    },
  });

  const guide6 = await prisma.user.create({
    data: {
      email: "guide6@roamio.com",
      name: "Sunil Bandara",
      password_hash: hashedPasswords.guide,
      role: "travel_guide",
      status: "active",
      phone_no: "+94771234583",
      bio: "Tea plantation and hill country expert with extensive knowledge of colonial history.",
      guides: {
        create: {
          verification_documents: [
            "license_sb_2024.pdf",
            "plantation_cert.pdf",
          ],
          languages_spoken: ["English", "Sinhala"],
          years_of_experience: 10,
        },
      },
    },
  });

  // Create travelers
  const traveler1 = await prisma.user.create({
    data: {
      email: "traveler1@roamio.com",
      name: "Emma Johnson",
      password_hash: hashedPasswords.traveler,
      role: "traveler",
      status: "active",
      phone_no: "+94771234571",
      bio: "Travel enthusiast exploring the beautiful landscapes of Sri Lanka.",
      travelers: {
        create: {},
      },
    },
  });

  const traveler2 = await prisma.user.create({
    data: {
      email: "traveler2@roamio.com",
      name: "David Smith",
      password_hash: hashedPasswords.traveler,
      role: "traveler",
      status: "active",
      phone_no: "+94771234572",
      bio: "Photography lover seeking hidden gems and authentic experiences.",
      travelers: {
        create: {},
      },
    },
  });

  const traveler3 = await prisma.user.create({
    data: {
      email: "traveler3@roamio.com",
      name: "Lisa Zhang",
      password_hash: hashedPasswords.traveler,
      role: "traveler",
      status: "active",
      phone_no: "+94771234584",
      bio: "Cultural explorer interested in local traditions and history.",
      travelers: {
        create: {},
      },
    },
  });

  // Create vendors
  const vendor1 = await prisma.user.create({
    data: {
      email: "vendor1@roamio.com",
      name: "Hotel Paradise Resort",
      password_hash: hashedPasswords.vendor,
      role: "vendor",
      status: "active",
      phone_no: "+94771234573",
      bio: "Luxury beachfront resort offering world-class hospitality.",
      vendor_profile: {
        create: {
          business_name: "Hotel Paradise Resort",
          business_type: "hotel",
          business_description:
            "Luxury beachfront resort offering world-class hospitality with stunning ocean views, premium amenities, and exceptional service. Experience the ultimate tropical getaway with our award-winning spa, gourmet restaurants, and pristine private beach.",
          business_website: "https://hotelparadiseresort.lk",
          tagline: "Where Luxury Meets Paradise",
          business_license: "HTL-2024-001-SR",
          social_media_links: {
            facebook: "https://facebook.com/hotelparadiseresort",
            instagram: "https://instagram.com/hotelparadiseresort",
            twitter: "https://twitter.com/paradiseresort",
          },
          verification_status: "approved",
          average_rating: 4.8,
        },
      },
    },
  });

  const vendor2 = await prisma.user.create({
    data: {
      email: "vendor2@roamio.com",
      name: "Spice Garden Restaurant",
      password_hash: hashedPasswords.vendor,
      role: "vendor",
      status: "active",
      phone_no: "+94771234574",
      bio: "Authentic Sri Lankan cuisine with traditional recipes passed down generations.",
      vendor_profile: {
        create: {
          business_name: "Spice Garden Restaurant",
          business_type: "restaurant",
          business_description:
            "Authentic Sri Lankan cuisine with traditional recipes passed down through generations. Experience the rich flavors of Ceylon with our signature curries, fresh seafood, and aromatic spices sourced directly from local gardens.",
          business_website: "https://spicegardenrestaurant.lk",
          tagline: "Taste the Heritage of Ceylon",
          business_license: "RST-2024-002-SR",
          social_media_links: {
            facebook: "https://facebook.com/spicegardenrestaurant",
            instagram: "https://instagram.com/spicegardenlk",
            tripadvisor: "https://tripadvisor.com/spice-garden-restaurant",
          },
          verification_status: "approved",
          average_rating: 4.6,
        },
      },
    },
  });

  const vendor3 = await prisma.user.create({
    data: {
      email: "vendor3@roamio.com",
      name: "Ceylon Transport Services",
      password_hash: hashedPasswords.vendor,
      role: "vendor",
      status: "active",
      phone_no: "+94771234585",
      bio: "Premium transportation services for tourists across Sri Lanka.",
      vendor_profile: {
        create: {
          business_name: "Ceylon Transport Services",
          business_type: "transport",
          business_description:
            "Premium transportation services for tourists across Sri Lanka. Our fleet of modern, air-conditioned vehicles and experienced drivers ensure comfortable and safe journeys to all major destinations including cultural sites, beaches, and hill country.",
          business_website: "https://ceylontransport.lk",
          tagline: "Your Journey, Our Passion",
          business_license: "TRP-2024-003-SR",
          social_media_links: {
            facebook: "https://facebook.com/ceylontransport",
            instagram: "https://instagram.com/ceylontransportlk",
            whatsapp: "+94771234585",
          },
          verification_status: "approved",
          average_rating: 4.7,
        },
      },
    },
  });

  return {
    admin,
    moderator,
    guide1,
    guide2,
    guide3,
    guide4,
    guide5,
    guide6,
    traveler1,
    traveler2,
    traveler3,
    vendor1,
    vendor2,
    vendor3,
  };
}

async function seedLocations() {
  console.log("📍 Seeding locations...");

  const locations = await prisma.location.createMany({
    data: [
      // Colombo locations
      {
        longitude: 79.8612,
        latitude: 6.9271,
        address: "Galle Face Green",
        city: "Colombo",
        province: "Western",
        district: "Colombo",
        postal_code: "00100",
      },
      {
        longitude: 79.8541,
        latitude: 6.932,
        address: "Independence Memorial Hall",
        city: "Colombo",
        province: "Western",
        district: "Colombo",
        postal_code: "00700",
      },
      {
        longitude: 79.8648,
        latitude: 6.9319,
        address: "Gangaramaya Temple",
        city: "Colombo",
        province: "Western",
        district: "Colombo",
        postal_code: "00200",
      },
      {
        longitude: 79.837,
        latitude: 6.9344,
        address: "Pettah Market",
        city: "Colombo",
        province: "Western",
        district: "Colombo",
        postal_code: "01100",
      },
      // Kandy locations
      {
        longitude: 80.7718,
        latitude: 7.2906,
        address: "Temple of the Sacred Tooth Relic",
        city: "Kandy",
        province: "Central",
        district: "Kandy",
        postal_code: "20000",
      },
      {
        longitude: 80.5937,
        latitude: 7.2691,
        address: "Royal Botanical Gardens",
        city: "Peradeniya",
        province: "Central",
        district: "Kandy",
        postal_code: "20400",
      },
      {
        longitude: 80.7335,
        latitude: 7.2906,
        address: "Kandy Lake",
        city: "Kandy",
        province: "Central",
        district: "Kandy",
        postal_code: "20000",
      },
      {
        longitude: 80.6337,
        latitude: 7.2691,
        address: "Spice Garden Matale",
        city: "Matale",
        province: "Central",
        district: "Matale",
        postal_code: "21000",
      },
      // Galle locations
      {
        longitude: 80.3956,
        latitude: 6.0535,
        address: "Galle Fort",
        city: "Galle",
        province: "Southern",
        district: "Galle",
        postal_code: "80000",
      },
      {
        longitude: 80.2889,
        latitude: 6.0367,
        address: "Unawatuna Beach",
        city: "Unawatuna",
        province: "Southern",
        district: "Galle",
        postal_code: "80600",
      },
      {
        longitude: 80.3956,
        latitude: 6.0535,
        address: "Dutch Reformed Church",
        city: "Galle",
        province: "Southern",
        district: "Galle",
        postal_code: "80000",
      },
      // Ancient cities
      {
        longitude: 81.8281,
        latitude: 6.9821,
        address: "Ancient City of Polonnaruwa",
        city: "Polonnaruwa",
        province: "North Central",
        district: "Polonnaruwa",
        postal_code: "51000",
      },
      {
        longitude: 80.3775,
        latitude: 8.3114,
        address: "Sigiriya Rock Fortress",
        city: "Sigiriya",
        province: "Central",
        district: "Matale",
        postal_code: "21120",
      },
      {
        longitude: 80.3982,
        latitude: 8.3439,
        address: "Dambulla Cave Temple",
        city: "Dambulla",
        province: "Central",
        district: "Matale",
        postal_code: "21100",
      },
      {
        longitude: 80.3964,
        latitude: 8.3114,
        address: "Sacred City of Anuradhapura",
        city: "Anuradhapura",
        province: "North Central",
        district: "Anuradhapura",
        postal_code: "50000",
      },
      {
        longitude: 80.4014,
        latitude: 8.3114,
        address: "Ruwanwelisaya Stupa",
        city: "Anuradhapura",
        province: "North Central",
        district: "Anuradhapura",
        postal_code: "50000",
      },
      // National Parks
      {
        longitude: 81.2152,
        latitude: 6.9497,
        address: "Yala National Park Entrance",
        city: "Tissamaharama",
        province: "Southern",
        district: "Hambantota",
        postal_code: "82600",
      },
      {
        longitude: 80.7891,
        latitude: 7.9219,
        address: "Minneriya National Park",
        city: "Minneriya",
        province: "North Central",
        district: "Polonnaruwa",
        postal_code: "50300",
      },
      {
        longitude: 81.3891,
        latitude: 6.8219,
        address: "Udawalawe National Park",
        city: "Udawalawe",
        province: "Sabaragamuwa",
        district: "Ratnapura",
        postal_code: "70190",
      },
      // Hill Country
      {
        longitude: 80.7742,
        latitude: 6.9497,
        address: "Nuwara Eliya Town",
        city: "Nuwara Eliya",
        province: "Central",
        district: "Nuwara Eliya",
        postal_code: "22200",
      },
      {
        longitude: 81.059,
        latitude: 6.882,
        address: "Ella Rock",
        city: "Ella",
        province: "Uva",
        district: "Badulla",
        postal_code: "90090",
      },
      {
        longitude: 81.049,
        latitude: 6.872,
        address: "Nine Arch Bridge",
        city: "Ella",
        province: "Uva",
        district: "Badulla",
        postal_code: "90090",
      },
      {
        longitude: 80.7842,
        latitude: 6.9597,
        address: "Hakgala Botanical Garden",
        city: "Nuwara Eliya",
        province: "Central",
        district: "Nuwara Eliya",
        postal_code: "22200",
      },
      {
        longitude: 80.7542,
        latitude: 6.9297,
        address: "Pedro Tea Estate",
        city: "Nuwara Eliya",
        province: "Central",
        district: "Nuwara Eliya",
        postal_code: "22200",
      },
      {
        longitude: 80.7942,
        latitude: 6.9697,
        address: "Horton Plains National Park",
        city: "Nuwara Eliya",
        province: "Central",
        district: "Nuwara Eliya",
        postal_code: "22200",
      },
      // Negombo
      {
        longitude: 79.8358,
        latitude: 7.2083,
        address: "Negombo Beach",
        city: "Negombo",
        province: "Western",
        district: "Gampaha",
        postal_code: "11500",
      },
      {
        longitude: 79.8258,
        latitude: 7.2183,
        address: "Negombo Fish Market",
        city: "Negombo",
        province: "Western",
        district: "Gampaha",
        postal_code: "11500",
      },
      // Mirissa
      {
        longitude: 80.4564,
        latitude: 5.9488,
        address: "Mirissa Beach",
        city: "Mirissa",
        province: "Southern",
        district: "Matara",
        postal_code: "81740",
      },
      {
        longitude: 80.4464,
        latitude: 5.9388,
        address: "Mirissa Whale Watching Point",
        city: "Mirissa",
        province: "Southern",
        district: "Matara",
        postal_code: "81740",
      },
      // Adams Peak
      {
        longitude: 80.4992,
        latitude: 6.8092,
        address: "Adams Peak Base",
        city: "Hatton",
        province: "Central",
        district: "Nuwara Eliya",
        postal_code: "22070",
      },
      {
        longitude: 80.4992,
        latitude: 6.8192,
        address: "Adams Peak Summit",
        city: "Hatton",
        province: "Central",
        district: "Nuwara Eliya",
        postal_code: "22070",
      },
      // Additional locations for comprehensive coverage
      {
        longitude: 79.84,
        latitude: 6.92,
        address: "National Museum Colombo",
        city: "Colombo",
        province: "Western",
        district: "Colombo",
        postal_code: "00700",
      },
      {
        longitude: 80.6337,
        latitude: 7.2591,
        address: "Traditional Village Experience",
        city: "Matale",
        province: "Central",
        district: "Matale",
        postal_code: "21000",
      },
    ],
  });

  return await prisma.location.findMany();
}

async function seedMedia(users) {
  console.log("🎬 Seeding media...");

  const mediaRecords = await prisma.media.createMany({
    data: [
      // Images
      {
        url: "https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg",
        s3_key: "media/images/colombo_galle_face.jpg",
        media_type: "image",
        uploaded_by_id: users.guide1.id,
        file_size: BigInt(2048576),
        format: "JPEG",
        width: 1920,
        height: 1080,
      },
      {
        url: "https://images.pexels.com/photos/2290753/pexels-photo-2290753.jpeg",
        s3_key: "media/images/kandy_temple.jpg",
        media_type: "image",
        uploaded_by_id: users.guide2.id,
        file_size: BigInt(3145728),
        format: "JPEG",
        width: 1920,
        height: 1280,
      },
      {
        url: "https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg",
        s3_key: "media/images/yala_wildlife.jpg",
        media_type: "image",
        uploaded_by_id: users.guide3.id,
        file_size: BigInt(1572864),
        format: "JPEG",
        width: 1280,
        height: 853,
      },
      {
        url: "https://images.pexels.com/photos/1007426/pexels-photo-1007426.jpeg",
        s3_key: "media/images/sigiriya_rock.jpg",
        media_type: "image",
        uploaded_by_id: users.guide4.id,
        file_size: BigInt(2621440),
        format: "JPEG",
        width: 1920,
        height: 1280,
      },
      {
        url: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg",
        s3_key: "media/images/ella_rock.jpg",
        media_type: "image",
        uploaded_by_id: users.guide5.id,
        file_size: BigInt(1835008),
        format: "JPEG",
        width: 1280,
        height: 853,
      },
      {
        url: "https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg",
        s3_key: "media/images/tea_plantation.jpg",
        media_type: "image",
        uploaded_by_id: users.guide6.id,
        file_size: BigInt(2097152),
        format: "JPEG",
        width: 1920,
        height: 1280,
      },
      // Audio files
      {
        url: "https://example.com/media/temple_audio.mp3",
        s3_key: "media/audio/temple_guide.mp3",
        media_type: "audio",
        duration_seconds: 300,
        uploaded_by_id: users.guide1.id,
        file_size: BigInt(5242880),
        format: "MP3",
        bitrate: 128,
        sample_rate: 44100,
      },
      {
        url: "https://example.com/media/nature_sounds.mp3",
        s3_key: "media/audio/nature_sounds.mp3",
        media_type: "audio",
        duration_seconds: 450,
        uploaded_by_id: users.guide2.id,
        file_size: BigInt(7340032),
        format: "MP3",
        bitrate: 128,
        sample_rate: 44100,
      },
      {
        url: "https://example.com/media/history_narration.mp3",
        s3_key: "media/audio/history_narration.mp3",
        media_type: "audio",
        duration_seconds: 600,
        uploaded_by_id: users.guide4.id,
        file_size: BigInt(9437184),
        format: "MP3",
        bitrate: 128,
        sample_rate: 44100,
      },
      {
        url: "https://example.com/media/cultural_music.mp3",
        s3_key: "media/audio/cultural_music.mp3",
        media_type: "audio",
        duration_seconds: 360,
        uploaded_by_id: users.guide5.id,
        file_size: BigInt(6291456),
        format: "MP3",
        bitrate: 128,
        sample_rate: 44100,
      },
      {
        url: "https://example.com/media/wildlife_guide.mp3",
        s3_key: "media/audio/wildlife_guide.mp3",
        media_type: "audio",
        duration_seconds: 480,
        uploaded_by_id: users.guide3.id,
        file_size: BigInt(8388608),
        format: "MP3",
        bitrate: 128,
        sample_rate: 44100,
      },
      {
        url: "https://example.com/media/tea_plantation_guide.mp3",
        s3_key: "media/audio/tea_plantation_guide.mp3",
        media_type: "audio",
        duration_seconds: 420,
        uploaded_by_id: users.guide6.id,
        file_size: BigInt(7340032),
        format: "MP3",
        bitrate: 128,
        sample_rate: 44100,
      },
    ],
  });

  return await prisma.media.findMany();
}

async function seedTourPackages(users, media) {
  console.log("🎒 Seeding 20 tour packages...");

  // Get guide IDs from the TravelGuide table (not User table)
  const guides = await prisma.travelGuide.findMany({
    orderBy: { id: "asc" },
  });

  const tourPackagesData = [
    // PUBLISHED PACKAGES (6)
    {
      guide_id: guides[0].id,
      title: "Colombo City Cultural Experience",
      description:
        "Explore the vibrant culture and history of Colombo with visits to iconic landmarks, local markets, and historical sites.",
      price: 5000.0,
      duration_minutes: 480,
      status: "published",
      created_at: new Date("2024-01-01T10:00:00Z"),
      cover_image_id: media[0].id,
    },
    {
      guide_id: guides[0].id,
      title: "Sacred Kandy Temple Tour",
      description:
        "A spiritual journey through Kandy featuring the Temple of the Sacred Tooth Relic and beautiful botanical gardens.",
      price: 7500.0,
      duration_minutes: 360,
      status: "published",
      created_at: new Date("2024-01-02T10:00:00Z"),
      cover_image_id: media[1].id,
    },
    {
      guide_id: guides[1].id,
      title: "Ancient Wonders Adventure",
      description:
        "Discover the ancient civilizations of Sri Lanka with visits to Sigiriya Rock Fortress and Polonnaruwa.",
      price: 12000.0,
      duration_minutes: 720,
      status: "published",
      created_at: new Date("2024-01-03T10:00:00Z"),
      cover_image_id: media[3].id,
    },
    {
      guide_id: guides[2].id,
      title: "Yala Wildlife Safari Experience",
      description:
        "Full-day wildlife safari in Yala National Park with opportunities to spot leopards, elephants, and exotic birds.",
      price: 9500.0,
      duration_minutes: 600,
      status: "published",
      created_at: new Date("2024-01-04T10:00:00Z"),
      cover_image_id: media[2].id,
    },
    {
      guide_id: guides[4].id,
      title: "Authentic Sri Lankan Culinary Journey",
      description:
        "Experience authentic Sri Lankan cuisine through cooking classes, spice garden visits, and traditional meals.",
      price: 6800.0,
      duration_minutes: 420,
      status: "published",
      created_at: new Date("2024-01-05T10:00:00Z"),
    },
    {
      guide_id: guides[5].id,
      title: "Hill Country Tea Trail",
      description:
        "Explore the scenic hill country, visit tea plantations, and learn about Ceylon tea production.",
      price: 8200.0,
      duration_minutes: 540,
      status: "published",
      created_at: new Date("2024-01-06T10:00:00Z"),
      cover_image_id: media[5].id,
    },

    // PENDING APPROVAL PACKAGES (10)
    {
      guide_id: guides[1].id,
      title: "Southern Coast Heritage Tour",
      description:
        "Experience the colonial heritage and natural beauty of the southern coast including Galle Fort.",
      price: 8500.0,
      duration_minutes: 540,
      status: "pending_approval",
      created_at: new Date("2024-01-15T10:00:00Z"),
    },
    {
      guide_id: guides[2].id,
      title: "Minneriya Elephant Gathering Tour",
      description:
        "Witness the famous elephant gathering at Minneriya National Park during the dry season.",
      price: 7800.0,
      duration_minutes: 300,
      status: "pending_approval",
      created_at: new Date("2024-01-16T10:00:00Z"),
    },
    {
      guide_id: guides[3].id,
      title: "Anuradhapura Sacred City Exploration",
      description:
        "Journey through the ancient sacred city of Anuradhapura with its magnificent stupas and ruins.",
      price: 9200.0,
      duration_minutes: 480,
      status: "pending_approval",
      created_at: new Date("2024-01-17T10:00:00Z"),
    },
    {
      guide_id: guides[0].id,
      title: "Negombo Fish Market and Beach Tour",
      description:
        "Experience the bustling fish market and relax on beautiful Negombo beach.",
      price: 4500.0,
      duration_minutes: 240,
      status: "pending_approval",
      created_at: new Date("2024-01-18T10:00:00Z"),
    },
    {
      guide_id: guides[1].id,
      title: "Mirissa Whale Watching Adventure",
      description:
        "Early morning whale watching trip from Mirissa with chances to see blue whales and dolphins.",
      price: 11000.0,
      duration_minutes: 360,
      status: "pending_approval",
      created_at: new Date("2024-01-19T10:00:00Z"),
    },
    {
      guide_id: guides[5].id,
      title: "Ella Rock Hiking Experience",
      description:
        "Challenging hike to Ella Rock with breathtaking views of the hill country landscape.",
      price: 5500.0,
      duration_minutes: 420,
      status: "pending_approval",
      created_at: new Date("2024-01-20T10:00:00Z"),
      cover_image_id: media[4].id,
    },
    {
      guide_id: guides[3].id,
      title: "Dambulla Cave Temple Discovery",
      description:
        "Explore the magnificent cave temples of Dambulla with ancient Buddhist paintings and statues.",
      price: 6200.0,
      duration_minutes: 300,
      status: "pending_approval",
      created_at: new Date("2024-01-21T10:00:00Z"),
    },
    {
      guide_id: guides[4].id,
      title: "Traditional Village Life Experience",
      description:
        "Immerse yourself in rural Sri Lankan life with village activities and home-cooked meals.",
      price: 3800.0,
      duration_minutes: 480,
      status: "pending_approval",
      created_at: new Date("2024-01-22T10:00:00Z"),
    },
    {
      guide_id: guides[1].id,
      title: "Sunrise at Adams Peak Pilgrimage",
      description:
        "Spiritual night climb to Adams Peak to witness the spectacular sunrise from the sacred summit.",
      price: 8900.0,
      duration_minutes: 720,
      status: "pending_approval",
      created_at: new Date("2024-01-23T10:00:00Z"),
    },
    {
      guide_id: guides[0].id,
      title: "Colombo Street Food Walking Tour",
      description:
        "Discover the diverse street food scene of Colombo with tastings from local vendors and markets.",
      price: 3200.0,
      duration_minutes: 180,
      status: "pending_approval",
      created_at: new Date("2024-01-24T10:00:00Z"),
    },

    // REJECTED PACKAGES (4)
    {
      guide_id: guides[2].id,
      title: "Incomplete Wildlife Safari",
      description: "Basic safari tour without proper planning.",
      price: 15000.0,
      duration_minutes: 120,
      status: "rejected",
      created_at: new Date("2024-01-25T10:00:00Z"),
      rejection_reason:
        "Insufficient detail in itinerary and overpriced for duration offered.",
    },
    {
      guide_id: guides[3].id,
      title: "Rushed Ancient Sites Tour",
      description: "Quick tour of historical sites.",
      price: 20000.0,
      duration_minutes: 180,
      status: "rejected",
      created_at: new Date("2024-01-26T10:00:00Z"),
      rejection_reason:
        "Tour duration too short for the number of sites claimed to be covered.",
    },
    {
      guide_id: guides[4].id,
      title: "Generic Beach Tour",
      description: "Standard beach visit.",
      price: 12000.0,
      duration_minutes: 60,
      status: "rejected",
      created_at: new Date("2024-01-27T10:00:00Z"),
      rejection_reason:
        "Lacks unique value proposition and proper activity planning.",
    },
    {
      guide_id: guides[5].id,
      title: "Unverified Mountain Adventure",
      description: "Mountain climbing without safety measures.",
      price: 25000.0,
      duration_minutes: 240,
      status: "rejected",
      created_at: new Date("2024-01-28T10:00:00Z"),
      rejection_reason:
        "Missing safety protocols and required certifications for adventure activities.",
    },
  ];

  const packages = [];
  for (const packageData of tourPackagesData) {
    const pkg = await prisma.tourPackage.create({
      data: packageData,
    });
    packages.push(pkg);
  }

  return packages;
}

async function seedTourStops(packages, locations, media) {
  console.log("🚏 Seeding comprehensive tour stops for ALL 20 packages...");

  // Create stops for ALL packages (published, pending, and rejected)
  const tourStopsData = [
    // Package 1: Colombo Cultural (3 stops)
    {
      package_id: packages[0].id,
      sequence_no: 1,
      stop_name: "Galle Face Green",
      description:
        "Start your journey at the iconic seafront promenade with stunning ocean views and local street food.",
      location_id: locations[0].id,
    },
    {
      package_id: packages[0].id,
      sequence_no: 2,
      stop_name: "Independence Memorial Hall",
      description:
        "Visit the national monument commemorating Sri Lanka's independence with beautiful architecture.",
      location_id: locations[1].id,
    },
    {
      package_id: packages[0].id,
      sequence_no: 3,
      stop_name: "Gangaramaya Temple",
      description:
        "Explore one of Colombo's most important Buddhist temples with its eclectic architecture.",
      location_id: locations[2].id,
    },

    // Package 2: Kandy Temple (4 stops)
    {
      package_id: packages[1].id,
      sequence_no: 1,
      stop_name: "Temple of the Sacred Tooth Relic",
      description:
        "Visit the most sacred Buddhist temple in Sri Lanka housing the tooth relic of Lord Buddha.",
      location_id: locations[4].id,
    },
    {
      package_id: packages[1].id,
      sequence_no: 2,
      stop_name: "Royal Botanical Gardens Peradeniya",
      description:
        "Explore the magnificent botanical gardens with rare plants and beautiful landscapes.",
      location_id: locations[5].id,
    },
    {
      package_id: packages[1].id,
      sequence_no: 3,
      stop_name: "Kandy Lake",
      description:
        "Peaceful walk around the scenic artificial lake in the heart of Kandy.",
      location_id: locations[6].id,
    },
    {
      package_id: packages[1].id,
      sequence_no: 4,
      stop_name: "Spice Garden Matale",
      description:
        "Learn about Sri Lankan spices and their traditional uses in cooking and medicine.",
      location_id: locations[7].id,
    },

    // Package 3: Ancient Wonders (3 stops)
    {
      package_id: packages[2].id,
      sequence_no: 1,
      stop_name: "Sigiriya Rock Fortress",
      description:
        "Climb the ancient rock fortress and marvel at the engineering marvel of the 5th century.",
      location_id: locations[12].id,
    },
    {
      package_id: packages[2].id,
      sequence_no: 2,
      stop_name: "Dambulla Cave Temple",
      description:
        "Explore the cave temple complex with ancient Buddhist art and statues.",
      location_id: locations[13].id,
    },
    {
      package_id: packages[2].id,
      sequence_no: 3,
      stop_name: "Ancient City of Polonnaruwa",
      description:
        "Discover the ruins of the ancient capital with well-preserved statues and structures.",
      location_id: locations[11].id,
    },

    // Package 4: Yala Wildlife (2 stops)
    {
      package_id: packages[3].id,
      sequence_no: 1,
      stop_name: "Yala National Park - Block 1",
      description:
        "Main safari area with highest leopard density in the world.",
      location_id: locations[16].id,
    },
    {
      package_id: packages[3].id,
      sequence_no: 2,
      stop_name: "Yala Beach Area",
      description:
        "Coastal area within the park where elephants come to drink and bathe.",
      location_id: locations[16].id,
    },

    // Package 5: Culinary Journey (3 stops)
    {
      package_id: packages[4].id,
      sequence_no: 1,
      stop_name: "Traditional Spice Garden",
      description:
        "Learn about Sri Lankan spices and traditional cooking methods.",
      location_id: locations[7].id,
    },
    {
      package_id: packages[4].id,
      sequence_no: 2,
      stop_name: "Local Cooking Class",
      description:
        "Hands-on cooking experience preparing authentic Sri Lankan dishes.",
      location_id: locations[6].id,
    },
    {
      package_id: packages[4].id,
      sequence_no: 3,
      stop_name: "Traditional Market Visit",
      description:
        "Explore local markets and learn about fresh ingredients used in Sri Lankan cuisine.",
      location_id: locations[3].id,
    },

    // Package 6: Hill Country Tea (4 stops)
    {
      package_id: packages[5].id,
      sequence_no: 1,
      stop_name: "Nuwara Eliya Town",
      description: 'Visit the charming hill station known as "Little England".',
      location_id: locations[19].id,
    },
    {
      package_id: packages[5].id,
      sequence_no: 2,
      stop_name: "Pedro Tea Estate",
      description:
        "Tour a working tea plantation and learn about Ceylon tea production.",
      location_id: locations[23].id,
    },
    {
      package_id: packages[5].id,
      sequence_no: 3,
      stop_name: "Hakgala Botanical Garden",
      description:
        "Explore the beautiful botanical garden with temperate climate plants.",
      location_id: locations[22].id,
    },
    {
      package_id: packages[5].id,
      sequence_no: 4,
      stop_name: "Horton Plains National Park",
      description:
        "Visit the plateau with unique ecosystem and World's End viewpoint.",
      location_id: locations[24].id,
    },

    // Package 7: Southern Coast Heritage (3 stops)
    {
      package_id: packages[6].id,
      sequence_no: 1,
      stop_name: "Galle Fort",
      description:
        "Walk through the UNESCO World Heritage Dutch colonial fort.",
      location_id: locations[8].id,
    },
    {
      package_id: packages[6].id,
      sequence_no: 2,
      stop_name: "Dutch Reformed Church",
      description: "Visit the historic church built by Dutch colonizers.",
      location_id: locations[10].id,
    },
    {
      package_id: packages[6].id,
      sequence_no: 3,
      stop_name: "Unawatuna Beach",
      description: "Relax on one of Sri Lanka's most beautiful beaches.",
      location_id: locations[9].id,
    },

    // Package 8: Minneriya Elephant (2 stops)
    {
      package_id: packages[7].id,
      sequence_no: 1,
      stop_name: "Minneriya National Park",
      description: "Witness the famous elephant gathering during dry season.",
      location_id: locations[17].id,
    },
    {
      package_id: packages[7].id,
      sequence_no: 2,
      stop_name: "Minneriya Tank",
      description:
        "Ancient reservoir where elephants gather to drink and bathe.",
      location_id: locations[17].id,
    },

    // Package 9: Anuradhapura Sacred (4 stops)
    {
      package_id: packages[8].id,
      sequence_no: 1,
      stop_name: "Sacred City of Anuradhapura",
      description:
        "Explore the ancient capital and first kingdom of Sri Lanka.",
      location_id: locations[14].id,
    },
    {
      package_id: packages[8].id,
      sequence_no: 2,
      stop_name: "Ruwanwelisaya Stupa",
      description: "Visit one of the most sacred Buddhist stupas in Sri Lanka.",
      location_id: locations[15].id,
    },
    {
      package_id: packages[8].id,
      sequence_no: 3,
      stop_name: "Sri Maha Bodhi Tree",
      description:
        "Pay respects at the sacred Bodhi tree, grown from a cutting of the original tree under which Buddha attained enlightenment.",
      location_id: locations[14].id,
    },
    {
      package_id: packages[8].id,
      sequence_no: 4,
      stop_name: "Abhayagiri Monastery",
      description:
        "Explore the ruins of one of the most important monastic complexes of ancient Sri Lanka.",
      location_id: locations[14].id,
    },

    // Package 10: Negombo Fish Market (2 stops)
    {
      package_id: packages[9].id,
      sequence_no: 1,
      stop_name: "Negombo Fish Market",
      description:
        "Experience the bustling morning fish market with fresh catches.",
      location_id: locations[26].id,
    },
    {
      package_id: packages[9].id,
      sequence_no: 2,
      stop_name: "Negombo Beach",
      description:
        "Relax on the golden sandy beach and watch traditional fishing boats.",
      location_id: locations[25].id,
    },

    // Package 11: Mirissa Whale Watching (2 stops)
    {
      package_id: packages[10].id,
      sequence_no: 1,
      stop_name: "Mirissa Whale Watching Point",
      description:
        "Board the boat for whale watching adventure in the deep blue sea.",
      location_id: locations[28].id,
    },
    {
      package_id: packages[10].id,
      sequence_no: 2,
      stop_name: "Mirissa Beach",
      description:
        "Relax on the beautiful crescent-shaped beach after whale watching.",
      location_id: locations[27].id,
    },

    // Package 12: Ella Rock Hiking (3 stops)
    {
      package_id: packages[11].id,
      sequence_no: 1,
      stop_name: "Ella Rock Trailhead",
      description: "Start the challenging hike to Ella Rock summit.",
      location_id: locations[20].id,
    },
    {
      package_id: packages[11].id,
      sequence_no: 2,
      stop_name: "Ella Rock Summit",
      description:
        "Reach the summit for breathtaking 360-degree views of hill country.",
      location_id: locations[20].id,
    },
    {
      package_id: packages[11].id,
      sequence_no: 3,
      stop_name: "Nine Arch Bridge",
      description:
        "Visit the iconic railway bridge and watch trains pass through.",
      location_id: locations[21].id,
    },

    // Package 13: Dambulla Cave Temple (2 stops)
    {
      package_id: packages[12].id,
      sequence_no: 1,
      stop_name: "Dambulla Cave Temple Complex",
      description:
        "Explore the five caves with ancient Buddhist paintings and statues.",
      location_id: locations[13].id,
    },
    {
      package_id: packages[12].id,
      sequence_no: 2,
      stop_name: "Golden Temple Museum",
      description:
        "Learn about the history and significance of the cave temples.",
      location_id: locations[13].id,
    },

    // Package 14: Traditional Village (3 stops)
    {
      package_id: packages[13].id,
      sequence_no: 1,
      stop_name: "Traditional Village Experience",
      description:
        "Immerse yourself in authentic rural Sri Lankan village life.",
      location_id: locations[32].id,
    },
    {
      package_id: packages[13].id,
      sequence_no: 2,
      stop_name: "Village Cooking Experience",
      description:
        "Learn traditional cooking methods and enjoy home-cooked meals.",
      location_id: locations[32].id,
    },
    {
      package_id: packages[13].id,
      sequence_no: 3,
      stop_name: "Village Craft Workshop",
      description:
        "Try your hand at traditional crafts like pottery and weaving.",
      location_id: locations[32].id,
    },

    // Package 15: Adams Peak Pilgrimage (3 stops)
    {
      package_id: packages[14].id,
      sequence_no: 1,
      stop_name: "Adams Peak Base Camp",
      description: "Start the spiritual night climb to the sacred summit.",
      location_id: locations[29].id,
    },
    {
      package_id: packages[14].id,
      sequence_no: 2,
      stop_name: "Rest Point Halfway",
      description: "Take a break at the halfway point with tea and snacks.",
      location_id: locations[29].id,
    },
    {
      package_id: packages[14].id,
      sequence_no: 3,
      stop_name: "Adams Peak Summit",
      description:
        "Reach the sacred summit and witness the spectacular sunrise.",
      location_id: locations[30].id,
    },

    // Package 16: Colombo Street Food (4 stops)
    {
      package_id: packages[15].id,
      sequence_no: 1,
      stop_name: "Pettah Market",
      description: "Start the food tour at the bustling Pettah market area.",
      location_id: locations[3].id,
    },
    {
      package_id: packages[15].id,
      sequence_no: 2,
      stop_name: "Galle Face Green Food Stalls",
      description: "Try popular street food at the iconic Galle Face Green.",
      location_id: locations[0].id,
    },
    {
      package_id: packages[15].id,
      sequence_no: 3,
      stop_name: "Local Tea Shop",
      description:
        "Experience authentic Sri Lankan tea culture at a local tea shop.",
      location_id: locations[2].id,
    },
    {
      package_id: packages[15].id,
      sequence_no: 4,
      stop_name: "Traditional Sweet Shop",
      description:
        "End the tour with traditional Sri Lankan sweets and desserts.",
      location_id: locations[3].id,
    },

    // Package 17: Incomplete Wildlife Safari (1 stop - minimal as it's rejected)
    {
      package_id: packages[16].id,
      sequence_no: 1,
      stop_name: "Basic Safari Drive",
      description: "Quick drive through wildlife area.",
      location_id: locations[16].id,
    },

    // Package 18: Rushed Ancient Sites (2 stops - minimal as it's rejected)
    {
      package_id: packages[17].id,
      sequence_no: 1,
      stop_name: "Quick Sigiriya View",
      description: "Brief stop at Sigiriya base.",
      location_id: locations[12].id,
    },
    {
      package_id: packages[17].id,
      sequence_no: 2,
      stop_name: "Polonnaruwa Drive-by",
      description: "Quick drive through ancient city.",
      location_id: locations[11].id,
    },

    // Package 19: Generic Beach Tour (1 stop - minimal as it's rejected)
    {
      package_id: packages[18].id,
      sequence_no: 1,
      stop_name: "Beach Visit",
      description: "Standard beach visit.",
      location_id: locations[9].id,
    },

    // Package 20: Unverified Mountain Adventure (2 stops - minimal as it's rejected)
    {
      package_id: packages[19].id,
      sequence_no: 1,
      stop_name: "Mountain Base",
      description: "Starting point for mountain climb.",
      location_id: locations[20].id,
    },
    {
      package_id: packages[19].id,
      sequence_no: 2,
      stop_name: "Mountain Trail",
      description: "Basic mountain trail without proper safety measures.",
      location_id: locations[20].id,
    },
  ];

  // Create all tour stops
  for (const stopData of tourStopsData) {
    await prisma.tourStop.create({
      data: stopData,
    });
  }

  // Create tour stop media relations for some stops
  const tourStops = await prisma.tourStop.findMany();
  await prisma.tourStopMedia.createMany({
    data: [
      { stop_id: tourStops[0].id, media_id: media[0].id },
      { stop_id: tourStops[3].id, media_id: media[6].id },
      { stop_id: tourStops[7].id, media_id: media[8].id },
      { stop_id: tourStops[10].id, media_id: media[1].id },
      { stop_id: tourStops[13].id, media_id: media[10].id },
      { stop_id: tourStops[17].id, media_id: media[11].id },
      { stop_id: tourStops[20].id, media_id: media[2].id },
      { stop_id: tourStops[25].id, media_id: media[3].id },
      { stop_id: tourStops[30].id, media_id: media[4].id },
      { stop_id: tourStops[35].id, media_id: media[5].id },
    ],
  });

  console.log(
    `✅ Created ${tourStopsData.length} tour stops across all 20 packages`
  );
}

async function seedPayments(users, packages) {
  console.log("💳 Seeding payments...");

  // Get published packages for payments
  const publishedPackages = packages.filter(
    (pkg) => pkg.status === "published"
  );

  await prisma.payment.createMany({
    data: [
      {
        transaction_id: "TXN_001_2024",
        user_id: users.traveler1.id,
        package_id: publishedPackages[0].id,
        amount: 5000.0,
        status: "completed",
        currency: "LKR",
        paid_at: new Date("2024-01-15T10:30:00Z"),
        invoice_number: "INV-001-2024",
      },
      {
        transaction_id: "TXN_002_2024",
        user_id: users.traveler2.id,
        package_id: publishedPackages[1].id,
        amount: 7500.0,
        status: "completed",
        currency: "LKR",
        paid_at: new Date("2024-01-20T14:15:00Z"),
        invoice_number: "INV-002-2024",
      },
      {
        transaction_id: "TXN_003_2024",
        user_id: users.traveler3.id,
        package_id: publishedPackages[2].id,
        amount: 12000.0,
        status: "completed",
        currency: "LKR",
        paid_at: new Date("2024-01-25T09:45:00Z"),
        invoice_number: "INV-003-2024",
      },
      {
        transaction_id: "TXN_004_2024",
        user_id: users.traveler1.id,
        package_id: publishedPackages[3].id,
        amount: 9500.0,
        status: "pending",
        currency: "LKR",
      },
      {
        transaction_id: "TXN_005_2024",
        user_id: users.traveler2.id,
        package_id: publishedPackages[4].id,
        amount: 6800.0,
        status: "failed",
        currency: "LKR",
      },
    ],
  });
}

async function seedDownloads(users, packages) {
  console.log("⬇️ Seeding downloads...");

  const travelers = await prisma.traveler.findMany();
  const publishedPackages = packages.filter(
    (pkg) => pkg.status === "published"
  );

  await prisma.download.createMany({
    data: [
      {
        traveler_id: travelers[0].id,
        package_id: publishedPackages[0].id,
        date: new Date("2024-01-15T11:00:00Z"),
        time: new Date("2024-01-15T11:00:00Z"),
        file_size: BigInt(15728640),
        url: "https://downloads.roamio.com/packages/colombo_cultural_v1.zip",
      },
      {
        traveler_id: travelers[1].id,
        package_id: publishedPackages[1].id,
        date: new Date("2024-01-20T15:00:00Z"),
        time: new Date("2024-01-20T15:00:00Z"),
        file_size: BigInt(23068672),
        url: "https://downloads.roamio.com/packages/kandy_temple_v1.zip",
      },
      {
        traveler_id: travelers[2].id,
        package_id: publishedPackages[2].id,
        date: new Date("2024-01-25T10:30:00Z"),
        time: new Date("2024-01-25T10:30:00Z"),
        file_size: BigInt(31457280),
        url: "https://downloads.roamio.com/packages/ancient_wonders_v1.zip",
      },
    ],
  });
}

async function seedReviews(users, packages) {
  console.log("⭐ Seeding reviews...");

  const travelers = await prisma.traveler.findMany();
  const publishedPackages = packages.filter(
    (pkg) => pkg.status === "published"
  );

  await prisma.review.createMany({
    data: [
      {
        traveler_id: travelers[0].id,
        package_id: publishedPackages[0].id,
        user_id: users.traveler1.id,
        rating: 5,
        comments:
          "Absolutely fantastic tour! Sarah was incredibly knowledgeable and made the history come alive. Highly recommended!",
        date: new Date("2024-01-16T18:00:00Z"),
      },
      {
        traveler_id: travelers[1].id,
        package_id: publishedPackages[1].id,
        user_id: users.traveler2.id,
        rating: 4,
        comments:
          "Beautiful temple and great insights into Buddhist culture. The audio guide was very helpful.",
        date: new Date("2024-01-21T16:30:00Z"),
      },
      {
        traveler_id: travelers[2].id,
        package_id: publishedPackages[2].id,
        user_id: users.traveler3.id,
        rating: 5,
        comments:
          "Incredible ancient sites! Michael's expertise in archaeology made this tour unforgettable.",
        date: new Date("2024-01-26T14:20:00Z"),
      },
      {
        traveler_id: travelers[0].id,
        package_id: publishedPackages[3].id,
        user_id: users.traveler1.id,
        rating: 4,
        comments:
          "Great wildlife experience. Saw leopards, elephants, and many birds. Priya was an excellent guide.",
        date: new Date("2024-01-28T17:45:00Z"),
      },
      {
        traveler_id: travelers[1].id,
        package_id: publishedPackages[4].id,
        user_id: users.traveler2.id,
        rating: 5,
        comments:
          "Amazing culinary experience! Learned so much about Sri Lankan spices and cooking techniques.",
        date: new Date("2024-01-30T19:15:00Z"),
      },
    ],
  });
}

async function seedHiddenPlaces(users, locations, media) {
  console.log("🗺️ Seeding hidden places...");

  const travelers = await prisma.traveler.findMany();

  await prisma.hiddenPlace.createMany({
    data: [
      {
        traveler_id: travelers[0].id,
        location_id: locations[27].id, // Mirissa
        picture_id: media[2].id,
        title: "Secret Cove near Mirissa",
        description:
          "A hidden beach cove perfect for watching sunsets away from crowds.",
        status: "approved",
        created_at: new Date("2024-01-10T12:00:00Z"),
        verified_at: new Date("2024-01-12T09:00:00Z"),
      },
      {
        traveler_id: travelers[1].id,
        location_id: locations[20].id, // Ella
        picture_id: media[3].id,
        title: "Hidden Waterfall near Ella",
        description:
          "A secluded waterfall accessible via a short trek from Ella town.",
        status: "approved",
        created_at: new Date("2024-01-14T15:30:00Z"),
        verified_at: new Date("2024-01-16T11:20:00Z"),
      },
      {
        traveler_id: travelers[2].id,
        location_id: locations[19].id, // Nuwara Eliya
        picture_id: media[4].id,
        title: "Secret Tea Garden Viewpoint",
        description:
          "A lesser-known viewpoint offering panoramic views of tea plantations.",
        status: "pending",
        created_at: new Date("2024-01-28T10:15:00Z"),
      },
    ],
  });
}

async function seedPOIs(users, locations) {
  console.log("📍 Seeding POIs...");

  await prisma.pOI.createMany({
    data: [
      {
        name: "Paradise Beach Resort",
        category: "Accommodation",
        description:
          "Luxury beachfront resort with world-class amenities and spa services.",
        type: "hotel",
        status: "approved",
        location_id: locations[8].id, // Galle
        vendor_id: users.vendor1.id,
        created_at: new Date("2024-01-05T10:00:00Z"),
      },
      {
        name: "Spice Garden Restaurant",
        category: "Dining",
        description:
          "Authentic Sri Lankan cuisine with traditional spices and cooking methods.",
        type: "restaurant",
        status: "approved",
        location_id: locations[4].id, // Kandy
        vendor_id: users.vendor2.id,
        created_at: new Date("2024-01-08T14:00:00Z"),
      },
      {
        name: "Ceylon Transport Hub",
        category: "Transportation",
        description:
          "Premium transportation services for tourists across Sri Lanka.",
        type: "transport",
        status: "approved",
        location_id: locations[0].id, // Colombo
        vendor_id: users.vendor3.id,
        created_at: new Date("2024-01-12T09:30:00Z"),
      },
      {
        name: "Hill Country Eco Lodge",
        category: "Accommodation",
        description:
          "Sustainable eco-lodge in the heart of Sri Lanka's hill country.",
        type: "hotel",
        status: "pending_approval",
        location_id: locations[19].id, // Nuwara Eliya
        vendor_id: users.vendor1.id,
        created_at: new Date("2024-01-25T16:45:00Z"),
      },
    ],
  });
}

async function seedReports(users, packages) {
  console.log("📋 Seeding reports...");

  const rejectedPackages = packages.filter((pkg) => pkg.status === "rejected");

  await prisma.report.createMany({
    data: [
      {
        reporter_id: users.traveler2.id,
        reported_user_id: users.guide1.id,
        status: "resolved",
        description:
          "Tour guide was late to the meeting point, but issue was resolved through communication.",
        created_at: new Date("2024-01-17T09:00:00Z"),
      },
      {
        reporter_id: users.moderator.id,
        reported_package_id: rejectedPackages[0].id,
        status: "resolved",
        description:
          "Package content was insufficient and pricing was not justified.",
        created_at: new Date("2024-01-26T11:30:00Z"),
      },
      {
        reporter_id: users.admin.id,
        reported_package_id: rejectedPackages[3].id,
        status: "resolved",
        description: "Safety protocols missing for adventure activities.",
        created_at: new Date("2024-01-29T14:15:00Z"),
      },
      {
        reporter_id: users.traveler3.id,
        reported_user_id: users.guide3.id,
        status: "open",
        description: "Guide canceled tour last minute without proper notice.",
        created_at: new Date("2024-01-30T08:45:00Z"),
      },
    ],
  });
}

async function seedSupportTickets(users) {
  console.log("🎫 Seeding support tickets...");

  const travelGuides = await prisma.travelGuide.findMany();
  const vendors = await prisma.vendor.findMany();

  await prisma.supportTicket.createMany({
    data: [
      {
        user_id: users.traveler1.id,
        user_type: "traveler",
        category: "payment",
        subject: "Payment issue with tour package",
        description:
          "I made a payment for the Colombo Cultural Experience tour but haven't received confirmation. The amount was deducted from my account but the booking status shows as pending.",
        urgency: "high",
        status: "in_progress",
        opened_at: new Date("2024-01-20T09:30:00Z"),
        created_at: new Date("2024-01-20T09:30:00Z"),
      },
      {
        user_id: users.guide2.id,
        user_type: "travel_guide",
        travel_guide_id: travelGuides[1].id,
        category: "technical",
        subject: "Unable to upload tour package images",
        description:
          "I'm experiencing difficulties uploading images for my new tour package. The upload keeps failing with an error message. I've tried different image formats but the issue persists.",
        urgency: "medium",
        status: "open",
        opened_at: new Date("2024-01-25T14:20:00Z"),
        created_at: new Date("2024-01-25T14:20:00Z"),
      },
      {
        user_id: users.vendor1.id,
        user_type: "vendor",
        vendor_id: vendors[0].id,
        category: "account",
        subject: "POI approval status inquiry",
        description:
          "My POI submission for Paradise Beach Resort was submitted over a week ago but still shows as pending approval. Could you please provide an update on the review process?",
        urgency: "low",
        status: "resolved",
        resolution:
          "POI has been approved and is now live on the platform. We apologize for the delay in the review process.",
        opened_at: new Date("2024-01-18T11:45:00Z"),
        resolved_at: new Date("2024-01-22T16:30:00Z"),
        created_at: new Date("2024-01-18T11:45:00Z"),
      },
      {
        user_id: users.traveler3.id,
        user_type: "traveler",
        category: "customer",
        subject: "Tour guide no-show issue",
        description:
          "I had a booking for the Ancient Wonders Adventure tour yesterday, but the guide never showed up at the meeting point. I waited for over an hour and tried calling multiple times with no response.",
        urgency: "high",
        status: "in_progress",
        opened_at: new Date("2024-01-30T18:15:00Z"),
        created_at: new Date("2024-01-30T18:15:00Z"),
      },
      {
        user_id: users.guide5.id,
        user_type: "travel_guide",
        travel_guide_id: travelGuides[4].id,
        category: "feature_request",
        subject: "Request for multi-language audio support",
        description:
          "It would be great to have the ability to upload audio guides in multiple languages for the same tour package. Many of my international clients speak different languages and this would enhance their experience.",
        urgency: "low",
        status: "open",
        opened_at: new Date("2024-02-01T10:00:00Z"),
        created_at: new Date("2024-02-01T10:00:00Z"),
      },
    ],
  });

  console.log(
    "✅ Created 5 support tickets with various categories and statuses"
  );
}

async function main() {
  try {
    console.log("🌱 Starting comprehensive database seeding...\n");

    // Clear existing data
    await clearDatabase();

    // Seed data step by step
    const users = await seedUsers();
    const locations = await seedLocations();
    const media = await seedMedia(users);
    const packages = await seedTourPackages(users, media);
    await seedTourStops(packages, locations, media);
    await seedPayments(users, packages);
    await seedDownloads(users, packages);
    await seedReviews(users, packages);
    await seedHiddenPlaces(users, locations, media);
    await seedPOIs(users, locations);
    await seedReports(users, packages);
    await seedSupportTickets(users);

    // Count packages by status
    const packageCounts = await prisma.tourPackage.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    // Count tour stops and support tickets
    const totalStops = await prisma.tourStop.count();
    const supportTicketCounts = await prisma.supportTicket.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    console.log("\n🎉 Comprehensive database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(
      "- 12 Users created (1 admin, 1 moderator, 6 guides, 3 travelers, 3 vendors)"
    );
    console.log(`- ${locations.length} Locations across Sri Lanka`);
    console.log("- 12 Media files (6 images, 6 audio)");
    console.log("- 20 Tour packages with status distribution:");

    packageCounts.forEach((count) => {
      console.log(`  • ${count.status}: ${count._count.status} packages`);
    });

    console.log(
      `- ${totalStops} Tour stops created for ALL packages (including pending and rejected)`
    );
    console.log("- 5 Payment records with various statuses");
    console.log("- 3 Downloads from completed tours");
    console.log("- 5 Reviews for published packages");
    console.log("- 3 Hidden places (2 approved, 1 pending)");
    console.log("- 4 POIs (3 approved, 1 pending_approval)");
    console.log("- 4 Reports (3 resolved, 1 open)");
    console.log("- 5 Support tickets with status distribution:");

    supportTicketCounts.forEach((count) => {
      console.log(`  • ${count.status}: ${count._count.status} tickets`);
    });

    console.log("\n🔐 Test Login Credentials:");
    console.log("┌─────────────┬─────────────────────┬───────────────┐");
    console.log("│ Role        │ Email               │ Password      │");
    console.log("├─────────────┼─────────────────────┼───────────────┤");
    console.log(
      `│ Admin       │ admin@roamio.com    │ ${testPasswords.admin}     │`
    );
    console.log(
      `│ Moderator   │ moderator@roamio.com│ ${testPasswords.moderator} │`
    );
    console.log(
      `│ Guide 1     │ guide1@roamio.com   │ ${testPasswords.guide}      │`
    );
    console.log(
      `│ Guide 2     │ guide2@roamio.com   │ ${testPasswords.guide}      │`
    );
    console.log(
      `│ Guide 3     │ guide3@roamio.com   │ ${testPasswords.guide}      │`
    );
    console.log(
      `│ Guide 4     │ guide4@roamio.com   │ ${testPasswords.guide}      │`
    );
    console.log(
      `│ Guide 5     │ guide5@roamio.com   │ ${testPasswords.guide}      │`
    );
    console.log(
      `│ Guide 6     │ guide6@roamio.com   │ ${testPasswords.guide}      │`
    );
    console.log(
      `│ Traveler 1  │ traveler1@roamio.com│ ${testPasswords.traveler}  │`
    );
    console.log(
      `│ Traveler 2  │ traveler2@roamio.com│ ${testPasswords.traveler}  │`
    );
    console.log(
      `│ Traveler 3  │ traveler3@roamio.com│ ${testPasswords.traveler}  │`
    );
    console.log(
      `│ Vendor 1    │ vendor1@roamio.com  │ ${testPasswords.vendor}     │`
    );
    console.log(
      `│ Vendor 2    │ vendor2@roamio.com  │ ${testPasswords.vendor}     │`
    );
    console.log(
      `│ Vendor 3    │ vendor3@roamio.com  │ ${testPasswords.vendor}     │`
    );
    console.log("└─────────────┴─────────────────────┴───────────────┘");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("💥 Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed.");
  });
