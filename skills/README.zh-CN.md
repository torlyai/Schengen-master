# Schengen-master 技能集

> Read this in: [English](README.md) · **中文**
>
> 由九位虚拟专家协助你申请申根签证 — 行程规划师、文件工程师、会计、表格专家、未成年人专家、担保专家、预约协调员、申请审计师、补救顾问。全部 Claude Code 斜杠命令。全部 markdown。免费、开源、MIT 协议。

**v0.2.0 提供 20 个技能**（目标 v1.0 提供 36 个完整技能）。v0.x 专注**法国申根短期签证申请**；其他申根国家在 v1.x 上线。

---

## 安装（30 秒）

打开 Claude Code，粘贴以下命令 — 剩下的交给 Claude：

```bash
curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```

就这么简单。下次启动 Claude Code 会话时，输入 `/start-here` 即可开始。

**重新运行同一条命令**可更新到最新版本。安装是幂等的、速度快。

**自定义安装路径：**
```bash
SCHENGEN_SKILLS_DEST=~/some/other/path curl -sSL ...install.sh | sh
```

## 快速入门

| 你说什么 | 触发什么技能 |
|---|---|
| "我想申请法国申根签证" | `/start-here` |
| "我需要哪些文件？" | `/document-checklist` |
| "帮我检查照片是否符合要求" | `/photo-check` *（附上图片时启用视觉识别）* |
| "我的旅行保险符合申根要求吗？" | `/insurance-check` |
| "帮我写求情信" | `/cover-letter` |
| "帮我起草雇主信" | `/employment-letter` |
| "审核我的银行流水" | `/bank-statement-check` |
| "估算我的出行成本" | `/cost-estimate` |
| "我和孩子一起申请" | `/minor-application` |
| "我的配偶担保我" | `/sponsored-application` |
| "帮我填 France-Visas 表" | `/france-visas-form` |
| "带我过 TLScontact" | `/tlscontact-form` |
| "我们一家 4 口" | `/group-application` |
| "我准备好提交申请了吗？" | `/audit-application` |
| "我找不到 TLS 预约时段" | `/find-slot` |
| "帮我预订预约" | `/book-appointment` |
| "我的 TLS 状态什么意思？" | `/track-application` |
| "我被拒了 — 怎么办？" | `/refusal-appeal` |

## v0.2 的 20 个技能

### 行程规划师
| 技能 | 功能 |
|---|---|
| `/start-here` | 入口；6 个关键问题；引导你进入下一步 |

### 文件工程师
| 技能 | 功能 |
|---|---|
| `/document-checklist` | 根据你的目的 + 家庭 + 担保情况，定制文件清单 |
| `/photo-check` | 启用视觉识别的护照照片合规性检查 |
| `/insurance-check` | 旅行保险证明对申根要求的合规性检查（€30000+、全程覆盖、医疗遣返） |
| `/cover-letter` | 起草个性化求情信，说明出行目的 + 回国承诺 |

### 会计（签证专用）— *v0.2 新增*
| 技能 | 功能 |
|---|---|
| `/employment-letter` | 起草合规雇主信；标记缺失字段（薪资、职位、休假批准） |
| `/bank-statement-check` | 按 €65/天规则审核 3 个月流水；标记可疑存款 |
| `/cost-estimate` | 分项出行成本核算（机票、住宿、日支、保险、费用） |
| `/financial-checklist` | 整合财务证据包；路由到上述一项或多项 |

### 未成年人专家
| 技能 | 功能 |
|---|---|
| `/minor-application` | 儿童申请入口 — 出生证明、父母同意书、学校证明、父母证件 |
| `/minor-parent-consent` | 父母一方或双方不随行时的同意书 |

### 担保专家
| 技能 | 功能 |
|---|---|
| `/sponsored-application` | 配偶/父母/朋友/雇主担保 — 根据担保人类型自动调整 |

### 表格专家 — *v0.2 新增*
| 技能 | 功能 |
|---|---|
| `/france-visas-form` | France-Visas 门户逐页指引 |
| `/tlscontact-form` | TLScontact 账户创建 + 参考号关联 + 预约流程配置 |
| `/group-application` | 家庭/团体结构性规则（每人 1 个 France-Visas、1 个 TLS 团队 ID、1 个时段） |

