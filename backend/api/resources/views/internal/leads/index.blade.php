<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DRRKOBE Internal Leads</title>
    <style>
        *{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#0a0a0a;font-family:Inter,Arial,sans-serif}.shell{min-height:100vh}.top{background:#0a0a0a;color:#fff}.top-inner{max-width:1240px;margin:auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{font-weight:900;font-size:24px;letter-spacing:-.04em}.badge{margin-left:8px;background:#ffcc00;color:#000;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:900}.user{font-size:12px;color:#d4d4d8}.top-actions{display:flex;align-items:center;gap:10px}.top-link,.logout{border:1px solid #3f3f46;background:transparent;color:#fff;border-radius:999px;padding:9px 14px;font-weight:800;font-size:12px;text-decoration:none;cursor:pointer}.main{max-width:1240px;margin:auto;padding:36px 24px 56px}.eyebrow{font:700 11px/1.5 monospace;letter-spacing:.12em;color:#71717a}.title{margin:6px 0 8px;font-size:36px;font-weight:900;letter-spacing:-.04em}.muted{margin:0;color:#71717a;font-size:14px;line-height:1.7}.filters{margin-top:26px;background:#fff;border:1px solid #e4e4e7;border-radius:22px;padding:18px}.filter-grid{display:grid;grid-template-columns:minmax(220px,1.5fr) repeat(2,minmax(170px,.7fr)) auto;gap:10px}.field label{display:block;margin-bottom:6px;font:800 9px/1.4 monospace;letter-spacing:.08em;color:#71717a}.input,.select{width:100%;height:42px;border:1px solid #d4d4d8;border-radius:12px;background:#fff;padding:0 12px;font-size:13px;color:#0a0a0a;outline:none}.input:focus,.select:focus{border-color:#0a0a0a}.submit{align-self:end;height:42px;border:0;border-radius:12px;background:#0a0a0a;color:#fff;padding:0 18px;font-weight:900;cursor:pointer}.quick{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.chip{display:inline-flex;align-items:center;gap:6px;border:1px solid #e4e4e7;background:#fff;color:#0a0a0a;border-radius:999px;padding:8px 11px;font-size:10px;font-weight:900;text-decoration:none}.chip.active{background:#0a0a0a;color:#fff;border-color:#0a0a0a}.chip.hot{border-color:#fecaca}.chip.warm{border-color:#fde68a}.chip.reset{color:#71717a}.summary{margin:24px 0 12px;display:flex;align-items:center;justify-content:space-between;gap:14px}.summary strong{font-size:17px}.summary span{color:#a1a1aa;font-size:11px}.cards{display:grid;gap:12px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:20px;padding:18px;display:grid;grid-template-columns:1.25fr .8fr .7fr .65fr auto;gap:16px;align-items:center}.company{font-size:15px;font-weight:900}.site,.small{margin-top:4px;color:#71717a;font-size:11px;line-height:1.45}.label{font:800 9px/1.4 monospace;letter-spacing:.08em;color:#a1a1aa}.value{margin-top:5px;font-size:12px;font-weight:800}.priority,.status{display:inline-flex;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900;letter-spacing:.05em;white-space:nowrap}.priority.hot{background:#fee2e2;color:#991b1b}.priority.warm{background:#fef3c7;color:#92400e}.priority.monitor{background:#e4e4e7;color:#3f3f46}.priority.pending{background:#f4f4f5;color:#71717a}.status{background:#0a0a0a;color:#fff}.score{font-size:22px;font-weight:900}.open{display:inline-flex;border-radius:999px;background:#ffcc00;color:#000;padding:9px 12px;font-size:10px;font-weight:900;text-decoration:none;white-space:nowrap}.open:hover{background:#f5c000}.empty{background:#fff;border:1px dashed #d4d4d8;border-radius:20px;padding:36px;text-align:center;color:#a1a1aa}.pager{margin-top:18px;display:flex;align-items:center;justify-content:space-between;gap:12px}.pager-info{font-size:11px;color:#71717a}.pager-actions{display:flex;gap:8px}.pager-link{display:inline-flex;border:1px solid #d4d4d8;background:#fff;color:#0a0a0a;border-radius:999px;padding:8px 12px;font-size:10px;font-weight:900;text-decoration:none}.pager-link.disabled{pointer-events:none;color:#a1a1aa;background:#f4f4f5}.footer{margin-top:30px;border-top:1px solid #e4e4e7;padding-top:18px;font-size:11px;color:#a1a1aa}.role{text-transform:uppercase}@media(max-width:980px){.filter-grid{grid-template-columns:1fr 1fr}.submit{width:100%}.card{grid-template-columns:1fr 1fr}.card .action{grid-column:1/-1}}@media(max-width:720px){.top-inner{align-items:flex-start;flex-direction:column}.top-actions{width:100%;justify-content:space-between}.main{padding:28px 16px 44px}.title{font-size:30px}.filter-grid{grid-template-columns:1fr}.card{grid-template-columns:1fr;gap:12px}.card .action{grid-column:auto}.open{justify-content:center;width:100%}.summary,.pager{align-items:flex-start;flex-direction:column}.pager-actions{width:100%}.pager-link{flex:1;justify-content:center}}
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
            <div class="top-actions">
                <a class="top-link" href="{{ route('internal.dashboard') }}">Dashboard</a>
                <form method="POST" action="{{ route('internal.logout') }}">
                    @csrf
                    <button class="logout" type="submit">Keluar</button>
                </form>
            </div>
        </div>
    </header>

    <main class="main">
        <div class="eyebrow">PHASE 8 · SALES PIPELINE</div>
        <h1 class="title">All Leads</h1>
        <p class="muted">Daftar lead internal dengan filter prioritas teknis, status follow-up sales, dan pencarian data perusahaan atau PIC.</p>

        <section class="filters">
            <form method="GET" action="{{ route('internal.leads.index') }}">
                <div class="filter-grid">
                    <div class="field">
                        <label for="q">SEARCH</label>
                        <input class="input" id="q" name="q" value="{{ $search }}" maxlength="120" placeholder="Perusahaan, site, PIC, WhatsApp, model">
                    </div>
                    <div class="field">
                        <label for="priority">PRIORITY</label>
                        <select class="select" id="priority" name="priority">
                            <option value="">Semua Priority</option>
                            @foreach($priorities as $option)
                                <option value="{{ $option }}" @selected($priority === $option)>{{ strtoupper($option) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="field">
                        <label for="status">SALES STATUS</label>
                        <select class="select" id="status" name="status">
                            <option value="">Semua Status</option>
                            @foreach($statuses as $option)
                                <option value="{{ $option }}" @selected($status === $option)>{{ strtoupper(str_replace('_', ' ', $option)) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <button class="submit" type="submit">Terapkan Filter</button>
                </div>
            </form>

            <div class="quick">
                <a class="chip reset {{ $priority === '' && $status === '' && $search === '' ? 'active' : '' }}" href="{{ route('internal.leads.index') }}">SEMUA</a>
                <a class="chip hot {{ $priority === 'hot' ? 'active' : '' }}" href="{{ route('internal.leads.index', ['priority' => 'hot']) }}">HOT</a>
                <a class="chip warm {{ $priority === 'warm' ? 'active' : '' }}" href="{{ route('internal.leads.index', ['priority' => 'warm']) }}">WARM</a>
                <a class="chip {{ $priority === 'monitor' ? 'active' : '' }}" href="{{ route('internal.leads.index', ['priority' => 'monitor']) }}">MONITOR</a>
                <a class="chip {{ $priority === 'pending' ? 'active' : '' }}" href="{{ route('internal.leads.index', ['priority' => 'pending']) }}">PENDING</a>
                @foreach($statuses as $option)
                    <a class="chip {{ $status === $option ? 'active' : '' }}" href="{{ route('internal.leads.index', ['status' => $option]) }}">{{ strtoupper(str_replace('_', ' ', $option)) }}</a>
                @endforeach
            </div>
        </section>

        <div class="summary">
            <strong>{{ number_format($leads->total()) }} lead ditemukan</strong>
            <span>Halaman {{ $leads->currentPage() }} dari {{ max($leads->lastPage(), 1) }}</span>
        </div>

        @if($leads->isEmpty())
            <div class="empty">Tidak ada lead yang cocok dengan filter saat ini.</div>
        @else
            <section class="cards">
                @foreach($leads as $lead)
                    @php
                        $leadPriority = in_array($lead->lead_score, ['hot', 'warm', 'monitor'], true) ? $lead->lead_score : 'pending';
                        $leadStatus = in_array($lead->status, $statuses, true) ? $lead->status : 'new';
                    @endphp
                    <article class="card">
                        <div>
                            <div class="company">{{ $lead->perusahaan }}</div>
                            <div class="site">{{ $lead->kota ?: '-' }} · {{ $lead->nama }}</div>
                            <div class="small">{{ $lead->whatsapp }} · {{ optional($lead->created_at)->format('d M Y H:i') }}</div>
                        </div>
                        <div>
                            <div class="label">PRIORITY / STATUS</div>
                            <div class="value"><span class="priority {{ $leadPriority }}">{{ strtoupper($leadPriority) }}</span></div>
                            <div class="small"><span class="status">{{ strtoupper(str_replace('_', ' ', $leadStatus)) }}</span></div>
                        </div>
                        <div>
                            <div class="label">MODEL / FLEET</div>
                            <div class="value">{{ $lead->model ?: '-' }}</div>
                            <div class="small">{{ number_format($lead->jumlah_forklift ?? 0) }} unit · {{ $lead->battery_type ?: '-' }}</div>
                        </div>
                        <div>
                            <div class="label">HEALTH SCORE</div>
                            <div class="score">{{ $lead->health_score ?? '-' }}{{ $lead->health_score !== null ? '%' : '' }}</div>
                            <div class="small">{{ $lead->qualification_reason ?: 'Belum ada qualification reason.' }}</div>
                        </div>
                        <div class="action">
                            <a class="open" href="{{ route('internal.leads.show', $lead) }}">OPEN →</a>
                        </div>
                    </article>
                @endforeach
            </section>
        @endif

        <div class="pager">
            <div class="pager-info">Menampilkan {{ $leads->firstItem() ?? 0 }}–{{ $leads->lastItem() ?? 0 }} dari {{ $leads->total() }} lead</div>
            <div class="pager-actions">
                <a class="pager-link {{ $leads->onFirstPage() ? 'disabled' : '' }}" href="{{ $leads->previousPageUrl() ?: '#' }}">← Sebelumnya</a>
                <a class="pager-link {{ $leads->hasMorePages() ? '' : 'disabled' }}" href="{{ $leads->nextPageUrl() ?: '#' }}">Berikutnya →</a>
            </div>
        </div>

        <div class="footer">DRRKOBE · Internal Sales Intelligence · Access controlled</div>
    </main>
</div>
</body>
</html>
