import { useCallback, useRef } from 'react';

const GOOGLE_TRANSLITERATE_URL = 'https://inputtools.google.com/request';
const TAMIL_LANGUAGE_CODE = 'ta-t-i0-und';
const MAX_SUGGESTIONS = 5;

/**
 * Calls Google's transliteration API directly via fetch.
 * Returns the top Tamil suggestion for the given English word,
 * or null if the API call fails.
 */
async function transliterateToTamil(word: string): Promise<string | null> {
  try {
    const url = `${GOOGLE_TRANSLITERATE_URL}?text=${encodeURIComponent(word)}&itc=${TAMIL_LANGUAGE_CODE}&num=${MAX_SUGGESTIONS}&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();

    // Response format: ["SUCCESS", [["word", ["suggestion1","suggestion2",...]]]]
    if (data?.[0] === 'SUCCESS' && data?.[1]?.[0]?.[1]?.length > 0) {
      return data[1][0][1][0]; // First suggestion
    }

    return null;
  } catch {
    return null;
  }
}

interface TransliterationResult {
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setValue: (val: string) => void,
  ) => void;
}

/**
 * Custom hook for Thanglish → Tamil transliteration.
 *
 * Buffers English characters as the user types.
 * On Space or Enter, sends the last word to Google's transliteration API
 * and replaces it with the Tamil equivalent.
 *
 * Falls back to English if the API call fails (e.g., offline).
 */
export function useTamilTransliteration(): TransliterationResult {
  const pendingWordRef = useRef('');
  const isTransliteratingRef = useRef(false);

  const transliterateWord = useCallback(
    async (
      word: string,
      element: HTMLInputElement | HTMLTextAreaElement,
      setValue: (val: string) => void,
    ) => {
      if (!word.trim() || isTransliteratingRef.current) return;

      isTransliteratingRef.current = true;

      try {
        const tamilWord = await transliterateToTamil(word);

        if (tamilWord) {
          const currentValue = element.value;
          const cursorPos = element.selectionStart || currentValue.length;

          // Find the English word just before cursor and replace it
          const beforeCursor = currentValue.slice(0, cursorPos);
          const afterCursor = currentValue.slice(cursorPos);

          const lastIndex = beforeCursor.lastIndexOf(word);

          if (lastIndex !== -1) {
            const newBefore = beforeCursor.slice(0, lastIndex) + tamilWord;
            const trailingChar = beforeCursor.slice(lastIndex + word.length);
            const newValue = newBefore + trailingChar + afterCursor;
            setValue(newValue);

            // Restore cursor position
            requestAnimationFrame(() => {
              const newCursorPos = newBefore.length + trailingChar.length;
              element.setSelectionRange(newCursorPos, newCursorPos);
            });
          }
        }
      } catch (error) {
        // Graceful fallback: if API fails, keep English text
        console.warn('Tamil transliteration failed, keeping English text:', error);
      } finally {
        isTransliteratingRef.current = false;
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === ' ' || e.key === 'Enter') {
        const word = pendingWordRef.current.trim();
        if (word) {
          const element = e.currentTarget;
          // Use a small delay so the space/enter character is added to the value first
          setTimeout(() => {
            transliterateWord(word, element, (val) => {
              // Trigger a React-compatible value change
              const nativeInputValueSetter =
                element instanceof HTMLTextAreaElement
                  ? Object.getOwnPropertyDescriptor(
                      window.HTMLTextAreaElement.prototype,
                      'value',
                    )?.set
                  : Object.getOwnPropertyDescriptor(
                      window.HTMLInputElement.prototype,
                      'value',
                    )?.set;

              if (nativeInputValueSetter) {
                nativeInputValueSetter.call(element, val);
                element.dispatchEvent(new Event('input', { bubbles: true }));
              }
            });
          }, 10);
          pendingWordRef.current = '';
        }
      }
    },
    [transliterateWord],
  );

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      setValue: (val: string) => void,
    ) => {
      const value = e.target.value;
      setValue(value);

      // Extract the current word being typed (characters after the last space/newline)
      const lastSpaceOrNewline = Math.max(value.lastIndexOf(' '), value.lastIndexOf('\n'));
      const currentWord = value.slice(lastSpaceOrNewline + 1);
      pendingWordRef.current = currentWord;
    },
    [],
  );

  return { handleKeyDown, handleChange };
}