### 预约协调员
| 技能 | 功能 |
|---|---|
| `/find-slot` | TLScontact 预约策略 + 与 [Visa Master 扩展](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) 集成 |
| `/book-appointment` | 完整预订机制指引；中心选择、时段建议、附加项建议、当天清单 — *v0.2 新增* |

### 申请审计师
| 技能 | 功能 |
|---|---|
| `/audit-application` | 提交前审计；阅读全部材料，标出不一致、遗漏和薄弱环节 |

### 补救顾问 — *v0.2 新增*
| 技能 | 功能 |
|---|---|
| `/track-application` | TLS 追踪器状态解读 + 现实时间线 + 升级触发 |
| `/refusal-appeal` | 解读拒签代码 1-9；起草申诉信或建议重新申请 |

## 法国知识库 — *v0.2 新增*

`countries/france/` 包含法国特定事实的唯一真实来源（费用、处理时间、拒签代码、常见怪癖）加上伦敦、曼彻斯特、爱丁堡和贝尔法斯特各领事中心的详细信息。

## v0.3 → v1.0 路线图

再 16 个技能即达完整 36 技能目录：行程规划（`/plan-trip`、`/itinerary-builder`、`/decide-visa-type`、`/timeline-planner`）、更多文件技能（`/accommodation-verify`、`/translate-doc`、`/apostille`）、更多未成年人技能（`/minor-birth-certificate`、`/minor-school-letter`、`/minor-parent-docs`）、预约日准备（`/appointment-prep`、`/appointment-day`、`/mock-interview`）、决定后（`/first-trip`）、以及元工具（`/learn`、`/audit-log`、`/vstack-upgrade`）。加上 Germany、Italy、Spain、Netherlands 等其他 `countries/*` 知识库。

详见 [CHANGELOG.md](CHANGELOG.md)。

## 关联产品

| 产品 | 角色 | 位置 |
|---|---|---|
| **Visa Master Chrome 扩展** | 监控 TLScontact 时段开放 — 免费版通知你，Premium 版自动预订 | [Chrome 应用商店](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) |
| **Schengen-master 仓库** | 当前仓库 — 扩展、模板、技能集的发布渠道 | github.com/torlyai/Schengen-master |
| **签证申请模板** | 技能引用的可打印模板（求情信、文件清单、照片规范等） | [`docs/templates/visa-application/`](../docs/templates/visa-application/) |

## 设计理念

这些技能基于 **[Schengen-master 设计理念](ETHOS.md)** — 12 条原则，塑造每个技能的思考、建议方式。如果你要贡献代码、或想理解某个技能为何给出某个建议，请先阅读。

核心原则：
- **申请就是审计轨迹。** 各文件之间必须严格一致。
- **最便宜的成本是不返工的成本。** 在前期就做好审计。
- **无聊的文件最重要。** 银行流水 + 保险 + 工作证明比求情信修辞更重要。
- **绝不撒谎。** VIS 数据库会交叉核对一切。
- **我们是模板，不是律师。** 始终对照官方来源核实。

## 更新与卸载

| 操作 | 命令 |
|---|---|
| 更新到最新 | 重新运行安装命令，或 `cd ~/.claude/skills/schengen-master && git pull` |
| 查看已安装版本 | `cat ~/.claude/skills/schengen-master/VERSION` |
| 卸载 | `rm -rf ~/.claude/skills/schengen-master` |

## 贡献

如果你发现某个技能信息有误、过时、或可以改进 — 请到 https://github.com/torlyai/Schengen-master/issues 提交 issue。签证规则会变；社区反馈是我们保持准确的途径。

如要添加新技能：复制 `SKILL.md.tmpl`，按格式编写，然后提交 PR。提交前请先阅读 `ETHOS.md` — 你的技能应该体现这些原则。

## 许可证

MIT。Fork 它。改进它。让它变成你的。如果它帮助你拿到签证，那就是胜利。

---

**灵感来自** [garrytan/gstack](https://github.com/garrytan/gstack) — 业界标杆的 AI 技能工具集。我们借鉴了其架构；签证申请这个领域是我们自己的。
