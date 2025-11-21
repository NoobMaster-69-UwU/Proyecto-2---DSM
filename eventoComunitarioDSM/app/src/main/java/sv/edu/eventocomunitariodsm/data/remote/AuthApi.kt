package sv.edu.eventocomunitariodsm.data.remote

import retrofit2.http.Body
import retrofit2.http.POST
import sv.edu.eventocomunitariodsm.data.model.AuthResponse
import sv.edu.eventocomunitariodsm.data.model.LoginRequest
import sv.edu.eventocomunitariodsm.data.model.RegisterRequest

interface AuthApi {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): AuthResponse
}
