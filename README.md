# Document Viewer

로컬에서 다양한 문서 형식을 바로 렌더링하는 **빌드 불필요** 웹 뷰어.
`python3 -m http.server` 하나로 즉시 실행됩니다.

---

## 지원 형식

| 형식 | 확장자 | 렌더러 | 특징 |
|------|--------|--------|------|
| **Markdown** | `.md` `.markdown` | marked.js | GFM · 코드 하이라이팅 · Mermaid 코드블록 자동 처리 |
| **HTML** | `.html` `.htm` | iframe sandbox | JS 실행 차단 · 다크 테마 자동 적용 |
| **DOCX** | `.docx` | mammoth.js | Word → HTML 변환 |
| **PDF** | `.pdf` | PDF.js | Canvas 렌더링 · 페이지 네비게이션 |
| **Plain Text** | `.txt` `.text` | 내장 | 줄 번호 표시 |
| **Mermaid** | `.mmd` | mermaid.js | 순수 다이어그램 파일 전용 |

---

## 빠른 시작

### 방법 1 — alias (권장)

```bash
# 최초 1회 설정
bash setup.sh
source ~/.bashrc

# 실행
dv
```

### 방법 2 — 직접 실행

```bash
bash start.sh
# → http://localhost:3000
```

### 방법 3 — 수동

```bash
python3 -m http.server 3000
# 브라우저에서 http://localhost:3000 접속
```

---

## 설치 및 alias 설정

```bash
git clone https://github.com/wntdev99/document-viewer.git
cd document-viewer

bash setup.sh        # 의존성 점검 + Playwright 브라우저 자동 설치
source ~/.bashrc     # alias 활성화
```

`setup.sh`가 `~/.bashrc`에 아래 alias를 자동 등록합니다.

| alias | 동작 |
|-------|------|
| `dv` | 서버 시작 (= `dv-start`) |
| `dv-start` | `start.sh` 실행 |
| `dv-setup` | `setup.sh` 실행 |

---

## 스크립트 상세

### `setup.sh` — 의존성 검사

```
▶ 1. Python 3 ≥ 3.6 + http.server 모듈
▶ 2. Node.js / npm (선택적, 향후 빌드 도구 대비)
▶ 3. package.json 존재 시 npm install 자동 실행 (변경 감지)
▶ 4. Playwright 설치 확인 + Chromium 브라우저 없으면 자동 설치
▶ 5. 시스템 브라우저 감지
▶ 6. 필수 소스 파일 27개 무결성 검사
▶ 7. 포트 3000 충돌 여부 확인
```

### `start.sh` — 서버 시작

- 사전 점검 (Python, index.html, npm deps)
- 포트 충돌 시 기존 프로세스 종료 선택 프롬프트
- 브라우저 자동 오픈 (`xdg-open` → `google-chrome` → `chromium` → `firefox`)
- **환경변수 오버라이드** 지원

```bash
DV_PORT=8080 dv-start              # 포트 변경
DV_OPEN_BROWSER=false dv-start     # 브라우저 자동 오픈 비활성화
```

---

## 주요 기능

### 파일 업로드 & 텍스트 붙여넣기

- 파일을 **드래그앤드롭** 하거나 클릭하여 업로드
- textarea에 텍스트를 직접 붙여넣고 **렌더링** 버튼 클릭
- `Ctrl+Enter` — 빠른 렌더링 단축키

### 형식 자동 감지

형식 선택을 **자동 감지**로 두면 내용을 분석하여 형식을 결정합니다.

| 형식 | 감지 신호 예시 |
|------|--------------|
| HTML | `<!DOCTYPE html>`, `<html>`, `<div>` 등 태그 |
| Mermaid | `graph TD`, `sequenceDiagram`, `flowchart` 등 키워드 |
| Markdown | `# 헤딩`, ` ``` `, `**bold**`, `[링크](url)` 등 |

### 형식 불일치 경고

선택한 형식과 감지된 형식이 다를 경우 Toast 경고를 표시합니다.

```
⚠️ Markdown 형식이 감지되었습니다. 현재 선택: HTML

  [ Markdown으로 렌더링 ]  [ HTML으로 계속 ]
