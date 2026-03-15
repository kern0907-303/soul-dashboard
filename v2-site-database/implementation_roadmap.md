# Implementation Roadmap

## Phase 1: 核心導航骨架 (第一批)
1. 完成 `core_personality`, `current_operation_dimension`, `inner_drive`, `expression_consistency`, `current_needs`, `bottleneck_diagnosis`。
2. 全面板統一輸出格式（`summary`, `interpretation`, `action_prompt`）並套用 `tone_guidelines.json`。
3. 建立 `frontend_panel_output_schema.json` 驗證流程。

## Phase 2: 關係與方向 (第二批)
1. 完成 `relationship_pattern`, `relationship_dynamics`, `time_rhythm`, `mission_direction`, `future_blueprint`, `decision_matrix`。
2. `decision_matrix` 支援二選一與多選排序（參照 `decision_matrix_spec.json`）。
3. 串接 `/calculate_lifecycle` 生成 30/90/365 天節點。

## Phase 3: 補強與報告 (第三批)
1. 完成 `value_ranking`, `role_fit`, `fear_and_defense`。
2. 依 `report_template.json` 產生個人總結報告。
3. 輸出畫面版與下載版（JSON/PDF）。

## Engineering Principles
- 每個面板只回答一個核心問題。
- 每個面板都必須有 `summary / interpretation / action_prompt`。
- 面板內容必須可導向行動，不做靜態命理堆疊。
- 所有面板資訊最終可收斂到個人總結報告。
- 保持舊版檔案不動，使用 adapter 映射舊欄位到新模型。
