# 同事内容模板

## 极简模板（默认）

```text
【材料主题】
【给谁看 / 希望推动什么】
【已知事实或原始内容】
【下一步或需要决策】（可不填）
【页数要求】（可不填；默认最少页数；写“必须一页/不要拆页”即为硬约束）
```

同事可以直接粘贴自然语言。先自动归入这些字段，不要求其判断图表或版式。

## 完整模板（高风险自动启用）

```text
【汇报对象】
【汇报目的 / 需要推动的决定】
【核心判断】
【背景事实】
【关键实体及标准名称】
【业务关系 / 时间关系 / 因果关系】
【数字、单位、时间范围、统计对象】
【当前进展】
【问题与风险】
【下一步行动、Owner、时间】
【来源】
【冲突、未知和待确认项】
【页数及输出要求】
```

出现资本、监管、法律、信贷、定价、客户政策或来源冲突时，先返回待确认项。展示形式只是偏好，不能覆盖事实与关系判断。

## Page-count intent normalization

- “必须一页”“强制一页”“只做一页”“不要拆页”“合并为一页” → `requested: 1`, `constraint: "exact"`, `overflowPolicy: "block"`.
- “最多三页” → `requested: 3`, `constraint: "maximum"`, `overflowPolicy: "block"`.
- “大约三页”“3页左右” → `requested: 3`, `constraint: "flexible"`.
- No page instruction → `requested: null`, `constraint: "minimum-needed"`.

Never silently weaken `exact` into `flexible`.
