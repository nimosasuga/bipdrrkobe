<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DRRKOBE Internal Login</title>
    <style>
        *{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#0a0a0a;font-family:Inter,Arial,sans-serif}.wrap{min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(440px,100%);background:#fff;border:1px solid #e4e4e7;border-radius:24px;padding:32px;box-shadow:0 18px 50px rgba(0,0,0,.08)}.brand{font-weight:900;font-size:28px;letter-spacing:-.04em}.badge{display:inline-block;margin-left:8px;background:#ffcc00;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:900;vertical-align:middle}.eyebrow{margin-top:8px;font:700 11px/1.5 monospace;letter-spacing:.12em;color:#71717a}.title{margin:28px 0 6px;font-size:24px;font-weight:900}.muted{margin:0 0 24px;color:#71717a;font-size:14px;line-height:1.6}.field{margin-top:16px}.field label{display:block;font-size:13px;font-weight:800}.field input{width:100%;margin-top:8px;border:1px solid #d4d4d8;border-radius:12px;padding:13px 14px;font-size:14px;outline:none}.field input:focus{border-color:#ffcc00;box-shadow:0 0 0 3px rgba(255,204,0,.2)}.btn{width:100%;margin-top:22px;border:0;border-radius:999px;background:#0a0a0a;color:#fff;padding:13px 18px;font-weight:900;cursor:pointer}.error{margin-top:16px;border:1px solid #fecaca;background:#fef2f2;color:#991b1b;border-radius:12px;padding:12px 14px;font-size:13px;font-weight:700}.note{margin-top:18px;font-size:11px;line-height:1.6;color:#a1a1aa}
    </style>
</head>
<body>
<div class="wrap">
    <main class="card">
        <div><span class="brand">DRRKOBE</span><span class="badge">INTERNAL</span></div>
        <div class="eyebrow">SALES INTELLIGENCE ACCESS</div>
        <h1 class="title">Masuk Dashboard Internal</h1>
        <p class="muted">Akses terbatas untuk akun internal yang aktif.</p>

        @if ($errors->any())
            <div class="error">{{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ route('internal.login.store') }}">
            @csrf
            <div class="field">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" value="{{ old('email') }}" autocomplete="email" required autofocus>
            </div>
            <div class="field">
                <label for="password">Password</label>
                <input id="password" name="password" type="password" autocomplete="current-password" required>
            </div>
            <button class="btn" type="submit">Masuk Dashboard</button>
        </form>

        <p class="note">Session dilindungi oleh autentikasi server, CSRF protection, dan pembatasan percobaan login.</p>
    </main>
</div>
</body>
</html>
