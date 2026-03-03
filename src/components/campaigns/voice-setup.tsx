'use client'

import { Loader2, Mic, Square, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  formatVoiceDuration,
  getVoiceDurationGuidance,
  type VoiceTake,
  type SavedVoiceModel,
  type VoiceProvider,
} from './campaign-constants'

interface VoiceSetupProps {
  voiceSetupMode: 'simple' | 'advanced'
  onVoiceSetupModeChange: (mode: 'simple' | 'advanced') => void
  allowAdvancedVoiceConfig: boolean
  onError: (msg: string) => void

  // Voice identity
  voiceName: string
  onVoiceNameChange: (v: string) => void
  voiceModelId: string
  onVoiceModelIdChange: (v: string) => void
  effectiveVoiceProvider: VoiceProvider
  onVoiceProviderChange: (v: VoiceProvider) => void
  allowedVoiceProviders: VoiceProvider[]
  savedVoices: SavedVoiceModel[]
  onActivateSavedVoice: (modelId: string) => void

  // Recording
  isRecording: boolean
  recordingElapsedMs: number
  voiceDurationMs: number
  onStartRecording: () => void
  onStopRecording: () => void
  onFilePicked: (file: File | null) => void

  // Takes
  voiceTakes: VoiceTake[]
  selectedVoiceTakeId: string | null
  onSelectTake: (take: VoiceTake) => void
  onRemoveTake: (takeId: string) => void

  // Clone
  voiceCloneLoading: boolean
  voiceCloneError: string | null
  voiceCloneMessage: string | null
  onCloneVoice: () => void

  // Style
  voiceStyle: 'natural' | 'whisper' | 'singing' | 'shouting'
  onVoiceStyleChange: (v: 'natural' | 'whisper' | 'singing' | 'shouting') => void
  voiceEmotion: 'neutral' | 'grateful' | 'excited' | 'playful' | 'heartfelt'
  onVoiceEmotionChange: (v: 'neutral' | 'grateful' | 'excited' | 'playful' | 'heartfelt') => void
  voiceCtaLabel: string
  onVoiceCtaLabelChange: (v: string) => void
}

