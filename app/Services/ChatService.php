<?php

namespace App\Services;

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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

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
        $perPage = 40;
        $page = $request->get('page', 1);
        $paginator = GroupMessage::where('group_id', $request->groupId)->with('user')->orderBy('id', 'desc')
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
    }

    public function getMessageStatus($id)
    {
        $messages = GroupMessage::findOrFail($id);
        if ($messages)
            return response()->json(["status" => true, "message" => "success"] + (new MessageResource($messages))->resolve());
        else
            return response()->json(["status" => false, "message" => "not found", "messages" => null], 404);
    }
}
