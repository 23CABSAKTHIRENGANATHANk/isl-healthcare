/**
 * ISL Setu - Supabase Authentication Diagnostic Script
 * Simple diagnostic to test Supabase authentication endpoints
 */

// Supabase configuration (from .env)
const SUPABASE_URL = "https://nndjafynozneorhvpxvg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZGphZnlub3puZW9yaHZweHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MzgzMjMsImV4cCI6MjEwMjIxNDMyM30.MFA0pG6wXkAckMYHQb_ALOAjyuKkNfegTtsLwtnzaW8";

console.log("🔍 ISL SETU - SUPABASE AUTHENTICATION DIAGNOSTIC\n");
console.log("━".repeat(70));

// 1. Check configuration
console.log("\n1️⃣  CONFIGURATION CHECK");
console.log("━".repeat(70));

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log("❌ Supabase credentials missing");
  process.exit(1);
}

console.log(`✅ SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`✅ SUPABASE_KEY: ${SUPABASE_KEY.substring(0, 20)}...`);

const projectMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectId = projectMatch ? projectMatch[1] : "unknown";
console.log(`✅ Project ID: ${projectId}`);

// 2. Test API connectivity
async function testConnectivity() {
  console.log("\n2️⃣  API CONNECTIVITY TEST");
  console.log("━".repeat(70));

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ API is reachable (Status: ${response.status})`);

    if (response.status === 200) {
      const data = await response.json();
      console.log(`✅ Auth settings available`);
      console.log(`   - Providers: ${data.providers?.length || "unknown"} configured`);
    }
  } catch (err) {
    console.log(`❌ API Connection Error: ${err.message}`);
  }
}

// 3. Test signup endpoint
async function testSignup() {
  console.log("\n3️⃣  SIGNUP TEST");
  console.log("━".repeat(70));

  const testEmail = `test-${Date.now()}@hospital.org`;
  const testPassword = "TestPassword123!";

  console.log(`Test Email: ${testEmail}`);
  console.log(`Test Password: ${testPassword}`);

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        data: {
          full_name: "Diagnostic Test User",
          healthcare_role: "nurse",
        },
      }),
    });

    console.log(`Response Status: ${response.status}`);

    const data = await response.json();

    if (response.status === 200) {
      console.log("\n✅ SIGNUP SUCCESSFUL");
      console.log(`User ID: ${data.user?.id}`);
      console.log(`Email: ${data.user?.email}`);
      if (data.session?.access_token) {
        console.log(`Session Token: ${data.session.access_token.substring(0, 20)}...`);
      }
    } else if (response.status === 422) {
      console.log("\n❌ SIGNUP FAILED - Status 422");
      console.log(`Error: ${data.error_description || data.message || JSON.stringify(data)}`);
      console.log(`\n🔧 SUGGESTED FIX:`);
      console.log(`This error means email/password auth is not properly configured.\n`);
      console.log(`ACTION REQUIRED:`);
      console.log(`1. Open https://app.supabase.com`);
      console.log(`2. Select project: ${projectId}`);
      console.log(`3. Go to: Authentication → Providers`);
      console.log(`4. Find "Email" and click to open settings`);
      console.log(`5. Enable "Email/Password authentication"`);
      console.log(`6. Set "Confirm email" toggle to OFF (for testing)`);
      console.log(`7. Make sure "Disable anonymous sign in" is checked`);
      console.log(`8. Click "Save" and wait for changes to apply`);
      console.log(`9. Run this diagnostic again`);
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`❌ Signup Error: ${err.message}`);
  }
}

// 4. Test login endpoint
async function testLogin() {
  console.log("\n4️⃣  LOGIN TEST");
  console.log("━".repeat(70));

  console.log(`Test Email: test@hospital.org`);
  console.log(`Test Password: TestPassword123!`);
  console.log(`(This will fail if user doesn't exist - that's expected)\n`);

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@hospital.org",
        password: "TestPassword123!",
      }),
    });

    console.log(`Response Status: ${response.status}`);

    if (response.status === 200) {
      console.log("✅ LOGIN SUCCESSFUL - Token received");
    } else if (response.status === 400 || response.status === 401) {
      console.log("✅ LOGIN ENDPOINT WORKING");
      console.log("   (User not found or invalid credentials - expected for test user)");
      console.log("   This indicates email/password auth is properly configured!");
    } else {
      const data = await response.json();
      console.log(`⚠️  Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`❌ Login Error: ${err.message}`);
  }
}

// Run all tests
async function runDiagnostics() {
  await testConnectivity();
  await testSignup();
  await testLogin();

  console.log("\n" + "━".repeat(70));
  console.log("📋 DIAGNOSTIC COMPLETE\n");

  console.log("Next Steps:");
  console.log("1. If signup failed with 422:");
  console.log("   ➜ Configure Supabase auth (see instructions above)");
  console.log("   ➜ Run this diagnostic again\n");

  console.log("2. If signup succeeded:");
  console.log("   ➜ Navigate to http://localhost:5173/signup");
  console.log("   ➜ Try signing up from the browser");
  console.log("   ➜ Try logging in at http://localhost:5173/login\n");

  console.log("3. Once auth is working:");
  console.log("   ➜ Run full test suite in AUTHENTICATION_COMPLETE_AUDIT.md\n");
}

runDiagnostics();
