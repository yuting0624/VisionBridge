import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.io.gcp.pubsub import ReadFromPubSub, WriteToPubSub
from google.cloud import videointelligence_v1 as videointelligence
from google.cloud import aiplatform
import json
import time
from google.api_core import retry
import google.api_core.exceptions
import asyncio

class AnalyzeVideo(beam.DoFn):
    def __init__(self):
        self.buffer = []
        self.last_process_time = time.time()
        self.buffer_size = 10  # バッファサイズ
        self.process_interval = 60  # 処理間隔（秒）

    def setup(self):
        self.video_client = videointelligence.VideoIntelligenceServiceClient()
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)

    @retry.Retry(predicate=retry.if_exception_type(google.api_core.exceptions.ResourceExhausted))
    async def process_video_async(self, video):
        features = [videointelligence.Feature.OBJECT_TRACKING, videointelligence.Feature.PERSON_DETECTION]
        operation = self.video_client.annotate_video(request={"features": features, "input_content": video})
        return await operation.result(timeout=120)

    async def process_videos_async(self, videos):
        tasks = [self.process_video_async(video) for video in videos]
        return await asyncio.gather(*tasks, return_exceptions=True)

    def process(self, element):
        from google.cloud import aiplatform
        aiplatform.init(project='visionbridge', location='asia-northeast1')

        self.buffer.append(element)

        current_time = time.time()
        if len(self.buffer) >= self.buffer_size or (current_time - self.last_process_time) >= self.process_interval:
            results = self.loop.run_until_complete(self.process_videos_async(self.buffer))
            processed_results = []

            for result in results:
                if isinstance(result, Exception):
                    print(f"Error processing video: {result}")
                    continue

                objects = []
                for annotation in result.annotation_results[0].object_annotations:
                    objects.append({
                        'entity': annotation.entity.description,
                        'confidence': annotation.confidence,
                        'frames': [
                            {
                                'time_offset': frame.time_offset.total_seconds(),
                                'normalized_bounding_box': {
                                    'left': frame.normalized_bounding_box.left,
                                    'top': frame.normalized_bounding_box.top,
                                    'right': frame.normalized_bounding_box.right,
                                    'bottom': frame.normalized_bounding_box.bottom
                                }
                            } for frame in annotation.frames
                        ]
                    })
                processed_results.append(objects)

            if processed_results:
                prompt = self.create_prompt_for_video(processed_results)
                model = aiplatform.TextGenerationModel.from_pretrained("gemini-1.5-flash-001")
                response = model.predict(prompt, max_output_tokens=1024, temperature=0.2)
                self.buffer = []
                self.last_process_time = current_time
                return [json.dumps(response.text)]

        return []

    def create_prompt_for_video(self, objects):
        return f"""あなたは視覚障害者のための視覚サポートAIアシスタントです。以下の動画分析結果を簡潔で明確な音声フィードバックに変換してください：

1. 最も重要な情報（安全性、移動に関わる要素）を最優先で伝えてください。
2. 検出されたオブジェクトの位置関係や動きを説明し、ユーザーの空間認識を助けてください。
3. 各情報は15字以内の短文で伝えてください。
4. 危険な状況や障害物を特に強調してください。
5. 人物、テキスト、標識などの重要な視覚情報も含めてください。
6. 動きのある物体の方向と速度を具体的に説明してください。
7. シーンの急激な変化や重要なイベントを即座に報告してください。

検出されたオブジェクト：
{json.dumps(objects, indent=2)}

上記の指示に従って、与えられた動画分析結果を視覚障害者向けのリアルタイム音声フィードバックに変換してください。重要度順に箇条書きで出力してください。"""

def run(argv=None):
    pipeline_options = PipelineOptions(argv, streaming=True, save_main_session=True)
    p = beam.Pipeline(options=pipeline_options)

    (p
     | 'Read from PubSub' >> ReadFromPubSub(subscription='projects/visionbridge/subscriptions/visionbridge-video-stream-sub')
     | 'Analyze Video' >> beam.ParDo(AnalyzeVideo())
     | 'Write to PubSub' >> WriteToPubSub(topic='projects/visionbridge/topics/visionbridge-video-analysis-results')
    )

    result = p.run()
    result.wait_until_finish()

if __name__ == '__main__':
    run()