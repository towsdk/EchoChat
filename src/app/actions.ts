'use server';

import {
  filterRelevantMessages,
  type FilterRelevantMessagesInput,
} from '@/ai/flows/filter-relevant-messages';

export async function getFilterDecision(
  input: FilterRelevantMessagesInput
) {
  try {
    const output = await filterRelevantMessages(input);
    return { success: true, data: output };
  } catch (error) {
    console.error('Error in AI filter:', error);
    return { success: false, error: 'Failed to get filter decision from AI.' };
  }
}
