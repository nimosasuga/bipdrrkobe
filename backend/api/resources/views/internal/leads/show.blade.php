<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $lead->perusahaan }} · DRRKOBE Internal</title>
    <style>
        *{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#0a0a0a;font-family:Inter,Arial,sans-serif}.top{background:#0a0a0a;color:#fff}.top-inner{max-width:1180px;margin:auto;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;gap:18px}.brand{font-size:24px;font-weight:900;letter-spacing:-.04em}.badge{margin-left:8px;background:#ffcc00;color:#000;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:900}.user{margin-top:4px;color:#d4d4d8;font-size:12px}.actions{display:flex;gap:10px;align-items:center}.btn,.logout{border-radius:999px;padding:9px 14px;font-size:12px;font-weight:800;text-decoration:none}.btn{background:#ffcc00;color:#000}.logout{border:1px solid #3f3f46;background:transparent;color:#fff;cursor:pointer}.main{max-width:1180px;margin:auto;padding:34px 24px 56px}.eyebrow{font:800 11px/1.5 monospace;letter-spacing:.11em;color:#71717a}.hero{margin-top:6px;display:flex;justify-content:space-between;align-items:flex-end;gap:18px}.title{margin:0;font-size:38px;font-weight:900;letter-spacing:-.045em}.sub{margin-top:8px;color:#71717a;font-size:13px}.badges{display:flex;gap:8px;flex-wrap:wrap}.pill{display:inline-flex;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:900}.pill.new{background:#f4f4f5;color:#52525b}.pill.follow_up{background:#fef3c7;color:#92400e}.pill.deal{background:#dcfce7;color:#166534}.pill.lost{background:#fee2e2;color:#991b1b}.pill.hot{background:#fee2e2;color:#991b1b}.pill.warm{background:#fef3c7;color:#92400e}.pill.monitor{background:#e4e4e7;color:#3f3f46}.pill.pending{background:#f4f4f5;color:#71717a}.grid{margin-top:24px;display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.stack{display:grid;gap:18px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:22px;padding:22px}.card h2{margin:0;font-size:18px;font-weight:900}.note{margin-top:6px;color:#71717a;font-size:12px;line-height:1.6}.kpis{margin-top:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.kpi{background:#fafafa;border:1px solid #eee;border-radius:16px;padding:14px}.kpi-label{font:800 9px/1.4 monospace;letter-spacing:.08em;color:#71717a}.kpi-value{margin-top:6px;font-size:19px;font-weight:900}.kv{margin-top:16px;display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.kv-item{border-top:1px solid #ececec;padding-top:10px}.kv-label{font-size:10px;font-weight:800;color:#a1a1aa;text-transform:uppercase}.kv-value{margin-top:5px;font-size:13px;font-weight:800;line-height:1.5}.wa{color:#0a0a0a;text-decoration:none}.wa:hover{text-decoration:underline}.reason{margin-top:14px;padding:14px;border-radius:16px;background:#fffbeb;border:1px solid #fde68a;font-size:12px;line-height:1.65}.issues{margin:8px 0 0;padding-left:18px}.summary{margin-top:14px;padding:16px;border-radius:16px;background:#0a0a0a;color:#fff}.summary-label{font:800 9px/1.5 monospace;letter-spacing:.1em;color:#ffcc00}.summary p{margin:8px 0 0;color:#d4d4d8;font-size:13px;line-height:1.7}.form{margin-top:16px;display:grid;gap:12px}.label{font-size:11px;font-weight:900}.select,.textarea{margin-top:6px;width:100%;border:1px solid #d4d4d8;border-radius:12px;background:#fff;padding:11px 12px;font:inherit}.textarea{min-height:110px;resize:vertical}.submit{border:0;border-radius:999px;background:#0a0a0a;color:#fff;padding:12px 16px;font-weight:900;cursor:pointer}.flash{margin-top:16px;border-radius:14px;background:#ecfdf5;border:1px solid #a7f3d0;padding:12px 14px;color:#065f46;font-size:12px;font-weight:800}.error{margin-top:12px;border-radius:14px;background:#fef2f2;border:1px solid #fecaca;padding:12px 14px;color:#991b1b;font-size:12px}.timeline{margin-top:16px;display:grid;gap:12px}.timeline-item{border-left:3px solid #ffcc00;padding:2px 0 2px 14px}.timeline-title{font-size:12px;font-weight:900}.timeline-meta{margin-top:4px;color:#71717a;font-size:11px}.timeline-note{margin-top:6px;color:#3f3f46;font-size:12px;line-height:1.6}.empty{margin-top:14px;color:#a1a1aa;font-size:12px}.footer{margin-top:30px;border-top:1px solid #e4e4e7;padding-top:18px;color:#a1a1aa;font-size:11px}@media(max-width:900px){.grid{grid-template-columns:1fr}.kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.top-inner{align-items:flex-start;flex-direction:column}.actions{width:100%;justify-content:space-between}.main{padding:28px 16px 44px}.hero{align-items:flex-start;flex-direction:column}.title{font-size:30px}.kpis,.kv{grid-template-columns:1fr}}
    </style>
</head>
<body>
@php
    $statusLabels = [
        'new' => 'NEW',
        'follow_up' => 'FOLLOW-UP',
        'deal' => 'DEAL',
        'lost' => 'LOST',
        'contacted' => 'FOLLOW-UP',
        'assessment_scheduled' => 'FOLLOW-UP',
        'proposal' => 'FOLLOW-UP',
        'won' => 'DEAL',
    ];
    $normalizeHistoryStatus = function (?string $value): string {
        if (in_array($value, ['follow_up','contacted','assessment_scheduled','proposal'], true)) return 'follow_up';
        if (in_array($value, ['deal','won'], true)) return 'deal';
        if ($value === 'lost') return 'lost';
        return 'new';
    };
    $diagnosis = $lead->diagnosis;
    $model = $diagnosis?->forkliftModel;
    $brand = $model?->brand;
    $issues = collect(explode('|', (string) $lead->masalah_text))->map(fn($item) => trim($item))->filter();
@endphp
<header class="top">
    <div class="top-inner">
        <div><span class="brand">DRRKOBE</span><span class="badge">INTERNAL</span><div class="user">{{ $user->name }} · {{ strtoupper($user->role) }}</div></div>
        <div class="actions"><a class="btn" href="{{ route('internal.leads.index') }}">← Leads</a><form method="POST" action="{{ route('internal.logout') }}">@csrf<button class="logout" type="submit">Keluar</button></form></div>
    </div>
</header>

<main class="main">
    <div class="eyebrow">LEAD DETAIL</div>
    <div class="hero">
        <div><h1 class="title">{{ $lead->perusahaan }}</h1><div class="sub">{{ $lead->kota ?: '-' }} · {{ $lead->nama }} · {{ optional($lead->created_at)->timezone('Asia/Jakarta')->format('d M Y H:i') }}</div></div>
        <div class="badges"><span class="pill {{ $currentStatus }}">{{ $statusLabels[$currentStatus] }}</span><span class="pill {{ $priority }}">{{ strtoupper($priority) }}</span></div>
    </div>

    @if(session('status'))<div class="flash">{{ session('status') }}</div>@endif
    @if($errors->any())<div class="error">{{ $errors->first() }}</div>@endif

    <div class="grid">
        <div class="stack">
            <section class="card">
                <h2>Assessment</h2>
                <p class="note">Data utama untuk membantu Anda menentukan cara follow-up customer.</p>
                <div class="kpis">
                    <div class="kpi"><div class="kpi-label">HEALTH SCORE</div><div class="kpi-value">{{ $lead->health_score !== null ? $lead->health_score.'%' : '-' }}</div></div>
                    <div class="kpi"><div class="kpi-label">FLEET</div><div class="kpi-value">{{ number_format($lead->jumlah_forklift ?? 0) }} unit</div></div>
                    <div class="kpi"><div class="kpi-label">OPERATING HOURS</div><div class="kpi-value">{{ $lead->jam_operasional ?? '-' }} jam</div></div>
                    <div class="kpi"><div class="kpi-label">PRIORITY</div><div class="kpi-value">{{ strtoupper($priority) }}</div></div>
                </div>

                <div class="kv">
                    <div class="kv-item"><div class="kv-label">PIC</div><div class="kv-value">{{ $lead->nama }}</div></div>
                    <div class="kv-item"><div class="kv-label">WhatsApp</div><div class="kv-value"><a class="wa" href="https://wa.me/{{ $lead->whatsapp }}" target="_blank" rel="noopener noreferrer">{{ $lead->whatsapp }} ↗</a></div></div>
                    <div class="kv-item"><div class="kv-label">Brand / Model</div><div class="kv-value">{{ $brand?->name ?: '-' }} · {{ $lead->model ?: ($model?->model_code ?: '-') }}</div></div>
                    <div class="kv-item"><div class="kv-label">Battery</div><div class="kv-value">{{ $lead->battery_type ?: '-' }}</div></div>
                    <div class="kv-item"><div class="kv-label">Shift</div><div class="kv-value">{{ $diagnosis?->shift ?? '-' }} shift/hari</div></div>
                    <div class="kv-item"><div class="kv-label">Umur Battery</div><div class="kv-value">{{ $diagnosis?->umur_battery ?? '-' }} tahun</div></div>
                </div>

                @if($issues->isNotEmpty())<div class="reason"><strong>Masalah yang dilaporkan</strong><ul class="issues">@foreach($issues as $issue)<li>{{ $issue }}</li>@endforeach</ul></div>@endif
                <div class="reason"><strong>Qualification reason</strong><br>{{ $lead->qualification_reason ?: 'Belum tersedia.' }}</div>
                @if($lead->ai_summary)<div class="summary"><div class="summary-label">ASSESSMENT SUMMARY</div><p>{{ $lead->ai_summary }}</p></div>@endif
            </section>

            <section class="card">
                <h2>History</h2>
                <p class="note">Catatan perubahan status lead.</p>
                @if($lead->activities->isEmpty())
                    <div class="empty">Belum ada catatan follow-up.</div>
                @else
                    <div class="timeline">
                        @foreach($lead->activities as $activity)
                            @php
                                $meta = is_array($activity->metadata_json) ? $activity->metadata_json : [];
                                $from = $normalizeHistoryStatus($meta['from'] ?? 'new');
                                $to = $normalizeHistoryStatus($meta['to'] ?? 'new');
                            @endphp
                            <div class="timeline-item">
                                <div class="timeline-title">@if($activity->event === 'sales_status_updated'){{ $statusLabels[$from] }} → {{ $statusLabels[$to] }}@else{{ strtoupper(str_replace('_',' ',$activity->event)) }}@endif</div>
                                <div class="timeline-meta">{{ optional($activity->created_at)->timezone('Asia/Jakarta')->format('d M Y H:i') }} · {{ $meta['user_name'] ?? 'system' }}</div>
                                @if(!empty($meta['note']))<div class="timeline-note">{{ $meta['note'] }}</div>@endif
                            </div>
                        @endforeach
                    </div>
                @endif
            </section>
        </div>

        <aside class="stack">
            <section class="card">
                <h2>Update Lead</h2>
                <p class="note">Setelah Anda menghubungi customer, cukup ubah status dan tulis catatan singkat.</p>
                <form class="form" method="POST" action="{{ route('internal.leads.status', $lead) }}">
                    @csrf
                    <label class="label">Status
                        <select class="select" name="status" required>
                            @foreach($statuses as $status)<option value="{{ $status }}" @selected($currentStatus === $status)>{{ $statusLabels[$status] }}</option>@endforeach
                        </select>
                    </label>
                    <label class="label">Catatan
                        <textarea class="textarea" name="note" maxlength="1000" placeholder="Contoh: PIC sudah dihubungi, lanjut diskusi kebutuhan battery."></textarea>
                    </label>
                    <button class="submit" type="submit">Simpan</button>
                </form>
            </section>

            <section class="card">
                <h2>Kontak Cepat</h2>
                <p class="note">Hubungi PIC langsung melalui WhatsApp.</p>
                <div style="margin-top:14px"><a class="btn" href="https://wa.me/{{ $lead->whatsapp }}" target="_blank" rel="noopener noreferrer">Buka WhatsApp →</a></div>
            </section>
        </aside>
    </div>

    <div class="footer">DRRKOBE · BIP Lead Detail</div>
</main>
</body>
</html>
