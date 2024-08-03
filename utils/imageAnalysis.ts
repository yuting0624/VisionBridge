export async function analyzeImageWithGemini(imageData: string, previousAnalysis: string | null) {
  try {
    const response = await fetch('/api/analyzeImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData, previousAnalysis }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}