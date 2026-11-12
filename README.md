# Staffku

Katalog staf AI pribadi (harian, belajar, bahasa, keuangan, menulis, perjalanan, menu, urusan hidup) dengan chat demo streaming (ID/EN).
Gratis untuk pemakaian pribadi non-komersial (lihat halaman `/terms`). Tema gelap ala x.ai/bot.
Next.js (App Router) + three.js untuk hero 3D. Tanpa database dan tanpa login: staf didefinisikan di `lib/agents.ts`.

## Jalankan lokal

```
npm install
copy .env.example .env.local     # isi LLM_API_KEY
npm run dev
```

## LLM

Endpoint OpenAI-compatible (LM Studio di `https://local.fts-tech.co.id/v1`). Semua lewat env:
`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` (kosong = otomatis pakai model chat pertama dari `/models`).
Selama `LLM_API_KEY` kosong, chat menjawab "belum dikonfigurasi" dengan pesan yang jelas, bukan error.

Model reasoning (mis. Qwen3) menghabiskan jatah token untuk berpikir tersembunyi sehingga jawaban kosong.
Isi `LLM_REASONING_EFFORT=none` untuk mematikannya. Kosongkan untuk model biasa.

Perlindungan di `app/api/chat/route.ts` dan `lib/guard.ts`: batas panjang pesan/riwayat, rate limit per IP
(`RATE_LIMIT_PER_10MIN`), batas chat bersamaan (`MAX_CONCURRENT`, penting karena satu model lokal), timeout 120 dtk.
Limit disimpan di memori proses, jadi jalankan satu proses saja.

## Deploy

Live di `https://staffku.fts-tech.co.id` (server NEWEST, Plesk).

1. `npm ci && npx next build` di server, `.env.production` berisi key (jangan di-commit).
2. `next start -H 127.0.0.1 -p 3200` di bawah systemd user service, user non-root.
3. Plesk: subdomain `staffku.fts-tech.co.id` -> nginx proxy ke `http://127.0.0.1:3200`,
   dengan `proxy_buffering off;` dan `proxy_read_timeout 300s;` agar streaming tidak tertahan.
