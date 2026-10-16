import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { INITIAL_SEED_TOOLS } from '@/app/lib/seed-tools';
import { FieldValue } from 'firebase-admin/firestore';

const DATABASE_ID =
  process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ||
  'ai-studio-gvsulakeraidirec-b9840b1c-2365-40d8-a6ec-8d6b200bdbfb';

async function ensureSeeded(force = false) {
  const colRef = adminDb.collection('tools_published');
  const existingSnap = await colRef.where('status', '==', 'Published').get();

  let seededNow = false;
  if (force || existingSnap.size < INITIAL_SEED_TOOLS.length) {
    const batch = adminDb.batch();
    for (const seed of INITIAL_SEED_TOOLS) {
      const docRef = colRef.doc(seed.id);
      batch.set(
        docRef,
        {
          ...seed,
          submitterEmail: 'vanharkj@mail.gvsu.edu',
          submitterId: 'admin-seed',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          publishedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    await batch.commit();
    seededNow = true;
  }

  const finalSnap = await colRef.where('status', '==', 'Published').get();
  const tools = finalSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      publishedAt: data.publishedAt?.seconds
        ? { seconds: data.publishedAt.seconds, nanoseconds: data.publishedAt.nanoseconds || 0 }
        : { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    };
  });

  return {
    ok: true,
    databaseId: DATABASE_ID,
    seededNow,
    count: tools.length,
    tools,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const result = await ensureSeeded(force);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Server seed GET error:', error);
    return NextResponse.json(
      {
        ok: false,
        databaseId: DATABASE_ID,
        error: error?.message || 'Failed to seed database via Admin SDK',
        count: INITIAL_SEED_TOOLS.length,
        tools: INITIAL_SEED_TOOLS.map((t) => ({
          ...t,
          submitterEmail: 'vanharkj@mail.gvsu.edu',
          submitterId: 'admin-seed',
        })),
      },
      { status: 200 }
    );
  }
}

export async function POST() {
  try {
    const result = await ensureSeeded(true);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Server seed POST error:', error);
    return NextResponse.json(
      {
        ok: false,
        databaseId: DATABASE_ID,
        error: error?.message || 'Failed to seed database via Admin SDK',
      },
      { status: 500 }
    );
  }
}
