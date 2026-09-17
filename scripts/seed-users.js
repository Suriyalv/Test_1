/**
 * One-time seed script: creates 60 Firebase Auth accounts (user1..user60)
 * plus a matching Firestore profile doc for each, so the class can log into
 * the deployed app immediately.
 *
 * Login identity vs. auth:
 *   - Firebase Auth only speaks email+password, so each account's real email
 *     is "<username>@kalvi-students.app" (must match STUDENT_EMAIL_DOMAIN in
 *     college-llm-ui/src/firebase.js exactly, or logins will fail).
 *   - Password for userN is literally "password_userN" (e.g. user7 -> password_user7).
 *   - The Firestore "name" field is NOT used for login at all — it's a plain
 *     reference field a teacher can edit later (Firestore console) to put a
 *     real name against each username, without touching auth.
 *
 * Setup (one time):
 *   1. Firebase console -> Project settings -> Service accounts
 *      -> "Generate new private key" -> save the downloaded file as
 *      scripts/serviceAccountKey.json (never commit this file).
 *   2. cd scripts && npm install
 *   3. npm run seed-users
 *
 * Safe to re-run: existing usernames are skipped, not recreated or reset.
 */
const admin = require("firebase-admin");
const path = require("path");

const STUDENT_EMAIL_DOMAIN = "kalvi-students.app"; // keep in sync with firebase.js
const USER_COUNT = 60;

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch {
  console.error(
    `\nMissing scripts/serviceAccountKey.json.\n` +
      `Download it from Firebase console -> Project settings -> Service accounts -> Generate new private key,\n` +
      `and save it at: ${serviceAccountPath}\n`
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const auth = admin.auth();
const db = admin.firestore();

async function seedOneUser(index) {
  const username = `user${index}`;
  const email = `${username}@${STUDENT_EMAIL_DOMAIN}`;
  const password = `password_${username}`;

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`- ${username}: already exists, skipping auth creation`);
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    userRecord = await auth.createUser({
      email,
      password,
      displayName: username,
    });
    console.log(`+ ${username}: created (password: ${password})`);
  }

  // "name" is a plain reference field, never read by the login flow itself —
  // safe for a teacher to overwrite later with the student's real name.
  await db
    .collection("users")
    .doc(userRecord.uid)
    .set(
      {
        username,
        name: `Student ${index}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return { username, email, password };
}

async function main() {
  console.log(`Seeding ${USER_COUNT} users (user1..user${USER_COUNT})...\n`);
  const created = [];
  for (let i = 1; i <= USER_COUNT; i++) {
    created.push(await seedOneUser(i));
  }

  console.log(`\nDone. Login credentials (username / password):`);
  created.forEach(({ username, password }) => {
    console.log(`  ${username}  /  ${password}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
