import { create } from 'zustand';

interface UiState {
  selectedOptionId: string | null;
  submitted: boolean;
  examNavigatorOpen: boolean;
  selectOption: (optionId: string) => void;
  markSubmitted: () => void;
  resetQuestionUi: (selectedOptionId?: string | null, submitted?: boolean) => void;
  setExamNavigatorOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedOptionId: null,
  submitted: false,
  examNavigatorOpen: false,
  selectOption: (optionId) => set({ selectedOptionId: optionId }),
  markSubmitted: () => set({ submitted: true }),
  resetQuestionUi: (selectedOptionId = null, submitted = false) =>
    set({ selectedOptionId, submitted }),
  setExamNavigatorOpen: (open) => set({ examNavigatorOpen: open }),
}));
