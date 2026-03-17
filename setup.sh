#!/usr/bin/env bash
# =============================================================================
# setup.sh — Document Viewer 의존성 검사 및 초기 설정
# =============================================================================

set -euo pipefail

# ── 색상 출력 헬퍼 ─────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()      { echo -e "${GREEN}[  OK]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[FAIL]${NC}  $*"; }
section() { echo -e "\n${BOLD}${BLUE}▶ $*${NC}"; }

PASS=0; FAIL=0
check_ok()  { ok "$1";  PASS=$(( PASS + 1 )); }
check_err() { error "$1"; FAIL=$(( FAIL + 1 )); }

# ── 프로젝트 루트 (스크립트 위치 기준) ────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}   Document Viewer — Setup & Dependency Check${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
info "프로젝트 경로: $PROJECT_DIR"

# =============================================================================
# 1. 필수 의존성 — Python 3
# =============================================================================
section "1. Python 3 (HTTP 서버)"

if command -v python3 &>/dev/null; then
    PY_VER=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')
    PY_MAJOR=$(python3 -c 'import sys; print(sys.version_info.major)')
    PY_MINOR=$(python3 -c 'import sys; print(sys.version_info.minor)')

    if [[ $PY_MAJOR -ge 3 && $PY_MINOR -ge 6 ]]; then
        check_ok "Python $PY_VER 설치됨 (≥3.6 필요)"
    else
        check_err "Python $PY_VER — 3.6 이상 필요"
    fi

    # http.server 모듈 확인
    if python3 -c "import http.server" 2>/dev/null; then
        check_ok "http.server 모듈 사용 가능"
    else
        check_err "http.server 모듈 없음 (Python 표준 라이브러리 이상)"
    fi
else
    check_err "python3 명령어를 찾을 수 없음"
    error "  설치: sudo apt install python3"
fi

# =============================================================================
# 2. Node.js / npm (선택 — 향후 빌드 도구 추가 대비)
# =============================================================================
section "2. Node.js / npm (선택적)"

if command -v node &>/dev/null; then
    NODE_VER=$(node --version)
    NODE_MAJOR=$(node --version | tr -d 'v' | cut -d. -f1)
    if [[ $NODE_MAJOR -ge 16 ]]; then
        check_ok "Node.js $NODE_VER 설치됨"
    else
        warn "Node.js $NODE_VER — v16 이상 권장 (현재 기능에는 무관)"
    fi
else
    warn "Node.js 미설치 — 현재 프로젝트(Vanilla JS)에는 불필요"
    warn "  설치: https://nodejs.org"
fi

if command -v npm &>/dev/null; then
    NPM_VER=$(npm --version)
    check_ok "npm $NPM_VER 설치됨"
else
    warn "npm 미설치"
fi

# =============================================================================
# 3. package.json 존재 시 npm install 실행
# =============================================================================
section "3. npm 패키지 (package.json 확인)"

PACKAGE_JSON="$PROJECT_DIR/package.json"
if [[ -f "$PACKAGE_JSON" ]]; then
    ok "package.json 감지됨"
    if command -v npm &>/dev/null; then
        # node_modules 최신 상태 확인
        if [[ ! -d "$PROJECT_DIR/node_modules" ]]; then
            info "node_modules 없음 → npm install 실행 중..."
            npm install --prefix "$PROJECT_DIR" && check_ok "npm install 완료" || check_err "npm install 실패"
        else
            # package.json이 node_modules보다 최신인 경우 재설치
            if [[ "$PACKAGE_JSON" -nt "$PROJECT_DIR/node_modules" ]]; then
                info "package.json이 변경됨 → npm install 실행 중..."
                npm install --prefix "$PROJECT_DIR" && check_ok "npm install 완료 (업데이트)" || check_err "npm install 실패"
            else
                check_ok "node_modules 최신 상태"
            fi
        fi
    else
        check_err "npm 미설치로 npm install 불가"
    fi
else
    ok "package.json 없음 — Vanilla JS (빌드 불필요)"
fi

# =============================================================================
# 4. Playwright (테스트 선택적)
# =============================================================================
section "4. Playwright (통합 테스트)"

