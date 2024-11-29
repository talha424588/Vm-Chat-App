<?php

namespace Database\Seeders;

use App\Models\GroupMessage;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class groupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $numberOfMessages = 200;

        // Get the last message ID to start from
        $lastMessage = GroupMessage::orderBy('id', 'desc')->first();
        $startId = $lastMessage ? $lastMessage->id + 1 : 1;

        for ($i = 0; $i < $numberOfMessages; $i++) {
            GroupMessage::create([
                'id' => $startId + $i, // Incrementing ID
                'sender' => '915599882', // Example sender names
                'group_id' => 'i2R5WNL55XaFXOX', // Random group IDs
                'msg' => 'This is message number ',
                'reply_id' => null, // or set to some value if needed
                'seen_by' => '915599882', // Example seen_by
                'time' => now()->timestamp, // Current timestamp
                'status' => 'New', // Default status
                'media_name' => null,
                'type' => 'text', // Example message type
                'is_deleted' => 0,
                'is_compose' => 1,
                'is_privacy_breach' => 0,
                'compose_id' => null,
            ]);
        }
    }
}
