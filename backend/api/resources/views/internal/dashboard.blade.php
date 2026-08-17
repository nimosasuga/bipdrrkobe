<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DRRKOBE Internal Sales Dashboard</title>
    <style>
        *{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#0a0a0a;font-family:Inter,Arial,sans-serif}.shell{min-height:100vh}.top{background:#0a0a0a;color:#fff}.top-inner{max-width:1240px;margin:auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{font-weight:900;font-size:24px;letter-spacing:-.04em}.badge{margin-left:8px;background:#ffcc00;color:#000;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:900}.user{font-size:12px;color:#d4d4d8}.logout{border:1px solid #3f3f46;background:transparent;color:#fff;border-radius:999px;padding:9px 14px;font-weight:800;cursor:pointer}.main{max-width:1240px;margin:auto;padding:36px 24px 56px}.eyebrow{font:700 11px/1.5 monospace;letter-spacing:.12em;color:#71717a}.title{margin:6px 0 10px;font-size:36px;font-weight:900;letter-spacing:-.04em}.muted{margin:0;color:#71717a;font-size:14px;line-height:1.7}.section{margin-top:32px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:14px}.section-title{margin:0;font-size:20px;font-weight:900;letter-spacing:-.025em}.section-note{font-size:12px;color:#a1a1aa}.section-link{color:#0a0a0a;font-size:11px;font-weight:900;text-decoration:none}.section-link:hover{text-decoration:underline}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.metric{background:#fff;border:1px solid #e4e4e7;border-radius:20px;padding:20px}.metric-label{font:800 10px/1.4 monospace;letter-spacing:.11em;color:#71717a}.metric-value{margin-top:9px;font-size:34px;font-weight:900;letter-spacing:-.05em}.metric-sub{margin-top:5px;color:#a1a1aa;font-size:11px;line-height:1.5}.funnel{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.funnel-card{position:relative;background:#0a0a0a;color:#fff;border-radius:18px;padding:18px;min-height:116px}.funnel-card:after{content:'→';position:absolute;right:-9px;top:50%;z-index:2;transform:translateY(-50%);width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#ffcc00;color:#000;font-weight:900}.funnel-card:last-child:after{display:none}.funnel-label{font:700 9px/1.45 monospace;letter-spacing:.08em;color:#a1a1aa}.funnel-value{margin-top:12px;font-size:27px;font-weight:900}.priority{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.priority-card{display:block;color:inherit;text-decoration:none;border-radius:20px;padding:20px;border:1px solid #e4e4e7;background:#fff;transition:transform .15s ease,border-color .15s ease}.priority-card:hover{transform:translateY(-2px);border-color:#a1a1aa}.priority-card.hot{border-color:#fecaca;background:#fff7f7}.priority-card.warm{border-color:#fde68a;background:#fffbeb}.priority-card.monitor{border-color:#d4d4d8}.priority-card.pending{border-style:dashed}.priority-label{font-size:11px;font-weight:900;letter-spacing:.08em}.priority-value{margin-top:8px;font-size:30px;font-weight:900}.pipeline-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:12px}.pipeline-summary-card{background:#fff;border:1px solid #e4e4e7;border-radius:18px;padding:16px}.pipeline-summary-label{font:800 9px/1.4 monospace;letter-spacing:.1em;color:#71717a}.pipeline-summary-value{margin-top:6px;font-size:26px;font-weight:900}.pipeline{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.pipeline-card{display:block;color:inherit;text-decoration:none;position:relative;background:#fff;border:1px solid #e4e4e7;border-radius:18px;padding:17px;min-height:112px;transition:transform .15s ease,border-color .15s ease}.pipeline-card:hover{transform:translateY(-2px);border-color:#a1a1aa}.pipeline-card:after{content:'→';position:absolute;right:-9px;top:50%;z-index:2;transform:translateY(-50%);width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#0a0a0a;color:#ffcc00;font-weight:900}.pipeline-card:last-child:after{display:none}.pipeline-card.won{border-color:#bbf7d0;background:#f0fdf4}.pipeline-card.lost{border-color:#fecaca;background:#fff7f7}.pipeline-stage{font:800 9px/1.45 monospace;letter-spacing:.08em;color:#71717a}.pipeline-count{margin-top:10px;font-size:28px;font-weight:900}.pipeline-caption{margin-top:4px;font-size:10px;color:#a1a1aa;line-height:1.45}.table-wrap{overflow:hidden;border:1px solid #e4e4e7;border-radius:22px;background:#fff}.lead-table{width:100%;border-collapse:collapse;font-size:12px}.lead-table th{padding:13px 14px;text-align:left;background:#0a0a0a;color:#fff;font-size:10px;letter-spacing:.08em}.lead-table td{padding:14px;border-bottom:1px solid #f0f0f0;vertical-align:top}.lead-table tr:last-child td{border-bottom:0}.company{font-weight:900}.small{margin-top:4px;color:#71717a;font-size:11px;line-height:1.45}.score{font-size:20px;font-weight:900}.pill{display:inline-flex;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900;letter-spacing:.06em}.pill.hot{background:#fee2e2;color:#991b1b}.pill.warm{background:#fef3c7;color:#92400e}.pill.monitor{background:#e4e4e7;color:#3f3f46}.pill.pending{background:#f4f4f5;color:#71717a}.sales-status{display:inline-flex;border-radius:999px;background:#0a0a0a;color:#fff;padding:6px 9px;font-size:9px;font-weight:900;letter-spacing:.05em;white-space:nowrap}.reason{max-width:330px;color:#52525b;line-height:1.5}.wa{color:#0a0a0a;font-weight:800;text-decoration:none}.wa:hover{text-decoration:underline}.open-link{display:inline-flex;border-radius:999px;background:#ffcc00;color:#000;padding:7px 10px;font-size:9px;font-weight:900;text-decoration:none;white-space:nowrap}.open-link:hover{background:#f5c000}.empty{padding:28px;text-align:center;color:#a1a1aa}.footer{margin-top:30px;border-top:1px solid #e4e4e7;padding-top:18px;font-size:11px;color:#a1a1aa}.role{text-transform:uppercase}@media(max-width:980px){.metrics{grid-template-columns:repeat(2,1fr)}.funnel,.pipeline{grid-template-columns:repeat(3,1fr)}.funnel-card:nth-child(3):after,.pipeline-card:nth-child(3):after{display:none}.priority{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.top-inner{align-items:flex-start;flex-direction:column}.main{padding:28px 16px 44px}.title{font-size:30px}.metrics,.priority,.funnel,.pipeline,.pipeline-summary{grid-template-columns:1fr}.funnel-card:after,.pipeline-card:after{display:none}.table-wrap{overflow-x:auto}.lead-table{min-width:1080px}.section-head{align-items:flex-start;flex-direction:column}}
    </style>
</head>
<body>
<div class="shell">
    <header class="top">
        <div class="top-inner">
            <div>
                <span class="brand">DRRKOBE</span><span class="badge">INTERNAL</span>
                <div class="user">{{ $user->name }} · <span class="role">{{ $user->role }}</span></div>
            </div>
            <form method="POST" action="{{ route('internal.logout') }}">
                @csrf
                <button class="logout" type="submit">Keluar</button>
            </form>
        </div>
    </header>

    <main class="main">
        <div class="eyebrow">PHASE 8 · INTERNAL SALES INTELLIGENCE</div>
        <h1 class="title">Sales Overview</h1>
        <p class="muted">Ringkasan funnel diagnosis, conversion, prioritas teknis, dan progres follow-up sales berdasarkan data yang sudah tercatat.</p>

        <section class="section">
            <div class="metrics">
                <article class="metric">
                    <div class="metric-label">TOTAL LEADS</div>
                    <div class="metric-value">{{ number_format($totalLeads) }}</div>
                    <div class="metric-sub">Lead assessment yang tersimpan.</div>
                </article>
                <article class="metric">
                    <div class="metric-label">STARTED → LEAD</div>
                    <div class="metric-value">{{ number_format($startedToLeadRate, 1) }}%</div>
                    <div class="metric-sub">Conversion diagnosis dimulai menjadi lead.</div>
                </article>
                <article class="metric">
                    <div class="metric-label">LEAD → WHATSAPP</div>
                    <div class="metric-value">{{ number_format($leadToAssessmentRate, 1) }}%</div>
                    <div class="metric-sub">Lead yang melanjutkan request assessment.</div>
                </article>
                <article class="metric">
                    <div class="metric-label">HOT LEADS</div>
                    <div class="metric-value">{{ number_format($leadPriority['hot']) }}</div>
                    <div class="metric-sub">Prioritas follow-up tertinggi saat ini.</div>
                </article>
            </div>
        </section>

        <section class="section">
            <div class="section-head">
                <h2 class="section-title">Diagnosis Funnel</h2>
                <div class="section-note">Unique session count · test event dikecualikan</div>
            </div>
            <div class="funnel">
                @php
                    $funnelItems = [
                        ['Diagnosis Started', $eventCounts['diagnosis_started'] ?? 0],
                        ['Diagnosis Completed', $eventCounts['diagnosis_completed'] ?? 0],
                        ['Step 8 Viewed', $eventCounts['step_8_viewed'] ?? 0],
                        ['Lead Captured', $eventCounts['lead_captured'] ?? 0],
                        ['Report Downloaded', $eventCounts['report_downloaded'] ?? 0],
                        ['Assessment Clicked', $eventCounts['assessment_clicked'] ?? 0],
                    ];
                @endphp
                @foreach($funnelItems as [$label, $value])
                    <article class="funnel-card">
                        <div class="funnel-label">{{ strtoupper($label) }}</div>
                        <div class="funnel-value">{{ number_format($value) }}</div>
                    </article>
                @endforeach
            </div>
        </section>

        <section class="section">
            <div class="section-head">
                <h2 class="section-title">Lead Priority</h2>
                <a class="section-link" href="{{ route('internal.leads.index') }}">ALL LEADS →</a>
            </div>
            <div class="priority">
                <a class="priority-card hot" href="{{ route('internal.leads.index', ['priority' => 'hot']) }}"><div class="priority-label">HOT</div><div class="priority-value">{{ number_format($leadPriority['hot']) }}</div></a>
                <a class="priority-card warm" href="{{ route('internal.leads.index', ['priority' => 'warm']) }}"><div class="priority-label">WARM</div><div class="priority-value">{{ number_format($leadPriority['warm']) }}</div></a>
                <a class="priority-card monitor" href="{{ route('internal.leads.index', ['priority' => 'monitor']) }}"><div class="priority-label">MONITOR</div><div class="priority-value">{{ number_format($leadPriority['monitor']) }}</div></a>
                <a class="priority-card pending" href="{{ route('internal.leads.index', ['priority' => 'pending']) }}"><div class="priority-label">PENDING</div><div class="priority-value">{{ number_format($leadPriority['pending']) }}</div></a>
            </div>
        </section>

        <section class="section">
            <div class="section-head">
                <h2 class="section-title">Sales Pipeline</h2>
                <div class="section-note">Klik tahap untuk membuka lead pada status tersebut</div>
            </div>

            <div class="pipeline-summary">
                <article class="pipeline-summary-card">
                    <div class="pipeline-summary-label">OPEN PIPELINE</div>
                    <div class="pipeline-summary-value">{{ number_format($openPipeline) }}</div>
                </article>
                <article class="pipeline-summary-card">
                    <div class="pipeline-summary-label">CLOSED</div>
                    <div class="pipeline-summary-value">{{ number_format($closedPipeline) }}</div>
                </article>
                <article class="pipeline-summary-card">
                    <div class="pipeline-summary-label">WON RATE</div>
                    <div class="pipeline-summary-value">{{ number_format($wonRate, 1) }}%</div>
                </article>
            </div>

            @php
                $pipelineItems = [
                    ['New', 'new', $salesPipeline['new'] ?? 0, 'Belum di-follow-up'],
                    ['Contacted', 'contacted', $salesPipeline['contacted'] ?? 0, 'PIC sudah dihubungi'],
                    ['Assessment', 'assessment_scheduled', $salesPipeline['assessment_scheduled'] ?? 0, 'Jadwal assessment tersedia'],
                    ['Proposal', 'proposal', $salesPipeline['proposal'] ?? 0, 'Masuk tahap proposal'],
                    ['Won', 'won', $salesPipeline['won'] ?? 0, 'Deal berhasil'],
                    ['Lost', 'lost', $salesPipeline['lost'] ?? 0, 'Deal tidak berlanjut'],
                ];
            @endphp

            <div class="pipeline">
                @foreach($pipelineItems as [$label, $class, $value, $caption])
                    <a class="pipeline-card {{ $class }}" href="{{ route('internal.leads.index', ['status' => $class]) }}">
                        <div class="pipeline-stage">{{ strtoupper($label) }}</div>
                        <div class="pipeline-count">{{ number_format($value) }}</div>
                        <div class="pipeline-caption">{{ $caption }}</div>
                    </a>
                @endforeach
            </div>
        </section>

        <section class="section">
            <div class="section-head">
                <h2 class="section-title">Lead Prioritas Terbaru</h2>
                <a class="section-link" href="{{ route('internal.leads.index') }}">LIHAT SEMUA →</a>
            </div>
            <div class="table-wrap">
                @if($recentLeads->isEmpty())
                    <div class="empty">Belum ada lead tersimpan.</div>
                @else
                    <table class="lead-table">
                        <thead>
                            <tr>
                                <th>PRIORITY</th>
                                <th>SALES STATUS</th>
                                <th>COMPANY / SITE</th>
                                <th>PIC</th>
                                <th>MODEL</th>
                                <th>FLEET</th>
                                <th>HEALTH</th>
                                <th>REASON</th>
                                <th>CAPTURED</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($recentLeads as $lead)
                                @php
                                    $priority = in_array($lead->lead_score, ['hot', 'warm', 'monitor'], true) ? $lead->lead_score : 'pending';
                                    $salesStatus = in_array($lead->status, ['new', 'contacted', 'assessment_scheduled', 'proposal', 'won', 'lost'], true) ? $lead->status : 'new';
                                @endphp
                                <tr>
                                    <td><span class="pill {{ $priority }}">{{ strtoupper($priority) }}</span></td>
                                    <td><span class="sales-status">{{ strtoupper(str_replace('_', ' ', $salesStatus)) }}</span></td>
                                    <td><div class="company">{{ $lead->perusahaan }}</div><div class="small">{{ $lead->kota ?: '-' }}</div></td>
                                    <td><div>{{ $lead->nama }}</div><div class="small"><a class="wa" href="https://wa.me/{{ $lead->whatsapp }}" target="_blank" rel="noopener noreferrer">{{ $lead->whatsapp }}</a></div></td>
                                    <td>{{ $lead->model ?: '-' }}</td>
                                    <td>{{ number_format($lead->jumlah_forklift ?? 0) }} unit</td>
                                    <td><span class="score">{{ $lead->health_score ?? '-' }}{{ $lead->health_score !== null ? '%' : '' }}</span></td>
                                    <td class="reason">{{ $lead->qualification_reason ?: ($lead->qualification_status === 'failed' ? 'Qualification gagal. Perlu pemeriksaan manual.' : 'Menunggu qualification.') }}</td>
                                    <td>{{ optional($lead->created_at)->format('d M Y H:i') }}</td>
                                    <td><a class="open-link" href="{{ route('internal.leads.show', $lead) }}">OPEN →</a></td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endif
            </div>
        </section>

        <div class="footer">DRRKOBE · Internal Sales Intelligence · Access controlled</div>
    </main>
</div>
</body>
</html>