```

### 테마 & 확대/축소

| 기능 | 방법 |
|------|------|
| 다크/라이트 토글 | 우상단 🌙 버튼 (설정 자동 저장) |
| 확대 | `Ctrl++` 또는 🔍+ 버튼 |
| 축소 | `Ctrl+-` 또는 🔍- 버튼 |
| 100% 초기화 | `Ctrl+0` 또는 ↺ 버튼 |
| 인쇄 | `Ctrl+P` 또는 🖨 버튼 |

---

## 아키텍처

### Strategy + Registry 패턴

새 형식 추가 시 **`js/config/formats.js` 하나만** 수정하면 나머지 UI/이벤트 코드는 변경 불필요 (OCP 원칙).

```
js/
├── app.js                  # 진입점 · 이벤트 오케스트레이터
├── state.js                # Observer 패턴 상태 관리
├── config/
│   └── formats.js          # 형식 레지스트리 ← 여기만 수정
├── renderers/
│   ├── BaseRenderer.js     # 추상 기반 클래스 + RendererFactory
│   ├── MarkdownRenderer.js
│   ├── HtmlRenderer.js
│   ├── DocxRenderer.js
│   ├── PdfRenderer.js
│   ├── TextRenderer.js
│   └── MermaidRenderer.js
├── validators/
│   ├── FormatValidator.js  # 신호 점수화 형식 감지
│   └── rules/              # htmlRules · markdownRules · mermaidRules
├── components/
│   ├── DropZone.js
│   ├── PastePanel.js
│   ├── FormatSelector.js
│   ├── ViewerPanel.js
│   ├── Toolbar.js
│   └── Toast.js
└── utils/
    ├── eventBus.js         # Pub/Sub 컴포넌트 통신
    ├── fileUtils.js
    └── domUtils.js
```

### 새 형식 추가 방법

**1단계** — `js/config/formats.js`에 항목 추가:

```js
export const FORMAT_REGISTRY = {
  // ... 기존 항목 ...
  rst: {
    id: 'rst',
    label: 'reStructuredText',
    extensions: ['.rst'],
    mimeTypes: ['text/x-rst'],
    binaryFormat: false,
    rendererClass: 'RstRenderer',
    validatorRules: 'rstRules',
  },
};
```

**2단계** — `js/renderers/RstRenderer.js` 작성:

```js
import { BaseRenderer } from './BaseRenderer.js';

export class RstRenderer extends BaseRenderer {
  async render(content) {
    this.clear();
    // 렌더링 로직 구현
  }
}
```

**3단계** — `js/app.js`에 등록:

```js
import { RstRenderer } from './renderers/RstRenderer.js';
RendererFactory.register('rst', RstRenderer);
```

**4단계** — `index.html`의 `<select>`에 옵션 추가 (텍스트 형식인 경우).

---

## CDN 라이브러리

빌드 없이 CDN으로 로드됩니다. 인터넷 연결 필요.

| 라이브러리 | 용도 | 버전 |
|-----------|------|------|
| [marked.js](https://marked.js.org) | Markdown → HTML 변환 | latest |
| [DOMPurify](https://github.com/cure53/DOMPurify) | XSS 방어 | 3.x |
| [highlight.js](https://highlightjs.org) | 코드 구문 하이라이팅 | 11.9 |
| [mermaid.js](https://mermaid.js.org) | 다이어그램 렌더링 | 10.x |
| [mammoth.js](https://github.com/mbeigi/mammoth.js) | DOCX → HTML 변환 | 1.x |
| [PDF.js](https://mozilla.github.io/pdf.js/) | PDF Canvas 렌더링 | 4.4 |

---

## 요구사항

| 항목 | 최소 버전 | 비고 |
|------|-----------|------|
| Python | 3.6+ | HTTP 서버 (`python3 -m http.server`) |
| 브라우저 | Chrome 90+ / Firefox 88+ | ES Modules 지원 필요 |
| Node.js | — | 현재 불필요 (향후 빌드 도구 추가 시) |
| 인터넷 | — | CDN 라이브러리 로드 필요 |

---

## 라이선스

MIT
