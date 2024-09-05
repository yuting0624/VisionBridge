export async function analyzeImageWithAI(data: string | Blob, analysisMode: 'normal' | 'video', previousAnalysis: string | null) {
  try {
    let result;
    if (analysisMode === 'video') {
      if (!(data instanceof Blob)) {
        throw new Error('動画データはBlobである必要があります');
      }
      const formData = new FormData();
      formData.append('video', data, 'video.webm');
      const response = await fetch('/api/videoAnalysis', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('動画分析に失敗しました');
      const { analysis } = await response.json();
      result = analysis;
    } else {
      const response = await fetch('/api/visionAnalysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: data, analysisMode: 'normal' }),
      });
      if (!response.ok) throw new Error('Vision AI分析に失敗しました');
      const { result: visionResult } = await response.json();
      result = await interpretWithGemini(visionResult, 'normal', previousAnalysis);
    }

    return result;
  } catch (error) {
    console.error("画像/動画の分析中にエラーが発生しました:", error);
    throw new Error(`分析に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function interpretWithGemini(analysisResult: any, analysisMode: string, previousAnalysis: string | null) {
  try {
    const prompt = createPromptForMode(analysisMode, analysisResult, previousAnalysis);
    const geminiResponse = await fetch('/api/analyzeImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, imageData: analysisResult, previousAnalysis }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`HTTPエラー! ステータス: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    return data.analysis;
  } catch (error) {
    console.error("Geminiでの解釈中にエラーが発生しました:", error);
    throw error;
  }
}

function createPromptForMode(mode: string, analysisResult: any, previousAnalysis: string | null): string {
  const basePrompt = `前回の分析: "${previousAnalysis || '初回分析'}"\n\n`;
  
  switch (mode) {
    case 'normal':
      return basePrompt + `
現在の画像の主要な要素、潜在的な障害物、危険要素を簡潔に説明してください。回答は2-3の短い日本語の文で、シンプルで直接的な表現を使用してください。
新たに発生した変化や危険を3つまで、15字以内の短文で列挙してください。変化がない場合は「変化なし」と回答してください。
例: '1. 人物が立ち上がる 2. 左側から車が接近 3. 信号が青に変わる'
画像内の人物や文字情報にも注目し、重要な情報があれば含めてください。
分析結果: ${JSON.stringify(analysisResult)}
`;
    case 'video':
      return basePrompt + `
動画の分析結果を基に、以下の点に焦点を当てて簡潔に説明してください：
1. 検出された主要なオブジェクトとその動き
2. 潜在的な障害物や危険要素
3. シーンの変化や重要なイベント
4. 前回の分析からの主な変更点（ある場合）
5. 人物の動きや表情の変化
6. 画面内に表示されるテキスト情報

回答は3-4の短い日本語の文で、シンプルで直接的な表現を使用してください。
例: '歩行者が右から左に移動しています。2メートル先に椅子があります。車が接近しているため注意が必要です。画面右上に「出口」の表示があります。'

分析結果: ${JSON.stringify(analysisResult)}
`;
    default:
      return basePrompt + `
画像または動画の内容を分析し、重要な要素を説明してください。
分析結果: ${JSON.stringify(analysisResult)}
`;
  }
}