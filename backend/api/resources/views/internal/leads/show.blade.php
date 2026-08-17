<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $lead->perusahaan }} · DRRKOBE Internal</title>
    <style>
        *{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#0a0a0a;font-family:Inter,Arial,sans-serif}.top{background:#0a0a0a;color:#fff}.top-inner{max-width:1240px;margin:auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{font-weight:900;font-size:24px;letter-spacing:-.04em}.badge{margin-left:8px;background:#ffcc00;color:#000;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:900}.user{font-size:12px;color:#d4d4d8}.actions{display:flex;align-items:center;gap:10px}.btn,.logout{border-radius:999px;padding:9px 14px;font-weight:800;font-size:12px;text-decoration:none;cursor:pointer}.btn{background:#ffcc00;color:#000;border:1px solid #ffcc00}.logout{border:1px solid #3f3f46;background:transparent;color:#fff}.main{max-width:1240px;margin:auto;padding:34px 24px 56px}.eyebrow{font:700 11px/1.5 monospace;letter-spacing:.12em;color:#71717a}.hero{margin-top:8px;display:flex;align-items:flex-end;justify-content:space-between;gap:24px}.title{margin:0;font-size:38px;font-weight:900;letter-spacing:-.045em}.sub{margin-top:8px;color:#71717a;font-size:14px}.badges{display:flex;flex-wrap:wrap;gap:8px}.pill{display:inline-flex;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:900;letter-spacing:.05em}.pill.hot{background:#fee2e2;color:#991b1b}.pill.warm{background:#fef3c7;color:#92400e}.pill.monitor{background:#e4e4e7;color:#3f3f46}.pill.pending{background:#f4f4f5;color:#71717a}.pill.status{background:#0a0a0a;color:#fff}.pill.overdue{background:#fee2e2;color:#991b1b}.pill.today{background:#fef3c7;color:#92400e}.pill.scheduled{background:#ecfdf5;color:#065f46}.pill.unscheduled{background:#f4f4f5;color:#71717a}.grid{margin-top:26px;display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.stack{display:grid;gap:18px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:22px;padding:22px}.card h2{margin:0;font-size:18px;font-weight:900;letter-spacing:-.025em}.card-note{margin-top:6px;color:#71717a;font-size:12px;line-height:1.6}.kpis{margin-top:18px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.kpi{border-radius:16px;background:#fafafa;border:1px solid #eee;padding:14px}.kpi-label{font:700 9px/1.45 monospace;letter-spacing:.08em;color:#71717a}.kpi-value{margin-top:7px;font-size:19px;font-weight:900}.kv{margin-top:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.kv-item{border-top:1px solid #ececec;padding-top:10px}.kv-label{font-size:10px;font-weight:800;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em}.kv-value{margin-top:5px;font-size:13px;font-weight:800;line-height:1.5}.wa{color:#0a0a0a;text-decoration:none}.wa:hover{text-decoration:underline}.summary{margin-top:16px;padding:16px;border-radius:16px;background:#0a0a0a;color:#fff}.summary-label{font:800 9px/1.5 monospace;letter-spacing:.1em;color:#ffcc00}.summary p{margin:8px 0 0;color:#d4d4d8;font-size:13px;line-height:1.7}.reason{margin-top:14px;padding:14px;border-radius:16px;background:#fffbeb;border:1px solid #fde68a;font-size:12px;line-height:1.6}.issues{margin:14px 0 0;padding-left:18px;color:#52525b;font-size:12px;line-height:1.7}.follow-box{margin-top:16px;border-radius:16px;border:1px solid #e4e4e7;background:#fafafa;padding:14px}.follow-date{margin-top:7px;font-size:18px;font-weight:900}.follow-meta{margin-top:5px;color:#71717a;font-size:11px;line-height:1.5}.form{margin-top:18px;display:grid;gap:13px}.label{font-size:11px;font-weight:900}.select,.textarea,.datetime{margin-top:6px;width:100%;border:1px solid #d4d4d8;border-radius:12px;background:#fff;padding:11px 12px;font:inherit;color:#0a0a0a;outline:none}.select:focus,.textarea:focus,.datetime:focus{border-color:#ffcc00;box-shadow:0 0 0 3px rgba(255,204,0,.18)}.textarea{min-height:100px;resize:vertical}.submit{border:0;border-radius:999px;background:#0a0a0a;color:#fff;padding:12px 16px;font-weight:900;cursor:pointer}.flash{margin-top:16px;border-radius:14px;background:#ecfdf5;border:1px solid #a7f3d0;padding:12px 14px;color:#065f46;font-size:12px;font-weight:800}.error{margin-top:12px;border-radius:14px;background:#fef2f2;border:1px solid #fecaca;padding:12px 14px;color:#991b1b;font-size:12px}.timeline{margin-top:16px;display:grid;gap:12px}.timeline-item{position:relative;border-left:3px solid #ffcc00;padding:2px 0 2px 14px}.timeline-title{font-size:12px;font-weight:900}.timeline-meta{margin-top:4px;color:#71717a;font-size:11px;line-height:1.5}.timeline-note{margin-top:6px;color:#3f3f46;font-size:12px;line-height:1.6}.empty{margin-top:14px;color:#a1a1aa;font-size:12px}.footer{margin-top:30px;border-top:1px solid #e4e4e7;padding-top:18px;font-size:11px;color:#a1a1aa}@media(max-width:900px){.grid{grid-template-columns:1fr}.kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.top-inner{align-items:flex-start;flex-direction:column}.actions{width:100%;justify-content:space-between}.main{padding:28px 16px 44px}.hero{align-items:flex-start;flex-direction:column}.title{font-size:30px}.kpis,.kv{grid-template-columns:1fr}}
    </style>
</head>
<body>
@php
    $statusLabels = [
        'new' => 'New',
        'contacted' => 'Contacted',
        'assessment_scheduled' => 'Assessment Scheduled',
        'proposal' => 'Proposal',
        'won' => 'Won',
        'lost' => 'Lost',
    ];
    $diagnosis = $lead->diagnosis;
    $model = $diagnosis?->forkliftModel;
    $brand = $model?->brand;
    $issues = collect(explode('|', (string) $lead->masalah_text))->map(fn($item) => trim($item))->filter();
    $currentStatus = array_key_exists($lead->status, $statusLabels) ? $lead->status : 'new';
    $isClosed = in_array($currentStatus, ['won', 'lost'], true);
    $nextLocal = $lead->next_follow_up_at?->copy()->timezone('Asia/Jakarta');
    $lastLocal = $lead->last_follow_up_at?->copy()->timezone('Asia/Jakarta');
    $followClass = 'unscheduled';
    $followLabel = $isClosed ? 'CLOSED' : 'UNSCHEDULED';
    if (!$isClosed && $nextLocal) {
        if ($nextLocal->lt($nowJakarta)) {
            $followClass = 'overdue';
            $followLabel = 'OVERDUE';
        } elseif ($nextLocal->isSameDay($nowJakarta)) {
            $followClass = 'today';
            $followLabel = 'DUE TODAY';
        } else {
            $followClass = 'scheduled';
            $followLabel = 'SCHEDULED';
        }
    }
@endphp
<header class="top">
    <div class="top-inner">
        <div>
            <span class="brand">DRRKOBE</span><span class="badge">INTERNAL</span>
            <div class="user">{{ $user->name }} · {{ strtoupper($user->role) }}</div>
        </div>
        <div class="actions">
            <a class="btn" href="{{ route('internal.leads.index') }}">← All Leads</a>
            <form method="POST" action="{{ route('internal.logout') }}">
                @csrf
                <button class="logout" type="submit">Keluar</button>
            </form>
        </div>
    </div>
</header>

<main class="main">
    <div class="eyebrow">PHASE 8 · LEAD DETAIL · FOLLOW-UP CONTROL</div>
    <div class="hero">
        <div>
            <h1 class="title">{{ $lead->perusahaan }}</h1>
            <div class="sub">{{ $lead->kota ?: '-' }} · {{ $lead->nama }} · captured {{ optional($lead->created_at)->timezone('Asia/Jakarta')->format('d M Y H:i') }}</div>
        </div>
        <div class="badges">
            <span class="pill {{ $priority }}">{{ strtoupper($priority) }}</span>
            <span class="pill status">{{ strtoupper($statusLabels[$currentStatus]) }}</span>
            <span class="pill {{ $followClass }}">{{ $followLabel }}</span>
        </div>
    </div>

    @if(session('status'))<div class="flash">{{ session('status') }}</div>@endif
    @if($errors->any())<div class="error">{{ $errors->first() }}</div>@endif

    <div class="grid">
        <div class="stack">
            <section class="card">
                <h2>Lead & Diagnosis</h2>
                <p class="card-note">Ringkasan data assessment dan bukti diagnosis yang tersedia untuk follow-up internal.</p>
                <div class="kpis">
                    <div class="kpi"><div class="kpi-label">HEALTH SCORE</div><div class="kpi-value">{{ $lead->health_score ?? '-' }}{{ $lead->health_score !== null ? '%' : '' }}</div></div>
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
                    <div class="kv-item"><div class="kv-label">Confidence</div><div class="kv-value">{{ $diagnosis?->ai_confidence ?? $diagnosis?->confidence ?? '-' }}{{ ($diagnosis?->ai_confidence ?? $diagnosis?->confidence) !== null ? '%' : '' }}</div></div>
                    <div class="kv-item"><div class="kv-label">Urgency</div><div class="kv-value">{{ $diagnosis?->ai_urgency ?: '-' }}</div></div>
                </div>

                @if($issues->isNotEmpty())
                    <div class="reason"><strong>Masalah yang dilaporkan</strong><ul class="issues">@foreach($issues as $issue)<li>{{ $issue }}</li>@endforeach</ul></div>
                @endif
                <div class="reason"><strong>Qualification reason</strong><br>{{ $lead->qualification_reason ?: 'Belum tersedia / menunggu qualification.' }}</div>
                @if($lead->ai_summary)<div class="summary"><div class="summary-label">DIAGNOSTIC SUMMARY</div><p>{{ $lead->ai_summary }}</p></div>@endif
            </section>

            <section class="card">
                <h2>Follow-up History</h2>
                <p class="card-note">Setiap perubahan status, catatan, dan jadwal follow-up dicatat sebagai activity trail.</p>
                @if($lead->activities->isEmpty())
                    <div class="empty">Belum ada aktivitas follow-up internal.</div>
                @else
                    <div class="timeline">
                        @foreach($lead->activities as $activity)
                            @php $meta = is_array($activity->metadata_json) ? $activity->metadata_json : []; @endphp
                            <div class="timeline-item">
                                <div class="timeline-title">
                                    @if($activity->event === 'sales_status_updated')
                                        {{ strtoupper($statusLabels[$meta['from'] ?? 'new'] ?? ($meta['from'] ?? 'NEW')) }} → {{ strtoupper($statusLabels[$meta['to'] ?? 'new'] ?? ($meta['to'] ?? 'NEW')) }}
                                    @else
                                        {{ strtoupper(str_replace('_', ' ', $activity->event)) }}
                                    @endif
                                </div>
                                <div class="timeline-meta">{{ optional($activity->created_at)->timezone('Asia/Jakarta')->format('d M Y H:i') }} · {{ $meta['user_name'] ?? 'system' }}{{ !empty($meta['user_role']) ? ' · '.strtoupper($meta['user_role']) : '' }}</div>
                                @if(!empty($meta['next_follow_up_at']))<div class="timeline-meta">Next follow-up: {{ \Illuminate\Support\Carbon::parse($meta['next_follow_up_at'])->timezone('Asia/Jakarta')->format('d M Y H:i') }}</div>@endif
                                @if(!empty($meta['note']))<div class="timeline-note">{{ $meta['note'] }}</div>@endif
                            </div>
                        @endforeach
                    </div>
                @endif
            </section>
        </div>

        <aside class="stack">
            <section class="card">
                <h2>Follow-up Control</h2>
                <p class="card-note">Jadwalkan tindakan berikutnya. Lead WON/LOST otomatis menutup jadwal aktif.</p>

                <div class="follow-box">
                    <span class="pill {{ $followClass }}">{{ $followLabel }}</span>
                    <div class="follow-date">{{ $nextLocal ? $nextLocal->format('d M Y H:i') : ($isClosed ? 'Pipeline ditutup' : 'Belum dijadwalkan') }}</div>
                    <div class="follow-meta">Last follow-up: {{ $lastLocal ? $lastLocal->format('d M Y H:i') : 'belum ada' }}</div>
                </div>

                <form class="form" method="POST" action="{{ route('internal.leads.status', $lead) }}">
                    @csrf
                    <label class="label">Status
                        <select class="select" name="status" required>
                            @foreach($statuses as $status)<option value="{{ $status }}" @selected($currentStatus === $status)>{{ $statusLabels[$status] }}</option>@endforeach
                        </select>
                    </label>
                    <label class="label">Next follow-up
                        <input class="datetime" type="datetime-local" name="next_follow_up_at" value="{{ old('next_follow_up_at', $nextLocal?->format('Y-m-d\TH:i')) }}">
                    </label>
                    <label class="label">Catatan follow-up
                        <textarea class="textarea" name="note" maxlength="1000" placeholder="Contoh: PIC sudah dihubungi. Follow-up kembali setelah approval internal.">{{ old('note') }}</textarea>
                    </label>
                    <button class="submit" type="submit">Simpan Follow-up</button>
                </form>
            </section>

            <section class="card">
                <h2>Traceability</h2>
                <div class="kv">
                    <div class="kv-item"><div class="kv-label">Lead ID</div><div class="kv-value">{{ $lead->id }}</div></div>
                    <div class="kv-item"><div class="kv-label">Diagnosis ID</div><div class="kv-value">{{ $lead->diagnosis_id ?: '-' }}</div></div>
                    <div class="kv-item"><div class="kv-label">Session ID</div><div class="kv-value">{{ $lead->session_id ?: '-' }}</div></div>
                    <div class="kv-item"><div class="kv-label">Qualification</div><div class="kv-value">{{ strtoupper($lead->qualification_status ?: 'pending') }}</div></div>
                </div>
            </section>
        </aside>
    </div>

    <div class="footer">DRRKOBE · Internal Sales Intelligence · Follow-up traceability</div>
</main>
</body>
</html>
