<?php

use App\Http\Controllers\Internal\InternalAuthController;
use App\Http\Controllers\Internal\InternalDashboardController;
use App\Http\Controllers\Internal\InternalLeadController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('internal')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/login', [InternalAuthController::class, 'create'])
            ->name('login');

        Route::post('/login', [InternalAuthController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('internal.login.store');
    });

    Route::middleware(['auth', 'internal.user'])->group(function () {
        Route::get('/dashboard', InternalDashboardController::class)
            ->name('internal.dashboard');

        Route::get('/leads', [InternalLeadController::class, 'index'])
            ->name('internal.leads.index');

        Route::get('/leads/{lead}', [InternalLeadController::class, 'show'])
            ->name('internal.leads.show');

        Route::post('/leads/{lead}/status', [InternalLeadController::class, 'updateStatus'])
            ->name('internal.leads.status');

        Route::post('/logout', [InternalAuthController::class, 'destroy'])
            ->name('internal.logout');
    });
});
