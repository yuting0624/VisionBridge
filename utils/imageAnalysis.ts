export async function analyzeImageWithAI(data: string | Blob, analysisMode: AnalysisMode, previousAnalysis: string | null) {
  try {
    let result;
    if (analysisMode === 'video') {
      if (!(data instanceof Blob)) {
        console.error('Received data type:', typeof data);
        throw new Error(`動画データはBlobである必要があります。受け取ったデータ型: ${typeof data}`);
      }
      
      const base64data = await blobToBase64(data);
      
      console.log('Sending video data of length:', base64data.length);

      const response = await fetch(process.env.NEXT_PUBLIC_ANALYZE_VIDEO_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoData: base64data, previousAnalysis }),
        credentials: 'include', 
      });
      
      if (!response.ok) {
        throw await handleResponseError(response, '動画分析に失敗しました');
      }
      const { analysis } = await response.json();
      result = analysis;
    } else {
      const response = await fetch(process.env.NEXT_PUBLIC_ANALYZE_IMAGE_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: data, analysisMode, previousAnalysis }),
      });
      if (!response.ok) {
        throw await handleResponseError(response, '画像分析に失敗しました');
      }
      const { analysis } = await response.json();
      result = analysis;
    }

    return result;
  } catch (error) {
    console.error("画像/動画の分析中にエラーが発生しました:", error);
    throw error; 
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function handleResponseError(response: Response, errorMessage: string): Promise<Error> {
  const errorBody = await response.text();
  console.error('Error response body:', errorBody);
  return new Error(`${errorMessage}: ${response.status} ${response.statusText} - ${errorBody}`);
}

export type AnalysisMode = 'normal' | 'video' | 'detailed';