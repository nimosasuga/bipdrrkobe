<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class InternalAuthController extends Controller
{
    public function create(): View|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('internal.dashboard');
        }

        return view('internal.login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $email = strtolower(trim($credentials['email']));

        $authenticated = Auth::attempt([
            'email' => $email,
            'password' => $credentials['password'],
            'is_active' => true,
        ]);

        if (! $authenticated) {
            return back()
                ->withErrors(['email' => 'Email atau password tidak valid.'])
                ->onlyInput('email');
        }

        $user = $request->user();

        if (! $user || ! in_array($user->role, ['admin', 'sales'], true)) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return back()
                ->withErrors(['email' => 'Email atau password tidak valid.'])
                ->onlyInput('email');
        }

        $request->session()->regenerate();

        $user->last_login_at = now();
        $user->save();

        return redirect()->intended(route('internal.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
