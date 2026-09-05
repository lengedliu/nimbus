# Nimbus Vault Sync — 셀프 호스팅 지원 Obsidian 클라우드 동기화 & 지식 관리 플랫폼

[简体中文](README.md) | [English](README_en.md) | [繁體中文](README_zh-TW.md) | [日本語](README_ja.md) | [한국어](README_ko.md)

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](package.json)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-010101?style=flat&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![MCP](https://img.shields.io/badge/MCP-22_Tools-8A2BE2?style=flat&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Git Sync](https://img.shields.io/badge/Git-Auto_Backup-F05032?style=flat&logo=git&logoColor=white)](#-git-자동-백업--원격-동기화)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md)
[![Database](https://img.shields.io/badge/Database-JSON%20%7C%20SQLite%20%7C%20Postgres%20%7C%20MySQL-4479A1?style=flat&logo=sqlite&logoColor=white)](#-멀티-데이터베이스-엔진--온라인-무중단-마이그레이션)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![i18n](https://img.shields.io/badge/i18n-5_Languages-00C49F?style=flat)](#-기본-다국어-지원-i18n)
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=flat&logo=opensourceinitiative&logoColor=white)](LICENSE)

**Nimbus Vault Sync**는 가볍고 안전하며 강력한 기능을 갖춘 프라이빗 셀프 호스팅 Obsidian 지식베이스 클라우드 동기화 및 협업 관리 플랫폼입니다. 모바일과 데스크톱(iOS, Android, Mac, Windows, Linux, Web) 간 밀리초 단위 양방향 실시간 동기화뿐만 아니라, **22가지 표준 Model Context Protocol (MCP) AI 도구**, **네이티브 Git 자동 백업**, **D3 양방향 링크 지식 그래프**, **인터랙티브 칸반 보드**, **3-Way 시각적 충돌 해결 에디터** 및 **안전한 외부 링크 공유 기능**을 기본 제공합니다.

---

## 🌟 핵심 기능 및 아키텍처 강점

- ⚡ **WebSocket 기반 밀리초 단위 초고속 실시간 동기화**
  - 다중 기기 및 다중 Vault 간 실시간 브로드캐스팅, 파일 변경분 즉시 반영.
  - SHA-256 낙관적 동시성 제어(Optimistic Concurrency Control)로 오프라인 복귀 시 덮어쓰기 방지.
- 🤖 **22가지 핵심 MCP (Model Context Protocol) AI 도구 내장**
  - **StreamableHTTP** 프로토콜 네이티브 지원으로 **Cursor, Cherry Studio, Claude Desktop, Cline, Roo Code, VSCode** 등 다양한 AI 클라이언트에서 직접 연결.
  - AI가 직접 전체 텍스트 검색, 문서 읽기/쓰기/부분 수정(Patch), 데일리 로그 기록, 양방향 링크 및 태그 분석, 첨부파일 관리, 버전 롤백 및 Git 원격 동기화 수행.
- 🌿 **Git 자동 백업 & 원격 동기화**
  - GitHub, GitLab, Gitee 및 프라이빗 Git 저장소와 Vault를 직접 연동.
  - 파일 수정 시 디바운스(Debounce) 기반 자동 커밋 및 푸시, 사용자 정의 커밋 메시지 템플릿 및 브랜치 관리.
- 📊 **인터랙티브 칸반 보드 & Markdown 할 일 자동 스캔**
  - Vault별 독립 시각화 칸반 보드 제공 (드래그 앤 드롭 업무 관리).
  - Markdown 할 일 문법(`- [ ]` / `- [x]`)을 실시간 스캔하여 Web 대시보드에서 원클릭 완료 및 원본 문서 이동.
- 🕸️ **D3 인터랙티브 지식 그래프 (Knowledge Graph)**
  - D3.js 기반 2D 포스 다이렉티드 네트워크 그래프로 문서 연결망, 고립 노트, 중심도 가중치 및 태그 군집 시각화.
- 🔀 **시각적 3-Way 차이 비교 & 충돌 해결**
  - 오프라인 편집 충돌 시 `.conflict` 사본을 자동 보존하여 데이터 유실 원천 방지.
  - 웹 대시보드에서 라인 단위 3-Way 차이점 비교, 병합 에디터 및 원클릭 해결 정책 지원.
- 👥 **세분화된 RBAC 권한 & 협업 관리**
  - 소유자(Owner), 편집자(Editor), 조회자(Viewer) 역할 기반 권한 제어.
  - 기기 및 사용자별 독립 API 토큰 발급, 실시간 접속 감지 및 원격 연결 강제 해제.
- 📢 **멀티 플랫폼 Webhook 실시간 알림**
  - **Discord, Slack, Feishu / Lark, DingTalk, WeCom** 및 커스텀 Webhook 기본 연동.
  - 파일 삭제, 충돌 발생, 버전 복원, 백업 생성, 기기 로그인 등 주요 이벤트 실시간 알림.
- 🔗 **비밀번호 보호 지원 외부 링크 공유**
  - Markdown 노트를 독립 웹 뷰어로 원클릭 공유. 비밀번호 설정, 만료 기간 지정, 텍스트 복사 방지 기능 지원.
- 🕘 **전체 버전 히스토리 스냅샷 & 안전한 휴지통**
  - 저장할 때마다 과거 스냅샷을 자동 아카이빙하여 타임라인별 차이 확인 및 원클릭 복원.
  - 삭제 시 휴지통으로 안전하게 소프트 삭제(Soft Delete)되며 개별 복원 및 자동 정리 정책 지원.
- 🗄️ **멀티 데이터베이스 엔진 & 온라인 무중단 마이그레이션**
  - 설정이 필요 없는 순수 JSON 파일 스토리지와 **SQLite, PostgreSQL, MySQL** 완전 지원.
  - 웹 관리 콘솔에서 기존 데이터를 대상 데이터베이스로 무중단 원클릭 마이그레이션 가능.
- 🌍 **기본 다국어 지원 (i18n)**
  - **한국어, English, 简体中文, 繁體中文, 日本語** 5개 국어 완벽 지원 (실시간 전환 및 설정 유지).
- 📖 **인터랙티브 REST API 개발자 문서**
  - OpenAPI Spec 규격 지원. 현재 토큰과 Vault ID가 자동 삽입된 인터랙티브 cURL 테스터 웹 내장.

---

## 📁 디렉터리 구조

```
nimbus-vault-sync/
├── server.js                # 엔트리포인트: REST API + WebSocket Hub + MCP 엔드포인트 + 정적 파일 서빙
├── obsidian-plugin/         # 공식 규격 준수 Obsidian 양방향 동기화 플러그인
│   ├── manifest.json
│   ├── main.js
│   ├── styles.css
│   └── README.md
├── src/
│   ├── config.js            # 중앙 집중식 설정 (package.json / 환경변수에서 버전 및 설정 로드)
│   ├── db.js                # 멀티 데이터베이스 관리자 (JSON / SQLite / PostgreSQL / MySQL) & 마이그레이션
│   ├── mcp.js               # 22개 표준 MCP 도구 구현 & StreamableHTTP 핸들러
│   ├── wsHub.js             # WebSocket 실시간 동기화 브로드캐스트 허브
│   ├── storage.js           # 파일 I/O, 버전 스냅샷, 휴지통, 충돌 관리
│   ├── gitSync.js           # Git 자동 커밋 파이프라인 & 원격 저장소 동기화
│   ├── webhooks.js          # 멀티 플랫폼 Webhook 알림 스케줄러
│   ├── users.js             # 사용자 계정 관리 & RBAC 권한
│   ├── vaults.js            # Vault 메타데이터 관리 & 접근 권한 검증
│   ├── vaultMembers.js      # 다중 사용자 협업 멤버 & 권한 매트릭스
│   ├── devices.js           # 연결 기기 관리 & 토큰 무효화
│   ├── shares.js            # 암호화 외부 링크 공유 관리
│   ├── syncRules.js         # 동기화 필터링 규칙 (무시 패턴 및 확장자)
│   ├── health.js            # 디스크, 메모리, DB 실시간 헬스체크 프로브
│   └── routes/              # 모듈형 RESTful 라우팅 정의
├── public/                  # 모던 반응형 Web 대시보드 (빌드 단계 없는 초고속 순수 JS/CSS)
│   ├── index.html           # 메인 SPA 관리 콘솔
│   ├── share.html           # 외부 링크 노트 뷰어
│   ├── style.css            # 반응형 테마 시스템
│   ├── app.js               # 프론트엔드 상태 머신 & 인터랙션 로직
│   └── i18n.js              # 5개 국어 다국어 사전
└── data/                    # 영구 데이터 볼륨 (Vault, 설정, 스냅샷, 휴지통, 백업)
```

---

## 🚀 빠른 시작

### 방법 1: Node.js / Bun 로컬 실행

```bash
# 1. 저장소 복제
git clone https://github.com/your-org/nimbus-vault-sync.git
cd nimbus-vault-sync

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# 필요에 따라 PORT, JWT_SECRET 등 수정

# 4. 서버 실행
npm start
```

브라우저에서 **`http://localhost:3000`**에 접속하면 Web 관리 콘솔이 열립니다.  
최초 실행 시 계정이 없으면 안내에 따라 초기 관리자(Admin) 계정을 생성할 수 있습니다.

---

### 방법 2: Docker & Docker Compose 배포

#### Docker Compose 사용 (권장)

```bash
cp .env.example .env
docker compose up -d --build
```

#### 단일 Docker 컨테이너 사용

```bash
docker build -t nimbus-vault-sync .
docker run -d -p 3000:3000 \
  -e JWT_SECRET=your_super_strong_random_secret \
  -v $(pwd)/data:/app/data \
  --name nimbus-vault-sync nimbus-vault-sync
```

- **웹 대시보드**: `http://localhost:3000`
- **WebSocket 엔드포인트**: `ws://localhost:3000/ws`
- **MCP AI 엔드포인트**: `http://localhost:3000/api/mcp`
- **헬스체크 프로브**: `http://localhost:3000/api/health`

---

## 🔌 Obsidian 플러그인 설치 및 설정

1. Obsidian을 실행하고 **「설정」->「커뮤니티 플러그인」**에서 안전 모드를 비활성화합니다.
2. 본 저장소의 [`obsidian-plugin`](./obsidian-plugin) 폴더를 Vault의 플러그인 디렉터리에 복사합니다:  
   `.obsidian/plugins/nimbus-sync/`
3. 플러그인 목록을 새로고침하고 **Nimbus Sync**를 활성화합니다.
4. Nimbus Web 콘솔에 로그인한 뒤 **「설정 및 토큰」**에서 **「플러그인 설정 복사」**를 클릭합니다.
5. Obsidian 플러그인 설정창에 붙여넣으면 즉시 양방향 실시간 동기화가 시작됩니다.

---

## 🤖 Model Context Protocol (MCP) AI 연동

Nimbus는 **StreamableHTTP** 프로토콜을 기본 지원합니다. 복잡한 로컬 프로세스를 별도로 실행하지 않고 표준 HTTP POST로 직접 연결할 수 있습니다.

### 1. 클라이언트 설정 파일 (`mcp.json`)

Web 콘솔 왼쪽 사이드바의 **「🤖 AI / MCP」**를 클릭하여 대상 Vault를 선택하고 설정을 복사하세요:

```json
{
  "mcpServers": {
    "nimbus-vault-sync": {
      "url": "http://<서버_주소>:3000/api/mcp",
      "type": "http",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer <JWT_토큰>",
        "X-Default-Vault-Name": "My Vault"
      }
    }
  }
}
```

### 2. 기본 내장 22가지 표준 MCP 도구 목록

| 카테고리 | 도구명 | 매개변수 & 설명 | 주요 활용 시나리오 |
| :--- | :--- | :--- | :--- |
| **Vault & 통계** | `list_vaults` | 현재 사용자가 접근 가능한 모든 Vault 및 권한 조회 | Vault 현황 파악 및 전환 |
| | `get_vault_stats` | `vaultId?`: 문서 수, 첨부파일 수, Top 20 태그 및 수정 현황 | 지식베이스 전반 건강검진 |
| **검색 & 메타데이터** | `list_notes` | `folder?`, `extension?`, `sortBy?`, `sortOrder?`, `limit?` | 폴더별 구조화된 문서 탐색 |
| | `get_note_metadata` | `path`, `vaultId?`: 글자 수, Frontmatter, `[[링크]]`, 태그, 목차 추출 | 노트 구조 및 의미 분석 |
| **읽기/쓰기/패치** | `read_note` | `path`, `vaultId?`: 노트 원본 본문 읽기 | 노트 내용 조회 |
| | `write_note` | `path`, `content`, `baseHash?`, `vaultId?`: 노트 생성/덮어쓰기 (스냅샷 자동 보존 & 전체 전송) | AI 문서 작성 및 리팩터링 |
| | `append_note` | `path`, `content`, `heading?`, `withTimestamp?`: 문서 끝 또는 특정 제목 아래 추가 | 회의록 추가 및 메모 |
| | `prepend_note` | `path`, `content`, `withTimestamp?`: 맨 위에 삽입 (YAML 속성 보존) | 핵심 요약 및 상단 고정 |
| | `patch_note` | `path`, `search`, `replace`, `replaceAll?`: 특정 문자열 부분 치환 | 국소 영역 정밀 수정 |
| **첨부파일** | `upload_attachment` | `path`, `sourceUrl?`, `base64Data?`, `vaultId?`: URL 또는 Base64로 이미지/파일 저장 | 웹 이미지 저장 |
| | `get_attachment_base64` | `path`, `vaultId?`: 이미지/파일의 Base64 및 MIME 타입 반환 | 멀티모달 AI 이미지 분석 |
| **데일리 노트** | `get_daily_note` | `date?`, `folder?`, `createIfMissing?`: 당일 데일리 노트 조회 및 생성 | 일지/일기 조회 |
| | `append_daily_note`| `content`, `date?`, `folder?`, `heading?`, `withTimestamp?`: 생각 기록 추가 | 순간 아이디어 기록 |
| **전체 검색 & 태그** | `search_notes` | `query`, `folder?`, `limit?`, `useRegex?`, `caseSensitive?`: 줄 번호 포함 전체 검색 | 빠른 지식 검색 |
| | `list_tags` | `folder?`, `vaultId?`: 전체 태그 목록 및 사용 빈도 집계 | 태그 체계 정리 |
| **파일 관리 & 삭제** | `move_note` | `oldPath`, `newPath`, `overwrite?`: 노트 이동 및 이름 변경 | 폴더 구조 정리 |
| | `delete_note` | `path`, `vaultId?`: 휴지통으로 안전 삭제 (전체 기기 실시간 반영) | 불필요한 노트 정리 |
| **버전 히스토리** | `get_note_history` | `path`, `vaultId?`: 특정 문서의 과거 백업 스냅샷 목록 조회 | 변경 이력 확인 |
| | `read_history_version`| `versionId`, `vaultId?`: 과거 스냅샷의 원본 내용 확인 | 버전 비교 및 롤백 |
| **외부 링크 공유** | `create_share_link` | `path`, `title?`, `password?`, `expiresDays?`, `allowCopy?`: 웹 링크 생성 | 원클릭 문서 외부 공개 |
| **Git 원격 동기화** | `get_vault_git_status`| `vaultId?`: Git 브랜치, 미커밋 변경사항, 원격 동기화 상태 확인 | Git 상태 모니터링 |
| | `git_sync_vault` | `vaultId?`, `commitMessage?`, `pullFirst?`: Git 자동 커밋 및 원격 동기화 트리거 | AI를 통한 원격 자동 푸시 |

---

## 📊 솔루션 비교

| 기능 | **Nimbus Vault Sync** | **Obsidian 공식 Sync** | **fast-note-sync-service (Go)** |
| :--- | :---: | :---: | :---: |
| **셀프 호스팅 완벽 지원** | ✅ **100% 완전한 데이터 제어** | ❌ 상용 폐쇄형 클라우드 | ✅ 셀프 호스팅 지원 |
| **심층 MCP AI 연동** | ✅ **22가지 표준 도구 지원** | ❌ 없음 | ⚠️ 기본 읽기/간단 쓰기 |
| **기본 다국어 인터페이스** | ✅ **5개 국어 기본 지원** | ⚠️ 앱 클라이언트만 지원 | ❌ 단일 언어 |
| **Git 원격 자동 동기화** | ✅ **GitHub/GitLab 자동 연동** | ❌ 없음 | ❌ 없음 |
| **인터랙티브 D3 지식 그래프** | ✅ **웹 기반 2D 포스 그래프** | ⚠️ 데스크톱 클라이언트만 | ❌ 없음 |
| **칸반 보드 & Markdown 할 일** | ✅ **인터랙티브 칸반 & 할 일 검색** | ❌ 없음 | ❌ 없음 |
| **3-Way 시각적 충돌 병합** | ✅ **시각적 Diff & Merge 에디터** | ⚠️ 단순 버전 선택 | ⚠️ 충돌 사본만 보존 |
| **멀티 DB & 무중단 마이그레이션** | ✅ **JSON / SQLite / PG / MySQL** | ❌ 전용 포맷 | ⚠️ SQLite / PG / MySQL |
| **안전한 외부 링크 공유** | ✅ **비밀번호 + 만료일 + 복사방지** | ❌ 유료 Publish 필요 | ⚠️ 기본 공유 |
| **인터랙티브 API 개발자 문서** | ✅ **cURL 테스터 내장** | ❌ 공개 API 없음 | ❌ 인터랙티브 문서 없음 |
| **멀티 Webhook 실시간 알림** | ✅ **Discord/Slack/Feishu/DingTalk/WeCom** | ❌ 없음 | ❌ 없음 |

---

## 🔒 프로덕션 보안 및 운영 권장사항

1. **강력한 비밀키 사용**: 배포 시 `.env` 파일의 `JWT_SECRET`을 `openssl rand -base64 32` 등으로 생성한 난수로 변경하세요.
2. **리버스 프록시 및 HTTPS/WSS 적용**: Nginx, Caddy, Cloudflare 등을 통해 SSL/TLS 암호화를 적용하고, 리버스 프록시 사용 시 `TRUST_PROXY=1`을 설정하세요.
3. **CORS 접근 제어**: 고정 도메인 운영 시 `CORS_ALLOWED_ORIGINS=https://your-domain.com`을 설정하여 교차 출처 요청을 제한하세요.
4. **정기 데이터 백업**: 모든 노트, 스냅샷, 휴지통 및 DB 설정은 `./data` 폴더에 저장됩니다. 이 디렉터리를 정기적으로 백업하세요.

---

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE)에 따라 오픈 소스로 배포됩니다.
