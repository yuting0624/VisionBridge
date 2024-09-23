const { VertexAI } = require('@google-cloud/vertexai');
const cors = require('cors')({origin: true});

const projectId = process.env.GCP_PROJECT_ID;
const location = 'asia-southeast1'; 
const model = 'gemini-1.5-flash-001';

if (!projectId) {
  throw new Error('GCP_PROJECT_ID environment variable is not set');
}

function createPromptForMode(mode, previousAnalysis) {
  const basePrompt = `前回の分析: "${previousAnalysis || '初回分析'}"\n\n`;
  
 const commonInstructions = `
あなたは視覚障害者のための視覚サポートAIアシスタントです。以下の指示に従って、与えられた画像を分析し、簡潔で明確な音声フィードバックを生成してください。

- 最も重要な情報（安全性、移動に関わる要素）を最優先で伝えてください。（例：交通信号、通行人、車両）。
- 環境の変化や新たに検出された物体に焦点を当て、前回分析との違いを明確にしてください。（例：信号が青から赤に変わった）。
- 位置情報を含め、ユーザーの空間認識を助ける具体的な表現を使用してください。（例：「2メートル先」「右手前」）。
- 各情報は15字以内の短文で伝えてください。
- 危険な状況や障害物を特に強調してください。
- 人物、テキスト、標識などの重要な視覚情報も含めてください。
- ハルシネーション（虚偽の情報）は絶対にしないでください。

**回答形式**:

- 重要度順に最大で3項目を箇条書きで出力してください。
- 各項目は15字以内の自然な日本語で記述してください。

**例**:
右2メートルに人物接近中。
左から自転車が接近中です。
信号が青から赤に変わった。とまってください。
前方障害物あり、注意してください。'
input: 夜の街の写真。信号機と交差点などが写っています
output: 右手前、信号赤色です。
交差点に近づいています。
前方に横断歩道があります。

上記の指示に従って、、音声フィードバックを生成してください。重要度順に箇条書きで出力してください。
`;

 switch (mode) {
    case 'normal':
      return basePrompt + commonInstructions;
    case 'detailed':
      return basePrompt + `
あなたは視覚障害者のための詳細な視覚サポートAIアシスタントです。ユーザーが特別に撮影した画像について、以下の指示に従って詳細な分析と説明を提供してください：

- 画像の全体的な構図と主要な要素を説明してください。
- 人物が写っている場合、その人数、位置、姿勢、表情、服装を述べてください。
- 物体や背景の色、形、テクスチャーなどの視覚的特徴を説明してください。
- 画像内のテキストや標識があれば、その内容と位置を正確に伝えてください。
- ハルシネーション（虚偽の情報）はしないでください。
- 安全性に関わる要素（障害物、危険な状況など）を特に強調してください。
- 空間的な関係性や距離感についても具体的に述べてください。
- 文字が検出された場合は、その意味を日本語で教えてください。

**回答形式**:

- 重要度順に最大で3項目を箇条書きで出力してください。
- 各項目は20字以内の自然な日本語で記述してください。

**例**:
男性が白いスプレーボトルがあります。- スプレーボトルには「Avène」と「Eau Thermale」の文字があります。日本語にするとアベンヌ温泉水という意味です。

上記の指示に従って、与えられた画像を分析し、音声フィードバックを生成してください。
`;
    default:
     return basePrompt + commonInstructions;
  }
}

exports.analyzeImage = (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { imageData, analysisMode, previousAnalysis } = req.body;

      const vertexAi = new VertexAI({
        project: projectId,
        location: location,
      });

      const generativeModel = vertexAi.preview.getGenerativeModel({
        model: model,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 1,
          topP: 0.95,
        },
        safetySettings: [
          {
            'category': 'HARM_CATEGORY_HATE_SPEECH',
            'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
            'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            'category': 'HARM_CATEGORY_HARASSMENT',
            'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ],
      });

      const prompt = createPromptForMode(analysisMode, previousAnalysis);

      const result = await generativeModel.generateContent({
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }] },
        ],
      });

      const response = await result.response;
      const generatedText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No text generated';

      res.status(200).json({ analysis: generatedText });
    } catch (error) {
      console.error('Error analyzing image with Vertex AI Gemini:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: 'Image analysis failed', details: errorMessage });
    }
  });
};