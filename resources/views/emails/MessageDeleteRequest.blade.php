<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Message Deletion Request</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>

<body
    style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; ">
    <table role="presentation"
        style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #242424; border-collapse: collapse; color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
        <tr>
            <td style="padding: 20px 30px; background:#1a1a1a; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-weight: 700; font-size: 25px; letter-spacing: -0.5px;">
                    Message Deletion Request</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #1DAB61; margin-top: 0; font-weight: 600; font-size: 20px; letter-spacing: -0.3px;">
                    User Details</h2>
                <table style="width: 100%; margin-bottom: 35px;">
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                            <strong style="color: #1DAB61; font-weight: 500;">Name:</strong> <span
                                style="color: #e2e8f0; margin-left: 8px;">{{ $name }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                            <strong style="color: #1DAB61; font-weight: 500;">Email:</strong> <span
                                style="color: #e2e8f0 !important; margin-left: 8px;">{{ $email }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                            <strong style="color: #1DAB61; font-weight: 500;">Role:</strong> <span
                                style="color: #e2e8f0; margin-left: 8px;">
                                @if ($role == 2)
                                    Operations
                                @endif
                            </span>
                        </td>
                    </tr>
                </table>

                <p style="color: #e2e8f0; line-height: 1.6; font-size: 15px; margin-bottom: 25px;">
                    <strong>{{ $name }}</strong> has requested the deletion of below message. Please review the
                    details below:
                </p>

                <div
                    style="background-color: #2d3748; padding: 25px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #1DAB61;">
                    <p style="margin: 0; color: #e2e8f0; line-height: 1.8;">
                        <strong style="color: #1DAB61; font-weight: 500; display: inline-block; width: 120px;">Message
                            ID:</strong> <span style="color: #e2e8f0;">{{ $id }}</span><br>
                        <strong style="color: #1DAB61; font-weight: 500; display: inline-block; width: 120px;">Posted
                            Date:</strong> <span style="color: #e2e8f0;">{{ date('Y-m-d H:i', $date) }}</span><br>
                        <strong style="color: #1DAB61; font-weight: 500; display: inline-block; width: 120px;">Message
                            Preview:</strong> <span style="color: #e2e8f0;">{{ $content }}</span>
                    </p>
                </div>




                <div style="text-align: center; margin-top: 35px;">
                    {{-- <a href="https://stag.visamtion.org/?group_id={{ $groupId }}&message_id={{ $id }}" --}}
                    <a href="http://127.0.0.1:8000/?group_id={{ $groupId }}&message_id={{ $id }}"
                        style="background: #1DAB61; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500; letter-spacing: 0.3px; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(126, 58, 242, 0.2);">View
                        Message</a>
                </div>

                <p style="color: #a0aec0; margin-top: 35px; font-size: 13px; text-align: center; font-style: italic;">
                    This is an automated email. Please do not reply directly to this message.
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 25px; background-color: #1a1a1a; text-align: center;">
                <p style="margin: 0; color: #a0aec0; font-size: 13px; letter-spacing: 0.2px;">
                    © 2024 VMChat. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>

</html>
