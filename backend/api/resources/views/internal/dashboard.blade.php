<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DRRKOBE Internal Dashboard</title>
    <style>
        *{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#0a0a0a;font-family:Inter,Arial,sans-serif}.shell{min-height:100vh}.top{background:#0a0a0a;color:#fff}.top-inner{max-width:1180px;margin:auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{font-weight:900;font-size:24px;letter-spacing:-.04em}.badge{margin-left:8px;background:#ffcc00;color:#000;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:900}.user{font-size:12px;color:#d4d4d8}.logout{border:1px solid #3f3f46;background:transparent;color:#fff;border-radius:999px;padding:9px 14px;font-weight:800;cursor:pointer}.main{max-width:1180px;margin:auto;padding:36px 24px 56px}.eyebrow{font:700 11px/1.5 monospace;letter-spacing:.12em;color:#71717a}.title{margin:6px 0 10px;font-size:34px;font-weight:900;letter-spacing:-.04em}.muted{margin:0;color:#71717a;font-size:14px;line-height:1.7}.grid{margin-top:28px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:20px;padding:22px}.card h2{margin:0 0 8px;font-size:17px}.card p{margin:0;color:#71717a;font-size:13px;line-height:1.6}.status{display:inline-flex;margin-top:16px;border-radius:999px;background:#fffbeb;padding:7px 10px;font-size:11px;font-weight:900}.role{text-transform:uppercase}.footer{margin-top:28px;border-top:1px solid #e4e4e7;padding-top:18px;font-size:11px;color:#a1a1aa}@media(max-width:780px){.grid{grid-template-columns:1fr}.top-inner{align-items:flex-start;flex-direction:column}.title{font-size:28px}}
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
        <div class="eyebrow">PHASE 8 · INTERNAL SALES DASHBOARD</div>
        <h1 class="title">Akses Internal Aktif</h1>
        <p class="muted">Fondasi autentikasi sudah aktif. Modul funnel, lead priority, conversion, dan sales follow-up akan ditambahkan bertahap setelah akses internal tervalidasi.</p>

        <section class="grid">
            <article class="card">
                <h2>Authentication</h2>
                <p>Session server-side, CSRF protection, role check, status akun aktif, dan login throttling.</p>
                <span class="status">AKTIF</span>
            </article>
            <article class="card">
                <h2>Sales Funnel</h2>
                <p>Data diagnosis hingga assessment sudah tersedia di PostgreSQL dan siap diaggregasi.</p>
                <span class="status">NEXT</span>
            </article>
            <article class="card">
                <h2>Lead Priority</h2>
                <p>HOT / WARM / MONITOR akan tetap terbatas untuk pengguna internal.</p>
                <span class="status">INTERNAL ONLY</span>
            </article>
        </section>

        <div class="footer">DRRKOBE · Internal Sales Intelligence · Access controlled</div>
    </main>
</div>
</body>
</html>
