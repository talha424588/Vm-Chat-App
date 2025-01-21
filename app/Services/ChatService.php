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
use Illuminate\Support\Facades\Log;
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
        $perPage = 50;
        if (!$request->messageId && !$request->unreadCount) {
            $page = (int)($request->get('page', 1));

            $paginator = GroupMessage::where('group_id', $request->groupId)
                // ->where('is_deleted', false)
                ->whereNot('status', EnumMessageEnum::MOVE)
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
        } else if ($request->messageId) {
            return $this->fetchMessagesUpToSearched($request);
        } else if ($request->lastMessageId) {
            return $this->fetchMessagesFromSpecificId($request, 50);
        } else if ($request->unreadCount) {
            return $this->fetchAllUnreadMessages($request);
        }
    }
    private function fetchAllUnreadMessages($request)
    {
        $currentPage = $request->get('page');
        $count = $request->get('unreadCount');
        $count = $request->get('unreadCount');
        $messages = GroupMessage::where('group_id', $request->groupId)
            ->whereNot('status', EnumMessageEnum::MOVE)
            ->with('user', 'reply')
            ->orderBy('id', 'desc')
            ->take($count) // Limit the number of messages
            ->get();




        if ($messages->isNotEmpty()) {
            return response()->json([
                'status' => true,
                'message' => 'Messages found',
                'data' => new MessageResourceCollection($messages),
                // 'pagination' => [
                //     'current_page' => $messages->currentPage(),
                //     'total_pages' => $messages->lastPage(),
                //     'total_count' => $messages->total(),
                //     'per_page' => $messages->perPage()
                // ]
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'No more messages to load',
                'data' => null,
                'pagination' => [
                    'current_page' => $currentPage,
                    'total_pages' => 0,
                    'total_count' => 0,
                    'per_page' => $currentPage,
                ]
            ], 404);
        }
    }
    private function fetchMessagesUpToSearched($request)
    {
        $pageNo = ($request->page);
        $messageId = $request->messageId;
        $groupId = $request->groupId;
        Log::info('fetchMessagesUpToSearched:', ['pageNo' => $pageNo, 'messageId' => $messageId, 'groupId' => $groupId]);
        $startTime = microtime(true);

        if (Auth::user()->role == 0 || Auth::user()->role == 2) {
            $messages = GroupMessage::where('group_id', $groupId)
                ->where('id', '>=', $messageId)
                ->orderBy('id', 'desc')
                // ->take(10000)
                // ->skip($pageNo * 20)
                ->get();
        } else {
            $messages = GroupMessage::where('group_id', $groupId)
                ->where('id', '>=', $messageId)
                ->where('is_deleted', false)
                ->orderBy('id', 'desc')
                ->get();
        }

        $queryTime = microtime(true) - $startTime;

        Log::info('Messages found in fetchMessagesUpToSearched', json_decode($messages));
        Log::info('Query response time for fetchMessagesUpToSearched:', ['time' => $queryTime]);

        if (count($messages)) {
            return response()->json([
                'status' => true,
                'message' => 'Messages found',
                'data' => new MessageResourceCollection($messages),
            ], 200);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Not found',
                'data' => null,
            ], 404);
        }
    }

    private function fetchMessagesFromSpecificId($request, $perPage)
    {
        $messageId = $request->lastMessageId;
        $groupId = $request->groupId;
        $currentPage = $request->get('page', 1);

        $messages = GroupMessage::where('group_id', $groupId)
            ->where('id', '<', $messageId + 10)
            ->where('is_deleted', false)
            ->orderBy('id', 'asc')
            ->paginate($perPage, ['*'], 'page', $currentPage);

        if ($messages->isNotEmpty()) {
            return response()->json([
                'status' => true,
                'message' => 'Messages found',
                'data' => new MessageResourceCollection($messages->items()),
                'pagination' => [
                    'current_page' => $messages->currentPage(),
                    'total_pages' => $messages->lastPage(),
                    'total_count' => $messages->total(),
                    'per_page' => $messages->perPage()
                ]
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'No more messages to load',
                'data' => null,
                'pagination' => [
                    'current_page' => $currentPage,
                    'total_pages' => 0,
                    'total_count' => 0,
                    'per_page' => $perPage
                ]
            ], 404);
        }
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

    // public function searchGroupMessages($searchQuery, $groupId)
    // {
    //     $messages = GroupMessage::where(function ($query) use ($searchQuery, $groupId) {
    //         $query->where("msg", "LIKE", "%$searchQuery%")
    //             ->orWhere("media_name", "LIKE", "%$searchQuery%");
    //     })
    //         ->where("group_id", $groupId)
    //         ->where(function ($query) {
    //             $query->whereIn("type", ["File", "Message"])
    //                 ->orWhereNull("type")
    //                 ->orWhere("type", "");
    //         })
    //         ->where('is_deleted', false)
    //         // ->whereRaw("msg NOT REGEXP '<[^>]+>'")
    //         ->whereRaw("NOT (msg REGEXP '<script[^>]*>|<iframe[^>]*>')")
    //         ->with("user")
    //         ->with('reply')
    //         ->get();
    //     if (count($messages) > 0) {
    //         return response()->json(["status" => true, "message" => "success", "messages" => $messages]);
    //     } else {
    //         return response()->json(["status" => false, "message" => "Not Found", "messages" => null]);
    //     }
    // }

    public function searchGroupMessages($searchQuery, $groupId, $offset = 0, $limit = 40)
    {
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
            ->whereRaw("NOT (msg REGEXP '<script[^>]*>|<iframe[^>]*>')")
            ->with("user")
            ->with('reply')
            ->offset($offset)
            ->limit($limit)
            ->orderBy("id", "asc")
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

    public function messageDeleteStatusCheck($id)
    {
        $message = GroupMessage::with('reply')->where('id', $id)
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
            $message->status = EnumMessageEnum::NEW;

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
            // $message->compose_id = $request->compose_id;
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


    public function restoreDeletedMessage($messageId)
    {
        $message = GroupMessage::with('reply')->where('id', $messageId)->first();
        if ($message) {
            $message->is_deleted = false;
            if ($message->save()) {
                return response()->json(["status" => true, "message" => "success", "message" => new MessageResource($message)]);
            } else {
                return response()->json(["status" => false, "message" => "Not Found", "messages" => null]);
            }
        } else {
            return response()->json(["status" => false, "message" => "Not Found", "messages" => null]);
        }
    }


    public function deleteMessage($messageId)
    {
        $message = GroupMessage::find($messageId);
        if ($message) {
            $message->delete();
            return response()->json(['true' => 'Message deleted successfully']);
        } else {
            return response()->json(['false' => 'Not found']);
        }
    }

    public function openChatGroup($request, $groupId)
    {
        $message_id = $request->message_id;
        return view('chat', compact('message_id', 'groupId'));
    }
}
