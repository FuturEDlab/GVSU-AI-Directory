import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { fetchGlobalNews } from '@/ai/flows/fetch-global-news';

// Maximum batch size in Firestore is 500
const FIRESTORE_BATCH_LIMIT = 450;

export async function GET(req: NextRequest) {
  // 1. Authenticate Request
  const authHeader = req.headers.get('Authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log("[Cron:News] Update started");

    // 2. Fetch new articles via existing flow
    const newArticles = await fetchGlobalNews();
    console.log(`[Cron:News] Fetched ${newArticles?.length || 0} articles from Genkit flow`);

    if (!newArticles || newArticles.length === 0) {
      throw new Error("No articles returned from fetchGlobalNews");
    }

    // 3. Fetch existing articles to prevent duplicates
    const existingNewsSnapshot = await adminDb.collection('global_news').get();
    const existingUrls = new Set<string>();
    const existingDocsByUrl = new Map<string, QueryDocumentSnapshot>();

    existingNewsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.url) {
        existingUrls.add(data.url);
        existingDocsByUrl.set(data.url, doc);
      }
    });

    console.log(`[Cron:News] Found ${existingUrls.size} existing articles in Firestore`);

    // 4. Deduplicate and Prepare Operations
    let newCount = 0;
    let updatedCount = 0;
    
    // We will use a batch to write documents.
    // If the batch exceeds the limit, we'll commit it and start a new one.
    let batch = adminDb.batch();
    let batchOperationCount = 0;

    const commitBatchIfNeeded = async () => {
      if (batchOperationCount >= FIRESTORE_BATCH_LIMIT) {
        await batch.commit();
        batch = adminDb.batch();
        batchOperationCount = 0;
      }
    };

    for (const article of newArticles) {
      // Normalize URL (basic lowercase for duplicate checking)
      const normalizedUrl = article.url.toLowerCase();

      if (existingUrls.has(normalizedUrl)) {
        // Update existing article (maybe title/summary improved)
        const docSnap = existingDocsByUrl.get(normalizedUrl);
        if (docSnap) {
          batch.update(docSnap.ref, {
            ...article,
            updatedAt: FieldValue.serverTimestamp()
          });
          updatedCount++;
          batchOperationCount++;
        }
      } else {
        // Insert new article
        const newDocRef = adminDb.collection('global_news').doc();
        batch.set(newDocRef, {
          ...article,
          // Ensure publishedAt exists
          publishedAt: article.publishedAt || new Date().toISOString(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        existingUrls.add(normalizedUrl);
        newCount++;
        batchOperationCount++;
      }
      
      await commitBatchIfNeeded();
    }

    // Commit any remaining operations
    if (batchOperationCount > 0) {
      await batch.commit();
    }

    console.log(`[Cron:News] Update completed successfully in ${Date.now() - startTime}ms. New: ${newCount}, Updated: ${updatedCount}`);

    // 5. Write Health Status to Config
    await adminDb.collection('config').doc('news_cron_status').set({
      lastSuccessfulUpdate: FieldValue.serverTimestamp(),
      articlesFetched: newArticles.length,
      newArticles: newCount,
      updatedArticles: updatedCount,
      status: 'Healthy',
      lastError: null,
      durationMs: Date.now() - startTime,
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'News updated successfully',
      stats: {
        fetched: newArticles.length,
        new: newCount,
        updated: updatedCount,
      }
    });

  } catch (error: any) {
    console.error(`[Cron:News] Update failed: ${error.message}`);
    
    // Log failure to config without overwriting the previous success metrics entirely,
    // just updating the status and error fields.
    try {
      await adminDb.collection('config').doc('news_cron_status').set({
        status: 'Needs Attention',
        lastError: error.message || 'Unknown error',
        lastFailedAttempt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (dbError) {
      console.error("[Cron:News] Could not write failure status to config:", dbError);
    }

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
