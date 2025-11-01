'use server';

/**
 * @fileOverview This file defines a Genkit flow for adaptive difficulty scaling in the Shadow Strike game.
 *
 * It dynamically adjusts the game's difficulty based on the player's score, increasing enemy spawn rates and obstacle complexity.
 * @module adaptiveDifficultyScaling
 * @exports adjustDifficulty - A function to adjust game difficulty based on player score.
 * @exports AdaptiveDifficultyInput - The input type for the adjustDifficulty function.
 * @exports AdaptiveDifficultyOutput - The output type for the adjustDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptiveDifficultyInputSchema = z.object({
  playerScore: z
    .number()
    .describe('The current score of the player in the game.'),
});
export type AdaptiveDifficultyInput = z.infer<typeof AdaptiveDifficultyInputSchema>;

const AdaptiveDifficultyOutputSchema = z.object({
  enemySpawnRate: z
    .number()
    .describe(
      'The rate at which enemies should spawn, higher values mean more frequent spawns.'
    ),
  obstacleComplexity: z
    .number()
    .describe(
      'A numerical value representing the complexity of obstacles, higher values mean more complex obstacles.'
    ),
  gameSpeedMultiplier: z
    .number()
    .describe(
      'A multiplier to increase the speed of the game, higher values mean faster gameplay.'
    ),
});
export type AdaptiveDifficultyOutput = z.infer<typeof AdaptiveDifficultyOutputSchema>;

export async function adjustDifficulty(input: AdaptiveDifficultyInput): Promise<AdaptiveDifficultyOutput> {
  return adjustDifficultyFlow(input);
}

const adjustDifficultyPrompt = ai.definePrompt({
  name: 'adjustDifficultyPrompt',
  input: {schema: AdaptiveDifficultyInputSchema},
  output: {schema: AdaptiveDifficultyOutputSchema},
  prompt: `You are an expert game designer tasked with dynamically adjusting the difficulty of the Shadow Strike ninja game based on the player's score.

  The player's current score is {{{playerScore}}}.

  Based on the player's score, determine appropriate values for the following:

  - enemySpawnRate: A number indicating how frequently enemies should spawn. Higher values mean more frequent spawns.  The initial spawn rate should be 1, and increase linearly to 5 as the player's score increases.
  - obstacleComplexity: A number representing the complexity of the obstacles. Higher values mean more complex obstacles. The initial obstacle complexity should be 1, and increase linearly to 10 as the player's score increases.
  - gameSpeedMultiplier: A multiplier to the game speed. Higher values mean faster gameplay. The initial multiplier should be 1.0, and increase linearly to 1.5 as the player's score increases.

  Consider these guidelines:
  - A low score indicates the player is struggling, so decrease difficulty by lowering the spawn rate, obstacle complexity, and game speed.
  - A very high score indicates the player is highly skilled, so increase difficulty substantially to challenge them.
  - Make small adjustments for moderate score changes to provide a smooth difficulty curve.
  - The maximum score is 10000.

  Based on the player's score, what values should be set for enemySpawnRate, obstacleComplexity, and gameSpeedMultiplier?`,
});

const adjustDifficultyFlow = ai.defineFlow(
  {
    name: 'adjustDifficultyFlow',
    inputSchema: AdaptiveDifficultyInputSchema,
    outputSchema: AdaptiveDifficultyOutputSchema,
  },
  async input => {
    // Scale score to a value between 0 and 1
    const scoreScale = Math.min(input.playerScore, 10000) / 10000;

    const {output} = await adjustDifficultyPrompt({
      playerScore: input.playerScore,
    });

    // Ensure the output values are within reasonable bounds.
    const clampedOutput: AdaptiveDifficultyOutput = {
      enemySpawnRate: Math.max(1, Math.min(5, output?.enemySpawnRate ?? 1)),
      obstacleComplexity: Math.max(1, Math.min(10, output?.obstacleComplexity ?? 1)),
      gameSpeedMultiplier: Math.max(1.0, Math.min(1.5, output?.gameSpeedMultiplier ?? 1.0)),
    };

    return clampedOutput;
  }
);
