import { speakText } from './speechSynthesis';

export function provideNavigation(analysis: string) {
  const obstacles = extractObstacles(analysis);
  const directions = generateDirections(obstacles);
  speakText(directions);
}

function extractObstacles(analysis: string): string[] {
  // 簡単な例: "障害物"という単語の後に来る名詞を抽出
  const obstacleRegex = /障害物[：:]\s*([^\。]+)/g;
  const matches = [...analysis.matchAll(obstacleRegex)];
  return matches.map(match => match[1]);
}

function generateDirections(obstacles: string[]): string {
  if (obstacles.length === 0) {
    return "前方に障害物はありません。安全に進むことができます。";
  }

  let directions = "注意: ";
  obstacles.forEach((obstacle, index) => {
    directions += `${obstacle}があります。`;
    if (index < obstacles.length - 1) {
      directions += "また、";
    }
  });
  directions += "慎重に進んでください。";

  return directions;
}