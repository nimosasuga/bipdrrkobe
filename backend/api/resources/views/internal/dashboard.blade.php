<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DRRKOBE BIP Conversion Dashboard</title>
    <style>
        *{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#0a0a0a;font-family:Inter,Arial,sans-serif}.top{background:#0a0a0a;color:#fff}.top-inner{max-width:1180px;margin:auto;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;gap:18px}.brand{font-size:24px;font-weight:900;letter-spacing:-.04em}.badge{margin-left:8px;background:#ffcc00;color:#000;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:900}.user{margin-top:4px;color:#d4d4d8;font-size:12px}.logout{border:1px solid #3f3f46;background:transparent;color:#fff;border-radius:999px;padding:9px 14px;font-weight:800;cursor:pointer}.main{max-width:1180px;margin:auto;padding:34px 24px 56px}.eyebrow{font:800 11px/1.5 monospace;letter-spacing:.11em;color:#71717a}.title{margin:6px 0 8px;font-size:38px;font-weight:900;letter-spacing:-.045em}.muted{margin:0;color:#71717a;font-size:14px;line-height:1.7}.flow{margin-top:26px;display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.flow-card{position:relative;background:#0a0a0a;color:#fff;border-radius:18px;padding:18px;min-height:112px}.flow-card:after{content:'→';position:absolute;right:-9px;top:50%;transform:translateY(-50%);width:20px;height:20px;border-radius:50%;background:#ffcc00;color:#000;display:grid;place-items:center;font-weight:900}.flow-card:last-child:after{display:none}.flow-label{font:800 9px/1.4 monospace;letter-spacing:.08em;color:#a1a1aa}.flow-value{margin-top:10px;font-size:30px;font-weight:900}.section{margin-top:30px}.section-head{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:12px}.section-title{margin:0;font-size:20px;font-weight:900}.section-note{font-size:11px;color:#71717a}.link{font-size:11px;font-weight:900;color:#0a0a0a;text-decoration:none}.link:hover{text-decoration:underline}.status-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.status-card{display:block;text-decoration:none;color:inherit;background:#fff;border:1px solid #e4e4e7;border-radius:20px;padding:20px}.status-card.follow_up{border-color:#fde68a;background:#fffbeb}.status-card.deal{border-color:#bbf7d0;background:#f0fdf4}.status-card.lost{border-color:#fecaca;background:#fff7f7}.status-label{font:900 10px/1.4 monospace;letter-spacing:.08em;color:#71717a}.status-value{margin-top:8px;font-size:32px;font-weight:900}.summary{margin-top:12px;background:#fff;border:1px solid #e4e4e7;border-radius:20px;padding:18px;display:flex;justify-content:space-between;gap:16px;align-items:center}.summary strong{font-size:15px}.deal-rate{font-size:28px;font-weight:900}.table-wrap{overflow:hidden;border:1px solid #e4e4e7;border-radius:20px;background:#fff}.table{width:100%;border-collapse:collapse;font-size:12px}.table th{background:#0a0a0a;color:#fff;text-align:left;padding:12px 14px;font-size:10px;letter-spacing:.07em}.table td{padding:14px;border-bottom:1px solid #f0f0f0;vertical-align:top}.table tr:last-child td{border-bottom:0}.company{font-weight:900}.small{margin-top:4px;color:#71717a;font-size:11px}.pill{display:inline-flex;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900}.pill.new{background:#f4f4f5;color:#52525b}.pill.follow_up{background:#fef3c7;color:#92400e}.pill.deal{background:#dcfce7;color:#166534}.pill.lost{background:#fee2e2;color:#991b1b}.priority{font-weight:900}.open{display:inline-flex;border-radius:999px;background:#ffcc00;color:#000;padding:7px 10px;font-size:9px;font-weight:900;text-decoration:none}.empty{padding:28px;text-align:center;color:#a1a1aa}.source{font-weight:900}.campaign{font-weight:800}.footer{margin-top:30px;border-top:1px solid #e4e4e7;padding-top:18px;color:#a1a1aa;font-size:11px}@media(max-width:1000px){.flow{grid-template-columns:repeat(3,1fr)}.flow-card:nth-child(3):after{display:none}}@media(max-width:900px){.status-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.top-inner{align-items:flex-start;flex-direction:column}.main{padding:28px 16px 44px}.title{font-size:30px}.flow,.status-grid{grid-template-columns:1fr}.flow-card:after{display:none}.table-wrap{overflow-x:auto}.table{min-width:760px}.summary{align-items:flex-start;flex-direction:column}}
    </style>
</head>
<body>
@php
    $statusMap = function (?string $status): string {
        if (in_array($status, ['follow_up','contacted','assessment_scheduled','proposal'], true)) return 'follow_up';
        if (in_array($status, ['deal','won'], true)) return 'deal';
        if ($status === 'lost') return 'lost';
        return 'new';
    };
@endphp
<header class="top">
    <div class="top-inner">
        <div>
            <span class="brand">DRRKOBE</span><span class="badge">INTERNAL</span>
            <div class="user">{{ $user->name }} · {{ strtoupper($user->role) }}</div>
        </div>
        <form method="POST" action="{{ route('internal.logout') }}">@csrf<button class="logout" type="submit">Keluar</button></form>
    </div>
</header>

<main class="main">
    <div class="eyebrow">ADS → BIP → ASSESSMENT → LEAD → DEAL</div>
    <h1 class="title">Conversion Dashboard</h1>
    <p class="muted">Satu tujuan: lihat traffic masuk, assessment, lead, lalu Deal atau Lost.</p>

    <section class="flow">
        <article class="flow-card"><div class="flow-label">BIP VISITOR</div><div class="flow-value">{{ number_format($eventCounts['bip_visited'] ?? 0) }}</div></article>
        <article class="flow-card"><div class="flow-label">ASSESSMENT STARTED</div><div class="flow-value">{{ number_format($eventCounts['diagnosis_started'] ?? 0) }}</div></article>
        <article class="flow-card"><div class="flow-label">ASSESSMENT COMPLETED</div><div class="flow-value">{{ number_format($eventCounts['diagnosis_completed'] ?? 0) }}</div></article>
        <article class="flow-card"><div class="flow-label">LEADS</div><div class="flow-value">{{ number_format($totalLeads) }}</div></article>
        <article class="flow-card"><div class="flow-label">WHATSAPP CTA</div><div class="flow-value">{{ number_format($eventCounts['assessment_clicked'] ?? 0) }}</div></article>
        <article class="flow-card"><div class="flow-label">DEAL</div><div class="flow-value">{{ number_format($salesStatus['deal']) }}</div></article>
    </section>

    <section class="section">
        <div class="section-head">
            <h2 class="section-title">ADS / Traffic Source</h2>
            <div class="section-note">UTM source · campaign · content</div>
        </div>
        <div class="table-wrap">
            @if($trafficSources->isEmpty())
                <div class="empty">Belum ada traffic baru setelah ADS tracking diaktifkan.</div>
            @else
                <table class="table">
                    <thead><tr><th>SOURCE</th><th>CAMPAIGN</th><th>CONTENT</th><th>USER</th><th>ASSESSMENT</th><th>LEAD</th><th>DEAL</th></tr></thead>
                    <tbody>
                    @foreach($trafficSources as $traffic)
                        <tr>
                            <td class="source">{{ strtoupper($traffic['source']) }}</td>
                            <td class="campaign">{{ $traffic['campaign'] }}</td>
                            <td>{{ $traffic['content'] !== '' ? $traffic['content'] : '-' }}</td>
                            <td>{{ number_format($traffic['users']) }}</td>
                            <td>{{ number_format($traffic['assessment_started']) }}</td>
                            <td>{{ number_format($traffic['leads']) }}</td>
                            <td><strong>{{ number_format($traffic['deals']) }}</strong></td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </section>

    <section class="section">
        <div class="section-head"><h2 class="section-title">Lead Status</h2><a class="link" href="{{ route('internal.leads.index') }}">ALL LEADS →</a></div>
        <div class="status-grid">
            <a class="status-card new" href="{{ route('internal.leads.index', ['status' => 'new']) }}"><div class="status-label">NEW</div><div class="status-value">{{ number_format($salesStatus['new']) }}</div></a>
            <a class="status-card follow_up" href="{{ route('internal.leads.index', ['status' => 'follow_up']) }}"><div class="status-label">FOLLOW-UP</div><div class="status-value">{{ number_format($salesStatus['follow_up']) }}</div></a>
            <a class="status-card deal" href="{{ route('internal.leads.index', ['status' => 'deal']) }}"><div class="status-label">DEAL</div><div class="status-value">{{ number_format($salesStatus['deal']) }}</div></a>
            <a class="status-card lost" href="{{ route('internal.leads.index', ['status' => 'lost']) }}"><div class="status-label">LOST</div><div class="status-value">{{ number_format($salesStatus['lost']) }}</div></a>
        </div>
        <div class="summary"><strong>Deal Conversion dari seluruh lead</strong><div class="deal-rate">{{ number_format($dealRate, 1) }}%</div></div>
    </section>

    <section class="section">
        <div class="section-head"><h2 class="section-title">Lead Terbaru</h2><a class="link" href="{{ route('internal.leads.index') }}">LIHAT SEMUA →</a></div>
        <div class="table-wrap">
            @if($recentLeads->isEmpty())
                <div class="empty">Belum ada lead.</div>
            @else
                <table class="table">
                    <thead><tr><th>STATUS</th><th>COMPANY / SITE</th><th>PIC</th><th>MODEL</th><th>HEALTH</th><th>PRIORITY</th><th></th></tr></thead>
                    <tbody>
                    @foreach($recentLeads as $lead)
                        @php $simpleStatus = $statusMap($lead->status); @endphp
                        <tr>
                            <td><span class="pill {{ $simpleStatus }}">{{ strtoupper(str_replace('_','-',$simpleStatus)) }}</span></td>
                            <td><div class="company">{{ $lead->perusahaan }}</div><div class="small">{{ $lead->kota ?: '-' }}</div></td>
                            <td>{{ $lead->nama }}</td>
                            <td>{{ $lead->model ?: '-' }}<div class="small">{{ number_format($lead->jumlah_forklift ?? 0) }} unit</div></td>
                            <td>{{ $lead->health_score !== null ? $lead->health_score.'%' : '-' }}</td>
                            <td class="priority">{{ strtoupper(in_array($lead->lead_score, ['hot','warm','monitor'], true) ? $lead->lead_score : 'pending') }}</td>
                            <td><a class="open" href="{{ route('internal.leads.show', $lead) }}">OPEN →</a></td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </section>

    <div class="footer">DRRKOBE · BIP Conversion Dashboard</div>
</main>
</body>
</html>
