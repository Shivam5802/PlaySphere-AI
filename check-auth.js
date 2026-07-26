const url = 'https://playsphereai.firebaseapp.com/__/auth/handler';

async function run() {
  console.log("Checking if auth handler exists:", url);
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response (first 100 chars):", text.slice(0, 100));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

run();
