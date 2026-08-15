---
name: commit-creation
description: Generate, split, and validate Git commits using this repository's Conventional Commits format with concise Chinese summaries and bullet bodies. Use when staging changes, planning multiple commits, creating commits, or writing commit messages.
---

# Commit Creation

分析已暂存的更改，自动生成符合Conventional Commits规范的提交信息并执行提交。

## When to Use

代码更改后的提交创建，符合Conventional Commits规范的消息自动生成时使用。

## Instructions

### 1. 工作流程

1. **检查全部修改**：执行 `git status`、`git diff --name-status` 和 `git diff --stat`。
2. **先分类再暂存**：按依赖/构建、schema/API、领域工具、页面组件、测试、文档等职责划分文件组，并使用明确路径逐组暂存。
3. **检查暂存内容**：每次提交前并行执行 `git status` 和 `git diff --cached`，确认暂存区只包含一个职责组。
4. **前缀选择**：根据该职责组选择前缀（参见下表）。
5. **消息生成**：`<前缀>: <摘要（50字以内）>` + 项目符号正文（0-4行）。
6. **执行提交**：创建提交后继续处理下一职责组，直至工作树无遗漏。

### 提交拆分规则

- **禁止**：当修改可以按职责独立分类时，将所有文件放进一个提交。
- **必须**：依赖、后端契约、领域工具、页面组件、测试和文档等独立关注点分别提交。
- **必须**：使用明确文件路径暂存，禁止用 `git add .` 混入多个职责组。
- **必须**：每次提交都应保持逻辑内聚，并尽可能处于可构建、可审查状态。
- **例外**：只有无法安全拆分的原子跨层变更才可合并；提交正文必须说明不能拆分的原因。

### 2. 前缀选择

| 前缀 | 用途 |
|--------|------|
| `feat` | 新功能添加 |
| `fix` | 修复错误 |
| `refactor` | 重构（无行为改变） |
| `perf` | 性能优化 |
| `test` | 添加/修改测试 |
| `docs` | 文档更新 |
| `build` | 构建/依赖变更 |
| `ci` | CI相关变更 |
| `chore` | 杂务（工具配置/脚本等） |
| `style` | 仅样式变更（与代码逻辑无关） |
| `revert` | 撤销 |

### 3. 提交信息格式

```
<前缀>: <摘要（命令式/简洁）>

- 变更内容1（项目符号）
- 变更内容2（项目符号）
```

**规则**：摘要限简体中文50字以内，正文为0-4行的项目符号。

### 4. 执行示例

```bash
git commit -m "$(cat <<'EOF'
fix：删除不必要的调试日志输出

- 删除用户信息获取处理中的冗余日志行
EOF
)"
```

## Examples

```
fix：删除不必要的调试日志输出
- 删除用户信息获取处理中的冗余日志行

feat：添加两步验证功能
- 实现短信认证流程
- 添加认证令牌的生成与验证功能
```

## Important Notes

- **必须**：使用 `git diff --cached` 分析暂存区内容（忽略未暂存的更改）
- **必须**：多职责修改先输出提交分组，再按组逐次暂存和提交
- **禁止**：模糊的摘要（如“update”，“fix bug”等），禁止仅有无条理的长文
- **禁止**：为了减少提交次数而把不相关文件合并到同一提交
- 对于较大的差异，聚焦主要变更点进行总结

## 运行时注意事项
- 当用户请求提交信息时，先通过 `git status` 或 `git diff --staged` 了解变更内容，然后按照上述格式提出一条提交信息。
