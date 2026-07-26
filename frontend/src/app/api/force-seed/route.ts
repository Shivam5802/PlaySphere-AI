import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/backend/firebase/config';
import { seedLandmarksAndInfrastructure } from '@/backend/firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const logs: string[] = [];
    logs.push("Starting database force-reset and re-seed process...");

    // 1. Delete venues
    const venuesCol = collection(db, 'venues');
    const venuesSnap = await getDocs(venuesCol);
    let deletedVenues = 0;
    for (const d of venuesSnap.docs) {
      await deleteDoc(d.ref);
      deletedVenues++;
    }
    logs.push(`Deleted ${deletedVenues} documents from 'venues' collection.`);

    // 2. Delete infrastructure
    const infraCol = collection(db, 'infrastructure');
    const infraSnap = await getDocs(infraCol);
    let deletedInfra = 0;
    for (const d of infraSnap.docs) {
      await deleteDoc(d.ref);
      deletedInfra++;
    }
    logs.push(`Deleted ${deletedInfra} documents from 'infrastructure' collection.`);

    // 3. Delete landmarks
    const landmarksCol = collection(db, 'landmarks');
    const landmarksSnap = await getDocs(landmarksCol);
    let deletedLandmarks = 0;
    for (const d of landmarksSnap.docs) {
      await deleteDoc(d.ref);
      deletedLandmarks++;
    }
    logs.push(`Deleted ${deletedLandmarks} documents from 'landmarks' collection.`);

    // 4. Delete ownership requests (allows claiming them fresh)
    const requestsCol = collection(db, 'ownership_requests');
    const requestsSnap = await getDocs(requestsCol);
    let deletedRequests = 0;
    for (const d of requestsSnap.docs) {
      await deleteDoc(d.ref);
      deletedRequests++;
    }
    logs.push(`Deleted ${deletedRequests} documents from 'ownership_requests' collection.`);

    // 5. Run the standard seed function
    logs.push("Executing seedLandmarksAndInfrastructure()...");
    await seedLandmarksAndInfrastructure();
    logs.push("Database seeding completed successfully with the updated image URLs!");

    return NextResponse.json({
      success: true,
      message: "Database successfully cleared and re-seeded.",
      details: {
        deletedVenues,
        deletedInfrastructure: deletedInfra,
        deletedLandmarks,
        deletedOwnershipRequests: deletedRequests
      },
      logs
    });
  } catch (error: any) {
    console.error("Force-seed error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || String(error)
    }, { status: 500 });
  }
}
