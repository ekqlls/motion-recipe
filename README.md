# motion-recipe
After Effects Expression Library

## 레시피 카드 정보

`expressions.json`의 기존 `name`, `category`, `description`, `code`, `guide`, 출처 필드는 유지합니다.

- `guide.property`: 코드 바로 위에 항상 표시할 정확한 적용 속성.
- `requiredEffects`: 먼저 적용할 효과의 이름과 필요한 이름 변경을 문자열 배열로 기록. 빈 배열은 효과 없음.
- `recommendedSettings`: 권장 시작값을 문자열 배열로 기록. 빈 배열은 별도 권장값 없음.
- `requirement`: `필수` 또는 `선택`. 카드가 설명하는 모션을 구현하는 기준이며, 연계 코드는 추가 연출 여부를 구분합니다.
- `cardGroup`: 같은 값을 가진 레시피를 한 카드로 표시. 첫 항목이 대표이며 모든 코드·안내는 개별 보존합니다. 각 항목의 이름·속성·효과로 검색해도 통합 카드가 표시됩니다.
- `copyLabel`: 개별 복사 버튼 이름. 생략하면 `코드 복사`.
- 기존 `group`: 다른 카드의 같은 세트 안내를 유지합니다. `cardGroup`이 있는 카드는 중복 세트 표시를 생략합니다.

Organic Wave는 Evolution이 필수이고 Amount는 선택입니다. Amount 코드를 쓰지 않을 때는 효과의 Amount를 12로 설정합니다. 권장값은 기존 안내의 시작값이며 이미지와 해상도에 맞게 조절하세요.

## 검증

Node.js 24에서 `node --test test/app.test.cjs`와 `node --check app.js`를 실행합니다. 테스트는 데이터 보존, 카드 통합, 검색/필터, 개별 복사와 실패 처리, 기존 연계 카드, 데이터 로딩 오류를 확인합니다. 간단한 DOM 대역을 사용하므로 실제 브라우저 레이아웃 및 After Effects 렌더링 검증은 별도입니다.
