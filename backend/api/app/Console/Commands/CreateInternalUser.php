<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class CreateInternalUser extends Command
{
    protected $signature = 'internal:create-user {email} {--name=} {--role=admin}';

    protected $description = 'Create or update an internal DRRKOBE sales/admin user.';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));
        $name = trim((string) ($this->option('name') ?: $this->ask('Nama')));
        $role = strtolower(trim((string) $this->option('role')));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Format email tidak valid.');

            return self::FAILURE;
        }

        if ($name === '') {
            $this->error('Nama wajib diisi.');

            return self::FAILURE;
        }

        if (! in_array($role, ['admin', 'sales'], true)) {
            $this->error('Role harus admin atau sales.');

            return self::FAILURE;
        }

        $password = (string) $this->secret('Password');
        $confirmation = (string) $this->secret('Konfirmasi password');

        if (strlen($password) < 12) {
            $this->error('Password minimal 12 karakter.');

            return self::FAILURE;
        }

        if (! hash_equals($password, $confirmation)) {
            $this->error('Konfirmasi password tidak sama.');

            return self::FAILURE;
        }

        $user = User::firstOrNew(['email' => $email]);
        $user->name = $name;
        $user->email = $email;
        $user->password = $password;
        $user->role = $role;
        $user->is_active = true;
        $user->remember_token = Str::random(60);
        $user->save();

        $this->info("Akun internal {$role} aktif: {$email}");

        return self::SUCCESS;
    }
}
