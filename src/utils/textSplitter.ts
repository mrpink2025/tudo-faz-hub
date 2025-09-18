/**
 * Utility function to safely split text for translation
 * Ensures each chunk respects URL-encoded character limits
 */

export function getUrlEncodedLength(text: string): number {
  return encodeURIComponent(text).length;
}

export function splitTextSafely(text: string, maxEncodedLength: number = 450): string[] {
  if (!text || text.trim().length === 0) {
    return [text];
  }

  // If text fits within limit, return as is
  if (getUrlEncodedLength(text) <= maxEncodedLength) {
    return [text];
  }

  const chunks: string[] = [];
  
  // First try to split by paragraphs (double newlines)
  const paragraphs = text.split(/\n\s*\n/);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const paragraphWithNewlines = currentChunk ? `\n\n${paragraph}` : paragraph;
    const potentialChunk = currentChunk + paragraphWithNewlines;
    
    if (getUrlEncodedLength(potentialChunk) <= maxEncodedLength) {
      currentChunk = potentialChunk;
    } else {
      // Save current chunk if it exists
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If single paragraph is too long, split by sentences
      if (getUrlEncodedLength(paragraph) > maxEncodedLength) {
        const sentenceChunks = splitBySentences(paragraph, maxEncodedLength);
        chunks.push(...sentenceChunks);
      } else {
        currentChunk = paragraph;
      }
    }
  }
  
  // Add remaining chunk
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

function splitBySentences(text: string, maxEncodedLength: number): string[] {
  // Split by sentence-ending punctuation
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const potentialChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    
    if (getUrlEncodedLength(potentialChunk) <= maxEncodedLength) {
      currentChunk = potentialChunk;
    } else {
      // Save current chunk if it exists
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If single sentence is too long, split by words
      if (getUrlEncodedLength(sentence) > maxEncodedLength) {
        const wordChunks = splitByWords(sentence, maxEncodedLength);
        chunks.push(...wordChunks);
      } else {
        currentChunk = sentence;
      }
    }
  }
  
  // Add remaining chunk
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

function splitByWords(text: string, maxEncodedLength: number): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const word of words) {
    const potentialChunk = currentChunk ? `${currentChunk} ${word}` : word;
    
    if (getUrlEncodedLength(potentialChunk) <= maxEncodedLength) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      
      // If single word is too long, force split by characters
      if (getUrlEncodedLength(word) > maxEncodedLength) {
        const charChunks = splitByCharacters(word, maxEncodedLength);
        chunks.push(...charChunks);
        currentChunk = '';
      } else {
        currentChunk = word;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

function splitByCharacters(text: string, maxEncodedLength: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const char of text) {
    const potentialChunk = currentChunk + char;
    
    if (getUrlEncodedLength(potentialChunk) <= maxEncodedLength) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = char;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}