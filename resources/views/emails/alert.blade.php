<!-- resources/views/emails/alert.blade.php -->

<h2>Alert!</h2>
<p>A user with the following details shared potential contact information:</p>
<hr>
<table>
    <tr>
        <td><strong>Reason: </strong></td>
        <td>{{ $reason }}</td>
    </tr>
    <tr>
        <td><strong>Name: </strong></td>
        <td>{{ $name }}</td>
    </tr>
    <tr>
        <td><strong>Email: </strong></td>
        <td>{{ $email }}</td>
    </tr>
    <tr>
        <td><strong>Message: </strong></td>
        <td>{{ $messageContent }}</td>
    </tr>
</table>
