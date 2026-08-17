<?php

use App\Http\Controllers\Api\V1\AiDiagnosticController;
use App\Http\Controllers\Api\V1\DiagnosisController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\MasterDataController;
use App\Http\Controllers\Api\V1\SyncController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/master/brands', [
        MasterDataController::class,
        'brands',
    ]);

    Route::get('/master/forklift-models', [
        MasterDataController::class,
        'forkliftModels',
    ]);

    Route::post('/diagnose', [
        DiagnosisController::class,
        'store',
    ]);

    Route::get('/diagnosis/{diagnosis}/result', [
        DiagnosisController::class,
        'result',
    ]);

    Route::post('/leads', [
        LeadController::class,
        'store',
    ]);

    Route::get('/ai/diagnosis/{diagnosis}/context', [
        AiDiagnosticController::class,
        'context',
    ]);

    Route::get('/ai/diagnosis/{diagnosis}/status', [
        AiDiagnosticController::class,
        'status',
    ]);

    Route::post('/ai/diagnosis/{diagnosis}/analyze', [
        AiDiagnosticController::class,
        'analyze',
    ]);

    Route::prefix('sync')->group(function () {
        Route::post('/brands', [
            SyncController::class,
            'brands',
        ]);

        Route::post('/forklift-models', [
            SyncController::class,
            'forkliftModels',
        ]);

        Route::post('/batteries', [
            SyncController::class,
            'batteries',
        ]);

        Route::post('/chargers', [
            SyncController::class,
            'chargers',
        ]);

        Route::post('/diagnostic-rules', [
            SyncController::class,
            'diagnosticRules',
        ]);
    });
});
