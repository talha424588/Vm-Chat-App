<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AlertEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $subject;
    public $reason;
    public $name;
    public $email;
    public $messageContent;

    public function __construct($subject, $reason, $name, $email, $messageContent)
    {
        $this->subject = $subject;
        $this->reason = $reason;
        $this->name = $name;
        $this->email = $email;
        $this->messageContent = $messageContent;
        Log::info($subject);
        Log::info($reason);
        Log::info($name);
        Log::info($email);
        Log::info($messageContent);

    }

    public function build()
    {
        return $this->view('emails.alert', [
            'subject' => $this->subject,
            'reason' => $this->reason,
            'name' => $this->name,
            'email' => $this->email,
            'messageContent' => $this->messageContent,
        ])->subject($this->subject);
    }
}
