// Acadexa seed script (CommonJS)
// Run: npx prisma db seed   (or npm run db:seed)
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seed() {
  console.log("🌱 Seeding Acadexa...");

  const passwordHash = await bcrypt.hash("Password123!", 12);

  // ---------- Research Areas ----------
  const researchAreaNames = [
    "Computer Science", "Artificial Intelligence", "Machine Learning",
    "Data Science", "Mathematics", "Physics", "Chemistry", "Biology",
    "Economics", "Business Administration", "Electrical Engineering",
    "Mechanical Engineering", "Civil Engineering", "Medicine", "Psychology",
    "Sociology", "Education", "Linguistics", "Environmental Science", "Biotechnology",
  ];

  const researchAreas = {};
  for (const name of researchAreaNames) {
    const area = await prisma.researchArea.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name), isSeed: true },
    });
    researchAreas[name] = area;
  }
  console.log(`  ✓ ${Object.keys(researchAreas).length} research areas`);

  // ---------- Universities ----------
  const universitiesData = [
    { name: "University of Punjab", country: "Pakistan", city: "Lahore" },
    { name: "National University of Sciences and Technology (NUST)", country: "Pakistan", city: "Islamabad" },
    { name: "Lahore University of Management Sciences (LUMS)", country: "Pakistan", city: "Lahore" },
    { name: "University of Karachi", country: "Pakistan", city: "Karachi" },
    { name: "Quaid-i-Azam University", country: "Pakistan", city: "Islamabad" },
    { name: "COMSATS University Islamabad", country: "Pakistan", city: "Islamabad" },
  ];

  const universities = {};
  for (const u of universitiesData) {
    const university = await prisma.university.upsert({
      where: { slug: slugify(u.name) },
      update: {},
      create: { name: u.name, slug: slugify(u.name), country: u.country, city: u.city, verified: true, isSeed: true },
    });
    universities[u.name] = university;
  }
  console.log(`  ✓ ${Object.keys(universities).length} universities`);

  // ---------- Departments ----------
  const departmentNames = ["Computer Science", "Mathematics", "Physics", "Economics", "Business", "Psychology", "Electrical Engineering"];
  const departments = {};
  for (const name of departmentNames) {
    const dept = await prisma.department.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    departments[name] = dept;
  }
  for (const uniKey of Object.keys(universities)) {
    const uni = universities[uniKey];
    const dept = departments["Computer Science"];
    await prisma.universityDepartment.upsert({
      where: { universityId_departmentId: { universityId: uni.id, departmentId: dept.id } },
      update: {},
      create: { universityId: uni.id, departmentId: dept.id },
    });
  }
  console.log(`  ✓ ${Object.keys(departments).length} departments`);

  // ---------- Users ----------
  const admin = await prisma.user.upsert({
    where: { email: "admin@acadexa.com" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@acadexa.com",
      passwordHash,
      role: "ADMIN",
      adminRole: "SUPER_ADMIN",
      status: "ACTIVE",
      verificationStatus: "VERIFIED",
      isDemo: true,
      isSeed: true,
      title: "Super Administrator",
    },
  });

  const researcherUsers = [
    { name: "Dr. Ayesha Khan", email: "researcher@acadexa.com", title: "Associate Professor", designation: "Associate Professor" },
    { name: "Prof. Bilal Ahmed", email: "teacher@acadexa.com", title: "Professor", designation: "Professor" },
    { name: "Sara Ali", email: "student@acadexa.com", title: "PhD Candidate", designation: "PhD Candidate" },
  ];

  const users = {};
  for (const u of researcherUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.email.includes("student") ? "STUDENT" : u.email.includes("teacher") ? "TEACHER" : "RESEARCHER",
        status: "ACTIVE",
        verificationStatus: "VERIFIED",
        title: u.title,
        designation: u.designation,
        isDemo: true,
        isSeed: true,
      },
    });
    users[u.email] = user;

    // Researcher profile with university
    const university = universities["University of Punjab"];
    await prisma.researcherProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        universityId: university.id,
        designation: u.designation,
        verified: true,
        publications: 0,
        citations: 0,
        bio: `${u.name} is an active researcher on Acadexa with a focus on computer science and AI.`,
      },
    });

    // Research interests
    await prisma.userResearchInterest.upsert({
      where: { userId_researchAreaId: { userId: user.id, researchAreaId: researchAreas["Artificial Intelligence"].id } },
      update: {},
      create: { userId: user.id, researchAreaId: researchAreas["Artificial Intelligence"].id },
    });
    await prisma.userResearchInterest.upsert({
      where: { userId_researchAreaId: { userId: user.id, researchAreaId: researchAreas["Computer Science"].id } },
      update: {},
      create: { userId: user.id, researchAreaId: researchAreas["Computer Science"].id },
    });
  }
  console.log(`  ✓ ${Object.keys(users).length + 1} demo users (incl. admin)`);

  // ---------- Papers ----------
  const papers = [
    {
      title: "A Hybrid Deep Learning Approach for Early Detection of Chronic Diseases",
      abstract: "This paper presents a hybrid deep learning framework combining convolutional and recurrent neural networks for early detection of chronic diseases using electronic health records.",
      keywords: ["deep learning", "chronic disease", "healthcare", "CNN", "RNN"],
      researchField: "Artificial Intelligence",
      publicationType: "Journal",
      accessType: "FREE",
      price: null,
      ownerEmail: "researcher@acadexa.com",
    },
    {
      title: "Economic Indicators and Stock Market Volatility in Emerging Economies",
      abstract: "An empirical analysis examining the relationship between macroeconomic indicators and stock market volatility across emerging economies using panel data regression.",
      keywords: ["economics", "stock market", "volatility", "emerging markets"],
      researchField: "Economics",
      publicationType: "Journal",
      accessType: "PAID",
      price: 1500,
      ownerEmail: "teacher@acadexa.com",
    },
    {
      title: "Explainable AI for Decision Support Systems: A Case Study in Finance",
      abstract: "We explore interpretable machine learning models in financial decision-making, providing transparency and trust for credit scoring and fraud detection use cases.",
      keywords: ["XAI", "finance", "machine learning", "interpretability"],
      researchField: "Machine Learning",
      publicationType: "Conference",
      accessType: "FREE",
      price: null,
      ownerEmail: "researcher@acadexa.com",
    },
  ];

  for (const p of papers) {
    const slug = `${slugify(p.title)}-${Date.now().toString(36)}`;
    const owner = users[p.ownerEmail];

    const paper = await prisma.researchPaper.create({
      data: {
        title: p.title,
        slug,
        abstract: p.abstract,
        keywords: JSON.stringify(p.keywords),
        researchField: p.researchField,
        publicationType: p.publicationType,
        publicationDate: new Date(),
        accessType: p.accessType,
        price: p.price,
        status: "APPROVED",
        isAuthorized: p.accessType === "FREE",
        needsPermission: p.accessType === "PAID",
        uploaderId: owner.id,
        universityId: universities["University of Punjab"].id,
      },
    });

    await prisma.paperAuthor.create({
      data: {
        paperId: paper.id,
        userId: owner.id,
        name: owner.name,
        email: owner.email,
        affiliation: "University of Punjab",
        isPrimary: true,
        order: 0,
      },
    });

    await prisma.paperResearchArea.upsert({
      where: { paperId_researchAreaId: { paperId: paper.id, researchAreaId: researchAreas[p.researchField].id } },
      update: {},
      create: { paperId: paper.id, researchAreaId: researchAreas[p.researchField].id },
    });
  }
  console.log(`  ✓ ${papers.length} seed papers`);

  // ---------- Platform settings ----------
  const settings = [
    { key: "platform_name", value: "Acadexa" },
    { key: "platform_commission", value: "10" },
    { key: "default_currency", value: "PKR" },
  ];
  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value },
    });
  }

  console.log("\n✅ Seed complete!");
  console.log("Demo accounts (password for all: Password123!)");
  console.log("  - admin@acadexa.com      (SUPER_ADMIN)");
  console.log("  - researcher@acadexa.com (RESEARCHER)");
  console.log("  - teacher@acadexa.com    (TEACHER)");
  console.log("  - student@acadexa.com    (STUDENT)");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });