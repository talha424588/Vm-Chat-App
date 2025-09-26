<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('close_external_entry_info', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('entry_id')->unique();
            $table->unsignedBigInteger('closed_by_id')->nullable();
            $table->string('closed_by_name')->nullable();
            $table->string('closed_by_media')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('close_external_entry_info');
    }
};
