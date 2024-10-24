<?php

namespace App\Services;

use App\Enum\MessageEnum as EnumMessageEnum;
use App\Http\Requests\LoginRequestBody;
use App\Http\Resources\GroupResource;
use App\Http\Resources\MessageResource;
use App\Http\Resources\MessageResourceCollection;
use App\Http\Resources\userResource;
use App\Models\Group;
use App\Models\GroupMessage;
use App\Models\User;
use App\Repositories\ChatRepository;
use App\Repositories\GroupRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Repositories\UserRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

use function PHPUnit\Framework\returnSelf;

class ChatService implements ChatRepository
{
    public function searchChatMessages($request)
    {
        $messages = GroupMessage::with('group')->where('msg', 'LIKE', "%{$request->get("query")}%")->get();
        if (count($messages) > 0)
            return new MessageResourceCollection($messages);
        else
            return response()->json(["status" => false, "message" => "not found", "messages" => null], 404);
    }

    public function fetchUserAllGroupsMessages($request)
    {
        $perPage = 20;
        if (!$request->messageId) {
            $page = $request->get('page', 1);
            // $paginator = GroupMessage::where('group_id', $request->groupId)->with('user','reply')->orderBy('id', 'desc')
            //     ->paginate($perPage, ['*'], 'page', $page);

            $paginator = GroupMessage::where('group_id', $request->groupId)
                ->where('is_deleted', false)
                ->with('user', 'reply')
                ->orderBy('id', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            if ($paginator != null) {
                $response = [
                    'status' => true,
                    'message' => 'Messages found',
                    'data' => new MessageResourceCollection($paginator->items()),
                    'pagination' => [
                        'current_page' => $paginator->currentPage(),
                        'total_pages' => $paginator->lastPage(),
                        'total_count' => $paginator->total(),
                        'per_page' => $paginator->perPage()
                    ]
                ];
                return response()->json($response);
            } else {
                return response()->json([
                    'status' => false,
                    'message' => 'Not found',
                    'data' => null,
                    'pagination' => [
                        'current_page' => 1,
                        'total_pages' => 0,
                        'total_count' => 0,
                        'per_page' => $perPage
                    ]
                ], 404);
            }
        } else {
            return $this->fetchMessagesUpToSearched($request);
        }
    }
    // private function fetchMessagesUpToSearched($request)
    // {
    //     $pageNo = (int)($request->currentPage);
    //     $messageId = $request->messageId;
    //     $groupId = $request->groupId;

    //     $messages = GroupMessage::where('group_id', $groupId)
    //         ->where('id', '>=', $messageId)
    //         ->where('is_deleted', false)
    //         ->orderBy('id', 'desc')
    //         ->take(PHP_INT_MAX)
    //         ->skip($pageNo * 20)
    //         ->get();
    //     return response()->json([
    //         'status' => true,
    //         'message' => 'Messages found',
    //         'data' => new MessageResourceCollection($messages),
    //     ]);
    // }


    private function fetchMessagesUpToSearched($request)
    {
        $pageNo = (int)($request->currentPage);
        $messageId = $request->messageId;
        $groupId = $request->groupId;

        // Fetch messages from the specified messageId onward
        $messages = GroupMessage::where('group_id', $groupId)
            ->where('id', '<=', $messageId)
            ->where('is_deleted', false)
            ->orderBy('id', 'desc')
            // ->take(20)
            // ->skip($pageNo * 20)
            ->get();

        // return count($messages);

        return response()->json([
            'status' => true,
            'message' => 'Messages found',
            'data' => new MessageResourceCollection($messages),
        ]);
    }

    public function getMessageStatus($id)
    {
        $message = GroupMessage::with('user')->where("id", $id)->first();
        $seenBy = explode(', ', $message->seen_by);
        $seenByUserNames = User::whereIn('unique_id', $seenBy)->get()->pluck('name')->all();
        if ($message)
            return response()->json(["status" => true, "message" => "success", "data" => $seenByUserNames]);
        else
            return response()->json(["status" => false, "message" => "not found", "messages" => null], 404);
    }

    public function updateMessageIsReadStatus($request)
    {
        $messagesArray = GroupMessage::WhereIn("id", $request->ids)->get();

        foreach ($messagesArray as $message) {
            $seenBy = explode(", ", $message->seen_by);
            if (!in_array(Auth::user()->unique_id, $seenBy)) {
                $seenBy[] = Auth::user()->unique_id;
                $message->seen_by = implode(', ', $seenBy);
                //    $message->seen_by = implode(', ', array_map(function ($unique_id) {
                //     return " $unique_id";
                // }, $seenBy));
                $message->save();
            }
        }
        return response()->json(["status" => 200, "message" => "is read updated"]);
    }

    public function searchGroupMessages($searchQuery, $groupId)
    {
        // $messages = GroupMessage::where("msg", "LIKE", "%$query%")
        //     ->orWhere("media_name", "LIKE", "%$query%")
        //     ->where("group_id", $groupId)
        //     ->where('is_deleted', false)
        //     ->with("user")
        //     ->get();

        $messages = GroupMessage::where(function ($query) use ($searchQuery, $groupId) {
            $query->where("msg", "LIKE", "%$searchQuery%")
                ->orWhere("media_name", "LIKE", "%$searchQuery%");
        })
            ->where("group_id", $groupId)
            ->where(function ($query) {
                $query->whereIn("type", ["File", "Message"])
                    ->orWhereNull("type")
                    ->orWhere("type", "");
            })
            ->where('is_deleted', false)
            ->with("user")
            ->with('reply')
            ->get();
        if (count($messages) > 0) {
            return response()->json(["status" => true, "message" => "success", "messages" => $messages]);
        } else {
            return response()->json(["status" => false, "message" => "Not Found", "messages" => null]);
        }
    }

    public function getMessageById($id)
    {
        $message = GroupMessage::where('id', $id)
            ->where('is_deleted', false)
            ->first();
        if ($message)
            return response()->json(["status" => true, "msessage" => "success", "message" => new MessageResource($message)]);
        else
            return response()->json(["status" => false, "message" => "Not Found", "messages" => null]);
    }

    public function updateMessage($request)
    {
        $messageId = $request->input('id');
        $messageContent = $request->input('message');

        $message = GroupMessage::where('id', $messageId)->first();
        if ($message) {
            $message->msg = $messageContent;
            $message->status = EnumMessageEnum::EDIT;

            if ($message->save()) {
                return response()->json(["status" => true, "message" => "success", "message" => new MessageResource($message)]);
            } else {
                return response()->json(["status" => false, "message" => "Not Found", "messages" => null]);
            }
        } else {
            return response()->json(["status" => false, "message" => "Not Found", "messages" => null]);
        }
    }


    public function messageCorrection($request)
    {
        $messageId = $request->input('id');
        $messageContent = $request->input('message');

        $message = GroupMessage::where('id', $messageId)->first();
        if ($message) {
            $message->msg = $messageContent;
            $message->status = EnumMessageEnum::CORRECTION;
            if ($message->save()) {
                return response()->json(["status" => true, "message" => "Correction saved successfully", "message" => new MessageResource($message)]);
            } else {
                return response()->json(["status" => false, "message" => "Not Found", "messages" => null]);
            }
        } else {
            return response()->json(["status" => false, "message" => "Not Found", "messages" => null]);
        }
    }
}