if python3 -c "from playwright.sync_api import sync_playwright" 2>/dev/null; then
    PW_VER=$(python3 -m playwright --version 2>/dev/null | awk '{print $2}')
    check_ok "playwright-python ${PW_VER} 설치됨"

    # Chromium 브라우저 바이너리 확인
    if python3 -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    try:
        b = p.chromium.launch(headless=True); b.close(); exit(0)
    except: exit(1)
" 2>/dev/null; then
        check_ok "Playwright Chromium 브라우저 사용 가능"
    else
        warn "Playwright Chromium 브라우저 없음 → 설치 중..."
        python3 -m playwright install chromium && check_ok "Chromium 설치 완료" || check_err "Chromium 설치 실패"
    fi
else
    warn "playwright-python 미설치 — 테스트 실행 불가"
    warn "  설치: pip install playwright && python3 -m playwright install chromium"
fi

# =============================================================================
# 5. 브라우저 (뷰어 실행용)
# =============================================================================
section "5. 브라우저"

BROWSER_FOUND=false
for browser in google-chrome chromium-browser chromium firefox; do
    if command -v "$browser" &>/dev/null; then
        BROWSER_BIN=$(command -v "$browser")
        check_ok "브라우저: $browser  ($BROWSER_BIN)"
        BROWSER_FOUND=true
        break
    fi
done
if ! $BROWSER_FOUND; then
    warn "실행 가능한 브라우저를 찾지 못했습니다. 수동으로 브라우저를 열어주세요."
fi

# =============================================================================
# 6. 필수 프로젝트 파일 구조 확인
# =============================================================================
section "6. 프로젝트 파일 무결성"

REQUIRED_FILES=(
    "index.html"
    "styles/base.css"
    "styles/layout.css"
    "styles/components.css"
    "styles/viewer.css"
    "styles/themes/light.css"
    "styles/themes/dark.css"
    "js/app.js"
    "js/state.js"
    "js/config/formats.js"
    "js/utils/eventBus.js"
    "js/utils/fileUtils.js"
    "js/utils/domUtils.js"
    "js/renderers/BaseRenderer.js"
    "js/renderers/MarkdownRenderer.js"
    "js/renderers/HtmlRenderer.js"
    "js/renderers/DocxRenderer.js"
    "js/renderers/PdfRenderer.js"
    "js/renderers/TextRenderer.js"
    "js/renderers/MermaidRenderer.js"
    "js/components/DropZone.js"
    "js/components/PastePanel.js"
    "js/components/FormatSelector.js"
    "js/components/ViewerPanel.js"
    "js/components/Toolbar.js"
    "js/components/Toast.js"
    "js/validators/FormatValidator.js"
)

MISSING_FILES=()
for f in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$PROJECT_DIR/$f" ]]; then
        MISSING_FILES+=("$f")
    fi
done

if [[ ${#MISSING_FILES[@]} -eq 0 ]]; then
    check_ok "필수 파일 ${#REQUIRED_FILES[@]}개 모두 존재"
else
    check_err "${#MISSING_FILES[@]}개 파일 누락:"
    for f in "${MISSING_FILES[@]}"; do
        error "    missing: $f"
    done
fi

# =============================================================================
# 7. 포트 충돌 확인
# =============================================================================
section "7. 포트 3000 상태"

if lsof -ti:3000 &>/dev/null 2>&1 || ss -tlnp 2>/dev/null | grep -q ':3000 '; then
    PID=$(lsof -ti:3000 2>/dev/null | head -1)
    warn "포트 3000이 이미 사용 중 (PID: ${PID:-unknown})"
    warn "  start.sh 실행 시 자동으로 처리됩니다"
else
    check_ok "포트 3000 사용 가능"
fi

# =============================================================================
# 최종 결과
# =============================================================================
echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
TOTAL=$((PASS + FAIL))
if [[ $FAIL -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}  ✅ 모든 체크 통과 ($PASS/$TOTAL)${NC}"
    echo -e "${NC}  실행: ${CYAN}dv-start${NC}  또는  ${CYAN}bash $PROJECT_DIR/start.sh${NC}"
else
    echo -e "${RED}${BOLD}  ⚠️  $FAIL개 항목 실패 ($PASS/$TOTAL 통과)${NC}"
    echo -e "  위 FAIL 항목을 해결한 후 다시 실행하세요."
fi
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

exit $FAIL
