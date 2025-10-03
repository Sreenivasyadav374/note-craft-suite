// aiService.ts

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

// --- 1. Define Schemas/Parsers for Note Suggestion (Existing) ---
const noteSuggestionSchema = z.object({
  suggestedTitle: z.string().describe("A concise title for the suggested note."),
  suggestedTags: z.array(z.string()).describe("A list of relevant tags for the note."),
});
const noteParser = StructuredOutputParser.fromZodSchema(noteSuggestionSchema);

// --- 2. Prompt Template for Note Suggestion (Existing) ---
const notePromptTemplate = `
You are an expert AI note assistant. Your task is to analyze the provided note content and current title to suggest a better, more concise title and a list of relevant tags.

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

// --- 3. Grammar/Spelling Fix Logic (NEW) ---
const grammarPromptTemplate = `
You are an expert copyeditor. Your task is to correct any grammar mistakes, fix spelling errors, improve syntax, and generally polish the following text to professional standards. Do not change the core meaning or structure of the text.

TEXT TO FIX:
---
{textToFix}
---

Provide ONLY the corrected, polished version of the text. Do not include any commentary, explanations, or surrounding quotes.
`;

const fixGrammarAndSpelling = async (
    textToFix: string
): Promise<string | null> => {
    
    // Using a direct string invocation since the output is unstructured (just the corrected text)
    const input = grammarPromptTemplate.replace("{textToFix}", textToFix);

    try {
        const response = await llm.invoke(input);
        // We expect the model to return only the corrected text
        return response.content as string; 
    } catch (error) {
        console.error("Gemini failed to fix grammar and spelling:", error);
        return null;
    }
};

// --- 4. Existing Note Suggestion Function ---
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


// --- 5. Export the Service ---
export const aiService = {
  generateNoteSuggestion,
  fixGrammarAndSpelling, // <-- NEW EXPORT
};