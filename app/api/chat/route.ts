import { NextResponse } from "next/server";
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

export async function POST(req: Request) {
  console.log("Received POST request");
  const { messages } = await req.json();
  console.log("Parsed request body:", messages);

  try {
    console.log("Sending request to Perplexity API");
    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: `You are a movie expert assistant. Use the following Wikipedia movie data to answer questions.
              - Always search movie data before answering
              - If unsure, say "I don't know about that movie"
              - Include release year, director, and plot summary when available
              - Keep responses under 3 sentences`
          },
          ...messages
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });
    console.log("Received response from Perplexity API");

    const perplexityData = await perplexityResponse.json();
    console.log("Parsed Perplexity response:", perplexityData);

    // route.js (excerpt)
    const content = perplexityData?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't find any information about that movie. Please try another query!";
    const sourceQuery = messages[messages.length - 1].content;

    // Add source information directly to content
    const fullContent = `${content}\n\n_Source: movie search for "${sourceQuery}"_`;

    console.log("Returning response:", fullContent);
    return NextResponse.json({
      content: fullContent, // Send combined content
    });

  } catch (error) {
    console.error("Perplexity API error:", error);
    return NextResponse.json({ content: "Error processing request" }, { status: 500 });
  }
}

// CSV loading and search functions
interface MovieData {
  Title: string;
  Year: string;
  Director: string;
  Plot: string;
  Genre: string;
}

let movieData: MovieData[] = [];

// Load CSV data
try {
  console.log("Loading movie data from CSV");
  const csvPath = path.join(process.cwd(), 'data', 'wiki_movie_plots_deduped.csv');
  const file = fs.readFileSync(csvPath, 'utf-8');
  console.log("CSV file read successfully");

  movieData = parse(file, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
  });
  console.log("Parsed CSV data, total movies loaded:", movieData.length);
} catch (error) {
  console.error("Error loading movie data:", error);
}

async function findRelevantContent(query: string): Promise<MovieData[]> {
  console.log("Searching for relevant movie content with query:", query);
  const searchTerms = query.toLowerCase().split(' ');

  const results = movieData.filter(movie => {
    const movieText = `${movie.Title} ${movie.Director} ${movie.Genre} ${movie.Plot}`.toLowerCase();
    return searchTerms.some(term => movieText.includes(term));
  }).slice(0, 5); // Return top 5 matches

  console.log("Search results found:", results);
  return results;
}