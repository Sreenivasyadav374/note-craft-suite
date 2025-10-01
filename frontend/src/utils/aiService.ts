// aiService.ts (Renamed from llmModel.ts for better convention)

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
// import { Task, AITaskSuggestion } from '../types'; // Removed unnecessary import for Note App context

const apiKey = 'AIzaSyAMPKq9jl9dKKvOCHhHE5UuVfYoCX-YVUE';

// Initialize the Gemini Model (Picks up GOOGLE_API_KEY from env)
const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  temperature: 0.5, // Lowered temperature for more focused suggestions
  apiKey: apiKey
});

// =======================================================
// --- Task Suggestion Logic (Existing) ---
// =======================================================

// Define the Structured Output Schema using Zod
const suggestionSchema = z.object({
  title: z.string().describe("A concise title for the suggested task."),
  description: z.string().describe("A brief, actionable description of the task."),
  category: z.enum(["work", "personal", "health", "social", "learning"]).describe("The category ID that best fits the task."),
  priority: z.enum(["low", "medium", "high"]).describe("The suggested priority level."),
  estimatedDuration: z.number().int().describe("The estimated duration of the task in minutes (e.g., 30, 60, 120)."),
});

// The model will return an array of suggestions
const taskParser = StructuredOutputParser.fromZodSchema(
  z.array(suggestionSchema).describe("An array of 3 to 5 distinct task suggestions.")
);


// Define the Prompt Template
const taskPromptTemplate = `
You are an expert personal productivity assistant. Your goal is to suggest 3-5 distinct, actionable tasks for a user's to-do list based on their recent activity and current goals.

Use the provided JSON Schema to format your entire response.

Current Day: {currentDay}
User Goals: {userGoals}
Recent Tasks (for context): {recentTasks}

Based on this context, generate new, high-value task suggestions.

FORMAT INSTRUCTIONS:
{formatInstructions}
`;

const taskPrompt = new PromptTemplate({
  template: taskPromptTemplate,
  inputVariables: ["currentDay", "userGoals", "recentTasks"],
  partialVariables: { formatInstructions: taskParser.getFormatInstructions() },
});


// Implement the Service Function (Retaining the original for completeness)
/*
const generateTaskSuggestions = async (
  recentTasks: Task[],
  currentDay: string,
  userGoals: string[]
): Promise<AITaskSuggestion[]> => {
  // ... (existing logic) ...
};
*/


// =======================================================
// --- Note Suggestion Logic (NEW) ---
// =======================================================

const noteSuggestionSchema = z.object({
  suggestedTitle: z.string().describe("A brief, descriptive, and punchy title for the note, ideally under 10 words."),
  suggestedTags: z.array(z.string()).describe("An array of 3 to 5 relevant keywords/tags for the note content."),
});

const noteParser = StructuredOutputParser.fromZodSchema(noteSuggestionSchema);

const notePromptTemplate = `
You are an expert note-taking assistant. Your task is to analyze the provided note content and current title to suggest a better, more concise title and a list of relevant tags.

Current Title: "{currentTitle}"
Note Content:
---
{noteContent}
---

Please generate suggestions based ONLY on the content. The new title should be highly descriptive. The tags should be keywords that categorize the note.

FORMAT INSTRUCTIONS:
{formatInstructions}
`;

const notePrompt = new PromptTemplate({
  template: notePromptTemplate,
  inputVariables: ["currentTitle", "noteContent"],
  partialVariables: { formatInstructions: noteParser.getFormatInstructions() },
});

// New function to generate suggestions for a single note
export interface NoteSuggestion {
  suggestedTitle: string;
  suggestedTags: string[];
}

const generateNoteSuggestion = async (
  title: string,
  content: string
): Promise<NoteSuggestion | null> => {

  const input = await notePrompt.format({
    currentTitle: title,
    noteContent: content,
  });

  try {
    const response = await llm.invoke(input);
    const suggestions = await noteParser.parse(response.content as string);
    return suggestions as NoteSuggestion;
  } catch (error) {
    console.error("Gemini failed to generate structured note suggestions:", error);
    return null;
  }
};


// --- 4. Export the Service ---
export const aiService = { 
  // generateTaskSuggestions, // Keep or remove based on your app's needs
  generateNoteSuggestion,
};