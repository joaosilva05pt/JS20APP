<?php
$file = 'database/migrations/2026_05_18_185041_create_events_table.php';
$content = file_get_contents($file);

// Remove DB use
$content = str_replace('use Illuminate\Support\Facades\DB;', '', $content);

// Remove all DB::statement() calls
$content = preg_replace('/\s*DB::statement\(\s*".*?\);/s', '', $content);

// Replace string tipos with enums
$content = str_replace(
    '$table->string(\'tipo\', 30)',
    '$table->enum(\'tipo\', [\'Treino\', \'Jogo\', \'Estagio\', \'Reuniao\'])',
    $content
);

$content = str_replace(
    '$table->string(\'tipo_jogo\', 30)',
    '$table->enum(\'tipo_jogo\', [\'Oficial\', \'Amigavel\', \'Nao_Aplicavel\'])',
    $content
);

file_put_contents($file, $content);
echo "File updated successfully\n";
