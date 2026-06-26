import { Team } from '../domain/Models';

/**
 * 2026 월드컵 본선 48개국 레퍼런스 데이터.
 * worldcup2026 API 의 team_id(문자열) 를 키로, 한글/영문명·국기·조를 보유한다.
 * (API 는 영어/페르시아어 국가명만 제공하므로 한글명은 여기서 자체 매핑한다.)
 */
export const TEAMS: Team[] = [
  // Group A
  { id: '1', code: 'MEX', nameKo: '멕시코', nameEn: 'Mexico', flag: '🇲🇽', group: 'A' },
  { id: '2', code: 'RSA', nameKo: '남아프리카공화국', nameEn: 'South Africa', flag: '🇿🇦', group: 'A' },
  { id: '3', code: 'KOR', nameKo: '대한민국', nameEn: 'South Korea', flag: '🇰🇷', group: 'A' },
  { id: '4', code: 'CZE', nameKo: '체코', nameEn: 'Czech Republic', flag: '🇨🇿', group: 'A' },
  // Group B
  { id: '5', code: 'CAN', nameKo: '캐나다', nameEn: 'Canada', flag: '🇨🇦', group: 'B' },
  { id: '6', code: 'BIH', nameKo: '보스니아 헤르체고비나', nameEn: 'Bosnia and Herzegovina', flag: '🇧🇦', group: 'B' },
  { id: '7', code: 'QAT', nameKo: '카타르', nameEn: 'Qatar', flag: '🇶🇦', group: 'B' },
  { id: '8', code: 'SUI', nameKo: '스위스', nameEn: 'Switzerland', flag: '🇨🇭', group: 'B' },
  // Group C
  { id: '9', code: 'BRA', nameKo: '브라질', nameEn: 'Brazil', flag: '🇧🇷', group: 'C' },
  { id: '10', code: 'MAR', nameKo: '모로코', nameEn: 'Morocco', flag: '🇲🇦', group: 'C' },
  { id: '11', code: 'HAI', nameKo: '아이티', nameEn: 'Haiti', flag: '🇭🇹', group: 'C' },
  { id: '12', code: 'SCO', nameKo: '스코틀랜드', nameEn: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },
  // Group D
  { id: '13', code: 'USA', nameKo: '미국', nameEn: 'United States', flag: '🇺🇸', group: 'D' },
  { id: '14', code: 'PAR', nameKo: '파라과이', nameEn: 'Paraguay', flag: '🇵🇾', group: 'D' },
  { id: '15', code: 'AUS', nameKo: '호주', nameEn: 'Australia', flag: '🇦🇺', group: 'D' },
  { id: '16', code: 'TUR', nameKo: '튀르키예', nameEn: 'Turkey', flag: '🇹🇷', group: 'D' },
  // Group E
  { id: '17', code: 'GER', nameKo: '독일', nameEn: 'Germany', flag: '🇩🇪', group: 'E' },
  { id: '18', code: 'CUW', nameKo: '쿠라소', nameEn: 'Curaçao', flag: '🇨🇼', group: 'E' },
  { id: '19', code: 'CIV', nameKo: '코트디부아르', nameEn: 'Ivory Coast', flag: '🇨🇮', group: 'E' },
  { id: '20', code: 'ECU', nameKo: '에콰도르', nameEn: 'Ecuador', flag: '🇪🇨', group: 'E' },
  // Group F
  { id: '21', code: 'NED', nameKo: '네덜란드', nameEn: 'Netherlands', flag: '🇳🇱', group: 'F' },
  { id: '22', code: 'JPN', nameKo: '일본', nameEn: 'Japan', flag: '🇯🇵', group: 'F' },
  { id: '23', code: 'SWE', nameKo: '스웨덴', nameEn: 'Sweden', flag: '🇸🇪', group: 'F' },
  { id: '24', code: 'TUN', nameKo: '튀니지', nameEn: 'Tunisia', flag: '🇹🇳', group: 'F' },
  // Group G
  { id: '25', code: 'BEL', nameKo: '벨기에', nameEn: 'Belgium', flag: '🇧🇪', group: 'G' },
  { id: '26', code: 'EGY', nameKo: '이집트', nameEn: 'Egypt', flag: '🇪🇬', group: 'G' },
  { id: '27', code: 'IRN', nameKo: '이란', nameEn: 'Iran', flag: '🇮🇷', group: 'G' },
  { id: '28', code: 'NZL', nameKo: '뉴질랜드', nameEn: 'New Zealand', flag: '🇳🇿', group: 'G' },
  // Group H
  { id: '29', code: 'ESP', nameKo: '스페인', nameEn: 'Spain', flag: '🇪🇸', group: 'H' },
  { id: '30', code: 'CPV', nameKo: '카보베르데', nameEn: 'Cape Verde', flag: '🇨🇻', group: 'H' },
  { id: '31', code: 'KSA', nameKo: '사우디아라비아', nameEn: 'Saudi Arabia', flag: '🇸🇦', group: 'H' },
  { id: '32', code: 'URU', nameKo: '우루과이', nameEn: 'Uruguay', flag: '🇺🇾', group: 'H' },
  // Group I
  { id: '33', code: 'FRA', nameKo: '프랑스', nameEn: 'France', flag: '🇫🇷', group: 'I' },
  { id: '34', code: 'SEN', nameKo: '세네갈', nameEn: 'Senegal', flag: '🇸🇳', group: 'I' },
  { id: '35', code: 'IRQ', nameKo: '이라크', nameEn: 'Iraq', flag: '🇮🇶', group: 'I' },
  { id: '36', code: 'NOR', nameKo: '노르웨이', nameEn: 'Norway', flag: '🇳🇴', group: 'I' },
  // Group J
  { id: '37', code: 'ARG', nameKo: '아르헨티나', nameEn: 'Argentina', flag: '🇦🇷', group: 'J' },
  { id: '38', code: 'ALG', nameKo: '알제리', nameEn: 'Algeria', flag: '🇩🇿', group: 'J' },
  { id: '39', code: 'AUT', nameKo: '오스트리아', nameEn: 'Austria', flag: '🇦🇹', group: 'J' },
  { id: '40', code: 'JOR', nameKo: '요르단', nameEn: 'Jordan', flag: '🇯🇴', group: 'J' },
  // Group K
  { id: '41', code: 'POR', nameKo: '포르투갈', nameEn: 'Portugal', flag: '🇵🇹', group: 'K' },
  { id: '42', code: 'COD', nameKo: '콩고민주공화국', nameEn: 'DR Congo', flag: '🇨🇩', group: 'K' },
  { id: '43', code: 'UZB', nameKo: '우즈베키스탄', nameEn: 'Uzbekistan', flag: '🇺🇿', group: 'K' },
  { id: '44', code: 'COL', nameKo: '콜롬비아', nameEn: 'Colombia', flag: '🇨🇴', group: 'K' },
  // Group L
  { id: '45', code: 'ENG', nameKo: '잉글랜드', nameEn: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
  { id: '46', code: 'CRO', nameKo: '크로아티아', nameEn: 'Croatia', flag: '🇭🇷', group: 'L' },
  { id: '47', code: 'GHA', nameKo: '가나', nameEn: 'Ghana', flag: '🇬🇭', group: 'L' },
  { id: '48', code: 'PAN', nameKo: '파나마', nameEn: 'Panama', flag: '🇵🇦', group: 'L' },
];

export const TEAM_BY_ID: Map<string, Team> = new Map(TEAMS.map((team) => [team.id, team]));
