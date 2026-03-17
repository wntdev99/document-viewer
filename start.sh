#!/usr/bin/env bash
# =============================================================================
# start.sh — Document Viewer 로컬 서버 시작
# =============================================================================

set -euo pipefail

# ── 색상 출력 헬퍼 ─────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[  OK]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

# ── 설정 ───────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
PORT="${DV_PORT:-3000}"         # 환경변수로 포트 오버라이드 가능
URL="http://localhost:$PORT"
OPEN_BROWSER="${DV_OPEN_BROWSER:-true}"

# Ctrl+C 트랩 — 서버 종료 메시지 출력
cleanup() {
    echo -e "\n${YELLOW}서버가 종료되었습니다.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# =============================================================================
# 1. Python3 필수 확인
# =============================================================================
if ! command -v python3 &>/dev/null; then
    error "python3가 설치되어 있지 않습니다.\n  설치: sudo apt install python3"
fi

PY_MAJOR=$(python3 -c 'import sys; print(sys.version_info.major)')
PY_MINOR=$(python3 -c 'import sys; print(sys.version_info.minor)')
if [[ $PY_MAJOR -lt 3 || ($PY_MAJOR -eq 3 && $PY_MINOR -lt 6) ]]; then
    error "Python 3.6 이상이 필요합니다. (현재: $(python3 --version))"
fi

# =============================================================================
# 2. index.html 존재 확인
# =============================================================================
if [[ ! -f "$PROJECT_DIR/index.html" ]]; then
    error "index.html이 없습니다. setup.sh를 먼저 실행하세요:\n  bash $PROJECT_DIR/setup.sh"
fi

# =============================================================================
# 3. package.json 있으면 node_modules 자동 설치
# =============================================================================
if [[ -f "$PROJECT_DIR/package.json" ]]; then
    if [[ ! -d "$PROJECT_DIR/node_modules" ]]; then
        warn "node_modules 없음 → npm install 실행 중..."
        if command -v npm &>/dev/null; then
            npm install --prefix "$PROJECT_DIR" --silent \
                && ok "npm install 완료" \
                || error "npm install 실패"
        else
            error "npm이 설치되어 있지 않아 의존성 설치 불가"
        fi
    fi
fi

# =============================================================================
# 4. 포트 충돌 처리
# =============================================================================
PORT_PIDS=$(lsof -ti:"$PORT" 2>/dev/null || true)
if [[ -n "$PORT_PIDS" ]]; then
    warn "포트 $PORT 가 사용 중입니다 (PID: $PORT_PIDS)"
    echo -ne "  기존 프로세스를 종료하시겠습니까? [Y/n] "
    read -r REPLY
    REPLY="${REPLY:-Y}"
    if [[ "$REPLY" =~ ^[Yy]$ ]]; then
        echo "$PORT_PIDS" | xargs kill -9 2>/dev/null && ok "기존 프로세스 종료 완료"
        sleep 0.5
    else
        error "포트 $PORT 충돌로 서버를 시작할 수 없습니다."
    fi
fi

# =============================================================================
# 5. 브라우저 자동 열기
# =============================================================================
open_browser() {
    local url="$1"
    sleep 1  # 서버 기동 대기
    for browser in xdg-open google-chrome chromium-browser chromium firefox; do
        if command -v "$browser" &>/dev/null; then
            "$browser" "$url" &>/dev/null &
            return 0
        fi
    done
    warn "브라우저를 자동으로 열 수 없습니다. 직접 접속하세요: $url"
}

# =============================================================================
# 6. 서버 시작
# =============================================================================
echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}   Document Viewer${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}▶ 서버 주소:${NC}  ${BOLD}${CYAN}$URL${NC}"
echo -e "  ${GREEN}▶ 프로젝트:${NC}   $PROJECT_DIR"
echo -e "  ${GREEN}▶ Python:${NC}     $(python3 --version)"
echo -e "  ${YELLOW}  종료: Ctrl+C${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# 브라우저 자동 열기 (백그라운드)
if [[ "$OPEN_BROWSER" == "true" ]]; then
    open_browser "$URL" &
fi

# HTTP 서버 시작 (포어그라운드)
cd "$PROJECT_DIR"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
