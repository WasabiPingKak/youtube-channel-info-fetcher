# Coverage 報告 + Badge 設定指南

本文件描述如何為專案加入 CI 覆蓋率報告、PR comment、動態 README badge。
已在 VTMap 專案驗證通過，可直接套用到 GeoPingkak、Vtaxon。

## 概觀

```
CI 跑 pytest --cov → 產出 coverage.xml
  ├─ PR comment（MishaKav/pytest-coverage-comment）── 每個 PR 顯示覆蓋率表格
  ├─ Extract %  → dynamic-badges-action 寫入 Gist JSON
  └─ README badge → shields.io 讀 Gist JSON 渲染圖片
```

AI agent 掃 repo 會看到的證據鏈：README badge → CI workflow → pyproject.toml coverage config → PR comment 歷史。

---

## 一、GitHub 前置設定（每個 repo 各做一次）

### 1. 建立 Gist（每個專案一個）

1. 到 `gist.github.com` 建一個 **public gist**
2. Filename: `coverage-badge.json`
3. 內容隨便貼（CI 會覆蓋）：
   ```json
   {"schemaVersion":1,"label":"coverage","message":"pending","color":"lightgrey"}
   ```
4. 記下網址列的 Gist ID（`gist.github.com/WasabiPingKak/` 後面那串）

### 2. PAT（全專案共用一個就好）

VTMap 已經建過 `GIST_TOKEN`，其他 repo 直接用同一個 PAT：
- GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
- 需要 Account permissions → **Gists: Read and write**

### 3. Repo Secrets & Variables

到 repo Settings → Secrets and variables → Actions：

| 類型 | 名稱 | 值 |
|------|------|----|
| Secret | `GIST_TOKEN` | PAT token（跟 VTMap 同一個） |
| Variable | `COVERAGE_GIST_ID` | 該專案的 Gist ID |

---

## 二、程式碼修改

### 1. pyproject.toml — 加入 coverage 設定

在 `[tool.pytest.ini_options]` 之後加：

```toml
[tool.coverage.run]
omit = ["tests/*", "tools/*"]

[tool.coverage.report]
fail_under = 80
show_missing = true
skip_covered = true
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.",
]
```

**注意**：不要加 `source = [...]`。加了會把所有未測試檔案算入分母，拉低覆蓋率。不加的話只量測有被 import 的程式碼，數字更能反映實際測試涵蓋範圍。

### 2. CI workflow — 加入 coverage report + badge 更新

在跑 pytest 的 job 中，修改 pytest 指令並加入三個 step：

```yaml
      # 原本: pytest --tb=short -q
      # 改為:
      - name: Run pytest with coverage
        run: pytest --tb=short -q --cov --cov-report=term-missing:skip-covered --cov-report=xml:coverage.xml
        env:
          # ... 原有 env vars ...

      - name: Coverage comment on PR
        if: github.event_name == 'pull_request'
        uses: MishaKav/pytest-coverage-comment@main
        with:
          pytest-xml-coverage-path: <backend-dir>/coverage.xml  # 改成你的 working-directory
          title: Backend Coverage Report
          badge-title: coverage
          hide-badge: false
          hide-report: false
          junitxml-path: ""

      - name: Extract coverage percentage
        id: cov
        run: |
          COVERAGE=$(python -c "
          import xml.etree.ElementTree as ET
          tree = ET.parse('coverage.xml')
          rate = float(tree.getroot().attrib['line-rate'])
          print(f'{rate * 100:.0f}')
          ")
          echo "percentage=$COVERAGE" >> "$GITHUB_OUTPUT"

      - name: Update coverage badge
        if: github.ref == 'refs/heads/develop'
        uses: schneegans/dynamic-badges-action@v1.7.0
        with:
          auth: ${{ secrets.GIST_TOKEN }}
          gistID: ${{ vars.COVERAGE_GIST_ID }}
          filename: coverage-badge.json
          label: coverage
          message: ${{ steps.cov.outputs.percentage }}%
          valColorRange: ${{ steps.cov.outputs.percentage }}
          minColorRange: 50
          maxColorRange: 100
```

