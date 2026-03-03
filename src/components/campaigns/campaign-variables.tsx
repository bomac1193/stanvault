'use client'

import { Input } from '@/components/ui/input'
import {
  suggestedVariableFields,
  type VariablePreset,
} from './campaign-constants'

interface CampaignVariablesProps {
  fanClubName: string
  onFanClubNameChange: (v: string) => void
  variableMode: 'simple' | 'advanced'
  onVariableModeChange: (mode: 'simple' | 'advanced') => void
  suggestedVariables: Record<string, string>
  onSuggestedVariableChange: (key: string, value: string) => void
  customVariables: Array<{ key: string; value: string }>
  onCustomVariableUpdate: (index: number, field: 'key' | 'value', value: string) => void
  onCustomVariableAdd: () => void
  onCustomVariableRemove: (index: number) => void
  presets: VariablePreset[]
  selectedPresetId: string
  onPresetSelect: (presetId: string) => void
  presetName: string
  onPresetNameChange: (v: string) => void
  onPresetSave: () => void
  onPresetDelete: () => void
  presetActionLoading: boolean
  presetError: string | null
  presetMessage: string | null
}

export function CampaignVariables({
  fanClubName,
  onFanClubNameChange,
  variableMode,
  onVariableModeChange,
  suggestedVariables,
  onSuggestedVariableChange,
  customVariables,
  onCustomVariableUpdate,
  onCustomVariableAdd,
  onCustomVariableRemove,
  presets,
  selectedPresetId,
  onPresetSelect,
  presetName,
  onPresetNameChange,
  onPresetSave,
  onPresetDelete,
  presetActionLoading,
  presetError,
  presetMessage,
}: CampaignVariablesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {presets.length > 0 && (
          <select
            value={selectedPresetId}
            onChange={(e) => onPresetSelect(e.target.value)}
            className="bg-transparent border-b border-[#1a1a1a] text-caption text-gray-400 py-1 focus:outline-none focus:border-[#2a2a2a]"
          >
            <option value="">Presets</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="text"
            value={presetName}
            onChange={(e) => onPresetNameChange(e.target.value)}
            placeholder="Save as..."
            className="bg-transparent border-b border-[#1a1a1a] text-caption text-gray-400 py-1 w-28 focus:outline-none focus:border-[#2a2a2a] placeholder:text-gray-700"
          />
          <button
            type="button"
            onClick={onPresetSave}
            disabled={presetActionLoading}
            className="text-caption text-gray-500 hover:text-white transition-colors disabled:opacity-40"
          >
            Save
          </button>
          {selectedPresetId && (
            <button
              type="button"
              onClick={onPresetDelete}
              disabled={presetActionLoading}
              className="text-caption text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-40"
            >
              Del
            </button>
          )}
        </div>
      </div>
      {presetError && <p className="text-caption text-status-error">{presetError}</p>}
      {presetMessage && <p className="text-caption text-gray-500">{presetMessage}</p>}

      <Input
        label="Fan Club Name"
        value={fanClubName}
        onChange={(e) => onFanClubNameChange(e.target.value)}
        variant="boxed"
        placeholder="Cherubs, Furies, Harpies, Sphinxes..."
      />

      <div className="space-y-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onVariableModeChange('simple')}
            className={`px-2.5 py-1 text-caption transition-colors ${
              variableMode === 'simple'
                ? 'text-white bg-[#141414]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Simple
          </button>
          <button
            type="button"
            onClick={() => onVariableModeChange('advanced')}
            className={`px-2.5 py-1 text-caption transition-colors ${
              variableMode === 'advanced'
                ? 'text-white bg-[#141414]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Advanced
          </button>
        </div>

        {variableMode === 'simple' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {suggestedVariableFields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                value={suggestedVariables[field.key] || ''}
                onChange={(e) => onSuggestedVariableChange(field.key, e.target.value)}
                variant="boxed"
                placeholder={field.placeholder}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {customVariables.map((item, index) => (
              <div key={`custom-var-${index}`} className="flex items-center gap-2">
                <input
                  value={item.key}
                  onChange={(e) => onCustomVariableUpdate(index, 'key', e.target.value)}
                  placeholder="key"
                  className="flex-1 bg-transparent border-b border-[#1a1a1a] text-body-sm text-white py-1.5 focus:outline-none focus:border-[#2a2a2a] placeholder:text-gray-700"
                />
                <input
                  value={item.value}
                  onChange={(e) => onCustomVariableUpdate(index, 'value', e.target.value)}
                  placeholder="value"
                  className="flex-1 bg-transparent border-b border-[#1a1a1a] text-body-sm text-white py-1.5 focus:outline-none focus:border-[#2a2a2a] placeholder:text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => onCustomVariableRemove(index)}
                  disabled={customVariables.length === 1}
                  className="text-caption text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-30"
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={onCustomVariableAdd}
              className="text-caption text-gray-500 hover:text-white transition-colors"
            >
              + Add variable
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
