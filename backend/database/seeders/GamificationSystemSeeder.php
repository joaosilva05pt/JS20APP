<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Mission;

class GamificationSystemSeeder extends Seeder
{
    public function run(): void
    {
        // 1. POPULAR OS NÍVEIS AUTOMÁTICOS (1 a 10)
        $niveis = [
            ['nivel_numero' => 1, 'titulo_nivel' => 'Recruta', 'pontos_necessarios' => 0, 'descricao_recompensa' => 'Início da caminhada no balneário.'],
            ['nivel_numero' => 2, 'titulo_nivel' => 'Jovem Promessa', 'pontos_necessarios' => 150, 'descricao_recompensa' => 'Desbloqueia moldura de perfil de Bronze.'],
            ['nivel_numero' => 3, 'titulo_nivel' => 'Jogador de Rotação', 'pontos_necessarios' => 400, 'descricao_recompensa' => 'Acesso a cosméticos intermédios.'],
            ['nivel_numero' => 4, 'titulo_nivel' => 'Titular Indiscutível', 'pontos_necessarios' => 800, 'descricao_recompensa' => 'Desbloqueia moldura de perfil de Prata.'],
            ['nivel_numero' => 5, 'titulo_nivel' => 'Peça Chave', 'pontos_necessarios' => 1500, 'descricao_recompensa' => 'Badge de Destaque no Plantel.'],
            ['nivel_numero' => 6, 'titulo_nivel' => 'Craque da Equipa', 'pontos_necessarios' => 2500, 'descricao_recompensa' => 'Desbloqueia moldura de perfil de Ouro.'],
            ['nivel_numero' => 7, 'titulo_nivel' => 'Líder de Balneário', 'pontos_necessarios' => 4000, 'descricao_recompensa' => 'Estatuto de Conselheiro Técnico.'],
            ['nivel_numero' => 8, 'titulo_nivel' => 'Capitão Lendário', 'pontos_necessarios' => 6000, 'descricao_recompensa' => 'Desbloqueia moldura de perfil de Platina.'],
            ['nivel_numero' => 9, 'titulo_nivel' => 'Ídolo do Clube', 'pontos_necessarios' => 8500, 'descricao_recompensa' => 'Badge Mítico de Lealdade.'],
            ['nivel_numero' => 10, 'titulo_nivel' => 'Lenda Viva', 'pontos_necessarios' => 12000, 'descricao_recompensa' => 'Efeito de Perfil Brilhante Supremo.'],
        ];

        foreach ($niveis as $nivel) {
            DB::table('levels_config')->updateOrInsert(
                ['nivel_numero' => $nivel['nivel_numero']],
                [
                    'titulo_nivel' => $nivel['titulo_nivel'],
                    'pontos_necessarios' => $nivel['pontos_necessarios'],
                    'descricao_recompensa' => $nivel['descricao_recompensa'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        // 2. ITEMS OFICIAIS DA LOJA APP (Cosméticos, Vantagens e Módulos Corporativos)
        $itensLoja = [
            // NOVO MÓDULO PREMIUM INTEGRADO DIRETO NA MONTRA DE COMPRAS
            [
                'nome' => 'Módulo Premium: Nutrição',
                'descricao' => 'Desbloqueia o acesso completo ao dossiê de planos de dieta, acompanhamento calórico e ementas de alto rendimento para todo o plantel.',
                'preco_pontos' => 5000, // Exige a união e doação coletiva do balneário
                'tipo' => 'Modulo',
                'stock' => -1, // Ilimitado, uma vez comprado fica ativo para sempre
                'imagem_url' => null
            ],
            [
                'nome' => 'Avatar Cromo Clássico',
                'descricao' => 'Desbloqueia um fundo estilo cromo vintage para a tua foto de perfil.',
                'preco_pontos' => 100,
                'tipo' => 'Cosmetico',
                'stock' => -1, // Infinito
                'imagem_url' => 'https://api.exemplo.com/assets/shop/avatar-cromo.png'
            ],
            [
                'nome' => 'Moldura Incandescente',
                'descricao' => 'Efeito de chamas animadas à volta do teu avatar no chat e ecrãs do clube.',
                'preco_pontos' => 250,
                'tipo' => 'Cosmetico',
                'stock' => -1,
                'imagem_url' => 'https://api.exemplo.com/assets/shop/moldura-fogo.png'
            ],
            [
                'nome' => 'Dono da Música',
                'descricao' => 'Dá-te o direito de escolher a playlist oficial de aquecimento no balneário na próxima sexta-feira.',
                'preco_pontos' => 500,
                'tipo' => 'Balneario',
                'stock' => 10, // Stock limitado por época
                'imagem_url' => 'https://api.exemplo.com/assets/shop/musica.png'
            ],
            [
                'nome' => 'Couteudo Bonus',
                'descricao' => 'Permite Acesso a conteúdos digitais.',
                'preco_pontos' => 750,
                'tipo' => 'Balneario',
                'stock' => 5, // Stock limitado por época
                'imagem_url' => 'https://api.exemplo.com/assets/shop/treino-extra.png'
            ],
        ];

        foreach ($itensLoja as $item) {
            DB::table('shop_items')->updateOrInsert(
                ['nome' => $item['nome']],
                [
                    'descricao' => $item['descricao'],
                    'preco_pontos' => $item['preco_pontos'],
                    'tipo' => $item['tipo'],
                    'stock' => $item['stock'],
                    'imagem_url' => $item['imagem_url'],
                    'ativo' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        // 3. CATÁLOGO DE MISSÕES PADRÃO DA APP
        $missoesPadrão = [
            [
                'titulo' => 'Foco Absoluto',
                'descricao' => 'Comparecer a 5 sessões de treino consecutivas sem atrasos.',
                'tipo' => 'Equipa',
                'categoria' => 'Assiduidade',
                'pontos_recompensa' => 150,
                'repetivel' => true
            ],
            [
                'titulo' => 'Muralha Defensiva',
                'descricao' => 'Alcançar uma avaliação de treino (0-20) igual ou superior a 16 em vertente defensiva.',
                'tipo' => 'Individual',
                'categoria' => 'Rendimento',
                'pontos_recompensa' => 200,
                'repetivel' => true
            ],
            [
                'titulo' => 'Espírito de Grupo',
                'descricao' => 'Comentar e dar feedback em 3 publicações partilhadas pelo Mister no painel de comunicação.',
                'tipo' => 'Clube',
                'categoria' => 'Interação',
                'pontos_recompensa' => 75,
                'repetivel' => false
            ],
            [
                'titulo' => 'Mente Sã em Corpo São',
                'descricao' => 'Cumprir a ementa nutricional recomendada para o Pré-Jogo durante 3 fins de semana seguidos.',
                'tipo' => 'Individual',
                'categoria' => 'Nutrição',
                'pontos_recompensa' => 120,
                'repetivel' => true
            ],
        ];

        foreach ($missoesPadrão as $missao) {
            DB::table('missions')->updateOrInsert(
                ['titulo' => $missao['titulo']],
                [
                    'descricao' => $missao['descricao'],
                    'tipo' => $missao['tipo'],
                    'categoria' => $missao['categoria'],
                    'pontos_recompensa' => $missao['pontos_recompensa'],
                    'repetivel' => $missao['repetivel'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }
    }
}