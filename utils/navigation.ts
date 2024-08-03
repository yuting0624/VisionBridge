import { speakText } from './speechSynthesis';

interface Obstacle {
  type: string;
  direction?: string;
  distance?: string;
}

export function extractObstacles(analysis: string): Obstacle[] {
  const obstacleRegex = /(\w+)が(左|右|前|後ろ|[0-9]+メートル先)に/g;
  const matches = [...analysis.matchAll(obstacleRegex)];
  return matches.map(match => ({
    type: match[1],
    direction: match[2],
    distance: match[2].includes('メートル') ? match[2] : undefined
  }));
}

export function generateDirections(obstacles: Obstacle[]): string {
  if (obstacles.length === 0) {
    return "周囲に障害物は見当たりません。安全に進むことができます。";
  }

  let directions = "注意: ";
  obstacles.forEach((obstacle, index) => {
    directions += `${obstacle.direction}に${obstacle.type}があります`;
    if (obstacle.distance) {
      directions += `（${obstacle.distance}）`;
    }
    if (index < obstacles.length - 1) {
      directions += "。また、";
    }
  });
  directions += "。慎重に進んでください。";

  return directions;
}

export function provideNavigation(analysis: string) {
  const obstacles = extractObstacles(analysis);
  const directions = generateDirections(obstacles);
  speakText(directions);
  return directions;
}

// モックの位置情報を使用（実際の実装ではGeolocation APIを使用）
let currentPosition = { lat: 35.6895, lng: 139.6917 }; // 東京駅の座標

export function updateCurrentPosition(lat: number, lng: number) {
  currentPosition = { lat, lng };
}

export function getNearbyPlaces(): string {
  // この関数は実際にはGoogle Maps APIなどを使用して近くの場所を取得します
  // ここではモックデータを返します
  return "100メートル先に横断歩道、200メートル先にコンビニエンスストアがあります。";
}

export function provideDetailedNavigation(analysis: string) {
  const obstacleInfo = provideNavigation(analysis);
  const nearbyPlaces = getNearbyPlaces();
  const fullNavigation = `${obstacleInfo} ${nearbyPlaces}`;
  speakText(fullNavigation);
  return fullNavigation;
}