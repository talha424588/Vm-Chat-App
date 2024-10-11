<?php

namespace App\Http\Controllers;

use App\Mail\AlertEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class MailController extends Controller
{
    public function sendAlertMail(Request $request)
    {
        $devEmail = 'dev3@visamtion.org';
        $bccEmail = 'siraj@visamtion.org';
        $subject = "Alert: Potential Contact Information Shared by " . $request->name;

        Mail::to($devEmail)->bcc($bccEmail)->send(new AlertEmail($subject, $request->reason, $request->name, $request->email, $request->message));
        return response()->json(['message' => 'Email sent successfully']);
    }
}
