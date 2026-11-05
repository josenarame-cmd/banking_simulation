<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountType;
use App\Models\LoginAttempt;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\AccountService;
use App\Services\AuditLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * User registration with automatic checking account creation.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'identification_number' => 'nullable|string|max:50',
            'role' => ['sometimes', Rule::in(['customer', 'officer'])],
        ]);

        $role = $validated['role'] ?? 'customer';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => $role,
            'status' => 'active',
            'email_verified_at' => now(), // simulated email verification
        ]);

        UserProfile::create([
            'user_id' => $user->id,
            'address' => $validated['address'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'identification_number' => $validated['identification_number'] ?? null,
        ]);

        // Automatically open a default Checking Account with $1,000 simulated welcome bonus!
        $checkingType = AccountType::where('code', 'checking')->first();
        if ($checkingType && $role === 'customer') {
            try {
                AccountService::createAccount($user, $checkingType->id, "{$user->name}'s Primary Checking", 1000.00);
            } catch (\Exception $e) {
                // If deposit fails, account created with 0
                AccountService::createAccount($user, $checkingType->id, "{$user->name}'s Primary Checking", 0.00);
            }
        }

        AuditLogService::log(
            'USER_REGISTERED',
            "New user {$user->name} ({$user->email}) registered with role: {$role}.",
            'User',
            $user->id,
            ['email' => $user->email, 'role' => $role],
            $user->id
        );

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Registration successful! Your welcome checking account has been established.',
            'token' => $token,
            'user' => $user->load(['profile', 'accounts']),
        ], 201);
    }

    /**
     * User login with attempt tracking and rate monitoring.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();
        $ip = $request->ip() ?? '127.0.0.1';

        if (!$user || !Hash::check($request->password, $user->password)) {
            LoginAttempt::create([
                'user_id' => $user ? $user->id : null,
                'email' => $request->email,
                'ip_address' => $ip,
                'status' => 'failed',
                'attempted_at' => now(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Invalid email or password credentials.',
            ], 401);
        }

        if ($user->status !== 'active') {
            LoginAttempt::create([
                'user_id' => $user->id,
                'email' => $request->email,
                'ip_address' => $ip,
                'status' => 'failed',
                'attempted_at' => now(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => "Your account is currently {$user->status}. Please contact banking support.",
            ], 403);
        }

        // Record successful login
        LoginAttempt::create([
            'user_id' => $user->id,
            'email' => $request->email,
            'ip_address' => $ip,
            'status' => 'success',
            'attempted_at' => now(),
        ]);

        AuditLogService::log('USER_LOGIN', "User {$user->email} logged in successfully.", 'User', $user->id, null, $user->id);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Logged in successfully.',
            'token' => $token,
            'user' => $user->load(['profile', 'accounts.accountType']),
        ]);
    }

    /**
     * Logout and invalidate token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()->delete();
            AuditLogService::log('USER_LOGOUT', "User {$user->email} logged out.", 'User', $user->id, null, $user->id);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get current authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'user' => $request->user()->load(['profile', 'accounts.accountType']),
        ]);
    }

    /**
     * Update profile and avatar upload.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'identification_number' => 'nullable|string|max:50',
            'profile_picture' => 'nullable|image|max:2048', // 2MB max
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if (isset($validated['phone'])) {
            $user->phone = $validated['phone'];
        }
        $user->save();

        $profile = $user->profile ?: new UserProfile(['user_id' => $user->id]);
        $profile->address = $validated['address'] ?? $profile->address;
        $profile->date_of_birth = $validated['date_of_birth'] ?? $profile->date_of_birth;
        $profile->identification_number = $validated['identification_number'] ?? $profile->identification_number;

        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('profiles', 'public');
            $profile->profile_picture = $path;
        }

        $profile->save();

        AuditLogService::log('PROFILE_UPDATED', "User {$user->name} updated personal profile information.", 'UserProfile', $profile->id, null, $user->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh(['profile', 'accounts']),
        ]);
    }

    /**
     * Change user password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password does not match.'], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        AuditLogService::log('PASSWORD_CHANGED', "User {$user->email} changed account password.", 'User', $user->id, null, $user->id);

        return response()->json(['status' => 'success', 'message' => 'Password changed successfully.']);
    }
}

