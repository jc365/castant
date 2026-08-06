/**
 * @file webhookClient.ts
 * @module infrastructure/webhooks/webhookClient
 *
 * Fire-and-forget HTTP client for dispatching events to the orchestration server.
 * Non-blocking — failures are logged but never propagate to the caller.
 */

import logger from '../logging/logger';

const ORCHESTRATION_URL = process.env.ORCHESTRATION_URL || 'http://localhost:8080';

export async function dispatchEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const resp = await fetch(`${ORCHESTRATION_URL}/webhook/${eventType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
      signal: AbortSignal.timeout(5000),
    });

    if (!resp.ok) {
      logger.warn({ eventType, status: resp.status }, 'Webhook dispatch returned non-200');
    } else {
      logger.info({ eventType }, 'Webhook dispatched');
    }
  } catch (err) {
    logger.warn({ eventType, error: err instanceof Error ? err.message : err }, 'Webhook dispatch failed (non-blocking)');
  }
}
