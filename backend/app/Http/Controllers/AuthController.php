<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage; //manipulação de ficheiros

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // 1. Validação dos dados de entrada (Atualizada com a validação da Imagem)
        $validated = $request->validate([
            'nome' => 'required|string|max:50',
            'apelido' => 'required|string|max:50',
            'email' => 'required|email|max:100|unique:users,email',
            
            // O 'confirmed' faz a magia de bater a password com 'password_confirmation'
            'password' => 'required|string|min:6|confirmed', 
            
            'genero' => 'required|string|in:Masculino,Feminino',
            'telemovel' => 'nullable|string|max:20|unique:users,telemovel',
            
            // VALIDAÇÃO DA FOTO: Deve ser uma imagem válida até 2MB (2048 KB)
            'foto_perfil' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            
            'profissao_base' => 'required|string|max:50',
            'data_nascimento' => 'nullable|date',
            'pais' => 'nullable|string|max:50',
            'localidade' => 'nullable|string|max:100',
        ]);

        try {
            //PROCESSAMENTO DO UPLOAD DA IMAGEM
            $fotoPath = null;
            if ($request->hasFile('foto_perfil')) {
                // Guarda o ficheiro na pasta 'uploads/perfis' dentro do disco 'public'
                // O Laravel gera automaticamente um nome criptografado super seguro e único
                $fotoPath = $request->file('foto_perfil')->store('uploads/perfis', 'public');
            }

            // 2. Criação do utilizador na Base de Dados
            $user = User::create([
                'nome' => $validated['nome'],
                'apelido' => $validated['apelido'],
                'email' => $validated['email'],
                
                // Encriptação segura usando o Hash::make (padrão recomendado no Laravel)
                'password' => Hash::make($validated['password']),

                'genero' => $validated['genero'],
                'telemovel' => $validated['telemovel'] ?? null,
                
                // GRAVAÇÃO DO CAMINHO DA FOTO (Ex: "uploads/perfis/abc123xyz.png")
                'foto_perfil' => $fotoPath,

                'profissao_base' => $validated['profissao_base'],
                'data_nascimento' => $validated['data_nascimento'] ?? null,
                'pais' => $validated['pais'] ?? null,
                'localidade' => $validated['localidade'] ?? null,
                
                // O primeiro_login continua true para podermos gerir o fluxo de Agente Livre depois
                'primeiro_login' => true, 
            ]);

            // Auto-login imediatamente após o registo de sucesso
            Auth::login($user);

            // 3. Resposta de sucesso
            return response()->json([
                'message' => 'Utilizador criado com sucesso.',
                'user' => $user
            ], 201);

        } catch (\Throwable $e) {
            // Registo do erro nos logs para poderes inspecionar no ficheiro storage/logs/laravel.log
            Log::error('Register error', ['exception' => $e]);

            return response()->json([
                'message' => 'Erro interno ao criar conta. Verifique o servidor.'
            ], 500);
        }
    }

    public function login(Request $request)
    {
        // Valida os dados de entrada
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // O truque para guardar a sessão está no segundo parâmetro (Auth::attempt($credenciais, $lembrar))
        // O $request->boolean('remember') vai ler o visto (checkbox) que vamos fazer no React
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            
            // Regenera a sessão por segurança
            $request->session()->regenerate();
            
            return response()->json([
                'message' => 'Login efetuado com sucesso',
                'user' => Auth::user()
            ], 200);
        }

        // Se falhar, manda erro 401
        return response()->json([
            'message' => 'Email ou password incorretos.'
        ], 401);
    }

    public function logout(Request $request)
    {
        // 1. Termina a sessão web
        Auth::guard('web')->logout();
        
        // 2. Invalida o cookie existente
        $request->session()->invalidate();
        
        // 3. Regenera o token de segurança para evitar ataques
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sessão terminada com sucesso']);
    }
}