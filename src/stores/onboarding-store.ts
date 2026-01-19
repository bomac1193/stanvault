import { create } from 'zustand'

export interface ProfileData {
  artistName: string
  genre: string
  careerStage: string
  location: string
}

export interface ConnectedPlatform {
  platform: string
  fanCount: number
}

interface OnboardingState {
  step: number
  profileData: ProfileData
  connectedPlatforms: ConnectedPlatform[]
  isConnecting: boolean

  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setProfileData: (data: Partial<ProfileData>) => void
  addConnectedPlatform: (platform: ConnectedPlatform) => void
  removeConnectedPlatform: (platform: string) => void
  setIsConnecting: (isConnecting: boolean) => void
  reset: () => void
}

const initialState = {
  step: 1,
  profileData: {
    artistName: '',
    genre: '',
    careerStage: '',
    location: '',
  },
  connectedPlatforms: [],
  isConnecting: false,
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
  setProfileData: (data) =>
    set((state) => ({
      profileData: { ...state.profileData, ...data },
    })),
  addConnectedPlatform: (platform) =>
    set((state) => ({
      connectedPlatforms: [...state.connectedPlatforms.filter((p) => p.platform !== platform.platform), platform],
    })),
  removeConnectedPlatform: (platform) =>
    set((state) => ({
      connectedPlatforms: state.connectedPlatforms.filter((p) => p.platform !== platform),
    })),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
  reset: () => set(initialState),
}))
