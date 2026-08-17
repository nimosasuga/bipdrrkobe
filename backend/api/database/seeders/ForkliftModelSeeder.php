<?php

namespace Database\Seeders;

use App\Models\ForkliftModel;
use Illuminate\Database\Seeder;

class ForkliftModelSeeder extends Seeder
{
    public function run(): void
    {
        $models = [
            ['name' => 'EFG 110-115', 'type' => 'Electric Forklift', 'capacity' => 1500],
            ['name' => 'EJC 112', 'type' => 'Electric Stacker', 'capacity' => 1200],
            ['name' => 'ETV 214', 'type' => 'Reach Truck', 'capacity' => 1400],
            ['name' => 'ERC 214', 'type' => 'Electric Stacker', 'capacity' => 1400],
            ['name' => 'ECE 225', 'type' => 'Order Picker', 'capacity' => 2500],
        ];

        foreach ($models as $model) {
            ForkliftModel::updateOrCreate(
                ['name' => $model['name']],
                $model
            );
        }
    }
}
