'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Mic, Send, Square, TestTube2, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import ShaderBackground from '@/components/voice-studio/ShaderBackground'
import ColorPanel from '@/components/voice-studio/ColorPanel'
import Frame2147241533 from '@/imports/Frame2147241533'

const suggestedVariableFields = [
  {
    key: 'oryx_phase',
    label: 'Oryx Phase',
    placeholder: 'Propagation',
    hint: 'Token: {oryx_phase}',
  },
  {
    key: 'propagation_goal',
    label: 'Propagation Goal',
    placeholder: '12',
    hint: 'Token: {propagation_goal}',
  },
  {
    key: 'campaign_theme',
    label: 'Campaign Theme',
    placeholder: 'Superfan Summer',
    hint: 'Token: {campaign_theme}',
  },
  {
    key: 'call_to_action',
    label: 'Call To Action',
    placeholder: 'Share this with your circle',
    hint: 'Token: {call_to_action}',
  },
  {
    key: 'reward_name',
    label: 'Reward Name',
    placeholder: 'Backstage Voice Drop',
    hint: 'Token: {reward_name}',
  },
] as const

const messageTemplateSuggestions = [
  {
    id: 'welcome',
    label: 'Welcome Superfan',
    subject: 'You are officially in my inner circle',
    body: 'Hey {fan_name} - I see you. Welcome to the {stan_club_name}. Your stan score is {stan_score}, and that support means everything to me.',
  },
  {
    id: 'propagation',
    label: 'Propagation Push',
    subject: 'Can you help me push this one out?',
    body: '{fan_name}, you already drove {propagation_count} propagations for me. We are aiming for {propagation_goal} this round. If you are in, {call_to_action}.',
  },
  {
    id: 'tip-reward',
    label: 'Tip Reward',
    subject: 'I made this for my real supporters',
    body: 'Hey {fan_name}, you have tipped {tip_count} times (${tip_amount_usd}) and held me down for real. I unlocked {reward_name} for you.',
  },
] as const

const actionCtaPresets = [
  {
    id: 'propagate',
    label: 'Propagate This Drop',
    action: 'Send this drop to 3 specific people who will take action, not just react.',
    cta: 'Propagate this drop to 3 high-intent people in your circle.',
    oryxPhase: 'Propagation',
  },
  {
    id: 'prove-conviction',
    label: 'Prove Conviction',
    action: 'Back your support with one real stake action now: tip, pledge, or pre-order.',
    cta: 'Prove conviction with one real stake action right now.',
    oryxPhase: 'Conviction',
  },
  {
    id: 'micro-circle',
    label: 'Lead a Listening Circle',
    action: 'Run a small listening circle (5-10 people) and report what landed.',
    cta: 'Lead a 5-10 person listening circle and send me the key feedback.',
  },
  {
    id: 'city-node',
    label: 'Activate Your City',
    action: 'Execute one local move: DJ handoff, campus share, venue intro, or playlist placement.',
    cta: 'Activate your city with one local move this week.',
  },
  {
    id: 'bring-one-fan',
    label: 'Bring One New Fan',
    action: 'Bring one new fan in and guide them to their first meaningful action.',
    cta: 'Bring one new fan in and guide their first real action.',
  },
  {
    id: 'archive',
    label: 'Archive This Era',
    action: 'Contribute one story, clip, translation, or memory that deepens the movement.',
    cta: 'Archive one story or clip that defines this era.',
  },
  {
    id: 'city-surge',
    label: 'Run City Surge',
    action: 'Execute one verified local move and log it to advance your city phase.',
    cta: 'Run one verified city surge action and report it today.',
    oryxPhase: 'Propagation',
  },
  {
    id: 'conviction-proof',
    label: 'Log Conviction Proof',
    action: 'Complete one stake-backed action and submit proof for conviction progression.',
    cta: 'Log one conviction-proof action with evidence now.',
    oryxPhase: 'Conviction',
  },
] as const

const defaultVoiceProviders: Array<'fish-audio' | 'resemble-ai' | 'chatterbox'> = ['fish-audio']

type CampaignResponse = {
  campaignId: string
  status: string
  note?: string
  dispatch?: {
    mode: string
    provider: string
    deliveryMode?: 'TEXT' | 'VOICE'
    voiceProvider?: string
    fromEmail: string
    subject: string
  }
  variables?: {
    builtIn: string[]
    custom: string[]
  }
  totals?: {
    segmentCount: number
    queuedRecipients: number
    skippedNoEmail: number
    sent: number
    failed: number
    previewOnly: number
  }
  reliability?: {
    retries?: number
    timedOutAttempts?: number
    providerErrors?: number
  }
  deliveryResultsPreview?: Array<{
    fanId: string
    email: string
    status: string
    messageId?: string | null
    error?: string
  }>
}

type VoiceCloneResponse = {
  id?: string
  externalId?: string
  provider?: 'fish-audio' | 'resemble-ai' | 'chatterbox'
  name?: string
  previewUrl?: string
}

type VoiceTake = {
  id: string
  blob: Blob
  durationMs: number
  source: 'recorded' | 'uploaded'
}

