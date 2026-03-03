export type EmissarCampaignResponse = {
  campaignId?: string
  status?: string
  dispatch?: {
    mode?: string
    provider?: string
    subject?: string
    deliveryMode?: 'TEXT' | 'VOICE'
    voiceProvider?: string
    testOnly?: boolean
  }
  totals?: {
    segmentCount?: number
    queuedRecipients?: number
    skippedNoEmail?: number
    sent?: number
    failed?: number
    previewOnly?: number
  }
  reliability?: {
    retries?: number
    timedOutAttempts?: number
    providerErrors?: number
  }
}

export function getEmissarApiUrl(): string {
  return process.env.EMISSAR_API_URL || 'http://localhost:3004'
}

export async function callEmissarCampaign(body: Record<string, unknown>) {
  const response = await fetch(`${getEmissarApiUrl()}/api/campaigns/stanvault/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Stanvault-User-Id': String(body.artistId || ''),
      'X-Stanvault-Tier': String(body.pricingTier || ''),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const responseText = await response.text()
  return {
    ok: response.ok,
    status: response.status,
    responseText,
  }
}
