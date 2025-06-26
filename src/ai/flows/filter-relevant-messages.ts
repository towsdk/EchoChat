'use server';

/**
 * @fileOverview An AI agent to filter relevant messages for forwarding.
 *
 * - filterRelevantMessages - A function that filters messages based on relevance.
 * - FilterRelevantMessagesInput - The input type for the filterRelevantMessages function.
 * - FilterRelevantMessagesOutput - The return type for the filterRelevantMessages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FilterRelevantMessagesInputSchema = z.object({
  message: z.string().describe('The content of the message to be filtered.'),
  topic: z.string().describe('The topic or context of the destination group.'),
});
export type FilterRelevantMessagesInput = z.infer<typeof FilterRelevantMessagesInputSchema>;

const FilterRelevantMessagesOutputSchema = z.object({
  isRelevant: z.boolean().describe('Whether the message is relevant to the topic of the destination group.'),
  reason: z.string().describe('The reason for the relevance or irrelevance of the message.'),
});
export type FilterRelevantMessagesOutput = z.infer<typeof FilterRelevantMessagesOutputSchema>;

export async function filterRelevantMessages(
  input: FilterRelevantMessagesInput
): Promise<FilterRelevantMessagesOutput> {
  return filterRelevantMessagesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'filterRelevantMessagesPrompt',
  input: {schema: FilterRelevantMessagesInputSchema},
  output: {schema: FilterRelevantMessagesOutputSchema},
  prompt: `You are an AI assistant tasked with filtering messages for a specific group.\n\nYou will determine if a given message is relevant to the group's topic.\n\nMessage: {{{message}}}\nGroup Topic: {{{topic}}}\n\nDetermine if the message is relevant to the group topic. If it is, set isRelevant to true. If not, set isRelevant to false. Provide a brief reason for your decision.\n`,
});

const filterRelevantMessagesFlow = ai.defineFlow(
  {
    name: 'filterRelevantMessagesFlow',
    inputSchema: FilterRelevantMessagesInputSchema,
    outputSchema: FilterRelevantMessagesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