type SavedVoiceModel = {
  id: string
  externalId: string
  provider: 'fish-audio' | 'resemble-ai' | 'chatterbox'
  name: string
  previewUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type CampaignHistoryItem = {
  id: string
  externalCampaignId: string | null
  status: string
  dispatchMode: string | null
  provider: string | null
  subject: string | null
  minTier: string | null
  minStanScore: number | null
  recipientLimit: number | null
  dryRun: boolean
  segmentCount: number
  queuedRecipients: number
  sentCount: number
  failedCount: number
  previewOnlyCount: number
  createdAt: string
}

type VariablePreset = {
  id: string
  name: string
  fanClubName: string | null
  customVariables: Record<string, string | number> | null
  createdAt: string
  updatedAt: string
}

type CampaignEntitlements = {
  pricingTier: 'STARTER' | 'PRIVATE_CIRCLE' | 'PATRON_GROWTH' | 'SOVEREIGN'
  monthlyLiveSendLimit: number | null
  monthlyVoiceSendLimit: number | null
  maxCustomVariables: number
  allowCustomFromEmail: boolean
  prioritySupport: boolean
  allowVoiceCampaigns: boolean
  allowAdvancedVoiceConfig: boolean
  allowedVoiceProviders: Array<'fish-audio' | 'resemble-ai' | 'chatterbox'>
  monthSentSoFar: number
  monthVoiceSentSoFar: number
  remaining: number | null
  voiceRemaining: number | null
}

type CampaignAnalytics = {
  ctaByKey: Array<{ ctaKey: string; count: number }>
  completionByStatus: Array<{ status: string; count: number }>
}

export default function CampaignsPage() {
  const [subject, setSubject] = useState('VIP Fan Drop')
  const [fromEmail, setFromEmail] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [messageTemplate, setMessageTemplate] = useState(
    'Hey {fan_name}, proud {stan_club_name} member - your conviction score is {conviction_score}, and you helped drive {propagation_count} propagations. Thank you for really showing up.'
  )
  const [variableMode, setVariableMode] = useState<'simple' | 'advanced'>('simple')
  const [fanClubName, setFanClubName] = useState('Cherubs')
  const [suggestedVariables, setSuggestedVariables] = useState<Record<string, string>>({
    oryx_phase: 'Propagation',
    propagation_goal: '12',
    campaign_theme: '',
    call_to_action: '',
    reward_name: '',
  })
  const [customVariables, setCustomVariables] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ])
  const [minTier, setMinTier] = useState('SUPERFAN')
  const [minStanScore, setMinStanScore] = useState('70')
  const [limit, setLimit] = useState('100')
  const [mood, setMood] = useState('excited')
  const [deliveryMode, setDeliveryMode] = useState<'TEXT' | 'VOICE'>('TEXT')
  const [voiceSetupMode, setVoiceSetupMode] = useState<'simple' | 'advanced'>('simple')
  const [voiceModelId, setVoiceModelId] = useState('')
  const [voiceProvider, setVoiceProvider] = useState<'fish-audio' | 'resemble-ai' | 'chatterbox'>('fish-audio')
  const [voiceStyle, setVoiceStyle] = useState<'natural' | 'whisper' | 'singing' | 'shouting'>('natural')
  const [voiceEmotion, setVoiceEmotion] = useState<'neutral' | 'grateful' | 'excited' | 'playful' | 'heartfelt'>('grateful')
  const [voiceCtaLabel, setVoiceCtaLabel] = useState('Your personal voice note')
  const [shaderColors, setShaderColors] = useState<[string, string, string]>(['#0000ff', '#ff00ff', '#ffffff'])
  const [voiceName, setVoiceName] = useState('Main Artist Voice')
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [voiceDurationMs, setVoiceDurationMs] = useState(0)
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [voiceTakes, setVoiceTakes] = useState<VoiceTake[]>([])
  const [selectedVoiceTakeId, setSelectedVoiceTakeId] = useState<string | null>(null)
  const [voiceCloneLoading, setVoiceCloneLoading] = useState(false)
  const [voiceCloneError, setVoiceCloneError] = useState<string | null>(null)
  const [voiceCloneMessage, setVoiceCloneMessage] = useState<string | null>(null)
  const [showAllActionCtas, setShowAllActionCtas] = useState(false)
  const [ctaDeadline, setCtaDeadline] = useState('')
  const [ctaProofInstruction, setCtaProofInstruction] = useState('')
  const [dryRun, setDryRun] = useState(true)
  const [loading, setLoading] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [presetsLoading, setPresetsLoading] = useState(false)
  const [presetActionLoading, setPresetActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [presetError, setPresetError] = useState<string | null>(null)
  const [presetMessage, setPresetMessage] = useState<string | null>(null)
  const [result, setResult] = useState<CampaignResponse | null>(null)
  const [history, setHistory] = useState<CampaignHistoryItem[]>([])
  const [savedVoices, setSavedVoices] = useState<SavedVoiceModel[]>([])
  const [presets, setPresets] = useState<VariablePreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [presetName, setPresetName] = useState('')
  const [entitlements, setEntitlements] = useState<CampaignEntitlements | null>(null)
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null)
  const [completionProofUrl, setCompletionProofUrl] = useState('')
  const [completionProofNote, setCompletionProofNote] = useState('')
  const [completionLogMessage, setCompletionLogMessage] = useState<string | null>(null)
  const messageTemplateRef = useRef<HTMLTextAreaElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingStartRef = useRef<number | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const voiceViewportWidth = 600
  const voiceViewportHeight = 760

  const allowedVoiceProviders = useMemo(
    () => entitlements?.allowedVoiceProviders || defaultVoiceProviders,
    [entitlements?.allowedVoiceProviders]
  )
  const tieredActionCtaPresets = useMemo(() => {
    const tier = entitlements?.pricingTier || 'STARTER'
    if (tier === 'STARTER') {
      return actionCtaPresets.filter((preset) =>
        ['propagate', 'bring-one-fan'].includes(preset.id)
      )
    }
    if (tier === 'PRIVATE_CIRCLE') {
      return actionCtaPresets.filter((preset) =>
        ['propagate', 'prove-conviction', 'bring-one-fan'].includes(preset.id)
      )
    }
    if (tier === 'PATRON_GROWTH') {
      return actionCtaPresets.filter((preset) =>
        ['propagate', 'prove-conviction', 'micro-circle', 'city-node', 'bring-one-fan', 'city-surge'].includes(preset.id)
      )
    }
    return actionCtaPresets
  }, [entitlements?.pricingTier])
  const recommendedActionCtaPresets = useMemo(() => {
    const tier = entitlements?.pricingTier || 'STARTER'
    const orderByTier: Record<string, string[]> = {
      STARTER: ['propagate', 'bring-one-fan'],
      PRIVATE_CIRCLE: ['propagate', 'prove-conviction', 'bring-one-fan'],
      PATRON_GROWTH: ['propagate', 'prove-conviction', 'city-node'],
      SOVEREIGN: ['city-surge', 'conviction-proof', 'archive'],
    }
    const order = orderByTier[tier] || orderByTier.PRIVATE_CIRCLE
    return order
      .map((id) => tieredActionCtaPresets.find((preset) => preset.id === id))
      .filter((preset): preset is (typeof actionCtaPresets)[number] => Boolean(preset))
  }, [entitlements?.pricingTier, tieredActionCtaPresets])
  const additionalActionCtaPresets = useMemo(
    () =>
      tieredActionCtaPresets.filter(
        (preset) => !recommendedActionCtaPresets.some((recommended) => recommended.id === preset.id)
      ),
    [tieredActionCtaPresets, recommendedActionCtaPresets]
  )
  const effectiveVoiceProvider = useMemo(() => {
    if (allowedVoiceProviders.includes(voiceProvider)) return voiceProvider
    return allowedVoiceProviders[0] || 'fish-audio'
  }, [allowedVoiceProviders, voiceProvider])

  const tokenPreview = useMemo(
    () => [
      '{fan_name}',
      '{city}',
      '{country}',
      '{stan_score}',
      '{fan_tier}',
      '{conviction_score}',
      '{engagement_score}',
      '{longevity_score}',
      '{recency_score}',
      '{platform_score}',
      '{propagation_count}',
      '{propagrations}',
      '{tip_count}',
      '{tip_amount_usd}',
      '{tip_frequency}',
      '{moment_saves}',
      '{stan_club_name}',
      '{stan_name}',
    ],
    []
  )

  function getActiveCustomVariablesMap() {
    if (variableMode === 'simple') {
      return Object.entries(suggestedVariables).reduce((acc, [key, value]) => {
        const trimmed = value.trim()
        if (trimmed.length > 0) acc[key] = trimmed
        return acc
      }, {} as Record<string, string>)
    }

    return customVariables
      .filter((item) => item.key.trim().length > 0)
      .reduce((acc, item) => {
        acc[item.key.trim()] = item.value
        return acc
      }, {} as Record<string, string>)
  }

  function insertTokenIntoMessage(token: string) {
    const textarea = messageTemplateRef.current
    if (!textarea) {
      setMessageTemplate((prev) => `${prev}${prev.endsWith(' ') ? '' : ' '}${token}`)
      return
    }

    const start = textarea.selectionStart ?? messageTemplate.length
    const end = textarea.selectionEnd ?? messageTemplate.length
    const before = messageTemplate.slice(0, start)
    const after = messageTemplate.slice(end)
    const next = `${before}${token}${after}`

    setMessageTemplate(next)
    requestAnimationFrame(() => {
      textarea.focus()
      const caret = start + token.length
      textarea.setSelectionRange(caret, caret)
    })
  }

  function applyMessageTemplateSuggestion(templateId: string) {
    const suggestion = messageTemplateSuggestions.find((item) => item.id === templateId)
    if (!suggestion) return
    setSubject(suggestion.subject)
    setMessageTemplate(suggestion.body)
  }

  function setCallToActionValue(value: string) {
    if (variableMode === 'simple') {
      setSuggestedVariables((prev) => ({ ...prev, call_to_action: value }))
      return
    }

    setCustomVariables((prev) => {
      const existingIndex = prev.findIndex((item) => item.key.trim() === 'call_to_action')
      if (existingIndex >= 0) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, value } : item
        )
      }
      return [...prev, { key: 'call_to_action', value }]
    })
  }

  function applyActionCtaPreset(presetId: string) {
    const preset = actionCtaPresets.find((item) => item.id === presetId)
    if (!preset) return
    setCallToActionValue(preset.cta)
    if (preset.oryxPhase) {
      setSuggestedVariables((prev) => ({ ...prev, oryx_phase: preset.oryxPhase as string }))
    }

    const voiceDefaults: Record<
      string,
      { style: 'natural' | 'whisper' | 'singing' | 'shouting'; emotion: 'neutral' | 'grateful' | 'excited' | 'playful' | 'heartfelt'; mood: string }
    > = {
      propagate: { style: 'shouting', emotion: 'excited', mood: 'excited' },
      'prove-conviction': { style: 'natural', emotion: 'heartfelt', mood: 'heartfelt' },
      'micro-circle': { style: 'natural', emotion: 'playful', mood: 'playful' },
      'city-node': { style: 'natural', emotion: 'excited', mood: 'excited' },
      'bring-one-fan': { style: 'natural', emotion: 'grateful', mood: 'grateful' },
      archive: { style: 'whisper', emotion: 'heartfelt', mood: 'heartfelt' },
      'city-surge': { style: 'shouting', emotion: 'excited', mood: 'excited' },
      'conviction-proof': { style: 'natural', emotion: 'heartfelt', mood: 'heartfelt' },
    }

    const pair = voiceDefaults[preset.id]
    if (pair) {
      setVoiceStyle(pair.style)
      setVoiceEmotion(pair.emotion)
      setMood(pair.mood)
    }

    if (!messageTemplate.includes('{call_to_action}')) {
      setMessageTemplate((prev) =>
        `${prev.trim()}${prev.trim().endsWith('.') ? '' : '.'} Mission: {call_to_action}`
      )
    }
  }

  function getCurrentCallToActionValue() {
    if (variableMode === 'simple') {
      return suggestedVariables.call_to_action || ''
    }
    const found = customVariables.find((item) => item.key.trim() === 'call_to_action')
    return found?.value || ''
  }

  function getSelectedActionCtaPresetId() {
    const current = getCurrentCallToActionValue().trim()
    const matched = tieredActionCtaPresets.find((preset) => preset.cta === current)
    return matched?.id || ''
  }

  function updateCustomVariable(index: number, field: 'key' | 'value', value: string) {
    setCustomVariables((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function addCustomVariable() {
    setCustomVariables((prev) => [...prev, { key: '', value: '' }])
  }

  function removeCustomVariable(index: number) {
    setCustomVariables((prev) => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    if (!allowedVoiceProviders.includes(voiceProvider)) {
      setVoiceProvider(allowedVoiceProviders[0] || 'fish-audio')
    }
  }, [allowedVoiceProviders, voiceProvider])

  useEffect(() => {
    if (entitlements && !entitlements.allowVoiceCampaigns && deliveryMode === 'VOICE') {
      setDeliveryMode('TEXT')
    }
  }, [entitlements, deliveryMode])

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function formatVoiceDuration(ms: number) {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  function getVoiceDurationGuidance(ms: number) {
    const seconds = Math.floor(ms / 1000)
    if (seconds <= 0) return { label: 'No duration yet', tone: 'text-gray-500' }
    if (seconds < 45) return { label: 'Too short: aim for 90-180 seconds.', tone: 'text-status-error' }
    if (seconds < 90) return { label: 'Usable, but longer is better.', tone: 'text-gray-400' }
    if (seconds <= 180) return { label: 'Ideal range for quality clone.', tone: 'text-green-400' }
    if (seconds <= 300) return { label: 'Great depth, good for stable cloning.', tone: 'text-green-400' }
    return { label: 'Long sample: still good, trim pauses if possible.', tone: 'text-gray-400' }
  }

  function addVoiceTake(blob: Blob, durationMs: number, source: 'recorded' | 'uploaded') {
    const take: VoiceTake = {
      id: `take_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      blob,
      durationMs,
      source,
    }
    setVoiceTakes((prev) => [take, ...prev].slice(0, 6))
    setSelectedVoiceTakeId(take.id)
    setVoiceBlob(blob)
    setVoiceDurationMs(durationMs)
  }

  function selectVoiceTake(take: VoiceTake) {
    setSelectedVoiceTakeId(take.id)
    setVoiceBlob(take.blob)
    setVoiceDurationMs(take.durationMs)
  }

  function removeVoiceTake(takeId: string) {
    setVoiceTakes((prev) => {
      const next = prev.filter((take) => take.id !== takeId)
      if (selectedVoiceTakeId === takeId) {
        const fallback = next[0] || null
        setSelectedVoiceTakeId(fallback?.id || null)
        setVoiceBlob(fallback?.blob || null)
        setVoiceDurationMs(fallback?.durationMs || 0)
      }
      return next
    })
  }

  async function startVoiceRecording() {
    setVoiceCloneError(null)
    setVoiceCloneMessage(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      mediaStreamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = recorder
      recordingChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }
      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' })
        const finalDuration = recordingStartRef.current ? Date.now() - recordingStartRef.current : recordingElapsedMs
        addVoiceTake(blob, finalDuration, 'recorded')
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        recordingStartRef.current = null
      }

      recordingStartRef.current = Date.now()
      setVoiceDurationMs(0)
      setRecordingElapsedMs(0)
      setIsRecordingVoice(true)
      recorder.start(250)

      recordingTimerRef.current = setInterval(() => {
        if (!recordingStartRef.current) return
        const elapsed = Date.now() - recordingStartRef.current
        setRecordingElapsedMs(elapsed)
      }, 200)
    } catch (err) {
      setVoiceCloneError(
        err instanceof Error ? err.message : 'Could not access microphone. Check browser permissions.'
      )
    }
  }

  function stopVoiceRecording() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    setIsRecordingVoice(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  function onVoiceFilePicked(file: File | null) {
    if (!file) return
    setVoiceCloneError(null)
    setVoiceCloneMessage(null)
    addVoiceTake(file, 0, 'uploaded')
  }

  async function cloneVoiceFromSample() {
    if (!voiceBlob) {
      setVoiceCloneError('Record or upload a voice sample first.')
      return
    }
    if (!voiceName.trim()) {
      setVoiceCloneError('Voice name is required.')
      return
    }

    setVoiceCloneLoading(true)
    setVoiceCloneError(null)
    setVoiceCloneMessage(null)
    try {
      const form = new FormData()
      const file = new File([voiceBlob], 'voice-sample.webm', { type: voiceBlob.type || 'audio/webm' })
      form.append('audio', file)
      form.append('name', voiceName.trim())
      form.append('duration', String(Math.round(voiceDurationMs / 1000)))
      form.append('provider', effectiveVoiceProvider)

      const response = await fetch('/api/campaigns/stanvault/voice/clone', {
        method: 'POST',
        body: form,
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || data?.details || 'Voice clone failed')
      }

      const clone = data as VoiceCloneResponse
      if (clone.externalId) {
        setVoiceModelId(clone.externalId)
      }
      if (clone.provider && allowedVoiceProviders.includes(clone.provider)) {
        setVoiceProvider(clone.provider)
      }
      await fetchSavedVoices()
      setVoiceCloneMessage(
        clone.externalId
          ? `Voice cloned: ${clone.name || 'New Voice'} (${clone.externalId})`
          : 'Voice cloned successfully.'
      )
    } catch (err) {
      setVoiceCloneError(err instanceof Error ? err.message : 'Voice clone failed')
    } finally {
      setVoiceCloneLoading(false)
    }
  }

  async function activateSavedVoice(modelId: string) {
    try {
      await fetch('/api/campaigns/stanvault/voice/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      })
      await fetchSavedVoices()
    } catch {
      // non-blocking
    }
  }

  async function fetchHistory() {
    setHistoryLoading(true)
    try {
      const response = await fetch('/api/campaigns/stanvault/send?limit=20', {
        cache: 'no-store',
      })
      const data = await response.json()
      if (response.ok) {
        setHistory(data.runs || [])
      }
    } finally {
      setHistoryLoading(false)
    }
  }

  async function fetchPresets() {
    setPresetsLoading(true)
    setPresetError(null)
    try {
      const response = await fetch('/api/campaigns/stanvault/presets', {
        cache: 'no-store',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch presets')
      }
      setPresets(data.presets || [])
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to fetch presets')
    } finally {
      setPresetsLoading(false)
    }
  }

  async function fetchEntitlements() {
    try {
      const response = await fetch('/api/campaigns/stanvault/entitlements', {
        cache: 'no-store',
      })
      const data = await response.json()
      if (response.ok) {
        setEntitlements(data)
      }
    } catch {
      // Non-blocking: entitlements are enforced server-side anyway.
    }
  }

  const fetchSavedVoices = useCallback(async () => {
    try {
      const response = await fetch('/api/campaigns/stanvault/voice/models', {
        cache: 'no-store',
      })
      const data = await response.json()
      if (!response.ok) return
      const models = (data.models || []) as SavedVoiceModel[]
      setSavedVoices(models)
      const active = models.find((model) => model.isActive)
      if (active) {
        setVoiceModelId(active.externalId)
        if (allowedVoiceProviders.includes(active.provider)) {
          setVoiceProvider(active.provider)
        }
      }
    } catch {
      // Non-blocking
    }
  }, [allowedVoiceProviders])

  useEffect(() => {
    void fetchHistory()
    void fetchPresets()
    void fetchEntitlements()
    void fetchSavedVoices()
    void fetchAnalytics()
  }, [fetchSavedVoices])

  async function fetchAnalytics() {
    try {
      const response = await fetch('/api/campaigns/stanvault/analytics', {
        cache: 'no-store',
      })
      const data = await response.json()
      if (!response.ok) return
      setAnalytics({
        ctaByKey: data.ctaByKey || [],
        completionByStatus: data.completionByStatus || [],
      })
    } catch {
      // non-blocking
    }
  }

  async function logCtaCompletion() {
    const ctaKey = getSelectedActionCtaPresetId()
    const ctaLabel = actionCtaPresets.find((preset) => preset.id === ctaKey)?.label
    if (!ctaKey || !ctaLabel) {
      setCompletionLogMessage('Choose a CTA preset before logging completion.')
      return
    }
    if (!completionProofUrl.trim() && !completionProofNote.trim()) {
      setCompletionLogMessage('Add proof URL or proof note before logging completion.')
      return
    }

    try {
      const response = await fetch('/api/campaigns/stanvault/cta/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ctaKey,
          ctaLabel,
          proofUrl: completionProofUrl || undefined,
          proofNote: completionProofNote || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to log completion')
      }
      setCompletionLogMessage('CTA completion logged.')
      setCompletionProofUrl('')
      setCompletionProofNote('')
      await fetchAnalytics()
    } catch (err) {
      setCompletionLogMessage(err instanceof Error ? err.message : 'Failed to log completion')
    }
  }

  function applyPreset(preset: VariablePreset) {
    setFanClubName(preset.fanClubName || '')
    setPresetName(preset.name)
    const variables = preset.customVariables || {}
    const suggestedKeys = new Set(suggestedVariableFields.map((field) => field.key))
    const nextSuggested = {
      oryx_phase: '',
      propagation_goal: '',
      campaign_theme: '',
      call_to_action: '',
      reward_name: '',
    }
    const advancedRows: Array<{ key: string; value: string }> = []

    for (const [key, value] of Object.entries(variables)) {
      if (suggestedKeys.has(key)) {
        nextSuggested[key as keyof typeof nextSuggested] = String(value)
      } else {
        advancedRows.push({ key, value: String(value) })
      }
    }

    setSuggestedVariables(nextSuggested)
    setCustomVariables(advancedRows.length > 0 ? advancedRows : [{ key: '', value: '' }])
    setVariableMode(advancedRows.length > 0 ? 'advanced' : 'simple')
    setPresetMessage(`Loaded preset "${preset.name}"`)
  }

  async function savePreset() {
    const trimmedName = presetName.trim()
    if (!trimmedName) {
      setPresetError('Preset name is required')
      return
    }

    setPresetActionLoading(true)
    setPresetError(null)
    setPresetMessage(null)
    try {
      const response = await fetch('/api/campaigns/stanvault/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          fanClubName: fanClubName || undefined,
          customVariables: getActiveCustomVariablesMap(),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save preset')
      }
      setPresetMessage(`Saved preset "${trimmedName}"`)
      setPresetName('')
      await fetchPresets()
      if (data?.preset?.id) {
        setSelectedPresetId(data.preset.id)
      }
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to save preset')
    } finally {
      setPresetActionLoading(false)
    }
  }

  async function deletePreset() {
    if (!selectedPresetId) {
      setPresetError('Select a preset to delete')
      return
    }

    setPresetActionLoading(true)
    setPresetError(null)
    setPresetMessage(null)
    try {
      const response = await fetch(`/api/campaigns/stanvault/presets/${selectedPresetId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete preset')
      }
      setPresetMessage('Preset deleted')
      setSelectedPresetId('')
      await fetchPresets()
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : 'Failed to delete preset')
    } finally {
      setPresetActionLoading(false)
    }
  }

  async function submitCampaign() {
    setLoading(true)
    setError(null)

    try {
      if (deliveryMode === 'VOICE' && entitlements && !entitlements.allowVoiceCampaigns) {
        throw new Error(`Voice campaigns are not available on ${entitlements.pricingTier}.`)
      }

      if (deliveryMode === 'VOICE' && !voiceModelId.trim()) {
        throw new Error('Please set your Echoniq voice before sending a voice campaign.')
      }
      const selectedCta = getSelectedActionCtaPresetId()
      if (selectedCta && (!ctaDeadline.trim() || !ctaProofInstruction.trim())) {
        throw new Error('For action CTAs, set both a deadline and proof instruction before sending.')
      }

      const customVariableCount = Object.keys(getActiveCustomVariablesMap()).length
      if (entitlements && customVariableCount > entitlements.maxCustomVariables) {
        throw new Error(
          `Your ${entitlements.pricingTier} tier allows up to ${entitlements.maxCustomVariables} custom variables.`
        )
      }

      const response = await fetch('/api/campaigns/stanvault/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          fromEmail: fromEmail || undefined,
          replyTo: replyTo || undefined,
          fanClubName,
          customVariables: getActiveCustomVariablesMap(),
          messageTemplate,
          minTier,
          minStanScore: Number.isNaN(parseInt(minStanScore, 10))
            ? 70
            : parseInt(minStanScore, 10),
          limit: Number.isNaN(parseInt(limit, 10)) ? 100 : parseInt(limit, 10),
          mood,
          deliveryMode,
          voiceConfigMode: deliveryMode === 'VOICE' ? (voiceSetupMode === 'advanced' ? 'ADVANCED' : 'SIMPLE') : undefined,
          voiceModelId: deliveryMode === 'VOICE' ? voiceModelId || undefined : undefined,
          voiceProvider: deliveryMode === 'VOICE' ? effectiveVoiceProvider : undefined,
          voiceStyle: deliveryMode === 'VOICE' ? voiceStyle : undefined,
          voiceEmotion: deliveryMode === 'VOICE' ? voiceEmotion : undefined,
          voiceCtaLabel: deliveryMode === 'VOICE' ? voiceCtaLabel || undefined : undefined,
          ctaKey: getSelectedActionCtaPresetId() || undefined,
          ctaLabel:
            actionCtaPresets.find((preset) => preset.id === getSelectedActionCtaPresetId())?.label || undefined,
          ctaDeadline: ctaDeadline || undefined,
          ctaProofInstruction: ctaProofInstruction || undefined,
          dryRun,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to run campaign')
      }

      setResult(data)
      void fetchHistory()
      void fetchEntitlements()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  async function sendTestVoiceToMe() {
    setTestSending(true)
    setError(null)

    try {
      if (!voiceModelId.trim()) {
        throw new Error('Please set your Echoniq voice before sending a test.')
      }
      const selectedCta = getSelectedActionCtaPresetId()
      if (selectedCta && (!ctaDeadline.trim() || !ctaProofInstruction.trim())) {
        throw new Error('Set CTA deadline and proof instruction before running a voice test.')
      }

      const response = await fetch('/api/campaigns/stanvault/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject || 'Voice Test',
          fromEmail: fromEmail || undefined,
          replyTo: replyTo || undefined,
          fanClubName,
          customVariables: getActiveCustomVariablesMap(),
          messageTemplate,
          minTier,
          minStanScore: Number.isNaN(parseInt(minStanScore, 10))
            ? 70
            : parseInt(minStanScore, 10),
          limit: 1,
          mood,
          deliveryMode: 'VOICE',
          voiceConfigMode: voiceSetupMode === 'advanced' ? 'ADVANCED' : 'SIMPLE',
          voiceModelId,
          voiceProvider: effectiveVoiceProvider,
          voiceStyle,
          voiceEmotion,
          voiceCtaLabel: voiceCtaLabel || undefined,
          ctaKey: getSelectedActionCtaPresetId() || undefined,
          ctaLabel:
            actionCtaPresets.find((preset) => preset.id === getSelectedActionCtaPresetId())?.label || undefined,
          ctaDeadline: ctaDeadline || undefined,
          ctaProofInstruction: ctaProofInstruction || undefined,
          dryRun: false,
          testOnly: true,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send test voice email')
      }

      setResult(data)
      void fetchHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setTestSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fan Campaigns"
        description="Compose and send superfan-targeted campaigns via Echoniq directly from Stanvault."
      />

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Campaign Composer</CardTitle>
          <CardDescription>
            Use Stanvault segments and Echoniq delivery in one workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {entitlements && (
            <div className="border border-gray-800 p-4 bg-gray-950/40">
              <p className="text-caption uppercase tracking-widest text-gray-500">Tier Entitlements</p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Tier</p>
                  <p className="text-body-sm text-gray-200 break-words">{entitlements.pricingTier}</p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Monthly Limit</p>
                  <p className="text-body-sm text-gray-200">
                    {entitlements.monthlyLiveSendLimit === null
                      ? 'Unlimited'
                      : entitlements.monthlyLiveSendLimit.toLocaleString()}
                  </p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Used This Month</p>
                  <p className="text-body-sm text-gray-200">{entitlements.monthSentSoFar.toLocaleString()}</p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Remaining</p>
                  <p className="text-body-sm text-gray-200">
                    {entitlements.remaining === null ? 'Unlimited' : entitlements.remaining.toLocaleString()}
                  </p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Voice Campaigns</p>
                  <p className="text-body-sm text-gray-200">
                    {entitlements.allowVoiceCampaigns ? 'Included' : 'Not included'}
                  </p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Voice Used</p>
                  <p className="text-body-sm text-gray-200">{entitlements.monthVoiceSentSoFar.toLocaleString()}</p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Voice Remaining</p>
                  <p className="text-body-sm text-gray-200">
                    {entitlements.voiceRemaining === null ? 'Unlimited' : entitlements.voiceRemaining.toLocaleString()}
                  </p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Voice Setup</p>
                  <p className="text-body-sm text-gray-200">
                    {entitlements.allowAdvancedVoiceConfig ? 'Simple + Advanced' : 'Simple only'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              variant="boxed"
              placeholder="VIP Fan Drop"
            />
            <Select
              label="Minimum Tier"
              value={minTier}
              onChange={(e) => setMinTier(e.target.value)}
              options={[
                { value: 'CASUAL', label: 'Casual+' },
                { value: 'ENGAGED', label: 'Engaged+' },
                { value: 'DEDICATED', label: 'Dedicated+' },
                { value: 'SUPERFAN', label: 'Superfan only' },
              ]}
              variant="boxed"
            />
            <Input
              label="From Email (optional)"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              variant="boxed"
              placeholder="Artist <campaigns@yourdomain.com>"
              disabled={entitlements ? !entitlements.allowCustomFromEmail : false}
              hint={
                entitlements && !entitlements.allowCustomFromEmail
                  ? 'Upgrade to Patron Growth or Sovereign to use custom fromEmail.'
                  : undefined
              }
            />
            <Input
              label="Reply-To (optional)"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              variant="boxed"
              placeholder="team@yourdomain.com"
            />
            <Input
              label="Min Stan Score"
              type="number"
              value={minStanScore}
              onChange={(e) => setMinStanScore(e.target.value)}
              variant="boxed"
              min={0}
              max={100}
            />
            <Input
              label="Recipient Limit"
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              variant="boxed"
              min={1}
              max={1000}
            />
          </div>

          <Input
            label="Mood"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            variant="boxed"
            placeholder="excited"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Select
              label="Delivery Mode"
              value={deliveryMode}
              onChange={(e) => setDeliveryMode(e.target.value as 'TEXT' | 'VOICE')}
              options={[
                { value: 'TEXT', label: 'Text Email' },
                {
                  value: 'VOICE',
                  label:
                    entitlements && !entitlements.allowVoiceCampaigns
                      ? 'Voice + Email Attachment (Tier Upgrade)'
                      : 'Voice + Email Attachment',
                },
              ]}
              variant="boxed"
            />
            {deliveryMode === 'VOICE' && (
              <div className="lg:col-span-2 relative">
                <div className="absolute top-3 left-3 z-10 hidden xl:block">
                  <ColorPanel colors={shaderColors} onColorsChange={setShaderColors} />
                </div>
                <div className="relative bg-black overflow-hidden border border-gray-800 min-h-[520px]">
                  <ShaderBackground
                    width={voiceViewportWidth}
                    height={voiceViewportHeight}
                    colors={shaderColors}
                  />
                  <div className="absolute inset-0">
                    <Frame2147241533>
                      <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-caption uppercase tracking-widest text-gray-400">Voice Guide</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={voiceSetupMode === 'simple' ? 'outline' : 'ghost'}
                      onClick={() => setVoiceSetupMode('simple')}
                    >
                      Simple
                    </Button>
                    <Button
                      type="button"
                      variant={voiceSetupMode === 'advanced' ? 'outline' : 'ghost'}
                      onClick={() => {
                        if (entitlements && !entitlements.allowAdvancedVoiceConfig) {
                          setError(
                            `Advanced voice setup is available on Patron Growth and Sovereign. Current tier: ${entitlements.pricingTier}.`
                          )
                          return
                        }
                        setVoiceSetupMode('advanced')
                      }}
                    >
                      Advanced
                      {entitlements && !entitlements.allowAdvancedVoiceConfig ? ' (Locked)' : ''}
                    </Button>
                  </div>
                </div>

                {voiceSetupMode === 'simple' ? (
                  <div className="space-y-3">
                    <div className="border border-gray-800 p-3 bg-black/20">
                      <p className="text-body-sm text-gray-200">Record one or more clean takes, then clone from your best take.</p>
                      <p className="text-caption text-gray-500 mt-1">Recommended: 90-180 seconds, minimal background noise.</p>
                    </div>
                    <Input
                      label="Voice Name"
                      value={voiceName}
                      onChange={(e) => setVoiceName(e.target.value)}
                      variant="boxed"
                      placeholder="Main Artist Voice"
                    />
                    {savedVoices.length > 0 && (
                      <Select
                        label="Saved Voices"
                        value={
                          savedVoices.find((voice) => voice.externalId === voiceModelId)?.id || ''
                        }
                        onChange={(e) => {
                          const selected = savedVoices.find((voice) => voice.id === e.target.value)
                          if (!selected) return
                          setVoiceModelId(selected.externalId)
                          if (allowedVoiceProviders.includes(selected.provider)) {
                            setVoiceProvider(selected.provider)
                          }
                          void activateSavedVoice(selected.id)
                        }}
                        options={[
                          { value: '', label: 'Select saved voice' },
                          ...savedVoices.map((voice) => ({
                            value: voice.id,
                            label: `${voice.name}${voice.isActive ? ' (Active)' : ''}`,
                          })),
                        ]}
                        variant="boxed"
                      />
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="border border-gray-800 bg-black/20 p-3 space-y-3">
                        <p className="text-caption text-gray-400 uppercase tracking-widest">Record</p>
                        <p className="text-caption text-gray-500">Best quality: 90-180 seconds, clear speech.</p>
                        <p className="text-caption text-gray-300">
                          Duration: {formatVoiceDuration(isRecordingVoice ? recordingElapsedMs : voiceDurationMs)}
                        </p>
                        <p className={`text-caption ${getVoiceDurationGuidance(isRecordingVoice ? recordingElapsedMs : voiceDurationMs).tone}`}>
                          {getVoiceDurationGuidance(isRecordingVoice ? recordingElapsedMs : voiceDurationMs).label}
                        </p>
                        <div className="flex items-end gap-1 h-6">
                          {[0, 1, 2, 3, 4].map((bar) => (
                            <span
                              key={bar}
                              className={`w-1 rounded-sm ${isRecordingVoice ? 'bg-gray-300 animate-pulse' : 'bg-gray-700'}`}
                              style={{ height: `${30 + ((bar % 3) * 20)}%`, animationDelay: `${bar * 120}ms` }}
                            />
                          ))}
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gray-300 transition-all"
                            style={{
                              width: `${Math.min(((isRecordingVoice ? recordingElapsedMs : voiceDurationMs) / 180000) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!isRecordingVoice ? (
                            <Button type="button" variant="outline" onClick={startVoiceRecording}>
                              <Mic className="w-4 h-4 mr-2" />
                              Start Recording
                            </Button>
                          ) : (
                            <Button type="button" variant="outline" onClick={stopVoiceRecording}>
                              <Square className="w-4 h-4 mr-2" />
                              Stop
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="border border-gray-800 bg-black/20 p-3 space-y-3">
                        <p className="text-caption text-gray-400 uppercase tracking-widest">Or Upload</p>
                        <label className="inline-flex items-center px-3 py-2 border border-gray-700 text-body-sm text-gray-200 cursor-pointer hover:border-gray-500 transition-colors">
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Audio File
                          <input
                            type="file"
                            accept="audio/webm,audio/wav,audio/mp3,audio/mpeg,audio/ogg"
                            className="hidden"
                            onChange={(e) => onVoiceFilePicked(e.target.files?.[0] || null)}
                          />
                        </label>
                        <p className="text-caption text-gray-500">
                          Supported: webm, wav, mp3, ogg.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cloneVoiceFromSample}
                        disabled={voiceCloneLoading}
                      >
                        {voiceCloneLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cloning Voice...
                          </>
                        ) : (
                          'Create Voice Clone'
                        )}
                      </Button>
                      <p className="text-caption text-gray-500">
                        Provider auto-selected for your tier: {effectiveVoiceProvider}
                      </p>
                    </div>

                    {voiceCloneError && <p className="text-caption text-status-error">{voiceCloneError}</p>}
                    {voiceCloneMessage && <p className="text-caption text-gray-500">{voiceCloneMessage}</p>}

                    <div className="border border-gray-800 bg-black/20 p-3 space-y-2">
                      <p className="text-caption uppercase tracking-widest text-gray-400">Saved Takes</p>
                      {voiceTakes.length === 0 ? (
                        <p className="text-caption text-gray-500">No takes yet. Record or upload to add one.</p>
                      ) : (
                        <div className="space-y-2">
                          {voiceTakes.map((take, idx) => (
                            <div
                              key={take.id}
                              className={`p-2 border ${selectedVoiceTakeId === take.id ? 'border-gray-500 bg-gray-800/40' : 'border-gray-800'} flex items-center justify-between gap-2`}
                            >
                              <div className="min-w-0">
                                <p className="text-body-sm text-gray-200 break-words">
                                  Take {voiceTakes.length - idx} · {take.source === 'recorded' ? 'Recorded' : 'Uploaded'}
                                </p>
                                <p className="text-caption text-gray-300">
                                  {take.durationMs > 0 ? formatVoiceDuration(take.durationMs) : 'Duration unknown'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" onClick={() => selectVoiceTake(take)}>
                                  Use
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => removeVoiceTake(take.id)}>
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Input
                      label="Connected Voice"
                      value={voiceModelId}
                      onChange={(e) => setVoiceModelId(e.target.value)}
                      variant="boxed"
                      placeholder="Will auto-fill after clone"
                      hint="You can still paste an existing Echoniq voice ID."
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <Input
                      label="Voice Model ID"
                      value={voiceModelId}
                      onChange={(e) => setVoiceModelId(e.target.value)}
                      variant="boxed"
                      placeholder="voice_xxx"
                      hint="Raw Echoniq model ID."
                    />
                    <Select
                      label="Voice Provider"
                      value={effectiveVoiceProvider}
                      onChange={(e) =>
                        setVoiceProvider(e.target.value as 'fish-audio' | 'resemble-ai' | 'chatterbox')
                      }
                      options={allowedVoiceProviders.map((provider) => ({
                        value: provider,
                        label:
                          provider === 'fish-audio'
                            ? 'Fish Audio'
                            : provider === 'resemble-ai'
                              ? 'Resemble AI'
                              : 'Chatterbox',
                      }))}
                      variant="boxed"
                    />
                  </div>
                )}

                <p className="text-caption text-gray-500">
                  Tier access: {entitlements?.pricingTier || '...'} · Providers:{' '}
                  {allowedVoiceProviders.join(', ')}
                </p>
                {entitlements && !entitlements.allowAdvancedVoiceConfig && (
                  <p className="text-caption text-gray-500">
                    Advanced mode unlocks on Patron Growth and Sovereign tiers.
                  </p>
                )}
                      </div>
                    </Frame2147241533>
                  </div>
                </div>
              </div>
            )}
          </div>

          {deliveryMode === 'VOICE' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Select
                label="Voice Style"
                value={voiceStyle}
                onChange={(e) => setVoiceStyle(e.target.value as 'natural' | 'whisper' | 'singing' | 'shouting')}
                options={[
                  { value: 'natural', label: 'Natural' },
                  { value: 'whisper', label: 'Whisper' },
                  { value: 'singing', label: 'Singing' },
                  { value: 'shouting', label: 'Shouting / Hype' },
                ]}
                variant="boxed"
              />
              <Select
                label="Emotion"
                value={voiceEmotion}
                onChange={(e) =>
                  setVoiceEmotion(e.target.value as 'neutral' | 'grateful' | 'excited' | 'playful' | 'heartfelt')
                }
                options={[
                  { value: 'neutral', label: 'Neutral' },
                  { value: 'grateful', label: 'Grateful' },
                  { value: 'excited', label: 'Excited' },
                  { value: 'playful', label: 'Playful' },
                  { value: 'heartfelt', label: 'Heartfelt' },
                ]}
                variant="boxed"
              />
            </div>
          )}

          {deliveryMode === 'VOICE' && (
            <Input
              label="Voice CTA Label"
              value={voiceCtaLabel}
              onChange={(e) => setVoiceCtaLabel(e.target.value)}
              variant="boxed"
              placeholder="Your personal voice note"
            />
          )}

          <div className="space-y-2">
            <label className="block text-caption uppercase tracking-widest text-gray-400">
              Starter Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {messageTemplateSuggestions.map((template) => (
                <Button
                  key={template.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyMessageTemplateSuggestion(template.id)}
                >
                  {template.label}
                </Button>
              ))}
            </div>
            <p className="text-caption text-gray-600">
              Pick one, then customize it below.
            </p>
          </div>

          <div className="space-y-2 border border-gray-800 p-3">
            <label className="block text-caption uppercase tracking-widest text-gray-400">
              Action CTAs (Post-Vanity)
            </label>
            <p className="text-caption text-gray-600">
              Recommended for {entitlements?.pricingTier || 'your tier'}:
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {recommendedActionCtaPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyActionCtaPreset(preset.id)}
                  className="text-left border border-gray-800 p-3 hover:border-gray-600 transition-colors"
                >
                  <p className="text-body-sm text-gray-100">{preset.label}</p>
                  <p className="mt-1 text-caption text-gray-500">{preset.action}</p>
                </button>
              ))}
            </div>
            {additionalActionCtaPresets.length > 0 && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAllActionCtas((prev) => !prev)}
                >
                  {showAllActionCtas ? 'Hide More Actions' : 'More Actions'}
                </Button>
                {showAllActionCtas && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {additionalActionCtaPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyActionCtaPreset(preset.id)}
                        className="text-left border border-gray-800 p-3 hover:border-gray-600 transition-colors"
                      >
                        <p className="text-body-sm text-gray-100">{preset.label}</p>
                        <p className="mt-1 text-caption text-gray-500">{preset.action}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="text-caption text-gray-600">
              Click one to set `{`{call_to_action}`}` and auto-pair voice tone for the action.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Input
                label="CTA Deadline (optional)"
                value={ctaDeadline}
                onChange={(e) => setCtaDeadline(e.target.value)}
                variant="boxed"
                placeholder="By Friday 8PM"
              />
              <Input
                label="Proof Instruction (optional)"
                value={ctaProofInstruction}
                onChange={(e) => setCtaProofInstruction(e.target.value)}
                variant="boxed"
                placeholder="Reply with screenshot link"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-caption uppercase tracking-widest text-gray-400">
              Message Template
            </label>
            <textarea
              ref={messageTemplateRef}
              className="w-full bg-gray-900 border border-gray-800 px-4 py-3 text-white font-light focus:outline-none focus:border-accent transition-colors min-h-[130px]"
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {tokenPreview.map((token) => (
                <button
                  type="button"
                  key={token}
                  onClick={() => insertTokenIntoMessage(token)}
                  className="px-2 py-1 border border-gray-800 text-caption text-gray-500 break-all hover:text-white hover:border-gray-600 transition-colors"
                >
                  {token}
                </button>
              ))}
            </div>
            <p className="text-caption text-gray-600">
              Click any variable to insert it at your cursor.
            </p>
          </div>

          <div className="space-y-4 border border-gray-800 p-4">
            <p className="text-caption uppercase tracking-widest text-gray-400">Variables</p>
            <Input
              label="Stan Club Name"
              value={fanClubName}
              onChange={(e) => setFanClubName(e.target.value)}
              variant="boxed"
              placeholder="Cherubs, Furies, Harpies, Sphinxes..."
            />

            <div className="border border-gray-800 p-3 space-y-3">
              <p className="text-caption uppercase tracking-widest text-gray-500">Variable Presets</p>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-5">
                  <Select
                    label="Saved Presets"
                    value={selectedPresetId}
                    onChange={(e) => {
                      const presetId = e.target.value
                      setSelectedPresetId(presetId)
                      const selected = presets.find((preset) => preset.id === presetId)
                      if (selected) applyPreset(selected)
                    }}
                    options={[
                      { value: '', label: presetsLoading ? 'Loading presets...' : 'Select a preset' },
                      ...presets.map((preset) => ({
                        value: preset.id,
                        label: preset.name,
                      })),
                    ]}
                    variant="boxed"
                  />
                </div>
                <div className="lg:col-span-5">
                  <Input
                    label="Preset Name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    variant="boxed"
                    placeholder="Sphinxes Core Vars"
                  />
                </div>
                <div className="lg:col-span-2 flex items-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={savePreset}
                    disabled={presetActionLoading}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={deletePreset}
                    disabled={presetActionLoading || !selectedPresetId}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              {presetError && <p className="text-caption text-status-error">{presetError}</p>}
              {presetMessage && <p className="text-caption text-gray-500">{presetMessage}</p>}
              <p className="text-caption text-gray-600">
                Saving with an existing name updates that preset.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={variableMode === 'simple' ? 'outline' : 'ghost'}
                  onClick={() => setVariableMode('simple')}
                >
                  Simple Mode
                </Button>
                <Button
                  type="button"
                  variant={variableMode === 'advanced' ? 'outline' : 'ghost'}
                  onClick={() => setVariableMode('advanced')}
                >
                  Advanced Mode
                </Button>
              </div>

              <Select
                label="Set Call To Action"
                value={getSelectedActionCtaPresetId()}
                onChange={(e) => {
                  const presetId = e.target.value
                  if (!presetId) return
                  applyActionCtaPreset(presetId)
                }}
                options={[
                  { value: '', label: 'Choose a CTA action preset' },
                  ...tieredActionCtaPresets.map((preset) => ({
                    value: preset.id,
                    label: preset.label,
                  })),
                ]}
                variant="boxed"
              />

              {variableMode === 'simple' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {suggestedVariableFields.map((field) => (
                    <Input
                      key={field.key}
                      label={field.label}
                      value={suggestedVariables[field.key] || ''}
                      onChange={(e) =>
                        setSuggestedVariables((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      variant="boxed"
                      placeholder={field.placeholder}
                      hint={field.hint}
                    />
                  ))}
                </div>
              ) : (
                <>
                  {entitlements && (
                    <p className="text-caption text-gray-600">
                      Max custom variables for {entitlements.pricingTier}: {entitlements.maxCustomVariables}
                    </p>
                  )}
                  <p className="text-caption uppercase tracking-widest text-gray-500">Custom Variables</p>
                  {customVariables.map((item, index) => (
                    <div key={`custom-var-${index}`} className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                      <div className="lg:col-span-5">
                        <Input
                          label={`Key ${index + 1}`}
                          value={item.key}
                          onChange={(e) => updateCustomVariable(index, 'key', e.target.value)}
                          variant="boxed"
                          placeholder="oryx_variable_name"
                        />
                      </div>
                      <div className="lg:col-span-5">
                        <Input
                          label={`Value ${index + 1}`}
                          value={item.value}
                          onChange={(e) => updateCustomVariable(index, 'value', e.target.value)}
                          variant="boxed"
                          placeholder="42"
                        />
                      </div>
                      <div className="lg:col-span-2 flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeCustomVariable(index)}
                          disabled={customVariables.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" onClick={addCustomVariable}>
                    Add Variable
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="dry-run"
              type="button"
              role="checkbox"
              aria-checked={dryRun}
              onClick={() => setDryRun((prev) => !prev)}
              className="h-5 w-5 rounded-sm border border-gray-600 bg-gray-900 flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {dryRun ? <span className="h-2.5 w-2.5 bg-accent block rounded-[1px]" /> : null}
            </button>
            <label htmlFor="dry-run" className="text-body-sm text-gray-300 select-none">
              Dry run (no live emails sent)
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={submitCampaign}
              disabled={loading || !messageTemplate.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : dryRun ? (
                <>
                  <TestTube2 className="w-4 h-4 mr-2" />
                  Run Preview
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Campaign
                </>
              )}
            </Button>
            {deliveryMode === 'VOICE' && (
              <Button
                variant="ghost"
                onClick={sendTestVoiceToMe}
                disabled={
                  testSending ||
                  loading ||
                  !messageTemplate.trim() ||
                  (entitlements ? !entitlements.allowVoiceCampaigns : false)
                }
              >
                {testSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Test...
                  </>
                ) : (
                  'Test Voice to Me'
                )}
              </Button>
            )}
            {error && <p className="text-caption text-status-error">{error}</p>}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card variant="default">
          <CardHeader>
            <CardTitle>Campaign Result</CardTitle>
            <CardDescription>
              Campaign ID: {result.campaignId} · Status: {result.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.dispatch && (
              <p className="text-body-sm text-gray-300">
                Dispatch: {result.dispatch.mode} via {result.dispatch.provider} (
                {result.dispatch.deliveryMode || 'TEXT'}
                {result.dispatch.voiceProvider ? ` · ${result.dispatch.voiceProvider}` : ''}) ({result.dispatch.fromEmail})
              </p>
            )}

            {result.totals && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Segment</p>
                  <p className="text-body-lg text-white">{result.totals.segmentCount}</p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Queued</p>
                  <p className="text-body-lg text-white">{result.totals.queuedRecipients}</p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Sent</p>
                  <p className="text-body-lg text-white">{result.totals.sent}</p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Failed</p>
                  <p className="text-body-lg text-white">{result.totals.failed}</p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">Preview Only</p>
                  <p className="text-body-lg text-white">{result.totals.previewOnly}</p>
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption text-gray-500">No Email</p>
                  <p className="text-body-lg text-white">{result.totals.skippedNoEmail}</p>
                </div>
              </div>
            )}

            {result.note && <p className="text-caption text-gray-500">{result.note}</p>}
            {result.reliability && (
              <p className="text-caption text-gray-500">
                Reliability: retries {result.reliability.retries || 0} · timeouts{' '}
                {result.reliability.timedOutAttempts || 0} · provider errors{' '}
                {result.reliability.providerErrors || 0}
              </p>
            )}
            {result.variables && (
              <p className="text-caption text-gray-500">
                Variables acknowledged: {result.variables.builtIn.length} built-in,{' '}
                {result.variables.custom.length} custom.
              </p>
            )}

            {result.deliveryResultsPreview && result.deliveryResultsPreview.length > 0 && (
              <div className="border border-gray-800 overflow-auto">
                <table className="w-full table-fixed text-left">
                  <thead className="bg-gray-900/70">
                    <tr>
                      <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-2/5">Email</th>
                      <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-1/5">Status</th>
                      <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-2/5">Message ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.deliveryResultsPreview.map((item) => (
                      <tr key={`${item.fanId}-${item.email}`} className="border-t border-gray-800">
                        <td className="px-4 py-3 text-body-sm text-gray-200 break-all">{item.email}</td>
                        <td className="px-4 py-3 text-body-sm text-gray-200 break-words">{item.status}</td>
                        <td className="px-4 py-3 text-body-sm text-gray-500 break-all">{item.messageId || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card variant="default">
        <CardHeader>
          <CardTitle>CTA Analytics</CardTitle>
          <CardDescription>Completion signals for post-vanity action missions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!analytics ? (
            <p className="text-body-sm text-gray-500">No analytics yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="border border-gray-800 p-3">
                  <p className="text-caption uppercase tracking-widest text-gray-500">Top CTA Keys</p>
                  {analytics.ctaByKey.length === 0 ? (
                    <p className="text-caption text-gray-600 mt-2">No CTA completions logged yet.</p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {analytics.ctaByKey.slice(0, 6).map((item) => (
                        <p key={item.ctaKey} className="text-body-sm text-gray-200">
                          {item.ctaKey}: {item.count}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border border-gray-800 p-3">
                  <p className="text-caption uppercase tracking-widest text-gray-500">Completion Status</p>
                  {analytics.completionByStatus.length === 0 ? (
                    <p className="text-caption text-gray-600 mt-2">No status data yet.</p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {analytics.completionByStatus.map((item) => (
                        <p key={item.status} className="text-body-sm text-gray-200">
                          {item.status}: {item.count}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={() => void fetchAnalytics()}>
                  Refresh Analytics
                </Button>
                <Button type="button" variant="ghost" onClick={() => void fetchSavedVoices()}>
                  Refresh Voices
                </Button>
              </div>
              <div className="border border-gray-800 p-3 space-y-3">
                <p className="text-caption uppercase tracking-widest text-gray-500">Log CTA Completion</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Input
                    label="Proof URL"
                    value={completionProofUrl}
                    onChange={(e) => setCompletionProofUrl(e.target.value)}
                    variant="boxed"
                    placeholder="https://..."
                  />
                  <Input
                    label="Proof Note"
                    value={completionProofNote}
                    onChange={(e) => setCompletionProofNote(e.target.value)}
                    variant="boxed"
                    placeholder="What was completed"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={logCtaCompletion}>
                    Log Completion
                  </Button>
                  {completionLogMessage && <p className="text-caption text-gray-500">{completionLogMessage}</p>}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card variant="default">
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
          <CardDescription>Latest campaign previews and sends stored in Stanvault.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p className="text-body-sm text-gray-500">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-body-sm text-gray-500">No campaign runs yet.</p>
          ) : (
            <div className="border border-gray-800 overflow-auto">
              <table className="w-full table-fixed text-left">
                <thead className="bg-gray-900/70">
                  <tr>
                    <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-1/4">Time</th>
                    <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-1/8">Status</th>
                    <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-1/6">Mode</th>
                    <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-1/4">Subject</th>
                    <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-1/12">Sent</th>
                    <th className="px-4 py-3 text-caption uppercase tracking-widest text-gray-400 w-1/12">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((run) => (
                    <tr key={run.id} className="border-t border-gray-800">
                      <td className="px-4 py-3 text-body-sm text-gray-300 break-words">
                        {new Date(run.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-gray-200 break-words">{run.status}</td>
                      <td className="px-4 py-3 text-body-sm text-gray-200 break-words">
                        {run.dispatchMode || (run.dryRun ? 'preview_only' : '-')}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-gray-200 break-words">{run.subject || '-'}</td>
                      <td className="px-4 py-3 text-body-sm text-gray-200">{run.sentCount}</td>
                      <td className="px-4 py-3 text-body-sm text-gray-200">{run.failedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
