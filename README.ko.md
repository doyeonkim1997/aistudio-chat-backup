# Ai Studio Chat Backup

AI Studio 프롬프트 대화 내용을 원클릭으로 TXT 파일로 저장하는 크롬 확장 프로그램.

AI Studio의 가상 스크롤 구조에 맞춰 채팅 화면을 자동으로 스크롤하며 과거 메시지를 로드하고,  
화면에 렌더링된 전체 대화를 누적 수집해 텍스트 파일로 저장합니다.

[English](./README.md)

### 사용 방법

- AI Studio 프롬프트 페이지 접속  
  (`https://aistudio.google.com/prompts/...`)
- 해당 탭 유지
- 확장 아이콘 클릭
- 자동 스크롤 완료까지 대기  
  (※ 프롬프트 수가 많을수록 시간 증가)
- TXT 파일 자동 다운로드

### 주요 기능 및 주의사항

- AI Studio 프롬프트 페이지 원클릭 백업
- 긴 대화 자동 로딩 및 수집
- 단일 TXT 파일 저장
- 브라우저 로컬 실행
- 백업 중 AI Studio 탭 닫기 / 새로고침 금지

### 설치 방법

- 저장소 클론 또는 다운로드
- 크롬 `chrome://extensions` 접속
- 개발자 모드 활성화
- 압축해제된 확장 프로그램 로드
- 프로젝트 폴더 선택

### 기술 스택

- JavaScript (Vanilla)
- Chrome Extensions API (Manifest V3)
- DOM 파싱
- 가상 스크롤 처리
- 별도 프레임워크 / 빌드 과정 없음
