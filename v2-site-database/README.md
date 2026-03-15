# Soul Dashboard V2 Site Database

此資料夾是新版網站的資料規格層，完全獨立於現有系統。

## 產品定位
- 路徑：`自我辨識 -> 關係理解 -> 時間導航 -> 決策優化`
- 定位：不是算命工具，而是人生導航系統
- 核心價值：看見自己、理解自己、整合自己、做出更適合自己的選擇

## 檔案說明
- `panel_registry.json`: 面板完整定義、四大區塊、三批次優先序（含總整合面板）
- `six_week_curriculum.json`: 六週 12 主題課程節奏、每週收斂與輸出
- `metric_formulas.json`: 指標計算規格與語氣策略
- `tone_guidelines.json`: 文案語氣規範（理性教練 60% + 溫暖陪伴 40%）
- `decision_matrix_spec.json`: 決策矩陣雙模式規格與 enum
- `report_template.json`: 個人總結報告模板
- `ui_design_tokens.json`: UI 色彩、字體、元件與圖表規範
- `frontend_panel_output_schema.json`: 前端每面板統一輸出 JSON Schema
- `implementation_roadmap.md`: 開發分期與工程原則
- `sample_user_snapshot.json`: 串接測試範例

## 設計與工程共同原則
- 每個面板只回答一個核心問題
- 每個面板必有 `summary / interpretation / action_prompt`
- 不是資訊堆疊，而是導航系統
- 所有資訊最終收斂到個人總結報告
