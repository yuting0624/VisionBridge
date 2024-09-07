export async function analyzeImageWithAI(data: string | Blob, analysisMode: AnalysisMode, previousAnalysis: string | null) {
  try {
    let result;
    if (analysisMode === 'video') {
      if (!(data instanceof Blob)) {
        console.error('Received data type:', typeof data);
        throw new Error(`動画データはBlobである必要があります。受け取ったデータ型: ${typeof data}`);
      }
      
      // Blobをbase64エンコードされた文字列に変換
      const base64data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(data);
      });
      
      console.log('Sending video data of length:', base64data.length);

      const response = await fetch(process.env.NEXT_PUBLIC_ANALYZE_VIDEO_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoData: base64data }),
        credentials: 'include', 
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error response body:', errorBody);
        throw new Error(`動画分析に失敗しました: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      const { analysis } = await response.json();
      result = analysis;
    } else {
      const prompt = createPromptForMode(analysisMode, null, previousAnalysis);
      const response = await fetch(process.env.NEXT_PUBLIC_ANALYZE_IMAGE_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: data, prompt, previousAnalysis }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`画像分析に失敗しました: ${response.status} ${response.statusText} - ${errorText}`);
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

export type AnalysisMode = 'normal' | 'video' | 'detailed';

function createPromptForMode(mode: AnalysisMode, analysisResult: any, previousAnalysis: string | null): string {
  const basePrompt = `前回の分析: "${previousAnalysis || '初回分析'}"\n\n`;
  
  const commonInstructions = `
1. 最も重要な情報（安全性、移動に関わる要素）を最優先で伝えてください。
2. 環境の変化や新たに検出された物体に焦点を当て、前回との違いを明確にしてください。
3. 位置情報を含め、ユーザーの空間認識を助ける具体的な表現を使用してください（例：「2メートル先」「右手前」）。
4. 各情報は15字以内の短文で伝えてください。
5. 危険な状況や障害物を特に強調してください。
6. 変化がない場合は、「変化なし」と報告してください。
7. 人物、テキスト、標識などの重要な視覚情報も含めてください。
8. 安全に関わるため、ハルシネーションは絶対にしないでください。
`;

  switch (mode) {
    case 'normal':
      return basePrompt + `
あなたは視覚障害者のための視覚サポートAIアシスタントです。以下の指示に従って、画像分析結果を簡潔で明確な音声フィードバックに変換してください：
${commonInstructions}
例:
'前方に階段、5段。
右2メートルに人物接近中。
左手に手すりあり。
出口サイン、真上3メートル。'

分析結果: ${JSON.stringify(analysisResult)}
上記の分析結果を基に、視覚障害者向けの音声フィードバックを生成してください。重要度順に箇条書きで出力してください。
`;
    case 'video':
      return basePrompt + `
動画の分析結果を基に、以下の点に焦点を当てて簡潔に説明してください：
${commonInstructions}
8. 動きのある物体の方向と速度を具体的に説明してください。
9. シーンの急激な変化や重要なイベントを即座に報告してください。

例:
'歩行者が右から左へ急ぎ足。
2メートル先、椅子に注意。
車が後方から接近中、要注意。
画面右上、出口サイン点滅。'

分析結果: ${JSON.stringify(analysisResult)}
上記の分析結果を基に、視覚障害者向けのリアルタイム音声フィードバックを生成してください。重要度順に箇条書きで出力してください。
`;
    case 'detailed':
      return basePrompt + `
あなたは視覚障害者のための詳細な視覚サポートAIアシスタントです。ユーザーが特別に要求した画像について、以下の指示に従って詳細な分析と説明を提供してください：

1. 画像の全体的な構図と主要な要素を説明してください。
2. 人物が写っている場合、その人数、位置、姿勢、表情、服装などを述べてください。
3. 物体や背景の色、形、テクスチャなどの視覚的特徴を説明してください。
4. 画像内のテキストや標識があれば、その内容と位置を正確に伝えてください。
5. ハルシネーションはしないでください。
6. 安全性に関わる要素（障害物、危険な状況など）があれば、特に強調して説明してください。
7. 空間的な関係性や距離感についても、できるだけ具体的に述べてください。

回答は、重要度順に最大で4項目を伝えてください。各項目を20字以内で簡潔かつわかりやすい自然な日本語で説明してください。

分析結果: ${JSON.stringify(analysisResult)}
上記の分析結果を基に、視覚障害者向けの詳細な音声フィードバックを生成してください。
`;
    default:
      return basePrompt + `
画像または動画の内容を分析し、視覚障害者にとって最も重要な要素を簡潔に説明してください。
${commonInstructions}
分析結果: ${JSON.stringify(analysisResult)}
上記の分析結果を基に、視覚障害者向けの音声フィードバックを生成してください。重要度順に箇条書きで出力してください。
`;
  }
  
}