'use client';

/**
 * @file hooks.ts
 * @description Dedicated barrel for client-only Firebase hooks and providers.
 * All client-side components should import hooks from here or '@/firebase'.
 */

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
