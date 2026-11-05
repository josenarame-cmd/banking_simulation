<?php

use Illuminate\Support\Facades\Route;

Route::get('/favicon.ico', function () {
    return response('', 204);
});

Route::get('/', function () {
    return view('app');
});

Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|build|storage).*$');
