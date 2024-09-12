<?php

namespace App\Http\Controllers\Chat;

use App\Events\Chat;
use App\Http\Controllers\Controller;
use App\Models\GroupMessage;
use App\Models\User;
use App\Repositories\ChatRepository;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Laravel\Ui\Presets\React;

class ChatController extends Controller
{
    public function __construct(protected ChatRepository $chatRepository) {}

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
        $user = $request->input('user');
        $uniqueId = $user['unique_id'];

        $message = new GroupMessage;
        $message->msg = $request->message;
        $message->sender = $uniqueId;
        $message->seen_by = $uniqueId .", ";
        $message->reply_id = $request->replyId;
        $message->group_id = $request->group_id;
        $message->type = $request->type;
        $message->time = $request->time;
        if ($message->save())
            $message->user = User::where("unique_id",$uniqueId)->first();
            return response()->json($message, 201);
    }


    // public function broadcastChat(Request $request)
    // {
    //     $user = $request->user();
    //     $message = $this->store($request);
    //     $messageResposne = json_decode($message->getContent(),true);
    //     event(new Chat($user,$request->body,$request->time, (int)($messageResposne['id'])));
    //     return response()->json(['msg'=>"event fired !!"]);
    // }

    public function delete($id)
    {
        try {
            $message = GroupMessage::findOrFail($id);
            if ($message->delete()) {
                return response()->json([
                    'status' => true,
                    'message' => 'Message deleted successfully'
                ], 200);
            } else {
                return response()->json([
                    'status' => false,
                    'message' => 'Message deletion failed'
                ], 400);
            }
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Message not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'An error occurred while deleting the message'
            ], 500);
        }
    }

    public function getMessageReadStatus($messageId)
    {
        return $this->chatRepository->getMessageStatus($messageId);
    }

    public function updateMessageReadStatus(Request $request)
    {
        return $this->chatRepository->updateMessageIsReadStatus($request);
    }
}
