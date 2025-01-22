<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MessageDeleteRequest extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public $user;
    public $message;
    public function __construct($user, $message)
    {
        $this->user = $user;
        $this->message = $message;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Message Delete Request',
        );
    }




    public function build()
    {

        $messageId = $this->message['message']['id'];
        $messageGroupId = $this->message['message']['group_id'];
        // $messageContent = Str::limit($this->message['message']['msg'], 50, '...');
        $messageContent = $this->message['message']['msg'];
        $messageTime = $this->message['message']['time'];

        $userName = $this->user['name'];
        $userEmail = $this->user['email'];
        $userRole = $this->user['role'];

        return $this->view('emails.MessageDeleteRequest', [
            'name' => $userName,
            'email' => $userEmail,
            'role' => $userRole,
            'id' => $messageId,
            'date' => $messageTime,
            'content' => $messageContent,
            'groupId' => $messageGroupId,
        ])->subject("Message Deletion Request");
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
