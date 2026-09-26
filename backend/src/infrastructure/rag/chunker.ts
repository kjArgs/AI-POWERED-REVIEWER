export interface TextChunk { chunk_index: number; content: string }

// Character chunks keep even unbroken text bounded; overlap preserves boundaries.
// 2400 characters is approximately 600 English tokens (not an exact token count).
export function chunkText(text: string, size = 2400, overlap = 300): TextChunk[] {
  if (!Number.isInteger(size) || !Number.isInteger(overlap) || size < 1 || overlap < 0 || overlap >= size) {
    throw new Error('Chunk size must be positive and overlap smaller than size');
  }
  const chunks: TextChunk[] = [];
  for (let start = 0; start < text.length; start += size - overlap) {
    const content = text.slice(start, start + size).trim();
    if (content) chunks.push({ chunk_index: chunks.length, content });
    if (start + size >= text.length) break;
  }
  return chunks;
}
