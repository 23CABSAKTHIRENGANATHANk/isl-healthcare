import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nndjafynozneorhvpxvg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZGphZnlub3puZW9yaHZweHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MzgzMjMsImV4cCI6MjEwMjIxNDMyM30.MFA0pG6wXkAckMYHQb_ALOAjyuKkNfegTtsLwtnzaW8";

console.log("==================================================");
console.log("🔍 TESTING SUPABASE LIVE CONNECTION & ENDPOINTS");
console.log("==================================================");
console.log("Target Project URL:", SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  const results = {};

  // 1. Test Auth Endpoint
  const startAuth = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_KEY },
    });
    const authLatency = Date.now() - startAuth;
    results.auth = { status: res.status, ok: res.ok, latencyMs: authLatency };
    console.log(`✅ Auth Endpoint: Status ${res.status} (${authLatency}ms)`);
  } catch (err) {
    results.auth = { status: "ERROR", error: err.message };
    console.log(`❌ Auth Endpoint Failed:`, err.message);
  }

  // 2. Test Signs Table
  const startSigns = Date.now();
  try {
    const { data, error, count } = await supabase.from("signs").select("*", { count: "exact" }).limit(5);
    const signsLatency = Date.now() - startSigns;
    if (error) {
      results.signs = { ok: false, error: error.message };
      console.log(`⚠️ Signs Table: Error -`, error.message);
    } else {
      results.signs = { ok: true, rowCount: data.length, latencyMs: signsLatency };
      console.log(`✅ Signs Table: Query OK, fetched ${data.length} sample rows (${signsLatency}ms)`);
    }
  } catch (err) {
    results.signs = { ok: false, error: err.message };
    console.log(`❌ Signs Query Failed:`, err.message);
  }

  // 3. Test Lessons Table
  const startLessons = Date.now();
  try {
    const { data, error } = await supabase.from("lessons").select("*").limit(5);
    const lessonsLatency = Date.now() - startLessons;
    if (error) {
      results.lessons = { ok: false, error: error.message };
      console.log(`⚠️ Lessons Table: Error -`, error.message);
    } else {
      results.lessons = { ok: true, rowCount: data.length, latencyMs: lessonsLatency };
      console.log(`✅ Lessons Table: Query OK, fetched ${data.length} sample rows (${lessonsLatency}ms)`);
    }
  } catch (err) {
    results.lessons = { ok: false, error: err.message };
    console.log(`❌ Lessons Query Failed:`, err.message);
  }

  // 4. Test Hospitals Table
  const startHospitals = Date.now();
  try {
    const { data, error } = await supabase.from("hospitals").select("*").limit(5);
    const hospitalsLatency = Date.now() - startHospitals;
    if (error) {
      results.hospitals = { ok: false, error: error.message };
      console.log(`⚠️ Hospitals Table: Error -`, error.message);
    } else {
      results.hospitals = { ok: true, rowCount: data.length, latencyMs: hospitalsLatency };
      console.log(`✅ Hospitals Table: Query OK, fetched ${data.length} sample rows (${hospitalsLatency}ms)`);
    }
  } catch (err) {
    results.hospitals = { ok: false, error: err.message };
    console.log(`❌ Hospitals Query Failed:`, err.message);
  }

  // 5. Test Profiles Table
  const startProfiles = Date.now();
  try {
    const { data, error } = await supabase.from("profiles").select("*").limit(5);
    const profilesLatency = Date.now() - startProfiles;
    if (error) {
      results.profiles = { ok: false, error: error.message };
      console.log(`⚠️ Profiles Table: Notice -`, error.message);
    } else {
      results.profiles = { ok: true, rowCount: data.length, latencyMs: profilesLatency };
      console.log(`✅ Profiles Table: Query OK, fetched ${data.length} sample rows (${profilesLatency}ms)`);
    }
  } catch (err) {
    results.profiles = { ok: false, error: err.message };
    console.log(`❌ Profiles Query Failed:`, err.message);
  }

  console.log("==================================================");
  console.log("SUMMARY STATUS:", results.auth?.ok && results.signs?.ok ? "🟢 FULLY OPERATIONAL" : "🟡 PARTIAL / RLS PROTECTED");
  console.log("==================================================");
}

testConnection();
