# Love AI Edge Function

这个函数负责把前端的记忆摘要发给大模型，生成：

- `monthly_report`: AI 每月回忆报告

不要把大模型 API key 放进前端。部署后在 Supabase 里设置环境变量。

DeepSeek OpenAI-compatible 配置：

```bash
supabase secrets set AI_API_KEY="你的 DeepSeek API key"
supabase secrets set AI_BASE_URL="https://api.deepseek.com"
supabase secrets set AI_MODEL="deepseek-v4-flash"
```

`AI_BASE_URL` 使用 OpenAI-compatible 接口，函数会自动请求 `/chat/completions`。如果你换成其他兼容服务，只需要改这三个 secret。

部署：

```bash
supabase functions deploy love-ai
```
