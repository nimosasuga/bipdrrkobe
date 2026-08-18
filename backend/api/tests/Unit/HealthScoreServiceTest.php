<?php

namespace Tests\Unit;

use App\Services\HealthScoreService;
use PHPUnit\Framework\TestCase;

class HealthScoreServiceTest extends TestCase
{
    public function test_severe_questionnaire_case_is_critical_without_falling_to_zero(): void
    {
        $service = new HealthScoreService();

        $result = $service->calculate([
            'umur_battery' => 5,
            'shift' => 3,
            'battery_type' => 'lead_acid',
            'answers' => [
                'charging_lama' => true,
                'isi_air' => 0,
                'downtime' => true,
                'cepat_habis' => true,
            ],
        ]);

        $this->assertSame(15, $result['health_score']);
        $this->assertSame('Kritis', $result['category']);
    }

    public function test_healthy_case_remains_at_full_score(): void
    {
        $service = new HealthScoreService();

        $result = $service->calculate([
            'umur_battery' => 1,
            'shift' => 1,
            'battery_type' => 'lead_acid',
            'answers' => [
                'charging_lama' => false,
                'isi_air' => 1,
                'downtime' => false,
                'cepat_habis' => false,
            ],
        ]);

        $this->assertSame(100, $result['health_score']);
        $this->assertSame('Baik', $result['category']);
    }

    public function test_unknown_answers_do_not_create_penalties(): void
    {
        $service = new HealthScoreService();

        $result = $service->calculate([
            'umur_battery' => 1,
            'shift' => 1,
            'battery_type' => 'lead_acid',
            'answers' => [
                'charging_lama' => null,
                'isi_air' => null,
                'downtime' => null,
                'cepat_habis' => null,
            ],
        ]);

        $this->assertSame(100, $result['health_score']);
        $this->assertSame('Baik', $result['category']);
    }

    public function test_aged_battery_with_fast_drain_and_downtime_is_critical(): void
    {
        $service = new HealthScoreService();

        $result = $service->calculate([
            'umur_battery' => 5,
            'shift' => 1,
            'battery_type' => 'lead_acid',
            'answers' => [
                'charging_lama' => false,
                'isi_air' => 1,
                'downtime' => true,
                'cepat_habis' => true,
            ],
        ]);

        $this->assertSame(40, $result['health_score']);
        $this->assertSame('Kritis', $result['category']);
    }
}
