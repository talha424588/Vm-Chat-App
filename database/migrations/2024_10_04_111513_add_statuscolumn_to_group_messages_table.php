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
        Schema::table('group_messages', function (Blueprint $table) {
            $table->enum('status', ['New', 'Move', 'Correction', 'Edited', 'Deleted'])->default(null);
            $table->string("media_name",256)->default(null)->nullable();
            $table->string("type",100)->default(null)->nullable();
            $table->boolean('is_deleted')->default(0);
            $table->integer('compose_id')->default(null);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('group_messages', function (Blueprint $table) {
            //
        });
    }
};