### 3. CI trigger — 加入 push 觸發

badge 更新需要在 merge 到 develop 時執行，所以 CI 要加 push trigger：

```yaml
on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop]    # 新增這行
```

### 4. README — 加入 badges

在 README 最上方加入（替換 `{OWNER}`、`{REPO}`、`{GIST_ID}`）：

```markdown
[![CI](https://github.com/{OWNER}/{REPO}/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/{OWNER}/{REPO}/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/{OWNER}/{GIST_ID}/raw/coverage-badge.json)](https://github.com/{OWNER}/{REPO}/actions/workflows/ci.yml)
```

---

## 三、VTMap 踩坑紀錄（移植時注意）

### 坑 1：module-level side effect 污染環境變數

**症狀**：CI 63 個 test ERROR — `IsADirectoryError` 或 `DefaultCredentialsError`

**根因**：`tools/migrate_tokens_to_kms.py` 在 import 時無條件設定 `GOOGLE_APPLICATION_CREDENTIALS`，當 `FIREBASE_KEY_PATH` env var 為空時解析成 repo root 目錄。測試檔 import 這個 module 就污染了所有後續測試。

**教訓**：tools 腳本的 module-level `os.environ[...] = ...` 要加 guard，env var 為空時不設定。

### 坑 2：firebase_admin 在沒有 GCP credentials 的 CI 環境初始化失敗

**症狀**：`DefaultCredentialsError: Your default credentials were not found`

**根因**：`firebase_admin.initialize_app()` 不帶 credential 會呼叫 `google.auth.default()`，CI 沒有 ADC。

**修法**：conftest 的 emulator fixture 用 AnonymousCredentials：
```python
from google.auth.credentials import AnonymousCredentials
import firebase_admin

class _EmulatorCredential(firebase_admin.credentials.Base):
    def get_credential(self):
        return AnonymousCredentials()

firebase_admin.initialize_app(_EmulatorCredential(), options={"projectId": "demo-test"})
```

注意：不能用 `MagicMock`（google-cloud 檢查型別），也不能用 `Base(AnonymousCredentials())`（Base 不接受建構參數）。

### 坑 3：Firestore emulator 測試資料殘留

**症狀**：test isolation 失敗，前一個測試的資料影響後一個

**根因**：`db.collection("X").stream()` 列不到 virtual parent document（只有 subcollection 沒有自身資料的 doc），逐筆刪除會漏。

**修法**：用 emulator REST API 整批清除：
```python
def _clear_emulator():
    import urllib.request
    host = os.environ.get("FIRESTORE_EMULATOR_HOST")
    url = f"http://{host}/emulator/v1/projects/demo-test/databases/(default)/documents"
    req = urllib.request.Request(url, method="DELETE")
    urllib.request.urlopen(req, timeout=5)
```

### 坑 4：coverage source 設定讓覆蓋率暴跌

**症狀**：覆蓋率從 >80% 掉到 68%

**根因**：`[tool.coverage.run] source = ["routes", "services", ...]` 會把那些目錄中所有檔案（包含從未被 import 的）都算入分母。

**修法**：不設 `source`，讓 coverage 只量測實際被 import 的程式碼。

---

## 四、Checklist

- [ ] 建立該專案的 Gist（public, coverage-badge.json）
- [ ] Repo Settings 加 secret `GIST_TOKEN` + variable `COVERAGE_GIST_ID`
- [ ] pyproject.toml 加 `[tool.coverage]` 區塊
- [ ] CI workflow 修改 pytest 指令 + 加 3 個 step + push trigger
- [ ] README 加 CI + Coverage badge
- [ ] 如果有 Firestore emulator 測試：確認 conftest 用 AnonymousCredentials + REST API cleanup
- [ ] 如果有 module-level `os.environ` 設定：確認有 guard
- [ ] Push 後確認 CI 綠燈、badge 正確顯示
