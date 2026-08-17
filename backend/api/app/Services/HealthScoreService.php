<?php

namespace App\Services;

class HealthScoreService
{
    public function calculate(array $data): array
    {
        $score = 100;

        $umur = (int) ($data['umur_battery'] ?? 0);
        $shift = (int) ($data['shift'] ?? 1);
        $batteryType = $data['battery_type'] ?? 'lead_acid';
        $answers = $data['answers'] ?? [];

        if ($umur > 4) {
            $score -= 30;
        } elseif ($umur >= 3) {
            $score -= 20;
        } elseif ($umur >= 2) {
            $score -= 10;
        }

        if (($answers['charging_lama'] ?? null) === true) {
            $score -= 15;
        }

        if ($shift >= 3 && $batteryType === 'lead_acid') {
            $score -= 15;
        }

        if (array_key_exists('isi_air', $answers) && $answers['isi_air'] !== null) {
            $isiAir = (int) $answers['isi_air'];

            if ($isiAir < 1) {
                $score -= 15;
            }
        }

        if (($answers['downtime'] ?? null) === true) {
            $score -= 20;
        }

        if (($answers['cepat_habis'] ?? null) === true) {
            $score -= 10;
        }

        $score = max(0, min(100, $score));

        return [
            'health_score' => $score,
            'category' => $this->category($score),
        ];
    }

    private function category(int $score): string
    {
        return match (true) {
            $score <= 40 => 'Kritis',
            $score <= 65 => 'Buruk',
            $score <= 80 => 'Waspada',
            default => 'Baik',
        };
    }
}
