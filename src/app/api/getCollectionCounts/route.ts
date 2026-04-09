import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export async function GET() {
  // Path to serviceAccountKey.json in your src/api folder
  const serviceAccountPath = path.join(process.cwd(), "src", "api", "serviceAccountKey.json");
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
  const db = getFirestore();

  const collections = ["students", "faculties", "courses"];
  const counts: { [key: string]: number } = {};

  await Promise.all(
    collections.map(async (col) => {
      const snap = await db.collection(col).count().get();
      counts[col] = snap.data().count || 0;
    })
  );

  return NextResponse.json(counts);
}
