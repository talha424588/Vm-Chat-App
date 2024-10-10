<?php

namespace App\Http\Controllers;

use App\Mail\AlertEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class MailController extends Controller
{
    public function sendAlertMail(Request $request)
    {
        // siraj@visamtion.org add it
        $devEmail = 'dev3@visamtion.org';
        $subject = "Alert: Potential Contact Information Shared by " . $request->name;

        Mail::to($devEmail)->send(new AlertEmail($subject, $request->reason, $request->name, $request->email, $request->message));
        return response()->json(['message' => 'Email sent successfully']);
    }
}
