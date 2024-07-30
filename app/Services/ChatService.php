<?php

namespace App\Services;

use App\Http\Requests\LoginRequestBody;
use App\Http\Resources\GroupResource;
use App\Http\Resources\MessageResource;
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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class ChatService implements ChatRepository
{
    public function searchChatMessages($request)
    {
        $messages = GroupMessage::with('group')->where('msg', 'LIKE', "%{$request->get("query")}%")->get();
        if(count($messages) > 0)
            return new MessageResource($messages);
        else
            return response()->json(["status"=>false,"message"=> "not found","messages"=>null],404);
    }

    public function fetchUserAllGroupsMessages($request)
    {
        $perPage = 20;
        $page = $request->get('page',1);
        $paginator = GroupMessage::where('group_id', $request->groupId)
        ->paginate($perPage, ['*'], 'page', $page);
        if ($paginator != null) {
            $response = [
                'status' => true,
                'message' => 'Messages found',
                'data' => new MessageResource($paginator->items()),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'total_pages' => $paginator->lastPage(),
                    'total_count' => $paginator->total(),
                    'per_page' => $paginator->perPage()
                ]
            ];
            return response()->json($response);
        }
        else
        {
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

        // if (count($userGroupsMessages) > 0)
        //     return new MessageResource($userGroupsMessages);
        // else
        //     return response()->json(["status" => false, "message" => "not found", "messages" => null], 404);
    }
}
