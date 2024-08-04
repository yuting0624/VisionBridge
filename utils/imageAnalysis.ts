export async function analyzeImageWithGemini(imageData: string, analysisMode: string, previousAnalysis: string | null) {
  try {
    let prompt;
    let visionResult = null;

    if (analysisMode !== 'normal') {
      // Vision APIを使用して画像を分析（Normal モード以外）
      const visionResponse = await fetch('/api/analyzeImageWithVision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData, mode: analysisMode }),
      });

      if (!visionResponse.ok) {
        throw new Error(`HTTP error! status: ${visionResponse.status}`);
      }

      visionResult = await visionResponse.json();
    }

    // Gemini APIを使用して結果を解釈
    prompt = createPromptForMode(analysisMode, visionResult, previousAnalysis);
    const geminiResponse = await fetch('/api/analyzeImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, imageData, previousAnalysis }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`HTTP error! status: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    return data.analysis;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}

function createPromptForMode(mode: string, visionResult: any, previousAnalysis: string | null): string {
  switch (mode) {
    case 'normal':
      if (previousAnalysis === null) {
        return `
現在の画像の主要な要素、潜在的な障害物、危険要素を簡潔に説明してください。回答は2-3の短い日本語の文で、シンプルで直接的な表現を使用してください。
例: '前方1メートルに椅子があります。右に曲がってください。' '床にコードがあり、つまずく可能性があります。注意してください。'
`;
      }
      return `
前回の分析: "${previousAnalysis || '初回分析'}"

現在の画像で新たに発生した変化や危険を3つまで、15字以内の短文で列挙してください。変化がない場合は「変化なし」と回答してください。例：
1. 人物が立ち上がる
2. 左側から車が接近
3. 信号が青に変わる
`;
    case 'person':
      return `画像内の人物に焦点を当てて、表情、推定年齢、服装などの詳細を説明してください。前回の分析との変化がある場合は、その変化も述べてください：${JSON.stringify(visionResult)}`;
    case 'text':
      return `画像内のテキストを読み上げ、その内容と位置を説明してください。前回と比較して新しく現れたテキストや変更点があれば、それらに焦点を当ててください：${JSON.stringify(visionResult)}`;
    default:
      return `画像の内容を分析し、重要な要素を説明してください：${JSON.stringify(visionResult)}`;
  }
}