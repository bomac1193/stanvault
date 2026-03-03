'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  messageTemplateSuggestions,
  actionCtaPresets,
} from './campaign-constants'

interface CampaignTemplatesProps {
  onApplyTemplate: (templateId: string) => void
  onApplyActionCta: (presetId: string) => void
  selectedCtaId: string
  recommendedPresets: readonly (typeof actionCtaPresets)[number][]
  additionalPresets: readonly (typeof actionCtaPresets)[number][]
  ctaDeadline: string
  onCtaDeadlineChange: (v: string) => void
  ctaProofInstruction: string
  onCtaProofInstructionChange: (v: string) => void
}

export function CampaignTemplates({
  onApplyTemplate,
  onApplyActionCta,
  selectedCtaId,
  recommendedPresets,
  additionalPresets,
  ctaDeadline,
  onCtaDeadlineChange,
  ctaProofInstruction,
  onCtaProofInstructionChange,
}: CampaignTemplatesProps) {
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-caption text-gray-500">Templates</p>
        <div className="flex flex-wrap gap-1.5">
          {messageTemplateSuggestions.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onApplyTemplate(t.id)}
              className="px-2.5 py-1 text-caption text-gray-400 border border-[#1a1a1a] hover:text-white hover:border-[#2a2a2a] transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-caption text-gray-500">Actions</p>
        <div className="flex flex-wrap gap-1.5">
          {recommendedPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyActionCta(preset.id)}
              className={`px-3 py-1.5 text-caption border transition-colors ${
                selectedCtaId === preset.id
                  ? 'text-white border-[#333] bg-[#14141480]'
                  : 'text-gray-400 border-[#1a1a1a] hover:text-white hover:border-[#2a2a2a]'
              }`}
            >
              {preset.label}
            </button>
          ))}
          {additionalPresets.length > 0 && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="px-3 py-1.5 text-caption text-gray-600 hover:text-gray-400 transition-colors"
            >
              +{additionalPresets.length} more
            </button>
          )}
          {showAll &&
            additionalPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyActionCta(preset.id)}
                className={`px-3 py-1.5 text-caption border transition-colors ${
                  selectedCtaId === preset.id
                    ? 'text-white border-[#333] bg-[#14141480]'
                    : 'text-gray-400 border-[#1a1a1a] hover:text-white hover:border-[#2a2a2a]'
                }`}
              >
                {preset.label}
              </button>
            ))}
        </div>
        {selectedCtaId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
            <Input
              label="Deadline"
              value={ctaDeadline}
              onChange={(e) => onCtaDeadlineChange(e.target.value)}
              variant="boxed"
              placeholder="By Friday 8PM"
            />
            <Input
              label="Proof Instruction"
              value={ctaProofInstruction}
              onChange={(e) => onCtaProofInstructionChange(e.target.value)}
              variant="boxed"
              placeholder="Reply with screenshot link"
            />
          </div>
        )}
      </div>
    </div>
  )
}
