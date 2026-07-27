import { describe, it, expect } from 'vitest';
import { parseJsonResponse } from './groqService';

describe('parseJsonResponse', () => {
  it('parses valid JSON input', () => {
    // Arrange
    const rawText = '{"coverLetter": "This is a cover letter."}'; // simple, clean JSON - no newlines needed here

    // Act
    const result = parseJsonResponse(rawText);

    // Assert
    expect(result).toEqual({ "coverLetter": "This is a cover letter." });
  });

  it('throws on malformed JSON input', () => {
    const rawText = '{"coverLetter": "This is a cover letter."'; 
    expect(() => parseJsonResponse(rawText)).toThrow();
  });

  it('handles real newlines inside string values (regression test)', () => {
    // Arrange
    const rawText = '{"coverLetter": "This is a cover letter.\n it has multiple lines   "}';

    // Act
    const result = parseJsonResponse(rawText);

    // Assert
    expect(result.coverLetter).toBe('This is a cover letter.\n it has multiple lines   ');
  });
});