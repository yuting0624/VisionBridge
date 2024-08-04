// utils/translationHelper.ts

export async function translateText(text: string, sourceLanguage: string, targetLanguage: string) {
  const response = await fetch('/api/translateText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.translatedText;
}