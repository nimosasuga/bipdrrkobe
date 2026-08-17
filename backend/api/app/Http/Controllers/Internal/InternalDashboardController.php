<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;

class InternalDashboardController extends Controller
{
    public function __invoke(Request $request): View
    {
        return view('internal.dashboard', [
            'user' => $request->user(),
        ]);
    }
}
