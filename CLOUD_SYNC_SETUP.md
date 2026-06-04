# Cloud Sync Setup

这个网页本身可以继续放在 GitHub Pages 上，但不同设备之间要互相看到记录、情书、积分和图片，需要一个云端数据库。

推荐使用 Supabase 免费项目。

## 1. 创建数据表

先想一个只属于你们的 `coupleId`，建议用长一点、别人猜不到的字符串，例如：

```text
wu-wang-2026-private-8x3k-love-book
```

在 Supabase SQL Editor 里执行：

```sql
create table if not exists public.love_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.love_state enable row level security;

create policy "Allow shared scrapbook read"
on public.love_state
for select
using (id = 'wu-wang-2026-private-8x3k-love-book');

create policy "Allow shared scrapbook upsert"
on public.love_state
for insert
with check (id = 'wu-wang-2026-private-8x3k-love-book');

create policy "Allow shared scrapbook update"
on public.love_state
for update
using (id = 'wu-wang-2026-private-8x3k-love-book')
with check (id = 'wu-wang-2026-private-8x3k-love-book');
```

如果你用了别的 `coupleId`，要把 SQL 里的 `wu-wang-2026-private-8x3k-love-book` 全部替换成你的那一串。

## 2. 创建图片桶

在 Storage 里创建 bucket：

```text
love photos
```

把它设置为 Public bucket。

然后在 SQL Editor 里执行：

```sql
create policy "Allow public photo read"
on storage.objects
for select
using (bucket_id = 'love photos');

create policy "Allow scrapbook photo upload"
on storage.objects
for insert
with check (bucket_id = 'love photos');
```

## 3. 填写配置

打开 `sync-config.js`，改成：

```js
window.LOVE_SYNC_CONFIG = {
  enabled: true,
  supabaseUrl: "https://你的项目.supabase.co",
  supabaseAnonKey: "你的 anon public key",
  coupleId: "wu-wang-2026-private-8x3k-love-book",
  tableName: "love_state",
  storageBucket: "love photos",
  pollIntervalMs: 15000,
};
```

`coupleId` 就像你们这本回忆册的房间号。两个人必须使用同一个 `coupleId`，才会同步到同一本回忆册。

不要把 Supabase 的 `service_role` key 放进网页，只能使用 `anon public key`。

## 4. 重新上传 GitHub

填好配置后，把文件提交并推送。两个人打开同一个线上网址，就会看到同一份数据。
