<?php

namespace App\Services;

class HealthScoreService
{
    private const MIN_SCREENING_SCORE = 15;

    public function calculate(array $data): array
    {
        $score = 100;

        $umur = (int) ($data['umur_battery'] ?? 0);
        $shift = (int) ($data['shift'] ?? 1);
        $batteryType = $data['battery_type'] ?? 'lead_acid';
        $answers = $data['answers'] ?? [];

        // Age is a strong baseline risk, but this assessment is still based on
        // reported operating data rather than a measured battery SOH test.
        if ($umur > 4) {
            $score -= 25;
        } elseif ($umur >= 3) {
            $score -= 20;
        } elseif ($umur >= 2) {
            $score -= 10;
        }

        if (($answers['charging_lama'] ?? null) === true) {
            $score -= 12;
        }

        if ($shift >= 3 && $batteryType === 'lead_acid') {
            $score -= 10;
        }

        if (array_key_exists('isi_air', $answers) && $answers['isi_air'] !== null) {
            $isiAir = (int) $answers['isi_air'];

            if ($isiAir < 1) {
                $score -= 10;
            }
        }

        if (($answers['downtime'] ?? null) === true) {
            $score -= 20;
        }

        if (($answers['cepat_habis'] ?? null) === true) {
            $score -= 15;
        }

        // Questionnaire-based screening should not imply a laboratory-confirmed
        // 0% state of health. Reserve the bottom end for verified technical data.
        $score = max(self::MIN_SCREENING_SCORE, min(100, $score));

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
