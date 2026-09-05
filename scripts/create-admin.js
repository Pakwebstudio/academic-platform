// Create an administrator account from the CLI.
// Usage: npm run create-admin -- --name "Admin User" --email admin@example.com --password Secret123! --role SUPER_ADMIN
// If arguments are omitted, you'll be prompted interactively.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient();
const VALID_ROLES = ["SUPER_ADMIN", "USER_MANAGER", "CONTENT_MODERATOR", "PAYMENT_MANAGER", "VERIFICATION_MANAGER", "SUPPORT_ADMIN"];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
      args[key] = value;
      if (value !== true) i++;
    }
  }
  return args;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let name = args.name;
  let email = args.email;
  let password = args.password;
  let adminRole = args.role || "SUPER_ADMIN";

  if (!name) name = await ask("Admin name: ");
  if (!email) email = await ask("Admin email: ");
  if (!password) password = await ask("Password (min 8 chars): ");

  if (!VALID_ROLES.includes(adminRole)) {
    console.error(`Invalid role. Choose one of: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }
  if (!email || !email.includes("@")) {
    console.error("A valid email is required.");
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    console.error(`A user with email ${email} already exists. Aborting.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "ADMIN",
      adminRole,
      status: "ACTIVE",
      verificationStatus: "VERIFIED",
    },
  });

  console.log(`✅ Administrator created: ${admin.email} (${adminRole})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());