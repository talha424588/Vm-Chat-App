<?php

namespace App\Http\Controllers\Chat;

use App\Events\Chat;
use App\Http\Controllers\Controller;
use App\Models\GroupMessage;
use App\Models\User;
use App\Repositories\ChatRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    public function __construct(protected ChatRepository $chatRepository)
    {
    }

    public function index()
    {
        return view('chat');
    }
    //
    public function searchGroupMessages(Request $request)
    {
        $validatorResponse = $this->validateInputDetails($request, [
            'query' => 'required',
            //'page' => 'required|integer|min:1',
        ]);

        if (isset($validatorResponse) && $validatorResponse->getStatusCode() == 400)
            return $validatorResponse;
        else
            return $this->chatRepository->searchChatMessages($request);
    }

    public function getUserAllGroupsMessages(Request $request)
    {

        $validatorResponse = $this->validateInputDetails($request, [
            'groupId' => 'required',
            'page' => 'required|integer|min:1',
        ]);
        if (isset($validatorResponse) && $validatorResponse->getStatusCode() == 400)
            return $validatorResponse;

        else
            return $this->chatRepository->fetchUserAllGroupsMessages($request);
    }

    private function validateInputDetails(Request $request, array $params)
    {
        $rules = [];
        $messages = [];

        foreach ($params as $paramName => $ruleset) {
            $messages["{$paramName}.required"] = ucfirst($paramName) . ' is required.';

            $rules[$paramName] = $ruleset;
        }

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 400);
        }

        return null;
    }


    // public function index(Request $request)
    // {
    //     return $this->chatRepository->fetchUserAllGroupsMessages($request);
    // }

    public function store(Request $request)
    {
        // $user = $request->input('user');

    // Get the unique_id from the user object
        // $uniqueId = $user['unique_id'];
        $uniqueId = $request->user()->unique_id;


        $message = new GroupMessage;
        $message->msg = $request->body;
        $message->sender = $uniqueId;
        $message->reply_id = $request->replyId;
        $message->group_id = $request->group_id;
        $message->time = time();
        $message->save();
        return response()->json($message, 201);
    }


    public function broadcastChat(Request $request)
    {
        $user = $request->user();
        $message = $this->store($request);
        $messageResposne = json_decode($message->getContent(),true);
        event(new Chat($user,$request->body,$request->time, (int)($messageResposne['id'])));
        return response()->json(['msg'=>"event fired !!"]);
    }
}