export function VoiceSetup({
  voiceSetupMode,
  onVoiceSetupModeChange,
  allowAdvancedVoiceConfig,
  onError,
  voiceName,
  onVoiceNameChange,
  voiceModelId,
  onVoiceModelIdChange,
  effectiveVoiceProvider,
  onVoiceProviderChange,
  allowedVoiceProviders,
  savedVoices,
  onActivateSavedVoice,
  isRecording,
  recordingElapsedMs,
  voiceDurationMs,
  onStartRecording,
  onStopRecording,
  onFilePicked,
  voiceTakes,
  selectedVoiceTakeId,
  onSelectTake,
  onRemoveTake,
  voiceCloneLoading,
  voiceCloneError,
  voiceCloneMessage,
  onCloneVoice,
  voiceStyle,
  onVoiceStyleChange,
  voiceEmotion,
  onVoiceEmotionChange,
  voiceCtaLabel,
  onVoiceCtaLabelChange,
}: VoiceSetupProps) {
  const displayDuration = isRecording ? recordingElapsedMs : voiceDurationMs
  const guidance = getVoiceDurationGuidance(displayDuration)

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onVoiceSetupModeChange('simple')}
            className={`px-3 py-1.5 text-caption transition-colors ${
              voiceSetupMode === 'simple' ? 'text-gray-200' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            Simple
          </button>
          <button
            type="button"
            onClick={() => {
              if (!allowAdvancedVoiceConfig) {
                onError('Advanced voice setup requires Patron Growth or Sovereign.')
                return
              }
              onVoiceSetupModeChange('advanced')
            }}
            className={`px-3 py-1.5 text-caption transition-colors ${
              voiceSetupMode === 'advanced' ? 'text-gray-200' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {voiceSetupMode === 'simple' ? (
        <div className="space-y-4">
          {!voiceModelId && (
            <div className="flex items-center gap-2 text-caption text-gray-500">
              <span className={voiceName ? 'text-gray-400' : 'text-white'}>1 Name</span>
              <span className="text-gray-700">&rarr;</span>
              <span className={voiceName && voiceTakes.length > 0 ? 'text-gray-400' : voiceName ? 'text-white' : ''}>2 Record or upload</span>
              <span className="text-gray-700">&rarr;</span>
              <span className={voiceName && voiceTakes.length > 0 ? 'text-white' : ''}>3 Clone</span>
              <span className="text-gray-700">&rarr;</span>
              <span>Done</span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              label="Voice Name"
              value={voiceName}
              onChange={(e) => onVoiceNameChange(e.target.value)}
              variant="boxed"
              placeholder="Main Artist Voice"
            />
            {savedVoices.length > 0 && (
              <Select
                label="Saved Voices"
                value={savedVoices.find((v) => v.externalId === voiceModelId)?.id || ''}
                onChange={(e) => {
                  const selected = savedVoices.find((v) => v.id === e.target.value)
                  if (!selected) return
                  onVoiceModelIdChange(selected.externalId)
                  if (allowedVoiceProviders.includes(selected.provider)) {
                    onVoiceProviderChange(selected.provider)
                  }
                  onActivateSavedVoice(selected.id)
                }}
                options={[
                  { value: '', label: 'Select saved voice' },
                  ...savedVoices.map((v) => ({
                    value: v.id,
                    label: `${v.name}${v.isActive ? ' (Active)' : ''}`,
                  })),
                ]}
                variant="boxed"
              />
            )}
          </div>

          {/* Record / Upload — single row */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <Button type="button" variant="outline" size="sm" onClick={onStartRecording}>
                  <Mic className="w-3.5 h-3.5 mr-1.5" />
                  Record
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={onStopRecording}>
                  <Square className="w-3.5 h-3.5 mr-1.5" />
                  Stop
                </Button>
              )}
              <label className="inline-flex items-center px-3 py-1.5 border border-[#1a1a1a] text-caption text-gray-300 cursor-pointer hover:border-[#333] transition-colors">
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload File
                <input
                  type="file"
                  accept="audio/webm,audio/wav,audio/mp3,audio/mpeg,audio/ogg"
                  className="hidden"
                  onChange={(e) => onFilePicked(e.target.files?.[0] || null)}
                />
              </label>
              <span className="text-caption text-gray-500 tabular-nums">
                {formatVoiceDuration(displayDuration)}
              </span>
            </div>
            <div className="h-1 bg-[#141414] overflow-hidden">
              <div
                className="h-full bg-gray-500 transition-all"
                style={{ width: `${Math.min((displayDuration / 180000) * 100, 100)}%` }}
              />
            </div>
            <p className={`text-caption ${guidance.tone}`}>{guidance.label}</p>
          </div>

          {/* Takes */}
          {voiceTakes.length > 0 && (
            <div className="space-y-1">
              <p className="text-caption text-gray-500">Takes</p>
              {voiceTakes.map((take, idx) => (
                <div
                  key={take.id}
                  className={`flex items-center justify-between py-1.5 px-2 transition-colors ${
                    selectedVoiceTakeId === take.id ? 'bg-[#14141499]' : ''
                  }`}
                >
                  <span className="text-caption text-gray-300">
                    <span className="text-gray-600 mr-1.5">{voiceTakes.length - idx}</span>
                    {take.source === 'recorded' ? 'Rec' : 'File'}
                    {take.durationMs > 0 ? ` · ${formatVoiceDuration(take.durationMs)}` : ''}
                  </span>
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectTake(take)}
                      className="text-caption text-gray-500 hover:text-white transition-colors"
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveTake(take.id)}
                      className="text-caption text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      Remove
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Clone */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCloneVoice}
              disabled={voiceCloneLoading}
            >
              {voiceCloneLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Cloning...
                </>
              ) : (
                'Clone Voice'
              )}
            </Button>
            <span className="text-caption text-gray-600">{effectiveVoiceProvider}</span>
          </div>

          {voiceCloneError && <p className="text-caption text-status-error">{voiceCloneError}</p>}
          {voiceCloneMessage && <p className="text-caption text-gray-500">{voiceCloneMessage}</p>}

          <Input
            label="Connected Voice ID"
            value={voiceModelId}
            onChange={(e) => onVoiceModelIdChange(e.target.value)}
            variant="boxed"
            placeholder="Auto-fills after clone"
          />
        </div>
      ) : (
        /* Advanced mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input
            label="Voice Model ID"
            value={voiceModelId}
            onChange={(e) => onVoiceModelIdChange(e.target.value)}
            variant="boxed"
            placeholder="voice_xxx"
          />
          <Select
            label="Voice Provider"
            value={effectiveVoiceProvider}
            onChange={(e) => onVoiceProviderChange(e.target.value as VoiceProvider)}
            options={allowedVoiceProviders.map((p) => ({
              value: p,
              label:
                p === 'fish-audio'
                  ? 'Fish Audio'
                  : p === 'resemble-ai'
                    ? 'Resemble AI'
                    : 'Chatterbox',
            }))}
            variant="boxed"
          />
        </div>
      )}

      {/* Style + Emotion + CTA Label */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-[#1a1a1a]">
        <Select
          label="Voice Style"
          value={voiceStyle}
          onChange={(e) =>
            onVoiceStyleChange(e.target.value as 'natural' | 'whisper' | 'singing' | 'shouting')
          }
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
            onVoiceEmotionChange(
              e.target.value as 'neutral' | 'grateful' | 'excited' | 'playful' | 'heartfelt'
            )
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
      <Input
        label="Voice CTA Label"
        value={voiceCtaLabel}
        onChange={(e) => onVoiceCtaLabelChange(e.target.value)}
        variant="boxed"
        placeholder="Your personal voice note"
      />
    </div>
  )
}
