# Nimbus Vault Sync — 셀프 호스팅 Obsidian 동기화 + Web 관리자 + MCP + 오픈 REST API 서버

[简体中文](README.md) / [English](README_en.md) / [日本語](README_ja.md) / [한국어](README_ko.md) / [繁體中文](README_zh-TW.md)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-010101?style=flat&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![MCP](https://img.shields.io/badge/MCP-18_Tools-8A2BE2?style=flat&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20MySQL%20%7C%20Postgres-4479A1?style=flat&logo=sqlite&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=flat&logo=opensourceinitiative&logoColor=white)](LICENSE)

**Nimbus Vault Sync**(구 FNS / Fast Note Sync)는 가볍고 강력한 셀프 호스팅 Obsidian 클라우드 동기화 및 지식 관리 백엔드 서비스입니다:

- 📡 **밀리초 단위 WebSocket 실시간 동기화** — 다중 기기 및 다중 Vault 간 협업, 낙관적 락 기반 충돌 방지 및 실시간 상태 브로드캐스트
- 🖥 **현대적인 Web 관리자 콘솔** — 다중 Vault 전환, 전문 퍼지 검색, 온라인 Markdown 편집 및 미리보기, 기기 관리, 휴지통 지원
- 🤖 **포괄적인 Model Context Protocol (MCP)** — 18가지 표준 MCP 도구가 내장되어 Cursor, Cherry Studio, Claude Desktop, Cline 등 AI 클라이언트가 직접 노트를 읽고 쓰고 정리하며 모바일과 데스크톱에 실시간 동기화
- 📖 **인터랙티브 REST API 개발자 문서** — OpenAPI Spec 규격 내장, 웹 콘솔에서 현재 토큰과 Vault ID가 주입된 cURL 명령어를 원클릭으로 복사
- 🔗 **우아한 공개 링크 공유** — 비밀번호 보호, 유효 기간, 복사 방지가 지원되는 전용 웹 리더 링크 생성
- 📱 **다중 기기 관리 및 감사** — 연결된 기기의 OS 플랫폼, IP 주소, 온라인 상태 모니터링, 전용 토큰 관리 및 원격 연결 해제
- 🕘 **버전 히스토리 스냅샷** — 저장 시 자동 스냅샷 아카이빙, 차이점 비교 및 원클릭 복원
- 🗑 **안전한 휴지통 메커니즘** — 삭제 시 휴지통으로 이동하는 소프트 삭제로 데이터 손실 방지, 개별 복원 및 일괄 비우기 지원
- 🗄 **다중 데이터베이스 엔진 지원** — JSON 파일, SQLite, PostgreSQL, MySQL을 네이티브 지원하며 원활한 마이그레이션 가능
- 🐳 **원클릭 Docker 배포** — 프로덕션급 `Dockerfile` 및 `docker-compose.yml`, 영구 데이터 볼륨 마운트 완비

Obsidian 전용 플러그인은 저장소의 [`obsidian-plugin`](./obsidian-plugin) 디렉토리에 포함되어 있습니다.

---

## 📁 디렉토리 구조

```
nimbus-vault-sync/
├── server.js                # 엔트리 포인트: REST API + WebSocket Hub + MCP 프로토콜 + 정적 파일 제공
├── obsidian-plugin/         # Obsidian 양방향 동기화 플러그인 (.obsidian/plugins/nimbus-sync)
│   ├── manifest.json
│   ├── main.js
│   ├── styles.css
│   └── README.md
├── src/
│   ├── config.js            # 환경 변수 및 시스템 설정
│   ├── db.js                # 다중 데이터베이스 엔진 관리 (JSON / SQLite / PostgreSQL / MySQL)
│   ├── users.js             # 사용자 계정 및 권한 관리 (Admin / 일반 사용자)
│   ├── vaults.js            # Vault 저장 및 접근 권한 검증
│   ├── auth.js              # JWT 인증 및 requireAuth / requireAdmin 미들웨어
│   ├── storage.js           # 노트 파일 I/O, 히스토리 스냅샷, 휴지통, 충돌 해결
│   ├── mcpServer.js         # 18개 표준 MCP 도구 구현 및 StreamableHTTP 핸들러
│   ├── wsHub.js             # WebSocket 실시간 다중 클라이언트 브로드캐스트 허브
│   └── routes/
│       ├── authRoutes.js    # 로그인, 회원가입, 시스템 상태
│       ├── vaultRoutes.js   # Vault 목록, 생성, 삭제, 매니페스트
│       ├── fileRoutes.js    # 파일 증분 읽기/쓰기, 삭제
│       ├── vaultExtrasRoutes.js # 히스토리, 휴지통, 충돌, 백업, 공유 멤버, 감사 로그
│       ├── shareRoutes.js   # 공유 링크 생성 및 공개 리더
│       ├── deviceRoutes.js  # 연결된 기기 목록 및 토큰 관리
│       ├── settingsRoutes.js# 동기화 설정, 비밀번호 변경, DB 엔진 전환
│       ├── adminRoutes.js   # 최고관리자 전용: 전체 Vault 및 사용자 관리
│       ├── mcpRoutes.js     # MCP StreamableHTTP 엔드포인트 및 /tools 인트로스펙션
│       └── docsRoutes.js    # REST API 대화형 문서 및 OpenAPI 스펙
├── public/                  # Web 관리 콘솔 (순수 HTML/CSS/JS, 빌드 과정 불필요)
│   ├── index.html           # 메인 대시보드
│   ├── share.html           # 공개 노트 읽기 전용 페이지
│   ├── style.css            # 모던 테마 스타일 시스템
│   └── app.js               # 프론트엔드 인터랙션 로직
└── data/                    # 영구 데이터: 노트 파일, 히스토리 스냅샷, 휴지통, 백업 ZIP
```

---

## 🚀 빠른 시작

```bash
cd nimbus-vault-sync
npm install
cp .env.example .env       # 필요에 따라 PORT 및 JWT_SECRET 설정
npm start
```

웹 브라우저에서 **`http://localhost:8787/admin`** 에 접속하여 Web 관리자 콘솔에 진입합니다.

사용자가 없는 초기 상태에서 관리자 계정을 생성하는 방법:
1. 웹 관리 콘솔을 열고 초기 관리자 설정 화면에서 등록합니다.
2. 또는 `POST /api/auth/register` API를 호출합니다 (사용자가 없을 때만 개방됨).

---

## 🐳 Docker 배포

```bash
cd nimbus-vault-sync
cp .env.example .env    # JWT_SECRET을 강력한 무작위 문자열로 변경
docker compose up -d --build
```

- 데이터는 호스트의 `./data` 디렉토리(볼륨 마운트)에 영구 저장됩니다. 이 디렉토리를 백업하면 모든 노트와 설정을 안전하게 보관할 수 있습니다.
- 관리자 콘솔: `http://localhost:8787/admin`
- WebSocket 동기화 엔드포인트: `ws://localhost:8787/ws`
- MCP 서비스 엔드포인트: `http://localhost:8787/api/mcp`
- 단일 Dockerfile 실행:
  ```bash
  docker build -t nimbus-vault-sync .
  docker run -d -p 8787:8787 \
    -e JWT_SECRET=your_jwt_secret_string \
    -v $(pwd)/data:/app/data \
    --name nimbus-vault-sync nimbus-vault-sync
  ```

---

## 🤖 Model Context Protocol (MCP) AI 연동

Nimbus는 **StreamableHTTP** 프로토콜 기반의 MCP 엔드포인트를 기본 내장하고 있습니다. AI 클라이언트(Cursor, Cherry Studio, Claude Desktop, Cline 등)는 로컬 하위 프로세스를 시작할 필요 없이 표준 HTTP POST를 통해 직접 연결할 수 있습니다.

### 1. 클라이언트 연결 설정 (`mcp.json`)

웹 관리자 콘솔의 사이드바에서 **「🤖 AI / MCP 설정」**을 클릭하여 Vault를 선택하고 다음 설정을 복사합니다:

```json
{
  "mcpServers": {
    "nimbus-fast-note-sync": {
      "url": "http://<서버주소>/api/mcp",
      "type": "http",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer <JWT토큰>",
        "X-Default-Vault-Name": "내 지식 저장소"
      }
    }
  }
}
```

### 2. 내장 18개 표준 MCP 도구 목록

| 카테고리 | 도구 이름 | 파라미터 및 설명 | 주요 활용 시나리오 |
| :--- | :--- | :--- | :--- |
| **Vault 관리 및 통계** | `list_vaults` | 접근 가능한 모든 Vault 및 사용자 권한 목록 조회 | Vault 현황 파악 |
| | `get_vault_stats` | `vaultId?`: Markdown/HTML/첨부파일 통계, 상위 20개 태그 및 최근 수정 내역 | 지식 베이스 건강 검진 |
| **노트 검색 및 메타데이터** | `list_notes` | `folder?`, `extension?`, `sortBy?`, `sortOrder?`, `limit?`, `includeMetadata?` | 폴더/시간/확장자별 목록 조회 |
| | `get_note_metadata`| `path`, `vaultId?`: 글자 수, YAML Frontmatter, 양방향 링크 `[[Link]]`, `#태그`, 목차 구조 추출 | 노트 심층 구조 분석 |
| **읽기 및 쓰기** | `read_note` | `path`, `vaultId?`: 노트 전체 본문 읽기 | 문서 내용 조회 |
| | `write_note` | `path`, `content`, `baseHash?`, `vaultId?`: 노트 작성 또는 덮어쓰기 (자동 히스토리 생성 및 실시간 브로드캐스트) | AI 노트 신규 생성/재구성 |
| | `append_note` | `path`, `content`, `heading?`, `withTimestamp?`: 노트 끝 또는 지정된 제목 아래에 내용 추가 | 회의록 추가, 빠른 메모 |
| | `prepend_note` | `path`, `content`, `withTimestamp?`: 노트 상단에 내용 삽입 (YAML 속성 보존) | 핵심 요약 삽입, 상단 고정 |
| | `patch_note` | `path`, `search`, `replace`, `replaceAll?`: 부분 검색 및 치환 | 전체 전송 없는 정밀 수정 |
| **데일리 노트** | `get_daily_note` | `date?`, `folder?`, `createIfMissing?`: 당일 데일리 노트 조회 및 생성 | 데일리 저널 조회 |
| | `append_daily_note`| `content`, `date?`, `folder?`, `heading?`, `withTimestamp?`: 타임스탬프와 함께 데일리 로그 추가 | 생각 조각 및 할 일 기록 |
| **전문 검색 및 태그** | `search_notes` | `query`, `folder?`, `limit?`, `useRegex?`, `caseSensitive?`: 줄 번호 포함 전문 검색 | 빠른 지식 검색 |
| | `list_tags` | `folder?`, `vaultId?`: 모든 태그 및 계층 태그 빈도 집계 | 태그 분류 체계 정리 |
| **정리 및 관리** | `move_note` | `oldPath`, `newPath`, `overwrite?`: 노트 이동 및 이름 변경 | 디렉토리 구조 정리 |
| | `delete_note` | `path`, `vaultId?`: 안전 삭제 (휴지통으로 이동) 및 브로드캐스트 | 노트 정리 |
| **히스토리 및 스냅샷** | `get_note_history` | `path`, `vaultId?`: 단일 노트의 전체 과거 스냅샷 버전 조회 | 변경 이력 추적 |
| | `read_history_version`| `versionId`, `vaultId?`: 특정 히스토리 버전의 원본 내용 읽기 | 버전 비교 및 롤백 |
| **공유** | `create_share_link`| `path`, `title?`, `password?`, `expiresDays?`, `allowCopy?`: 공개 웹 링크 생성 | AI 원클릭 글 발행 |

---

## 📖 REST API 개요

웹 관리 콘솔의 좌측 메뉴 **「📖 REST API 개발자 문서」**를 클릭하면 현재 인증 토큰과 활성 Vault ID가 주입된 대화형 cURL 명령어를 바로 확인할 수 있습니다. `GET /api/docs/spec`을 통해 OpenAPI 스펙도 제공됩니다.

### 주요 핵심 엔드포인트

| 분류 | 메서드 | 경로 | 설명 |
| :--- | :--- | :--- | :--- |
| **인증** | `POST` | `/api/auth/login` | 로그인 및 JWT 토큰 발급 |
| | `GET` | `/api/health` | 서비스 헬스체크 |
| **Vault** | `GET` | `/api/vaults` | 접근 가능한 Vault 목록 및 권한 조회 |
| | `POST` | `/api/vaults` | 새 Vault 생성 |
| | `GET` | `/api/vaults/:vaultId/manifest` | 전체 파일 매니페스트 및 SHA-256 해시 |
| | `GET` | `/api/vaults/search?q=키워드` | 전체 Vault 대상 파일명 및 본문 검색 |
| **파일** | `GET` | `/api/vaults/:vaultId/files/*` | 노트 본문 또는 첨부파일 읽기 |
| | `PUT` | `/api/vaults/:vaultId/files/*` | 파일 쓰기 (`X-Base-Hash` 충돌 방지 및 실시간 브로드캐스트 지원) |
| | `DELETE`| `/api/vaults/:vaultId/files/*` | 파일 삭제 (휴지통으로 소프트 삭제) |
| **히스토리** | `GET` | `/api/vaults/:vaultId/history?path=...` | 과거 히스토리 버전 목록 조회 |
| | `POST` | `/api/vaults/:vaultId/history/:versionId/restore` | 특정 과거 버전으로 롤백 복원 |
| **휴지통** | `GET` | `/api/vaults/:vaultId/trash` | 휴지통 내 파일 목록 조회 |
| | `POST` | `/api/vaults/:vaultId/trash/:trashId/restore` | 휴지통에서 파일 복원 |
| **백업 및 충돌** | `POST` | `/api/vaults/:vaultId/backups` | 전체 Vault ZIP 스냅샷 백업 생성 |
| | `GET` | `/api/vaults/:vaultId/export` | 전체 Vault ZIP 다운로드 |
| | `POST` | `/api/vaults/:vaultId/conflicts/resolve` | 충돌 해결 전략 적용 |
| **공유** | `POST` | `/api/vaults/:vaultId/shares` | 공개 공유 링크 생성 |
| | `GET` | `/api/public/shares/:shareId` | 리더 전용 공개 노트 본문 조회 |
| **MCP** | `GET` | `/api/mcp/tools` | 18개 MCP 도구 규격 및 파라미터 규칙 조회 |
| | `POST` | `/api/mcp` | AI 클라이언트의 JSON-RPC 요청 처리 |

---

## 📡 WebSocket 실시간 동기화 프로토콜

- **연결 엔드포인트**: `ws://<host>/ws?token=<jwt>&vaultId=<vaultId>`
- **양방향 브로드캐스트**:
  - 연결 즉시 `init` 전체 매니페스트 비교를 진행합니다.
  - 파일 수정 또는 삭제 발생 시 동일한 Vault에 접속된 기기에 `change` / `deleted` 알림을 브로드캐스트합니다.
  - `baseHash` 낙관적 락으로 충돌을 감지하며, 오프라인 편집 등으로 충돌이 발생하면 `.conflict` 사본을 자동 생성합니다.

---

## 📊 fast-note-sync-service (FNS) 비교

| 기능 및 특성 | Nimbus Vault Sync | FNS (haierkeys) |
|---|---|---|
| **실시간 동기화 (WebSocket)** | ✅ 밀리초 양방향 브로드캐스트 | ✅ |
| **Web 관리자 콘솔** | ✅ 모던 SPA (온라인 편집/검색/기기 관리) | ✅ |
| **MCP 도구 수 및 기능 깊이** | ✅ **18개 표준 도구** (데일리 노트, 공유, 메타데이터, 스냅샷) | ✅ 기본 도구 |
| **인터랙티브 REST API 문서** | ✅ **내장 문서 및 원클릭 cURL** (`/api/docs/spec`) | ❌ |
| **노트 버전 히스토리 및 롤백** | ✅ 자동 스냅샷 및 원클릭 롤백 | ✅ |
| **안전한 휴지통 메커니즘** | ✅ 소프트 삭제, 개별 복원 및 비우기 | ✅ |
| **공개 링크 공유** | ✅ 비밀번호 보호, 유효 기간 및 웹 리더 | ✅ |
| **다중 기기 관리 및 감사** | ✅ 온라인 상태 / OS 플랫폼 / 원격 연결 해제 | ✅ |
| **다중 데이터베이스 엔진** | ✅ JSON / SQLite / MySQL / PostgreSQL 유연한 전환 | ✅ SQLite / MySQL / PostgreSQL |
| **경량성 및 커스터마이징** | ✅ 순수 Node.js, 빌드 불필요, 손쉬운 확장 | Go 언어 기반 |

---

## 🔒 보안 및 운영 권장사항

1. **강력한 비밀키**: `.env` 파일의 `JWT_SECRET`을 길고 복잡한 무작위 문자열로 설정하세요.
2. **리버스 프록시 및 HTTPS**: 프로덕션 환경에서는 Nginx, Caddy 또는 Cloudflare 뒤에서 실행하고 HTTPS/WSS를 활성화하세요.
3. **데이터 백업**: 모든 노트와 데이터베이스 파일은 `./data` 디렉토리에 저장됩니다. 이 디렉토리를 주기적으로 백업하거나 웹 콘솔의 "백업 생성" 기능을 활용하세요.

---

## 💖 Sponsorship & Support / 후원 및 지원

- If you find this project useful and would like it to continue development, please support us in the following ways. Thank you for supporting open-source software!
- 본 프로젝트가 도움이 되었고 지속적인 개발을 응원해 주신다면 다음 방법으로 후원해 주실 수 있습니다. 오픈소스 프로젝트를 지원해 주셔서 감사합니다:

| Ko-fi *Non-China Region* | | WeChat Pay *China Region* |
| :---: | :---: | :---: |
| <a href="https://ko-fi.com/lengedliu" target="_blank"><img src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" width="220" alt="Support me on Ko-fi" /></a> | or | <img src="./public/wechat-reward.jpg" width="190" alt="WeChat Pay 微信打赏" /> |

---
