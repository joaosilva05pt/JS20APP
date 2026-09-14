<?php
$migrations_dir = 'database/migrations';

foreach (glob("$migrations_dir/*.php") as $file) {
    $content = file_get_contents($file);
    
    // Remove DB use if not needed
    if (strpos($content, 'DB::statement') === false && strpos($content, 'DB::') === false) {
        $content = str_replace('use Illuminate\Support\Facades\DB;', '', $content);
    }
    
    // Remove all DB::statement() calls and associated comments
    $content = preg_replace('/\s*\/\/ CHECK.*?\n/i', '', $content);
    $content = preg_replace('/\s*DB::statement\(\s*"""?\s*ALTER\s+TABLE.*?\)\s*;\s*/s', '', $content);
    $content = preg_replace('/\s*DB::statement\(\s*"[^"]*ALTER\s+TABLE[^"]*"\s*\)\s*;\s*/s', '', $content);
    
    file_put_contents($file, $content);
    echo "Cleaned: " . basename($file) . "\n";
}

echo "\nDone!\n";
