<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DRRKOBE Internal Leads</title>
    <style>
        *{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#0a0a0a;font-family:Inter,Arial,sans-serif}.top{background:#0a0a0a;color:#fff}.top-inner{max-width:1180px;margin:auto;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;gap:18px}.brand{font-size:24px;font-weight:900;letter-spacing:-.04em}.badge{margin-left:8px;background:#ffcc00;color:#000;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:900}.user{margin-top:4px;color:#d4d4d8;font-size:12px}.actions{display:flex;gap:10px;align-items:center}.btn,.logout{border-radius:999px;padding:9px 14px;font-weight:800;font-size:12px;text-decoration:none}.btn{border:1px solid #3f3f46;color:#fff}.logout{border:1px solid #3f3f46;background:transparent;color:#fff;cursor:pointer}.main{max-width:1180px;margin:auto;padding:34px 24px 56px}.eyebrow{font:800 11px/1.5 monospace;letter-spacing:.11em;color:#71717a}.title{margin:6px 0 8px;font-size:36px;font-weight:900;letter-spacing:-.04em}.muted{margin:0;color:#71717a;font-size:14px}.filters{margin-top:24px;background:#fff;border:1px solid #e4e4e7;border-radius:20px;padding:16px}.filter-row{display:grid;grid-template-columns:1fr 190px auto;gap:10px}.input,.select{width:100%;height:42px;border:1px solid #d4d4d8;border-radius:12px;padding:0 12px;font-size:13px;background:#fff}.submit{border:0;border-radius:12px;background:#0a0a0a;color:#fff;padding:0 18px;font-weight:900;cursor:pointer}.chips{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px}.chip{display:inline-flex;border:1px solid #e4e4e7;border-radius:999px;padding:8px 11px;color:#0a0a0a;text-decoration:none;font-size:10px;font-weight:900}.chip.active{background:#0a0a0a;color:#fff;border-color:#0a0a0a}.chip.deal{border-color:#bbf7d0}.chip.lost{border-color:#fecaca}.summary{margin:22px 0 12px;font-size:13px;color:#71717a}.cards{display:grid;gap:12px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:20px;padding:18px;display:grid;grid-template-columns:1.3fr .8fr .75fr .65fr auto;gap:16px;align-items:center}.company{font-size:15px;font-weight:900}.small{margin-top:4px;color:#71717a;font-size:11px;line-height:1.45}.label{font:800 9px/1.4 monospace;letter-spacing:.08em;color:#a1a1aa}.value{margin-top:5px;font-size:12px;font-weight:800}.pill{display:inline-flex;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900}.pill.new{background:#f4f4f5;color:#52525b}.pill.follow_up{background:#fef3c7;color:#92400e}.pill.deal{background:#dcfce7;color:#166534}.pill.lost{background:#fee2e2;color:#991b1b}.priority{font-size:11px;font-weight:900}.score{font-size:22px;font-weight:900}.open{display:inline-flex;border-radius:999px;background:#ffcc00;color:#000;padding:9px 12px;font-size:10px;font-weight:900;text-decoration:none}.empty{background:#fff;border:1px dashed #d4d4d8;border-radius:20px;padding:34px;text-align:center;color:#a1a1aa}.pager{margin-top:18px;display:flex;justify-content:space-between;align-items:center;gap:12px}.pager-info{font-size:11px;color:#71717a}.pager-actions{display:flex;gap:8px}.pager-link{display:inline-flex;border:1px solid #d4d4d8;background:#fff;color:#0a0a0a;border-radius:999px;padding:8px 12px;font-size:10px;font-weight:900;text-decoration:none}.pager-link.disabled{pointer-events:none;color:#a1a1aa;background:#f4f4f5}.footer{margin-top:30px;border-top:1px solid #e4e4e7;padding-top:18px;color:#a1a1aa;font-size:11px}@media(max-width:900px){.card{grid-template-columns:1fr 1fr}.card .action{grid-column:1/-1}}@media(max-width:650px){.top-inner{align-items:flex-start;flex-direction:column}.actions{width:100%;justify-content:space-between}.main{padding:28px 16px 44px}.filter-row{grid-template-columns:1fr}.card{grid-template-columns:1fr}.card .action{grid-column:auto}.open{width:100%;justify-content:center}.pager{align-items:flex-start;flex-direction:column}.pager-actions{width:100%}.pager-link{flex:1;justify-content:center}}
    </style>
</head>
<body>
@php
    $statusLabels = ['new'=>'NEW','follow_up'=>'FOLLOW-UP','deal'=>'DEAL','lost'=>'LOST'];
    $statusMap = function (?string $value): string {
        if (in_array($value, ['follow_up','contacted','assessment_scheduled','proposal'], true)) return 'follow_up';
        if (in_array($value, ['deal','won'], true)) return 'deal';
        if ($value === 'lost') return 'lost';
        return 'new';
    };
@endphp
<header class="top">
    <div class="top-inner">
        <div><span class="brand">DRRKOBE</span><span class="badge">INTERNAL</span><div class="user">{{ $user->name }} · {{ strtoupper($user->role) }}</div></div>
        <div class="actions"><a class="btn" href="{{ route('internal.dashboard') }}">Dashboard</a><form method="POST" action="{{ route('internal.logout') }}">@csrf<button class="logout" type="submit">Keluar</button></form></div>
    </div>
</header>

<main class="main">
    <div class="eyebrow">BIP LEADS</div>
    <h1 class="title">Leads</h1>
    <p class="muted">Cukup empat status: New → Follow-up → Deal / Lost.</p>

    <section class="filters">
        <form method="GET" action="{{ route('internal.leads.index') }}">
            <div class="filter-row">
                <input class="input" name="q" value="{{ $search }}" maxlength="120" placeholder="Cari perusahaan, site, PIC, WhatsApp, model">
                <select class="select" name="status">
                    <option value="">Semua Status</option>
                    @foreach($statuses as $option)<option value="{{ $option }}" @selected($status === $option)>{{ $statusLabels[$option] }}</option>@endforeach
                </select>
                <button class="submit" type="submit">Filter</button>
            </div>
        </form>
        <div class="chips">
            <a class="chip {{ $status === '' && $search === '' ? 'active' : '' }}" href="{{ route('internal.leads.index') }}">SEMUA</a>
            <a class="chip {{ $status === 'new' ? 'active' : '' }}" href="{{ route('internal.leads.index', ['status'=>'new']) }}">NEW</a>
            <a class="chip {{ $status === 'follow_up' ? 'active' : '' }}" href="{{ route('internal.leads.index', ['status'=>'follow_up']) }}">FOLLOW-UP</a>
            <a class="chip deal {{ $status === 'deal' ? 'active' : '' }}" href="{{ route('internal.leads.index', ['status'=>'deal']) }}">DEAL</a>
            <a class="chip lost {{ $status === 'lost' ? 'active' : '' }}" href="{{ route('internal.leads.index', ['status'=>'lost']) }}">LOST</a>
        </div>
    </section>

    <div class="summary">{{ number_format($leads->total()) }} lead ditemukan</div>

    @if($leads->isEmpty())
        <div class="empty">Tidak ada lead yang cocok.</div>
    @else
        <section class="cards">
            @foreach($leads as $lead)
                @php
                    $simpleStatus = $statusMap($lead->status);
                    $priority = in_array($lead->lead_score, ['hot','warm','monitor'], true) ? $lead->lead_score : 'pending';
                @endphp
                <article class="card">
                    <div><div class="company">{{ $lead->perusahaan }}</div><div class="small">{{ $lead->kota ?: '-' }} · {{ $lead->nama }}</div><div class="small">{{ $lead->whatsapp }} · {{ optional($lead->created_at)->timezone('Asia/Jakarta')->format('d M Y H:i') }}</div></div>
                    <div><div class="label">STATUS</div><div class="value"><span class="pill {{ $simpleStatus }}">{{ $statusLabels[$simpleStatus] }}</span></div><div class="small priority">{{ strtoupper($priority) }}</div></div>
                    <div><div class="label">MODEL / FLEET</div><div class="value">{{ $lead->model ?: '-' }}</div><div class="small">{{ number_format($lead->jumlah_forklift ?? 0) }} unit · {{ $lead->battery_type ?: '-' }}</div></div>
                    <div><div class="label">HEALTH</div><div class="score">{{ $lead->health_score !== null ? $lead->health_score.'%' : '-' }}</div></div>
                    <div class="action"><a class="open" href="{{ route('internal.leads.show', $lead) }}">OPEN →</a></div>
                </article>
            @endforeach
        </section>
    @endif

    <div class="pager">
        <div class="pager-info">Menampilkan {{ $leads->firstItem() ?? 0 }}–{{ $leads->lastItem() ?? 0 }} dari {{ $leads->total() }}</div>
        <div class="pager-actions"><a class="pager-link {{ $leads->onFirstPage() ? 'disabled' : '' }}" href="{{ $leads->previousPageUrl() ?: '#' }}">← Sebelumnya</a><a class="pager-link {{ $leads->hasMorePages() ? '' : 'disabled' }}" href="{{ $leads->nextPageUrl() ?: '#' }}">Berikutnya →</a></div>
    </div>

    <div class="footer">DRRKOBE · BIP Leads</div>
</main>
</body>
</html>
